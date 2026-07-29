/** Minimal ABI for OpenImpact.sol (donate + confirm + hash submits). */
export const openImpactAbi = [
  {
    type: "function",
    name: "createDonation",
    stateMutability: "payable",
    inputs: [
      { name: "organisation", type: "address" },
      { name: "recipient", type: "address" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "confirmReceipt",
    stateMutability: "nonpayable",
    inputs: [{ name: "donationId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "submitRecipientProof",
    stateMutability: "nonpayable",
    inputs: [
      { name: "donationId", type: "uint256" },
      { name: "proofHash", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "submitPublication",
    stateMutability: "nonpayable",
    inputs: [
      { name: "donationId", type: "uint256" },
      { name: "publicationHash", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "nextDonationId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "event",
    name: "DonationCreated",
    inputs: [
      { name: "donationId", type: "uint256", indexed: true },
      { name: "donor", type: "address", indexed: true },
      { name: "organisation", type: "address", indexed: true },
      { name: "recipient", type: "address", indexed: false },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const;
