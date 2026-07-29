import { checkProofAuthenticity } from "./proof-check.functions";

/**
 * Placeholder web3 layer. The web3 team replaces these bodies with real
 * wallet + chain calls; the UI only depends on these signatures.
 */

export interface WalletConnection {
  address: string;
  chain: string;
}

const MOCK_ADDRESS = "0x7A4f9C1bE2d83a5F0c6D18b4E9aA37cC90f2B5d1";

export async function connectWallet(): Promise<WalletConnection> {
  await new Promise((r) => setTimeout(r, 650));
  return { address: MOCK_ADDRESS, chain: "sepolia" };
}

export async function disconnectWallet(): Promise<void> {
  await new Promise((r) => setTimeout(r, 120));
}

export async function submitToChain(payload: Record<string, unknown>): Promise<string> {
  // eslint-disable-next-line no-console
  console.log("[stub] submitToChain", payload);
  await new Promise((r) => setTimeout(r, 900));
  return mockTxHash();
}

export function mockTxHash(): string {
  const hex = "0123456789abcdef";
  let out = "0x";
  for (let i = 0; i < 64; i += 1) out += hex[Math.floor(Math.random() * 16)];
  return out;
}

export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/**
 * AI counterfeit check for a proof-of-use upload. Runs server-side through
 * Lovable AI (Gemini) — see `proof-check.functions.ts`. Never throws: if the
 * check can't run, the submission passes through marked as unchecked.
 */
export async function runAiProofCheck(proof: {
  photoUrl: string;
  description: string;
  testimonial?: string;
  amount?: number;
  currency?: string;
  seenBefore?: boolean;
}): Promise<{ flagged: boolean; reason?: string; internalNote?: string; checked: boolean }> {
  try {
    const res = await checkProofAuthenticity({
      data: {
        image: proof.photoUrl,
        description: proof.description,
        testimonial: proof.testimonial ?? "",
        amount: proof.amount,
        currency: proof.currency,
        seenBefore: Boolean(proof.seenBefore),
      },
    });
    return {
      flagged: res.verdict === "flagged",
      reason: res.publicReason || undefined,
      internalNote: res.internalNote,
      checked: !res.unavailable,
    };
  } catch {
    return { flagged: false, checked: false, internalNote: "Automated check could not run." };
  }
}
