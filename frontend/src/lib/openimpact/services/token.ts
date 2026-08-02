import {
  createPublicClient,
  createWalletClient,
  custom,
  formatUnits,
  http,
  parseUnits,
  type Address,
} from "viem";
import { baseSepolia } from "viem/chains";

import { MOCK_USDC_ADDRESS, TRUSTFLOW_ADDRESS } from "@/contracts/addresses";
import { mockUsdcAbi } from "@/contracts/mock-usdc-abi";

function ethereumProvider() {
  if (typeof window === "undefined") return null;
  return (window as Window & { ethereum?: any }).ethereum ?? null;
}

const chainIdEnv = Number(import.meta.env.VITE_CHAIN_ID ?? baseSepolia.id);
const rpcUrl = (import.meta.env.VITE_RPC_URL ?? "").trim();

function chainForId(id: number) {
  if (id === baseSepolia.id) return baseSepolia;
  return { ...baseSepolia, id, name: `chain-${id}` };
}

export function getPublicClient() {
  const provider = ethereumProvider();
  const chain = chainForId(chainIdEnv);
  return createPublicClient({
    chain,
    transport: rpcUrl ? http(rpcUrl) : provider ? custom(provider) : http("https://sepolia.base.org"),
  });
}

export async function getWalletClient() {
  const provider = ethereumProvider();
  if (!provider) throw new Error("No web3 wallet found (e.g. MetaMask).");

  const chain = chainForId(chainIdEnv);
  const walletClient = createWalletClient({
    chain,
    transport: custom(provider),
  });

  const [account] = await walletClient.getAddresses();
  if (!account) throw new Error("Please connect your wallet first.");

  return { walletClient, account, chain };
}

/** Check raw mUSDC balance in BigInt micro-units (6 decimals). */
export async function getRawUSDCBalance(address: string): Promise<bigint> {
  try {
    const publicClient = getPublicClient();
    return await publicClient.readContract({
      address: MOCK_USDC_ADDRESS as Address,
      abi: mockUsdcAbi,
      functionName: "balanceOf",
      args: [address as Address],
    });
  } catch (err) {
    console.error("Error reading raw USDC balance:", err);
    return 0n;
  }
}

/** Check mUSDC balance for a wallet address in human-readable format. */
export async function checkUSDCBalance(address: string): Promise<string> {
  try {
    const balance = await getRawUSDCBalance(address);
    return formatUnits(balance, 6);
  } catch (err) {
    console.error("Error reading USDC balance:", err);
    return "0";
  }
}

/** Check current allowance for spender (TrustFlow contract). */
export async function checkUSDCAllowance(
  owner: string,
  spender: string = TRUSTFLOW_ADDRESS,
): Promise<bigint> {
  try {
    const publicClient = getPublicClient();
    return await publicClient.readContract({
      address: MOCK_USDC_ADDRESS as Address,
      abi: mockUsdcAbi,
      functionName: "allowance",
      args: [owner as Address, spender as Address],
    });
  } catch (err) {
    console.error("Error reading USDC allowance:", err);
    return 0n;
  }
}

/** Approve TrustFlow contract to spend mUSDC tokens. Uses simulateContract for accurate gas estimation. */
export async function approveUSDC(
  amountUsdc: number,
  spender: string = TRUSTFLOW_ADDRESS,
): Promise<string> {
  const { walletClient, account } = await getWalletClient();
  const publicClient = getPublicClient();
  const value = parseUnits(String(amountUsdc), 6);

  const { request } = await publicClient.simulateContract({
    address: MOCK_USDC_ADDRESS as Address,
    abi: mockUsdcAbi,
    functionName: "approve",
    args: [spender as Address, value],
    account,
  });

  const hash = await walletClient.writeContract(request);
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

/** Faucet feature for judges/testers: Mint 1,000 mUSDC to connected wallet. */
export async function mintTestUSDC(
  toAddress?: string,
  amountUsdc: number = 1000,
): Promise<string> {
  const { walletClient, account } = await getWalletClient();
  const publicClient = getPublicClient();
  const recipient = (toAddress || account) as Address;
  const value = parseUnits(String(amountUsdc), 6);

  const { request } = await publicClient.simulateContract({
    address: MOCK_USDC_ADDRESS as Address,
    abi: mockUsdcAbi,
    functionName: "mint",
    args: [recipient, value],
    account,
  });

  const hash = await walletClient.writeContract(request);
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}
