export type DonationStatus = "pending" | "received" | "verified" | "flagged";

/**
 * A proof of use is always authored by a recipient, but it is *addressed*:
 * either to one specific donation (and therefore one specific donor), or —
 * the secondary case — to the organisation as general public content.
 */
export type ProofScope = "donation" | "general";

export interface ProofOfUse {
  id: string;
  scope: ProofScope;
  /** Set when scope === "donation". The donation this proof answers for. */
  donationId?: string;
  /** Who authored it. */
  recipientId: string;
  /** Snapshot of the donor this proof was addressed to, taken at upload time. */
  donorName?: string;
  donorIsPublic?: boolean;
  /** Set when scope === "general" — lives on the organisation's public page. */
  orgId?: string;
  photoUrl: string;
  description: string;
  testimonial: string;
  submittedAt: string;
  flagged?: boolean;
  /**
   * Optional details the recipient chose to share with THIS donation's donor only.
   * Never shown to the organisation or on the public receipt — only when the
   * signed-in donor matches the donation.
   */
  donorOnlyShare?: {
    contact?: string;
    social?: string;
    note?: string;
  };
  /**
   * Result of the automated counterfeit check (Gemini, via Lovable AI).
   * `aiReason` is the short plain-language line shown to humans — never raw
   * model output. `aiInternalNote` is for platform/org oversight only.
   */
  aiChecked?: boolean;
  aiReason?: string;
  aiInternalNote?: string;
}

/** True when a proof carries any donor-only contact/social share. */
export function hasDonorOnlyShare(
  proof?: Pick<ProofOfUse, "donorOnlyShare"> | null,
) {
  const s = proof?.donorOnlyShare;
  if (!s) return false;
  return Boolean(s.contact?.trim() || s.social?.trim() || s.note?.trim());
}

/**
 * The ONLY slice of a submission an organisation is allowed to see: a short,
 * one-line excerpt. Full testimonial / proof detail belongs to the donor who
 * funded that donation. Never pass raw `testimonial` into an org-facing view.
 */
export function proofOrgBrief(
  proof: Pick<ProofOfUse, "description" | "testimonial">,
  maxChars = 90,
) {
  const source = (proof.description || proof.testimonial || "").replace(/\s+/g, " ").trim();
  if (!source) return "Submission received";
  return source.length <= maxChars ? source : `${source.slice(0, maxChars).trimEnd()}…`;
}

/** Name to show for the donor a proof is addressed to. */
export function proofDonorLabel(proof: Pick<ProofOfUse, "donorName" | "donorIsPublic">) {
  return proof.donorIsPublic && proof.donorName ? proof.donorName : "Anonymous";
}

/**
 * Second mandatory leg of accountability — owed by the ORGANISATION, not the
 * recipient: evidence that the impact of a donation was publicised somewhere
 * the public can check.
 */
export type PublicationType = "social" | "news" | "blog" | "other";

export const PUBLICATION_TYPE_LABEL: Record<PublicationType, string> = {
  social: "Social media post",
  news: "News article",
  blog: "Blog",
  other: "Other",
};

export interface PublicationProof {
  id: string;
  /** Where the public can see it — required. */
  url: string;
  type: PublicationType;
  /** Optional one-line context, e.g. "Front page of the county gazette". */
  caption?: string;
  submittedAt: string;
  /** Org account / staff label that filed it. */
  submittedBy?: string;
}

export type PublicationStatus = "pending" | "published";

export interface Donation {
  id: string;
  donorName: string;
  isPublic: boolean;
  amount: number;
  currency: string;
  recipientId: string;
  orgId?: string;
  status: DonationStatus;
  txHash: string;
  /**
   * OpenImpact contract `uint256` id when the donation was escrowed on-chain.
   * Mapped in sessionStorage for confirm/proof/publication calls; also kept
   * here for UI. Optional Supabase column can be added later.
   */
  onChainDonationId?: string;
  timestamp: string;
  note?: string;
  /** Proof of use attached to *this* donation, visible to *this* donor. */
  proof?: ProofOfUse | null;
  /** Publication proof filed by the organisation. Mandatory, like `proof`. */
  publication?: PublicationProof | null;
}

export function publicationStatus(d: Pick<Donation, "publication">): PublicationStatus {
  return d.publication ? "published" : "pending";
}

export const PUBLICATION_STATUS_LABEL: Record<PublicationStatus, string> = {
  pending: "Pending publication",
  published: "Published",
};

/**
 * A donation is only "fully accounted for" when BOTH legs are in:
 * the recipient's proof of use AND the organisation's publication proof.
 */
export function isFullyAccounted(d: Pick<Donation, "proof" | "publication">) {
  return Boolean(d.proof && d.publication);
}

/** Safe display host for a publication link. */
export function linkHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export interface Recipient {
  id: string;
  /**
   * Real, legal identity. PRIVATE to the platform and the recipient's own
   * dashboard — organisations and the public never see this field.
   */
  name: string;
  /**
   * The only handle organisations, donors and the public ever see, paired
   * with the wallet address. Assigned at signup on both onboarding paths.
   */
  pseudonym: string;
  orgId?: string;
  story: string;
  walletAddress: string;
  /** Most recent submission of any kind — convenience for profile headers. */
  proofOfUse: ProofOfUse | null;
  reputationScore: number;
}

export interface Organisation {
  id: string;
  name: string;
  tagline: string;
  description: string;
  imageUrl: string;
  walletAddress: string;
  reputationScore: number;
  recipientIds: string[];
  /** Secondary case: testimonials not tied to a single donation. */
  generalProofs?: ProofOfUse[];
}

/**
 * A generic, unassigned recipient slot an organisation opens against a
 * project or disbursement. The org never learns the claimant's real name —
 * only the pseudonym + wallet assigned on claim.
 */
export interface RecipientInvite {
  code: string;
  orgId: string;
  projectLabel: string;
  amount?: number;
  note?: string;
  createdAt: string;
  usedByAccountId?: string;
  claimedPseudonym?: string;
  claimedWallet?: string;
  claimedAt?: string;
}

export const STATUS_LABEL: Record<DonationStatus, string> = {
  pending: "Waiting to be received",
  received: "Received — proof pending",
  verified: "Verified",
  flagged: "Flagged for review",
};

/** The only recipient identity an org / donor / the public is allowed to see. */
export function recipientPublicLabel(
  r?: Pick<Recipient, "pseudonym"> | null,
  fallback = "Unclaimed recipient",
) {
  return r?.pseudonym ?? fallback;
}

/** Short wallet form used next to a pseudonym. */
export function shortWallet(address?: string) {
  if (!address) return "—";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
