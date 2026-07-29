import type { DonationStatus, ProofOfUse } from "@/lib/openimpact/types";
import { checkProofAuthenticity } from "@/lib/openimpact/proof-check.functions";

import { getSupabase, isSupabaseConfigured } from "./client";
import type { Database } from "./database.types";

type ProofRow = Database["public"]["Tables"]["proofs"]["Row"];

export type ProofDraft = Omit<
  ProofOfUse,
  "id" | "scope" | "donationId" | "recipientId" | "donorName" | "donorIsPublic" | "orgId"
> & {
  donationId?: string;
  orgId?: string;
  scope: "donation" | "general";
  recipientId: string;
  donorName?: string;
  donorIsPublic?: boolean;
};

function mapProof(row: ProofRow, donorOnlyShare?: ProofOfUse["donorOnlyShare"]): ProofOfUse {
  return {
    id: row.id,
    scope: row.scope,
    donationId: row.donation_id ?? undefined,
    recipientId: row.recipient_id,
    donorName: row.donor_name ?? undefined,
    donorIsPublic: row.donor_is_public ?? undefined,
    orgId: row.org_id ?? undefined,
    photoUrl: row.photo_url,
    description: row.description,
    testimonial: row.testimonial,
    submittedAt: row.submitted_at,
    flagged: row.flagged,
    aiChecked: row.ai_checked ?? undefined,
    aiReason: row.ai_reason ?? undefined,
    aiInternalNote: row.ai_internal_note ?? undefined,
    donorOnlyShare,
  };
}

/** Confirm funds landed — requires signed-in recipient who owns the row (RLS). */
export async function confirmDonationReceipt(
  donationId: string,
): Promise<"persisted" | "local"> {
  if (!isSupabaseConfigured()) return "local";

  const sb = getSupabase();
  const { data, error } = await sb
    .from("donations")
    .update({ status: "received" })
    .eq("id", donationId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) {
    console.warn("[supabase] confirmReceipt:", error.message);
    return "local";
  }
  return data ? "persisted" : "local";
}

