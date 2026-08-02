import {
  confirmReceiptOnChain,
  createDonationOnChain,
  submitProofHashOnChain,
  submitPublicationHashOnChain,
  type ChainDonationResult,
} from "../web3";

export async function createDonation(params: {
  organisation: string;
  recipient: string;
  amountUsdc: number;
}): Promise<ChainDonationResult> {
  return createDonationOnChain({
    organisation: params.organisation,
    recipient: params.recipient,
    amountUsdc: params.amountUsdc,
  });
}

export async function confirmReceipt(
  offChainDonationId: string,
  onChainId?: string,
): Promise<string> {
  return confirmReceiptOnChain(offChainDonationId, onChainId);
}

export async function submitProof(
  offChainDonationId: string,
  proof: { photoUrl: string; description: string; testimonial?: string },
): Promise<string> {
  return submitProofHashOnChain(offChainDonationId, proof);
}

export async function submitPublication(
  offChainDonationId: string,
  publication: { url: string; type: string; caption?: string },
): Promise<string> {
  return submitPublicationHashOnChain(offChainDonationId, publication);
}
