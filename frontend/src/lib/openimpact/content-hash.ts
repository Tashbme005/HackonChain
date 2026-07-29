/**
 * Canonical content hashing for OpenImpact proofs / publications.
 *
 * Contract stores only the resulting string (never PII or media bytes).
 * Hash the same UTF-8 payload before `submitRecipientProof` /
 * `submitPublication` so on-chain hashes match Supabase content.
 *
 * Format: hex SHA-256 with `sha256:` prefix.
 *
 * Proof payload:
 *   v1|donation|{donationId}|{photoUrl}|{description}|{testimonial}
 *
 * Publication payload:
 *   v1|publication|{donationId}|{url}|{type}|{caption}
 */

async function sha256Hex(utf8: string): Promise<string> {
  const data = new TextEncoder().encode(utf8);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return `sha256:${hex}`;
}

function normalize(part: string | undefined | null): string {
  return (part ?? "").replace(/\s+/g, " ").trim();
}

export function proofCanonicalString(input: {
  donationId: string;
  photoUrl: string;
  description: string;
  testimonial?: string;
}): string {
  return [
    "v1",
    "donation",
    normalize(input.donationId),
    normalize(input.photoUrl),
    normalize(input.description),
    normalize(input.testimonial),
  ].join("|");
}

export function publicationCanonicalString(input: {
  donationId: string;
  url: string;
  type: string;
  caption?: string;
}): string {
  return [
    "v1",
    "publication",
    normalize(input.donationId),
    normalize(input.url),
    normalize(input.type),
    normalize(input.caption),
  ].join("|");
}

export async function hashProofContent(input: {
  donationId: string;
  photoUrl: string;
  description: string;
  testimonial?: string;
}): Promise<string> {
  return sha256Hex(proofCanonicalString(input));
}

export async function hashPublicationContent(input: {
  donationId: string;
  url: string;
  type: string;
  caption?: string;
}): Promise<string> {
  return sha256Hex(publicationCanonicalString(input));
}