/** Upload a proof photo to the public `proofs` bucket. Path: `{uid}/{uuid}.ext`. */
export async function uploadProofPhoto(file: File): Promise<string> {
  const sb = getSupabase();
  const { data: sessionData } = await sb.auth.getSession();
  const uid = sessionData.session?.user.id;
  if (!uid) {
    throw new Error("Sign in as the recipient to upload proof photos.");
  }

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${uid}/${crypto.randomUUID()}.${ext}`;

  const { error } = await sb.storage.from("proofs").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || `image/${ext}`,
  });
  if (error) throw new Error(error.message);

  const { data } = sb.storage.from("proofs").getPublicUrl(path);
  return data.publicUrl;
}

async function dataUrlToFile(dataUrl: string, name = "proof.jpg"): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], name, { type: blob.type || "image/jpeg" });
}

async function resolvePhotoUrl(draft: ProofDraft, file?: File | null): Promise<string> {
  if (file) return uploadProofPhoto(file);
  if (draft.photoUrl.startsWith("http://") || draft.photoUrl.startsWith("https://")) {
    return draft.photoUrl;
  }
  if (draft.photoUrl.startsWith("data:")) {
    const converted = await dataUrlToFile(draft.photoUrl);
    return uploadProofPhoto(converted);
  }
  return draft.photoUrl;
}

type AiVerdict = {
  flagged: boolean;
  ai_checked: boolean;
  ai_reason: string | null;
  ai_internal_note: string | null;
};

async function runProofCheck(input: {
  photoUrl: string;
  description: string;
  testimonial: string;
  amount?: number;
  currency?: string;
  recipientId: string;
  proofId: string;
  seenBefore: boolean;
}): Promise<AiVerdict> {
  const sb = getSupabase();

  try {
    const { data, error } = await sb.functions.invoke("check-proof", {
      body: {
        photoUrl: input.photoUrl,
        description: input.description,
        testimonial: input.testimonial,
        amount: input.amount,
        currency: input.currency,
        recipientId: input.recipientId,
        proofId: input.proofId,
      },
    });
    if (!error && data && typeof data === "object" && "flagged" in (data as object)) {
      const v = data as AiVerdict;
      return {
        flagged: Boolean(v.flagged),
        ai_checked: Boolean(v.ai_checked),
        ai_reason: v.ai_reason ?? null,
        ai_internal_note: v.ai_internal_note ?? null,
      };
    }
  } catch (err) {
    console.warn("[supabase] check-proof edge unavailable, using client stub", err);
  }

  const stub = await checkProofAuthenticity({
    image: input.photoUrl,
    description: input.description,
    testimonial: input.testimonial,
    amount: input.amount,
    currency: input.currency,
    seenBefore: input.seenBefore,
  });

  const verdict: AiVerdict = {
    flagged: stub.verdict === "flagged",
    ai_checked: !stub.unavailable,
    ai_reason: stub.verdict === "flagged" ? stub.publicReason : null,
    ai_internal_note: stub.internalNote,
  };

  await sb.from("proofs").update(verdict).eq("id", input.proofId);
  return verdict;
}

/**
 * Insert a proof (+ optional donor-only share), run AI check, sync donation status.
 * Returns null when remote persist isn't possible (no session / RLS) — caller keeps local state.
 */
export async function persistProof(input: {
  draft: ProofDraft;
  file?: File | null;
  amount?: number;
  currency?: string;
  seenBefore?: boolean;
}): Promise<{ proof: ProofOfUse; donationStatus?: DonationStatus } | null> {
  if (!isSupabaseConfigured()) return null;

  const sb = getSupabase();
  const { data: sessionData } = await sb.auth.getSession();
  if (!sessionData.session) {
    console.warn("[supabase] persistProof skipped — no auth session");
    return null;
  }

  let photoUrl: string;
  try {
    photoUrl = await resolvePhotoUrl(input.draft, input.file);
  } catch (err) {
    console.warn("[supabase] photo upload failed:", err);
    return null;
  }

  const insertRow = {
    scope: input.draft.scope,
    donation_id: input.draft.scope === "donation" ? input.draft.donationId ?? null : null,
    recipient_id: input.draft.recipientId,
    donor_name: input.draft.donorName ?? null,
    donor_is_public: input.draft.donorIsPublic ?? null,
    org_id: input.draft.orgId ?? null,
    photo_url: photoUrl,
    description: input.draft.description,
    testimonial: input.draft.testimonial,
    submitted_at: input.draft.submittedAt,
    flagged: false,
    ai_checked: null as boolean | null,
    ai_reason: null as string | null,
    ai_internal_note: null as string | null,
  };

  const { data: created, error } = await sb.from("proofs").insert(insertRow).select("*").single();
  if (error || !created) {
    console.warn("[supabase] proof insert:", error?.message);
    return null;
  }

  const row = created as ProofRow;
  const share = input.draft.donorOnlyShare;
  if (share && (share.contact || share.social || share.note)) {
    const { error: shareErr } = await sb.from("proof_donor_shares").insert({
      proof_id: row.id,
      contact: share.contact ?? null,
      social: share.social ?? null,
      note: share.note ?? null,
    });
    if (shareErr) console.warn("[supabase] donor share:", shareErr.message);
  }

  const verdict = await runProofCheck({
    photoUrl,
    description: input.draft.description,
    testimonial: input.draft.testimonial,
    amount: input.amount,
    currency: input.currency,
    recipientId: input.draft.recipientId,
    proofId: row.id,
    seenBefore: Boolean(input.seenBefore),
  });

  let donationStatus: DonationStatus | undefined;
  if (input.draft.scope === "donation" && input.draft.donationId) {
    donationStatus = verdict.flagged ? "flagged" : "verified";
    const { error: donErr } = await sb
      .from("donations")
      .update({ status: donationStatus })
      .eq("id", input.draft.donationId);
    if (donErr) console.warn("[supabase] donation status:", donErr.message);
  }

  const patched: ProofRow = {
    ...row,
    photo_url: photoUrl,
    flagged: verdict.flagged,
    ai_checked: verdict.ai_checked,
    ai_reason: verdict.ai_reason,
    ai_internal_note: verdict.ai_internal_note,
  };

  return {
    proof: mapProof(patched, input.draft.donorOnlyShare),
    donationStatus,
  };
}
