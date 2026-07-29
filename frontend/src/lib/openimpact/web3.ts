import {
  createPublicClient,
  createWalletClient,
  custom,
  decodeEventLog,
  http,
  parseEther,
  type Address,
  type Hash,
} from "viem";
import { sepolia } from "viem/chains";

import { hashProofContent, hashPublicationContent } from "./content-hash";
import { checkProofAuthenticity } from "./proof-check.functions";
import { openImpactAbi } from "./openimpact-abi";

/**
 * Web3 layer for OpenImpact.
 *
 * Same stack as the Solidity contract: Ethereum (Sepolia by default) via viem.
 * Browser wallets (MetaMask, Rabby, etc.) inject `window.ethereum`; that is how
 * users sign donate / confirm / proof txs. This is not account sign-in.
 *
 * When `VITE_OPENIMPACT_CONTRACT_ADDRESS` is set, donate / confirm / proof /
 * publication hash calls hit the deployed contract. Otherwise stubs keep the
 * demo usable without a wallet or testnet.
 */

export interface WalletConnection {
  address: string;
  chain: string;
}

export interface ChainDonationResult {
  txHash: string;
  /** On-chain `uint256` donation id from OpenImpact. */
  onChainDonationId?: string;
}

const MOCK_ADDRESS = "0x7A4f9C1bE2d83a5F0c6D18b4E9aA37cC90f2B5d1";
const ONCHAIN_MAP_PREFIX = "openimpact:onchain:";

const contractAddress = (import.meta.env.VITE_OPENIMPACT_CONTRACT_ADDRESS ?? "").trim() as Address | "";
const chainIdEnv = Number(import.meta.env.VITE_CHAIN_ID ?? 11155111);
const rpcUrl = (import.meta.env.VITE_RPC_URL ?? "").trim();

export function isContractConfigured(): boolean {
  return Boolean(contractAddress && /^0x[a-fA-F0-9]{40}$/.test(contractAddress));
}

function chainForId(id: number) {
  if (id === sepolia.id) return sepolia;
  return { ...sepolia, id, name: `chain-${id}` };
}

function ethereumProvider(): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  return (window as Window & { ethereum?: EthereumProvider }).ethereum ?? null;
}

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
};

export function rememberOnChainDonationId(offChainDonationId: string, onChainId: string | number) {
  try {
    sessionStorage.setItem(`${ONCHAIN_MAP_PREFIX}${offChainDonationId}`, String(onChainId));
  } catch {
    /* ignore quota / private mode */
  }
}

export function lookupOnChainDonationId(offChainDonationId: string): bigint | null {
  try {
    const raw = sessionStorage.getItem(`${ONCHAIN_MAP_PREFIX}${offChainDonationId}`);
    if (raw == null || raw === "") return null;
    return BigInt(raw);
  } catch {
    return null;
  }
}

