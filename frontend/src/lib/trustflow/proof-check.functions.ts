import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

/**
 * Hackathon-scope counterfeit check for recipient proof-of-use uploads.
 * One Gemini pass over the image + claim; the model returns a verdict, a
 * plain-language reason for humans, and a slightly fuller internal note.
 */
const Input = z.object({
  /** Data URL (uploaded file) or https URL (sample image). */
  image: z.string().min(1),
  description: z.string().default(""),
  testimonial: z.string().default(""),
  amount: z.number().optional(),
  currency: z.string().optional(),
  /** Local fingerprint match against this recipient's earlier uploads. */
  seenBefore: z.boolean().default(false),
});


export type ProofCheckResult = {
  verdict: "verified" | "flagged";
  publicReason: string;
  internalNote: string;
  unavailable?: boolean;
};

export const checkProofAuthenticity = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<ProofCheckResult> => {
    // Deterministic duplicate catch — no model call needed, and it makes the
    // "reused image" demo case reliable.
    if (data.seenBefore) {
      return {
        verdict: "flagged",
        publicReason: "This image appears to match a previous submission.",
        internalNote:
          "Image fingerprint matches an earlier upload from this recipient. Ask for a fresh photo before releasing further funds.",
      };
    }

    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      return {
        verdict: "verified",
        publicReason: "",
        internalNote: "Automated check unavailable — submission passed through unchecked.",
        unavailable: true,
      };
    }

    const claim = [
      data.amount ? `Claimed amount: ${data.amount} ${data.currency ?? ""}`.trim() : null,
      data.description ? `Recipient's description: ${data.description}` : null,
      data.testimonial ? `Recipient's testimonial: ${data.testimonial}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const gateway = createLovableAiGatewayProvider(key);
      const { text } = await generateText({
        model: gateway("google/gemini-3.6-flash"),
        system:
          "You review photos and receipts submitted as proof that donated money was spent as described. " +
          "Assess three things: (1) does the image look like a stock photo, a reused or recycled image, or something lifted from the internet; " +
          "(2) are there visible signs of digital manipulation or editing; " +
          "(3) does the content look plausible and consistent with the claimed amount and description. " +
          "Be pragmatic: ordinary phone photos of goods, receipts, or work in progress are normal and should pass. " +
          "Only flag when something concrete looks wrong.\n" +
          'Reply with JSON only, exactly: {"verdict":"verified"|"flagged","publicReason":string,"internalNote":string}. ' +
          'verdict MUST be the literal string "verified" or "flagged" — no other value. ' +
          "publicReason is ONE short plain-language sentence with no jargon, safe to show a donor " +
          '(e.g. "The receipt total does not match the amount donated."); use an empty string when verified. ' +
          "internalNote is one or two sentences for platform staff.",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: claim || "No written claim was provided." },
              { type: "image", image: data.image },
            ],
          },
        ],
      });

      const parsed = parseVerdict(text);
      if (!parsed) {
        return {
          verdict: "verified",
          publicReason: "",
          internalNote: "Automated check returned an unreadable result — treated as unchecked.",
          unavailable: true,
        };
      }
      return parsed;
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      return {
        verdict: "verified",
        publicReason: "",
        internalNote: `Automated check could not run (${message.slice(0, 120)}).`,
        unavailable: true,
      };
    }
  });

/** Tolerant parse of the model's JSON reply — never throws. */
function parseVerdict(text: string): ProofCheckResult | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const raw = JSON.parse(match[0]) as Record<string, unknown>;
    const verdictWord = String(raw.verdict ?? "").toLowerCase();
    const flagged = /flag|reject|suspic|fail/.test(verdictWord);
    const publicReason = String(raw.publicReason ?? "").trim();
    return {
      verdict: flagged ? "flagged" : "verified",
      publicReason: flagged
        ? publicReason || "Something about this submission needs a human to check it."
        : "",
      internalNote:
        String(raw.internalNote ?? "").trim() ||
        (flagged ? publicReason : "No signs of reuse or manipulation found."),
    };
  } catch {
    return null;
  }
}

