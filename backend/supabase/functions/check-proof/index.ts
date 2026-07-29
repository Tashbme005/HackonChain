// Supabase Edge Function: check-proof
// Runs server-side so the Gemini API key never ships to the browser.
// Flow matches docs/backend.md: duplicate photo check → Gemini → fail open.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Body = {
  photoUrl: string;
  description?: string;
  testimonial?: string;
  amount?: number;
  currency?: string;
  recipientId: string;
  proofId?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as Body;
    if (!body.photoUrl || !body.recipientId) {
      return json({ error: "photoUrl and recipientId are required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // 1) Deterministic reuse check — same photo URL from this recipient before.
    const { data: prior, error: priorErr } = await supabase
      .from("proofs")
      .select("id")
      .eq("recipient_id", body.recipientId)
      .eq("photo_url", body.photoUrl)
      .limit(2);

    if (priorErr) {
      console.error("prior lookup failed", priorErr);
    }

    const reused =
      (prior?.length ?? 0) > (body.proofId ? 1 : 0) ||
      ((prior?.length ?? 0) === 1 && !body.proofId);

    if (reused || (prior && prior.length > 0 && !body.proofId)) {
      // If proofId provided, ignore the current row itself.
      const others = (prior ?? []).filter((p) => p.id !== body.proofId);
      if (others.length > 0) {
        const verdict = {
          flagged: true,
          ai_checked: true,
          ai_reason: "This image appears to match a previous submission.",
          ai_internal_note:
            "Image URL matches an earlier upload from this recipient. Ask for a fresh photo before releasing further funds.",
        };
        if (body.proofId) {
          await supabase.from("proofs").update(verdict).eq("id", body.proofId);
        }
        return json(verdict);
      }
    }

    // 2) Gemini vision/text check (optional — fail open if unset or errors).
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) {
      const verdict = {
        flagged: false,
        ai_checked: false,
        ai_reason: null as string | null,
        ai_internal_note: "Automated check unavailable — GEMINI_API_KEY not configured.",
      };
      if (body.proofId) {
        await supabase.from("proofs").update(verdict).eq("id", body.proofId);
      }
      return json(verdict);
    }

    let flagged = false;
    let reason = "";
    let internal = "";

    try {
      const prompt = [
        "You are checking a donation proof-of-use photo for fraud signals.",
        "Flag if: obvious stock photo / watermark, heavy editing, or clear mismatch between the image and the description.",
        "Respond ONLY with JSON: {\"suspicious\":boolean,\"reason\":string}",
        `Description: ${body.description ?? ""}`,
        `Testimonial: ${body.testimonial ?? ""}`,
        `Claimed amount: ${body.amount ?? "?"} ${body.currency ?? ""}`,
        `Photo URL: ${body.photoUrl}`,
      ].join("\n");

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1 },
          }),
        },
      );

      if (!res.ok) {
        throw new Error(`Gemini HTTP ${res.status}`);
      }

      const data = await res.json();
      const text: string =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]) as {
          suspicious?: boolean;
          reason?: string;
        };
        flagged = Boolean(parsed.suspicious);
        reason = parsed.reason ?? "";
        internal = flagged
          ? `Gemini flagged: ${reason}`
          : "Gemini found no obvious fraud signals.";
      } else {
        throw new Error("No JSON in Gemini response");
      }
    } catch (err) {
      console.error("Gemini fail-open", err);
      const verdict = {
        flagged: false,
        ai_checked: false,
        ai_reason: null as string | null,
        ai_internal_note: "Automated check could not run — submission passed through unchecked.",
      };
      if (body.proofId) {
        await supabase.from("proofs").update(verdict).eq("id", body.proofId);
      }
      return json(verdict);
    }

    const verdict = {
      flagged,
      ai_checked: true,
      ai_reason: flagged ? reason || "Flagged by the automated check." : null,
      ai_internal_note: internal,
    };

    if (body.proofId) {
      await supabase.from("proofs").update(verdict).eq("id", body.proofId);
      if (flagged && body.proofId) {
        const { data: proof } = await supabase
          .from("proofs")
          .select("donation_id")
          .eq("id", body.proofId)
          .maybeSingle();
        if (proof?.donation_id) {
          await supabase
            .from("donations")
            .update({ status: "flagged" })
            .eq("id", proof.donation_id);
        }
      } else if (!flagged && body.proofId) {
        const { data: proof } = await supabase
          .from("proofs")
          .select("donation_id")
          .eq("id", body.proofId)
          .maybeSingle();
        if (proof?.donation_id) {
          await supabase
            .from("donations")
            .update({ status: "verified" })
            .eq("id", proof.donation_id);
        }
      }
    }

    return json(verdict);
  } catch (err) {
    console.error(err);
    return json(
      {
        flagged: false,
        ai_checked: false,
        ai_reason: null,
        ai_internal_note: "Automated check could not run.",
        error: String(err),
      },
      200,
    );
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
