/**
 * Identity boundary (stub).
 *
 * Real, legal identity lives ONLY on `Recipient.name` and is rendered in
 * exactly one place: the recipient's own dashboard. Organisations, donors and
 * the public are shown `recipientPublicLabel()` (pseudonym) plus the wallet
 * address, which is all that's needed to disburse funds.
 *
 * KYC / verification would happen here, server-side, and would never return
 * the underlying identity document or legal name to an organisation client.
 */

export type KycStatus = "unverified" | "pending" | "verified";

export interface KycResult {
  status: KycStatus;
  /** Safe to show an organisation — a boolean-ish attestation, never a name. */
  attestation: string;
  checkedAt: string;
}

/** Stub: the web3/backend team replaces this with a real KYC provider call. */
export async function verifyRecipientIdentity(recipientId: string): Promise<KycResult> {
  // eslint-disable-next-line no-console
  console.log("[stub] verifyRecipientIdentity", recipientId);
  await new Promise((r) => setTimeout(r, 400));
  return {
    status: "verified",
    attestation: "Identity verified by TrustFlow — legal name withheld from organisations.",
    checkedAt: new Date().toISOString(),
  };
}
