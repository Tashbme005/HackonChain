import type {
  Donation,
  Organisation,
  ProofOfUse,
  PublicationProof,
  Recipient,
  RecipientInvite,
} from "@/lib/openimpact/types";
import orgWater from "@/assets/org-water-trust.jpg";

import { getSupabase } from "./client";
import type { Database } from "./database.types";
import { fetchOrgTrustScore } from "./org";

/** Fixed IDs from `backend/supabase/seed.sql` — keep demo wiring stable. */
export const SEED_ORG_KILIFI = "a1000000-0000-4000-8000-000000000001";
export const SEED_RECIPIENT_CORAL = "b1000000-0000-4000-8000-000000000001";

/** Seed rows ship empty image_url; keep the UI looking like the mock demo. */
const ORG_IMAGE_FALLBACK: Record<string, string> = {
  [SEED_ORG_KILIFI]: orgWater,
  "a1000000-0000-4000-8000-000000000002":
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=70",
  "a1000000-0000-4000-8000-000000000003":
    "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=70",
  "a1000000-0000-4000-8000-000000000004":
    "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=70",
};

type OrgRow = Database["public"]["Tables"]["organisations"]["Row"];
type RecipientRow = Database["public"]["Tables"]["recipients"]["Row"];
type DonationRow = Database["public"]["Tables"]["donations"]["Row"];
type ProofPublicRow = Database["public"]["Views"]["proofs_public"]["Row"];
type PublicationRow = Database["public"]["Tables"]["publications"]["Row"];
type InviteRow = Database["public"]["Tables"]["invites"]["Row"];

export type LedgerSnapshot = {
  organisations: Organisation[];
  recipients: Recipient[];
  donations: Donation[];
  invites: RecipientInvite[];
};

function mapProof(row: ProofPublicRow): ProofOfUse {
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
  };
}

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

/**
 * Load public ledger slices from Supabase (anon-safe views/tables).
 * Proofs come from `proofs_public` — never the base `proofs` table as anon.
 */
export async function fetchLedgerSnapshot(): Promise<LedgerSnapshot> {
  const sb = getSupabase();

  const [orgsRes, recipientsRes, donationsRes, proofsRes, pubsRes, invitesRes] =
    await Promise.all([
      sb.from("organisations").select("*").order("name"),
      sb.from("recipients").select("*").order("pseudonym"),
      sb.from("donations").select("*").order("created_at", { ascending: false }),
      sb.from("proofs_public").select("*").order("submitted_at", { ascending: false }),
      sb.from("publications").select("*"),
      sb.from("invites").select("*").order("created_at", { ascending: false }),
    ]);

  const errors = [
    orgsRes.error,
    recipientsRes.error,
    donationsRes.error,
    proofsRes.error,
    pubsRes.error,
    invitesRes.error,
  ].filter(Boolean);
  if (errors.length) {
    throw new Error(errors.map((e) => e!.message).join("; "));
  }

  const orgRows = (orgsRes.data ?? []) as OrgRow[];
  const recipientRows = (recipientsRes.data ?? []) as RecipientRow[];
  const donationRows = (donationsRes.data ?? []) as DonationRow[];
  const proofRows = (proofsRes.data ?? []) as ProofPublicRow[];
  const pubRows = (pubsRes.data ?? []) as PublicationRow[];
  const inviteRows = (invitesRes.data ?? []) as InviteRow[];

  const proofs = proofRows.map(mapProof);
  const proofsByDonation = new Map<string, ProofOfUse>();
  const proofsByRecipient = new Map<string, ProofOfUse[]>();
  const generalByOrg = new Map<string, ProofOfUse[]>();

  for (const proof of proofs) {
    if (proof.donationId && !proofsByDonation.has(proof.donationId)) {
      proofsByDonation.set(proof.donationId, proof);
    }
    const list = proofsByRecipient.get(proof.recipientId) ?? [];
    list.push(proof);
    proofsByRecipient.set(proof.recipientId, list);
    if (proof.scope === "general" && proof.orgId) {
      const g = generalByOrg.get(proof.orgId) ?? [];
      g.push(proof);
      generalByOrg.set(proof.orgId, g);
    }
  }

  const pubsByDonation = new Map(
    pubRows.map((p) => [p.donation_id, mapPublication(p)] as const),
  );

  const recipients: Recipient[] = recipientRows.map((r) => {
    const list = proofsByRecipient.get(r.id) ?? [];
    return {
      id: r.id,
      // Real name lives on profiles — never on this public table.
      name: "",
      pseudonym: r.pseudonym,
      orgId: r.org_id ?? undefined,
      story: r.story,
      walletAddress: r.wallet_address ?? "",
      proofOfUse: list[0] ?? null,
      reputationScore: r.reputation_score,
    };
  });

  const organisations: Organisation[] = orgRows.map((o) => ({
    id: o.id,
    name: o.name,
    tagline: o.tagline,
    description: o.description,
    imageUrl: o.image_url || ORG_IMAGE_FALLBACK[o.id] || "",
    walletAddress: o.wallet_address ?? "",
    reputationScore: o.reputation_score,
    recipientIds: recipients.filter((r) => r.orgId === o.id).map((r) => r.id),
    generalProofs: generalByOrg.get(o.id) ?? [],
  }));

  // Prefer server-computed trust scores (proof-rate × publication-rate).
  await Promise.all(
    organisations.map(async (o) => {
      const score = await fetchOrgTrustScore(o.id);
      if (score != null && !Number.isNaN(score)) o.reputationScore = score;
    }),
  );

  const donations: Donation[] = donationRows.map((d) => ({
    id: d.id,
    donorName: d.donor_name,
    isPublic: d.is_public,
    amount: Number(d.amount),
    currency: d.currency,
    recipientId: d.recipient_id,
    orgId: d.org_id ?? undefined,
    status: d.status,
    txHash: d.tx_hash ?? "",
    timestamp: d.created_at,
    note: d.note ?? undefined,
    proof: proofsByDonation.get(d.id) ?? null,
    publication: pubsByDonation.get(d.id) ?? null,
  }));

  return {
    organisations,
    recipients,
    donations,
    invites: inviteRows.map(mapInvite),
  };
}
