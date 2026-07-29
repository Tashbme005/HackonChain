# HackonChain — TrustFlow

A documentation-first hackathon project for **TrustFlow**, a transparent donation accountability platform that tracks donor → organisation → end recipient and lets recipients publish proof-of-use (with an AI trust layer to flag suspicious/counterfeit submissions).

## What this repo contains

This repo currently contains product docs and a frontend build prompt (no working frontend code yet):

- `docs/donor-accountability-requirements.md`: Problem statement, personas, user stories, privacy/accountability rules, and an MVP scope.
- `docs/lovable-build-prompt.md`: The build prompt + UI direction for a clean hackathon MVP in Lovable (frontend-only prototype with mock/stub wallet + chain calls).
- `docs/donor_org_recipient_proof_flow.svg`: A visual of the donor/organisation/recipient proof flow.

## Project summary

### The problem

Donors have little visibility into whether their donation reached the intended recipient and how it was actually used. Accountability often happens years later (audits/court cases), after trust has already been damaged.

### The solution: “Open Ledger”

TrustFlow treats every donation as a receipt, aiming for transparency you can verify:

- Donations are traceable end-to-end (donor → org/intermediary → recipient).
- Recipients are required to publish **proof of use** (photos/receipts/testimonials).
- The platform uses an AI trust layer (Gemini via Lovable’s AI Connector) to flag likely duplicates/fakes for review.
- Donors can opt for privacy: donor PII is kept off-chain while only wallet/transaction data is shown on-chain.

### Privacy & accountability principles (high-level)

- Recipient identity is private from the organisation (only wallet/pseudonym is visible).
- The organisation sees status and a brief summary, not full recipient proof/testimonial details.
- The donor sees the full proof/testimonial for their specific donation.
- Organisations must also publish impact proof for accountability (recipient proof alone doesn’t “complete” a donation).
- Reputation scores factor in both recipient proof submission and organisation publication proof.

## Hackathon MVP (what to build first)

Suggested minimal demo flow (frontend prototype with stubs):

1. Landing / cause discovery with trust/reputation signals
2. Donor donation flow (mock wallet connect → donate → pending status)
3. Donor dashboard (receipt cards per donation)
4. Recipient dashboard (confirm receipt → upload proof + testimonial)
5. Public impact/proof page per donation (shareable)
6. Organisation dashboard (optional if time allows)

For details, see:

- `docs/donor-accountability-requirements.md`
- `docs/lovable-build-prompt.md`

## Open questions (for the web3 team)

- Which chain/testnet will we deploy to (affects wallet UX and integration)?
- What exactly lives on-chain vs off-chain (must preserve the donor privacy split)?
- Should the AI counterfeit-check only set a “verified/flagged” flag on-chain (typically off-chain AI + on-chain status)?
- How will disbursements work (direct donor → recipient with org as pass-through vs any approval/multisig flows)?

## Notes for the web3 team

Current build phase is **UI/frontend only**:

- `connectWallet()` and `submitToChain()` are intended to be stubbed in the prototype and later wired to real wallet + smart contract logic.
- The AI counterfeit-check concept is intended to be “live now” via the built-in Gemini connector, while the chain integration can come later.

