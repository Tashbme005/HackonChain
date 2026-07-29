import type { Donation } from "@/lib/openimpact/types";

import { getSupabase, isSupabaseConfigured } from "./client";
import type { Database } from "./database.types";

type DonationInsert = Database["public"]["Tables"]["donations"]["Insert"];

function toInsert(
  donation: Donation,
  donorProfileId: string | null,
): DonationInsert {
  return {
    id: donation.id,
    donor_profile_id: donorProfileId,
    // Private donors never store a real name on the public-readable row.
    donor_name: donation.isPublic ? donation.donorName : "Anonymous",
    is_public: donation.isPublic,
    amount: donation.amount,
    currency: donation.currency,
    recipient_id: donation.recipientId,
    org_id: donation.orgId ?? null,
    status: donation.status,
    tx_hash: donation.txHash || null,
    note: donation.note ?? null,
    created_at: donation.timestamp,
  };
}

/**
 * Persist a donation. When the user is signed in, attach their profile id;
 * otherwise insert with `donor_profile_id = null` (allowed by RLS for demos).
 */
export async function insertDonation(donation: Donation): Promise<Donation> {
  if (!isSupabaseConfigured()) {
    return {
      ...donation,
      donorName: donation.isPublic ? donation.donorName : "Anonymous",
    };
  }

  const sb = getSupabase();
  const { data: sessionData } = await sb.auth.getSession();
  const donorProfileId = sessionData.session?.user.id ?? null;

  const row = toInsert(donation, donorProfileId);
  const { data, error } = await sb.from("donations").insert(row).select("*").single();

  if (error) {
    throw new Error(error.message);
  }

  const saved = data as Database["public"]["Tables"]["donations"]["Row"];
  return {
    ...donation,
    id: saved.id,
    donorName: saved.donor_name,
    isPublic: saved.is_public,
    amount: Number(saved.amount),
    currency: saved.currency,
    recipientId: saved.recipient_id,
    orgId: saved.org_id ?? undefined,
    status: saved.status,
    txHash: saved.tx_hash ?? "",
    timestamp: saved.created_at,
    note: saved.note ?? undefined,
    proof: donation.proof ?? null,
    publication: donation.publication ?? null,
  };
}
