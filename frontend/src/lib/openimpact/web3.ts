import {
  createPublicClient,
  createWalletClient,
  custom,
  decodeEventLog,
  http,
  parseUnits,
  type Address,
  type Hash,
} from "viem";
import { baseSepolia } from "viem/chains";

import { MOCK_USDC_ADDRESS, TRUSTFLOW_ADDRESS } from "@/contracts/addresses";
import { mockUsdcAbi } from "@/contracts/mock-usdc-abi";
import { hashProofContent, hashPublicationContent } from "./content-hash";
import { openImpactAbi } from "./openimpact-abi";
import { checkProofAuthenticity } from "./proof-check.functions";
import { approveUSDC, checkUSDCAllowance } from "./services/token";

export interface WalletConnection {
  address: string;
  chain: string;
}

export interface ChainDonationResult {
  txHash: string;
  onChainDonationId?: string;
}

const MOCK_ADDRESS = "0x7A4f9C1bE2d83a5F0c6D18b4E9aA37cC90f2B5d1";
const ONCHAIN_MAP_PREFIX = "openimpact:onchain:";

const envContractAddress = (import.meta.env.VITE_OPENIMPACT_CONTRACT_ADDRESS ?? "").trim();
export const contractAddress: Address = (
  envContractAddress && /^0x[a-fA-F0-9]{40}$/.test(envContractAddress)
    ? envContractAddress
    : TRUSTFLOW_ADDRESS
) as Address;

const chainIdEnv = Number(import.meta.env.VITE_CHAIN_ID ?? baseSepolia.id);
const rpcUrl = (import.meta.env.VITE_RPC_URL ?? "").trim();

export function isContractConfigured(): boolean {
  return Boolean(contractAddress && /^0x[a-fA-F0-9]{40}$/.test(contractAddress));
}

