import orgWater from "@/assets/org-water-trust.jpg";
import proofWater from "@/assets/proof-water-pump.jpg";
import proofSolar from "@/assets/proof-solar-stall.jpg";

import type { Donation, Organisation, ProofOfUse, Recipient } from "./types";

/**
 * Proofs are addressed: each one names the donation (and therefore the donor)
 * it answers for. General testimonials carry an orgId instead.
 */
const PROOF_AMINA_PUMP: ProofOfUse = {
  id: "pf-1001",
  scope: "donation",
  donationId: "dn-1001",
  recipientId: "rcp-amina",
  donorName: "Priya Raman",
  donorIsPublic: true,
  photoUrl: proofWater,
  description:
    "Bought a replacement pump head and two lengths of pipe from Mtwapa Hardware. The borehole was running again the same afternoon.",
  testimonial:
    "The queue at the well is twenty minutes now, not two hours. Thank you for trusting us with this.",
  submittedAt: "2026-07-19T14:20:00.000Z",
  donorOnlyShare: {
    contact: "WhatsApp +254 700 000 000 (Amina — evenings only)",
    social: "instagram.com/mtwapa.water",
    note: "Happy to send a short video of the borehole if you'd like — just message.",
  },
};

const PROOF_AMINA_SECOND: ProofOfUse = {
  id: "pf-1006",
  scope: "donation",
  donationId: "dn-1006",
  recipientId: "rcp-amina",
  donorName: "Priya Raman",
  donorIsPublic: true,
  photoUrl: proofWater,
  description:
    "Your 300 USDC covered the second pump at Kadzandani, plus the concrete apron around it. Signed off by the village committee on 2 July.",
  testimonial:
    "You asked whether it would stretch to a second pump. It did — 90 more households are drawing water from it.",
  submittedAt: "2026-07-03T09:40:00.000Z",
};

const PROOF_FATOU_KIT: ProofOfUse = {
  id: "pf-1002",
  scope: "donation",
  donationId: "dn-1002",
  recipientId: "rcp-fatou",
  donorName: "Anonymous",
  donorIsPublic: false,
  photoUrl: proofSolar,
  description:
    "Solar panel, battery and two lamps bought from SolarSeed's supplier. Installed on the stall roof on Tuesday.",
  testimonial:
    "I close at nine now instead of six. That is three more hours of customers every single day.",
  submittedAt: "2026-07-24T17:05:00.000Z",
};

const PROOF_FATOU_SECOND: ProofOfUse = {
  id: "pf-1009",
  scope: "donation",
  donationId: "dn-1009",
  recipientId: "rcp-fatou",
  donorName: "Priya Raman",
  donorIsPublic: true,
  photoUrl: proofSolar,
  description:
    "The second kit went to Isatou at the next stall. Receipt from the supplier is stapled to the back of the photo.",
  testimonial:
    "You paid for a kit you will never see, for a woman you have never met. She asked me to say thank you by name.",
  submittedAt: "2026-06-20T11:15:00.000Z",
};

const PROOF_JOSEPH_FLAGGED: ProofOfUse = {
  id: "pf-1005",
  scope: "donation",
  donationId: "dn-1005",
  recipientId: "rcp-joseph",
  donorName: "Daniel Okoro",
  donorIsPublic: true,
  photoUrl: proofWater,
  description: "Pump spares for the Kilifi hand pumps.",
  testimonial: "",
  submittedAt: "2026-07-14T15:02:00.000Z",
  flagged: true,
};

/** Secondary case: a testimonial not tied to any one donation. */
const GENERAL_KILIFI: ProofOfUse = {
  id: "pf-gen-01",
  scope: "general",
  recipientId: "rcp-amina",
  orgId: "org-kilifi",
  photoUrl: proofWater,
  description:
    "End-of-quarter note from the Mtwapa water committee to everyone who has ever given to this cause.",
  testimonial:
    "Four pumps running, none of them broken for more than a day this quarter. That is the whole report.",
  submittedAt: "2026-07-01T08:00:00.000Z",
};

