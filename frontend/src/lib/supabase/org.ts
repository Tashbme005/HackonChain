import type { PublicationProof, RecipientInvite } from "@/lib/openimpact/types";

import { getSupabase, isSupabaseConfigured } from "./client";
import type { Database } from "./database.types";

type PublicationRow = Database["public"]["Tables"]["publications"]["Row"];
type InviteRow = Database["public"]["Tables"]["invites"]["Row"];

function mapPublication(row: PublicationRow): PublicationProof {
  return {
    id: row.id,
    url: row.url,
    type: row.type,
    caption: row.caption ?? undefined,
    submittedAt: row.submitted_at,
    submittedBy: row.submitted_by ?? undefined,
  };
}

function mapInvite(row: InviteRow): RecipientInvite {
  return {
    code: row.code,
    orgId: row.org_id,
    projectLabel: row.project_label,
    amount: row.amount ?? undefined,
    note: row.note ?? undefined,
    createdAt: row.created_at,
    usedByAccountId: row.used_by_profile_id ?? undefined,
    claimedPseudonym: row.claimed_pseudonym ?? undefined,
    claimedWallet: row.claimed_wallet ?? undefined,
    claimedAt: row.claimed_at ?? undefined,
  };
}

/** Org-safe proof slice from `proofs_org_brief` (no full testimonial/photo). */
export type OrgProofBrief = {
  id: string;
  scope: "donation" | "general";
  donationId?: string;
  recipientId: string;
  orgId?: string;
  submittedAt: string;
  flagged: boolean;
  aiChecked?: boolean;
  aiReason?: string;
  brief: string;
};

export async function fetchOrgProofBriefs(orgId: string): Promise<OrgProofBrief[] | null> {
  if (!isSupabaseConfigured()) return null;
  const sb = getSupabase();
  const { data, error } = await sb
    .from("proofs_org_brief")
    .select("*")
    .eq("org_id", orgId)
    .order("submitted_at", { ascending: false });

  if (error) {
    console.warn("[supabase] proofs_org_brief:", error.message);
    return null;
  }

  return ((data ?? []) as Database["public"]["Views"]["proofs_org_brief"]["Row"][]).map((r) => ({
    id: r.id,
    scope: r.scope,
    donationId: r.donation_id ?? undefined,
    recipientId: r.recipient_id,
    orgId: r.org_id ?? undefined,
    submittedAt: r.submitted_at,
    flagged: r.flagged,
    aiChecked: r.ai_checked ?? undefined,
    aiReason: r.ai_reason ?? undefined,
    brief: r.brief,
  }));
}

export async function upsertPublication(
  donationId: string,
  draft: Omit<PublicationProof, "id" | "submittedAt"> & { submittedAt?: string },
): Promise<PublicationProof | null> {
  if (!isSupabaseConfigured()) return null;

  const sb = getSupabase();
  const { data: sessionData } = await sb.auth.getSession();
  if (!sessionData.session) {
    console.warn("[supabase] upsertPublication skipped — no auth session");
    return null;
  }

  const row = {
    donation_id: donationId,
    url: draft.url.trim(),
    type: draft.type,
    caption: draft.caption?.trim() || null,
    submitted_by: draft.submittedBy ?? null,
    submitted_at: draft.submittedAt ?? new Date().toISOString(),
  };

  const { data, error } = await sb
    .from("publications")
    .upsert(row, { onConflict: "donation_id" })
    .select("*")
    .single();

  if (error || !data) {
    console.warn("[supabase] publication upsert:", error?.message);
    return null;
  }
  return mapPublication(data as PublicationRow);
}

export async function deletePublication(donationId: string): Promise<"persisted" | "local"> {
  if (!isSupabaseConfigured()) return "local";

  const sb = getSupabase();
  const { data: sessionData } = await sb.auth.getSession();
  if (!sessionData.session) return "local";

  const { error } = await sb.from("publications").delete().eq("donation_id", donationId);
  if (error) {
    console.warn("[supabase] publication delete:", error.message);
    return "local";
  }
  return "persisted";
}

export async function insertInvite(invite: RecipientInvite): Promise<RecipientInvite | null> {
  if (!isSupabaseConfigured()) return null;

  const sb = getSupabase();
  const { data: sessionData } = await sb.auth.getSession();
  if (!sessionData.session) {
    console.warn("[supabase] insertInvite skipped — no auth session");
    return null;
  }

  const { data, error } = await sb
    .from("invites")
    .insert({
      code: invite.code,
      org_id: invite.orgId,
      project_label: invite.projectLabel,
      amount: invite.amount ?? null,
      note: invite.note ?? null,
      created_at: invite.createdAt,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.warn("[supabase] invite insert:", error?.message);
    return null;
  }
  return mapInvite(data as InviteRow);
}

export async function deleteInvite(code: string): Promise<"persisted" | "local"> {
  if (!isSupabaseConfigured()) return "local";

  const sb = getSupabase();
  const { data: sessionData } = await sb.auth.getSession();
  if (!sessionData.session) return "local";

  const { error } = await sb.from("invites").delete().eq("code", code);
  if (error) {
    console.warn("[supabase] invite delete:", error.message);
    return "local";
  }
  return "persisted";
}

export async function fetchOrgTrustScore(orgId: string): Promise<number | null> {
  if (!isSupabaseConfigured()) return null;
  const sb = getSupabase();
  const { data, error } = await sb.rpc("org_trust_score", { p_org_id: orgId });
  if (error) {
    console.warn("[supabase] org_trust_score:", error.message);
    return null;
  }
  return typeof data === "number" ? data : Number(data);
}

export async function linkRecipientOrg(
  recipientId: string,
  orgId: string,
): Promise<"persisted" | "local"> {
  if (!isSupabaseConfigured()) return "local";

  const sb = getSupabase();
  const { data: sessionData } = await sb.auth.getSession();
  if (!sessionData.session) return "local";

  const { data, error } = await sb
    .from("recipients")
    .update({ org_id: orgId })
    .eq("id", recipientId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.warn("[supabase] linkRecipientOrg:", error.message);
    return "local";
  }
  return data ? "persisted" : "local";
}