function chainForId(id: number) {
  if (id === baseSepolia.id) return baseSepolia;
  return { ...baseSepolia, id, name: `chain-${id}` };
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
    return { address: MOCK_ADDRESS, chain: "base-sepolia" };
  }

  const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
  const address = accounts[0];
  if (!address) throw new Error("No wallet account returned.");

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${chainIdEnv.toString(16)}` }],
    });
  } catch {
    /* user may reject; continue */
  }

  const chainHex = (await provider.request({ method: "eth_chainId" })) as string;
  const id = Number.parseInt(chainHex, 16);
  return { address, chain: id === baseSepolia.id ? "base-sepolia" : `chain-${id}` };
}

export async function disconnectWallet(): Promise<void> {
  await new Promise((r) => setTimeout(r, 80));
}

async function getClients() {
  const provider = ethereumProvider();
  if (!provider) throw new Error("No injected wallet (window.ethereum) found.");

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
async function mintDemoTokensToRecipient(donationId: bigint) {
  const { walletClient, publicClient, account } = await getClients();

  // Read the donation from TrustFlow
  const donation = await publicClient.readContract({
    address: contractAddress,
    abi: openImpactAbi,
    functionName: "getDonation",
    args: [donationId],
  });

  const recipient = donation.recipient as Address;
  const amount = donation.amountUSDC;

  console.log("Demo release");
  console.log("Recipient:", recipient);
  console.log("Amount:", amount.toString());

  const { request } = await publicClient.simulateContract({
    address: MOCK_USDC_ADDRESS,
    abi: mockUsdcAbi,
    functionName: "mint",
    args: [recipient, amount],
    account,
  });

  const hash = await walletClient.writeContract(request);

  await publicClient.waitForTransactionReceipt({
    hash,
  });

  console.log("Demo funds released.");
}
/**
  Escrow mUSDC on-chain (TrustFlow contract on Base Sepolia).
  Includes step-by-step diagnostic logging and direct transferFrom simulation to catch token errors.
 */
export async function createDonationOnChain(params: {
  organisation: string;
  recipient: string;
  /** Amount in USDC (e.g. 50 = $50 mUSDC). */
  amountUsdc: number;
}): Promise<ChainDonationResult> {
  const provider = ethereumProvider();
  if (!provider) {
    await new Promise((r) => setTimeout(r, 500));
    return { txHash: mockTxHash() };
  }

  const { walletClient, publicClient, account } = await getClients();
  const value = parseUnits(String(params.amountUsdc), 6);

  console.log("=== [TrustFlow Diagnostics Start] ===");
  console.log("Configured TRUSTFLOW_ADDRESS:", contractAddress);
  console.log("Configured MOCK_USDC_ADDRESS:", MOCK_USDC_ADDRESS);
  console.log("User Connected Wallet:", account);
  console.log("Donation Amount USDC:", params.amountUsdc, "Raw Value:", value.toString());

  // Diagnostic 1: Query TrustFlow.usdc() on-chain
  let onChainUsdcAddress: Address = MOCK_USDC_ADDRESS as Address;
  try {
    const fetchedAddress = await publicClient.readContract({
      address: contractAddress,
      abi: openImpactAbi,
      functionName: "usdc",
    });
    console.log("On-Chain TrustFlow.usdc() returned:", fetchedAddress);
    if (fetchedAddress && /^0x[a-fA-F0-9]{40}$/.test(fetchedAddress)) {
      onChainUsdcAddress = fetchedAddress as Address;
    }
  } catch (err) {
    console.warn("Could not read usdc() from TrustFlow contract on-chain:", err);
  }

  const isMismatch = onChainUsdcAddress.toLowerCase() !== MOCK_USDC_ADDRESS.toLowerCase();
  if (isMismatch) {
    console.warn(
      `⚠️ ADDRESS MISMATCH DETECTED!\nTrustFlow on-chain usdc(): ${onChainUsdcAddress}\nFrontend MOCK_USDC_ADDRESS: ${MOCK_USDC_ADDRESS}\nTrustFlow will attempt transferFrom on ${onChainUsdcAddress}!`,
    );
  }

  // Diagnostic 2: Read balance & allowance on target USDC contract
  const userBalance = await publicClient.readContract({
    address: onChainUsdcAddress,
    abi: mockUsdcAbi,
    functionName: "balanceOf",
    args: [account],
  });
  const userAllowance = await publicClient.readContract({
    address: onChainUsdcAddress,
    abi: mockUsdcAbi,
    functionName: "allowance",
    args: [account, contractAddress],
  });

  console.log(`Balance of user on token ${onChainUsdcAddress}:`, userBalance.toString());
  console.log(`Allowance for TrustFlow (${contractAddress}) on token ${onChainUsdcAddress}:`, userAllowance.toString());

  if (userBalance < value) {
    throw new Error(
      `Insufficient mUSDC balance in your wallet on token ${onChainUsdcAddress}. Balance: ${userBalance.toString()}, Needed: ${value.toString()}. Click "🚰 Get 1,000 Test mUSDC" first.`,
    );
  }

  // Diagnostic 3: Approve if needed and wait for confirmation receipt
  if (userAllowance < value) {
    console.log(`Allowance (${userAllowance}) < needed (${value}). Requesting approve...`);
    await approveUSDC(params.amountUsdc, contractAddress);
    console.log("Approve confirmed on-chain.");
  } else {
    console.log("Allowance is sufficient.");
  }

  // Diagnostic 4: Directly simulate transferFrom on the USDC contract
  try {
    console.log(`Simulating transferFrom on USDC contract ${onChainUsdcAddress}...`);
    await publicClient.simulateContract({
      address: onChainUsdcAddress,
      abi: mockUsdcAbi,
      functionName: "transferFrom",
      args: [account, contractAddress, value],
      account: contractAddress,
    });
    console.log("transferFrom simulation succeeded!");
  } catch (err: any) {
    console.error("❌ transferFrom simulation FAILED with error:", err);
    if (err?.shortMessage) console.error("Short Message:", err.shortMessage);
  }

  // Step 5: Simulate TrustFlow.createDonation(org, recipient, value)
  console.log("Simulating TrustFlow.createDonation...");
  const { request } = await publicClient.simulateContract({
    address: contractAddress,
    abi: openImpactAbi,
    functionName: "createDonation",
    args: [params.organisation as Address, params.recipient as Address, value],
    account,
  });

  console.log("TrustFlow.createDonation simulation succeeded! Submitting transaction to wallet...");
  const hash = await walletClient.writeContract(request);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const onChainDonationId = parseDonationCreatedId(receipt.logs);
  console.log("=== [TrustFlow Diagnostics End - Tx Complete] ===", hash);
  return { txHash: hash, onChainDonationId };
}

export async function confirmReceiptOnChain(
  offChainDonationId: string,
  knownOnChainId?: string,
): Promise<string> {
  const provider = ethereumProvider();
  if (!provider) {
    await new Promise((r) => setTimeout(r, 400));
    return mockTxHash();
  }

  let onChainId = lookupOnChainDonationId(offChainDonationId);
  if (onChainId == null && knownOnChainId) {
    rememberOnChainDonationId(offChainDonationId, knownOnChainId);
    onChainId = BigInt(knownOnChainId);
  }
  if (onChainId == null) {
    return mockTxHash();
  }

  const { walletClient, publicClient, account } = await getClients();
  const { request } = await publicClient.simulateContract({
    address: contractAddress,
    abi: openImpactAbi,
    functionName: "confirmReceipt",
    args: [onChainId],
    account,
  });

  const hash = await walletClient.writeContract(request);
  await publicClient.waitForTransactionReceipt({ hash });
  await mintDemoTokensToRecipient(onChainId);
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

  const provider = ethereumProvider();
  if (!provider) {
    console.log("[stub] proof hash", contentHash);
    await new Promise((r) => setTimeout(r, 300));
    return mockTxHash();
  }

  const onChainId = lookupOnChainDonationId(offChainDonationId);
  if (onChainId == null) return mockTxHash();

  const { walletClient, publicClient, account } = await getClients();
  const { request } = await publicClient.simulateContract({
    address: contractAddress,
    abi: openImpactAbi,
    functionName: "submitRecipientProof",
    args: [onChainId, contentHash],
    account,
  });

  const hash = await walletClient.writeContract(request);
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

  const provider = ethereumProvider();
  if (!provider) {
    console.log("[stub] publication hash", contentHash);
    await new Promise((r) => setTimeout(r, 300));
    return mockTxHash();
  }

  const onChainId = lookupOnChainDonationId(offChainDonationId);
  if (onChainId == null) return mockTxHash();

  const { walletClient, publicClient, account } = await getClients();
  const { request } = await publicClient.simulateContract({
    address: contractAddress,
    abi: openImpactAbi,
    functionName: "submitPublication",
    args: [onChainId, contentHash],
    account,
  });

  const hash = await walletClient.writeContract(request);
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

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
      amountUsdc: Number(payload.amount ?? 0),
    });
    if (result.onChainDonationId && typeof payload.offChainDonationId === "string") {
      rememberOnChainDonationId(payload.offChainDonationId, result.onChainDonationId);
    }
    return result.txHash;
  }

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