export const MOCK_ORGS: Organisation[] = [
  {
    id: "org-kilifi",
    name: "Kilifi Water Trust",
    tagline: "Clean boreholes for coastal villages",
    description:
      "We drill and repair boreholes so families stop walking six kilometres for water. Every pump we fix gets photographed, dated and signed off by the village committee.",
    imageUrl: orgWater,
    walletAddress: "0xCe5E6dA2A6B03c24b3A0578Aa5FbA9c271F68f28",
    reputationScore: 96,
    recipientIds: ["rcp-amina", "rcp-joseph"],
    generalProofs: [GENERAL_KILIFI],
  },
  {
    id: "org-booklift",
    name: "BookLift Schools",
    tagline: "Textbooks and desks for rural classrooms",
    description:
      "Teachers tell us what a classroom is missing, we buy it locally, and the receipt plus a photo of the delivered goods goes straight back to the donor.",
    imageUrl:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=70",
    walletAddress: "0x9C2e05Ba71D8f3C4e6A09b7F25dE83c1A4b7F210",
    reputationScore: 88,
    recipientIds: ["rcp-mercy"],
  },
  {
    id: "org-nightshift",
    name: "Night Shift Kitchen",
    tagline: "Hot meals for people sleeping rough",
    description:
      "A volunteer kitchen serving 300 meals a night. Grocery receipts are uploaded the same evening they're spent.",
    imageUrl:
      "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=70",
    walletAddress: "0x5D71bE93c02A48f6D9b3E71cA85d02fB6e1C4437",
    reputationScore: 72,
    recipientIds: ["rcp-tomas"],
  },
  {
    id: "org-solarseed",
    name: "SolarSeed Collective",
    tagline: "Off-grid solar kits for market traders",
    description:
      "One solar kit lets a trader work three extra hours a night. Recipients film a short thank-you when the kit is installed.",
    imageUrl:
      "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=70",
    walletAddress: "0x1B48cE07a9F2d635C81a0b4E7d92C3fA05e6D274",
    reputationScore: 91,
    recipientIds: ["rcp-fatou"],
  },
];

export const MOCK_RECIPIENTS: Recipient[] = [
  {
    id: "rcp-amina",
    name: "Amina Hassan",
    pseudonym: "Coral-4821",
    orgId: "org-kilifi",
    story: "Runs the water committee in Mtwapa village, 240 households.",
    walletAddress: "0xe268a37D13b668cA28a6338D0e9eBFce32f49cF1",
    proofOfUse: PROOF_AMINA_PUMP,
    reputationScore: 98,
  },
  {
    id: "rcp-joseph",
    name: "Joseph Karanja",
    pseudonym: "Baobab-1907",
    orgId: "org-kilifi",
    story: "Maintains four hand pumps across Kilifi county.",
    walletAddress: "0xB7e02C4aF19d8365Ea07b4C29dF16a3B85c0D742",
    proofOfUse: null,
    reputationScore: 84,
  },
  {
    id: "rcp-mercy",
    name: "Mercy Otieno",
    pseudonym: "Kestrel-3364",
    orgId: "org-booklift",
    story: "Teaches grade 5 at Ndalu Primary — 62 pupils, 18 textbooks.",
    walletAddress: "0xC30a91Be47D25c8A160bE47d29fC0a3B8172dE04",
    proofOfUse: null,
    reputationScore: 90,
  },
  {
    id: "rcp-tomas",
    name: "Tomás Reyes",
    pseudonym: "Almendro-7715",
    orgId: "org-nightshift",
    story: "Buys and cooks the Thursday night service.",
    walletAddress: "0xD4b17Ec902A56f38B0d9C24aE7f13c85B06aF291",
    proofOfUse: null,
    reputationScore: 66,
  },
  {
    id: "rcp-fatou",
    name: "Fatou Njie",
    pseudonym: "Marigold-2258",
    orgId: "org-solarseed",
    story: "Sells vegetables at Serrekunda market; installing her first solar kit.",
    walletAddress: "0xE58c23Af71B04d69C3a17bE05d24fA9c81B7036D",
    proofOfUse: PROOF_FATOU_KIT,
    reputationScore: 94,
  },
];