export async function connectWallet(): Promise<WalletConnection> {
  const provider = ethereumProvider();
  if (!provider) {
    await new Promise((r) => setTimeout(r, 400));
    return { address: MOCK_ADDRESS, chain: isContractConfigured() ? "sepolia" : "stub" };
  }

  const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
  const address = accounts[0];
  if (!address) throw new Error("No wallet account returned.");

  if (isContractConfigured()) {
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${chainIdEnv.toString(16)}` }],
      });
    } catch {
      /* user may reject; continue */
    }
  }

  const chainHex = (await provider.request({ method: "eth_chainId" })) as string;
  const id = Number.parseInt(chainHex, 16);
  return { address, chain: id === sepolia.id ? "sepolia" : `chain-${id}` };
}

export async function disconnectWallet(): Promise<void> {
  await new Promise((r) => setTimeout(r, 80));
}

async function getClients() {
  const provider = ethereumProvider();
  if (!provider) throw new Error("No injected wallet (window.ethereum) found.");
  if (!isContractConfigured()) throw new Error("Contract address is not configured.");

  const chain = chainForId(chainIdEnv);
  const walletClient = createWalletClient({
    chain,
    transport: custom(provider),
  });
  const publicClient = createPublicClient({
    chain,
    transport: rpcUrl ? http(rpcUrl) : custom(provider),
  });
  const [account] = await walletClient.getAddresses();
  if (!account) throw new Error("Connect a wallet first.");
  return { walletClient, publicClient, account, chain };
}

function parseDonationCreatedId(logs: { data: Hash; topics: [] | [Hash, ...Hash[]] }[]): string | undefined {
  for (const log of logs) {
    try {
      const decoded = decodeEventLog({
        abi: openImpactAbi,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName === "DonationCreated") {
        return String(decoded.args.donationId);
      }
    } catch {
      /* not our event */
    }
  }
  return undefined;
}

/**
 * Escrow native ETH on-chain (v1). Amount is treated as ETH when the contract
 * is configured; otherwise a stub tx hash is returned.
 */
export async function createDonationOnChain(params: {
  organisation: string;
  recipient: string;
  /** ETH amount when contract is live; ignored by the stub. */
  amountEth: number;
}): Promise<ChainDonationResult> {
  if (!isContractConfigured()) {
    await new Promise((r) => setTimeout(r, 500));
    return { txHash: mockTxHash() };
  }

  const { walletClient, publicClient, account } = await getClients();
  const value = parseEther(String(params.amountEth));

  const hash = await walletClient.writeContract({
    address: contractAddress as Address,
    abi: openImpactAbi,
    functionName: "createDonation",
    args: [params.organisation as Address, params.recipient as Address],
    value,
    account,
    chain: chainForId(chainIdEnv),
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const onChainDonationId = parseDonationCreatedId(receipt.logs);
  return { txHash: hash, onChainDonationId };
}

export async function confirmReceiptOnChain(
  offChainDonationId: string,
  knownOnChainId?: string,
): Promise<string> {
  if (!isContractConfigured()) {
    await new Promise((r) => setTimeout(r, 400));
    return mockTxHash();
  }

  let onChainId = lookupOnChainDonationId(offChainDonationId);
  if (onChainId == null && knownOnChainId) {
    rememberOnChainDonationId(offChainDonationId, knownOnChainId);
    onChainId = BigInt(knownOnChainId);
  }
  if (onChainId == null) {
    // No mapping (donation created while stubbing) — skip chain call.
    return mockTxHash();
  }

  const { walletClient, publicClient, account } = await getClients();
  const hash = await walletClient.writeContract({
    address: contractAddress as Address,
    abi: openImpactAbi,
    functionName: "confirmReceipt",
    args: [onChainId],
    account,
    chain: chainForId(chainIdEnv),
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function submitProofHashOnChain(
  offChainDonationId: string,
  proof: { photoUrl: string; description: string; testimonial?: string },
): Promise<string> {
  const contentHash = await hashProofContent({
    donationId: offChainDonationId,
    photoUrl: proof.photoUrl,
    description: proof.description,
    testimonial: proof.testimonial,
  });

  if (!isContractConfigured()) {
    // eslint-disable-next-line no-console
    console.log("[stub] proof hash", contentHash);
    await new Promise((r) => setTimeout(r, 300));
    return mockTxHash();
  }

  const onChainId = lookupOnChainDonationId(offChainDonationId);
  if (onChainId == null) return mockTxHash();

  const { walletClient, publicClient, account } = await getClients();
  const hash = await walletClient.writeContract({
    address: contractAddress as Address,
    abi: openImpactAbi,
    functionName: "submitRecipientProof",
    args: [onChainId, contentHash],
    account,
    chain: chainForId(chainIdEnv),
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function submitPublicationHashOnChain(
  offChainDonationId: string,
  publication: { url: string; type: string; caption?: string },
): Promise<string> {
  const contentHash = await hashPublicationContent({
    donationId: offChainDonationId,
    url: publication.url,
    type: publication.type,
    caption: publication.caption,
  });

  if (!isContractConfigured()) {
    // eslint-disable-next-line no-console
    console.log("[stub] publication hash", contentHash);
    await new Promise((r) => setTimeout(r, 300));
    return mockTxHash();
  }

  const onChainId = lookupOnChainDonationId(offChainDonationId);
  if (onChainId == null) return mockTxHash();

  const { walletClient, publicClient, account } = await getClients();
  const hash = await walletClient.writeContract({
    address: contractAddress as Address,
    abi: openImpactAbi,
    functionName: "submitPublication",
    args: [onChainId, contentHash],
    account,
    chain: chainForId(chainIdEnv),
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

/**
 * Dispatcher kept for call sites that still pass a loose payload.
 * Prefer the typed helpers above for new code.
 */
export async function submitToChain(payload: Record<string, unknown>): Promise<string> {
  const action = typeof payload.action === "string" ? payload.action : "createDonation";

  if (action === "confirmReceipt" && typeof payload.donationId === "string") {
    return confirmReceiptOnChain(payload.donationId);
  }

  if (action === "attachProof" && typeof payload.donationId === "string") {
    return submitProofHashOnChain(payload.donationId, {
      photoUrl: String(payload.photoUrl ?? ""),
      description: String(payload.description ?? ""),
      testimonial: typeof payload.testimonial === "string" ? payload.testimonial : undefined,
    });
  }

  if (action === "submitPublication" && typeof payload.donationId === "string") {
    return submitPublicationHashOnChain(payload.donationId, {
      url: String(payload.url ?? ""),
      type: String(payload.type ?? "other"),
      caption: typeof payload.caption === "string" ? payload.caption : undefined,
    });
  }

  if (
    action === "createDonation" ||
    (typeof payload.organisation === "string" && typeof payload.recipient === "string")
  ) {
    const result = await createDonationOnChain({
      organisation: String(payload.organisation ?? payload.to ?? ""),
      recipient: String(payload.recipient ?? payload.to ?? ""),
      amountEth: Number(payload.amount ?? 0),
    });
    if (result.onChainDonationId && typeof payload.offChainDonationId === "string") {
      rememberOnChainDonationId(payload.offChainDonationId, result.onChainDonationId);
    }
    return result.txHash;
  }

  // eslint-disable-next-line no-console
  console.log("[stub] submitToChain", payload);
  await new Promise((r) => setTimeout(r, 400));
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
      image: proof.photoUrl,
      description: proof.description,
      testimonial: proof.testimonial ?? "",
      amount: proof.amount,
      currency: proof.currency,
      seenBefore: Boolean(proof.seenBefore),
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