export const MOCK_DONATIONS: Donation[] = [
  {
    id: "dn-1001",
    donorName: "Priya Raman",
    isPublic: true,
    amount: 120,
    currency: "USDC",
    recipientId: "rcp-amina",
    orgId: "org-kilifi",
    status: "verified",
    txHash: "0x8f2a41c7d90b35e6a1c04f7b28de5931ac60f4b7e21d8305c9a7b40e16fd2c85",
    timestamp: "2026-07-16T09:12:00.000Z",
    note: "For the pump repair fund.",
    proof: PROOF_AMINA_PUMP,
    publication: {
      id: "pub-1001",
      url: "https://kilifinews.example/2026/07/kadzandani-pump-back-online",
      type: "news",
      caption: "Kilifi County News covered the pump coming back online.",
      submittedAt: "2026-07-20T08:30:00.000Z",
      submittedBy: "Kilifi Water Trust",
    },
  },
  {
    id: "dn-1002",
    donorName: "Anonymous",
    isPublic: false,
    amount: 45,
    currency: "USDC",
    recipientId: "rcp-fatou",
    orgId: "org-solarseed",
    status: "verified",
    txHash: "0x2c9e70b41d8a36f5029ce7b18a4d0563f19b8c72ad30e4165b9f0c28d7a41e63",
    timestamp: "2026-07-21T18:40:00.000Z",
    proof: PROOF_FATOU_KIT,
    publication: {
      id: "pub-1002",
      url: "https://instagram.example/p/solarseed-kit-14",
      type: "social",
      caption: "Kit #14 install, posted to our followers.",
      submittedAt: "2026-07-23T12:05:00.000Z",
      submittedBy: "SolarSeed",
    },
  },
  {
    id: "dn-1003",
    donorName: "Priya Raman",
    isPublic: true,
    amount: 250,
    currency: "USDC",
    recipientId: "rcp-mercy",
    orgId: "org-booklift",
    status: "received",
    txHash: "0x71b0d4ae3c9f2071ad85be0142c7369fa5d80b41e27c9036a8f14bd7052ce983",
    timestamp: "2026-07-25T11:02:00.000Z",
    note: "Textbooks for grade 5.",
  },
  {
    id: "dn-1004",
    donorName: "Priya Raman",
    isPublic: false,
    amount: 60,
    currency: "USDC",
    recipientId: "rcp-tomas",
    orgId: "org-nightshift",
    status: "pending",
    txHash: "0x5a13cf8027bd9e461038a7c25fd0b94e17c6a3820df54619bc07e29a3d81f065",
    timestamp: "2026-07-28T20:15:00.000Z",
  },
  {
    id: "dn-1005",
    donorName: "Daniel Okoro",
    isPublic: true,
    amount: 80,
    currency: "USDC",
    recipientId: "rcp-joseph",
    orgId: "org-kilifi",
    status: "flagged",
    txHash: "0x93de07a2b415c6f8027d13ba59e40c67f81a2d035be974c108af26d31b705e4c",
    timestamp: "2026-07-12T07:48:00.000Z",
    note: "Proof photo matched an earlier upload — under review.",
    proof: PROOF_JOSEPH_FLAGGED,
  },
  {
    id: "dn-1006",
    donorName: "Priya Raman",
    isPublic: true,
    amount: 300,
    currency: "USDC",
    recipientId: "rcp-amina",
    orgId: "org-kilifi",
    status: "verified",
    txHash: "0x4b6c19d02fa738e51bc09d47a6e3210f85cd7b94e026a1f378bd50c94a1e6203",
    timestamp: "2026-06-28T08:30:00.000Z",
    note: "Second pump, if it stretches that far.",
    proof: PROOF_AMINA_SECOND,
  },
  {
    id: "dn-1007",
    donorName: "Léa Marchand",
    isPublic: true,
    amount: 75,
    currency: "USDC",
    recipientId: "rcp-amina",
    orgId: "org-kilifi",
    status: "received",
    txHash: "0xc07b3e51a9d248f60b1ac37d92e05648fa17c0b3d9e2857416ac0d3b57e9f102",
    timestamp: "2026-07-26T13:55:00.000Z",
  },
  {
    id: "dn-1008",
    donorName: "Anonymous",
    isPublic: false,
    amount: 40,
    currency: "USDC",
    recipientId: "rcp-amina",
    orgId: "org-kilifi",
    status: "pending",
    txHash: "0x6e21b40d75ca38f109be27a4d05c3f817ba9026de41c75830fa2b6c19d740e35",
    timestamp: "2026-07-28T06:05:00.000Z",
  },
  {
    id: "dn-1009",
    donorName: "Priya Raman",
    isPublic: true,
    amount: 150,
    currency: "USDC",
    recipientId: "rcp-fatou",
    orgId: "org-solarseed",
    status: "verified",
    txHash: "0xa5f39b70c18d264e07ba3c95d1f8026be47a10c3d95728f6014bd3e7a90c5127",
    timestamp: "2026-06-14T16:22:00.000Z",
    note: "For a second solar kit.",
    proof: PROOF_FATOU_SECOND,
  },
  {
    id: "dn-1010",
    donorName: "Daniel Okoro",
    isPublic: true,
    amount: 95,
    currency: "USDC",
    recipientId: "rcp-joseph",
    orgId: "org-kilifi",
    status: "received",
    txHash: "0x30fa74be29c105d68a3b0f47e2d915c806ba37d0e15c94af2760b3d81ea5c904",
    timestamp: "2026-07-27T10:40:00.000Z",
  },
];

export const CURRENT_DONOR_NAME = "Priya Raman";
export const CURRENT_RECIPIENT_ID = "rcp-amina";
export const CURRENT_ORG_ID = "org-kilifi";

/** Demo donor profile. Replaced by the signed-in user's profile once auth exists. */
export const DONOR_PROFILE = {
  name: CURRENT_DONOR_NAME,
  walletAddress: "0x7A4f9C1bE2d83a5F0c6D18b4E9aA37cC90f2B5d1",
  memberSince: "2025-11-04T00:00:00.000Z",
  location: "Lisbon, Portugal",
};

