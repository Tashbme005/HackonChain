# Lovable Build Prompt — openImpact (Donor Accountability Platform)

## Product brief

Build **openImpact**, a web app where people can donate to causes/organisations and track, on a wallet-based ledger, exactly what happened to their money — including proof-of-use uploaded by the recipient (photos, receipts, testimonials). The core value is **transparency you can see, not just promise**. This is a hackathon MVP for a blockchain/AI hackathon — prioritize a clean, convincing demo flow over completeness.

Build this as a frontend-only prototype for now: use mock/local data (no real wallet connection or blockchain calls yet — stub these with clearly-named placeholder functions like `connectWallet()`, `submitToChain()` so the web3 team can wire in real logic later).

## Design direction: "Open Ledger"

Treat every donation as a receipt — the product's whole point is that money leaves a visible paper trail. Avoid generic dark-mode/neon crypto-trading aesthetics and avoid generic cream+orange SaaS templates. Instead:

**Color palette**
- Background (paper): `#F4F6F5` — cool, light, almost paper-like, not warm cream
- Ink / primary text & UI: `#12333B` — deep teal-navy
- Verified / confirmed state: `#1E8F6F` — forest-teal green
- Pending / in-transit state: `#D98F3E` — muted amber
- Flagged / warning state (AI counterfeit flag only): `#C1443C` — muted brick-red, used sparingly
- Secondary text / muted: `#6B7A78` — slate-sage

**Typography**
- Display/headline face: **Fraunces** (warm serif) — used for page headlines, testimonials, and the emotional/human parts of the copy
- Body/UI face: **Inter** — used for all forms, buttons, dashboards, navigation
- Data/mono face: **IBM Plex Mono** — used *only* for wallet addresses, transaction hashes, timestamps, and monetary amounts, so verifiable/on-chain data is visually distinct from regular UI text at a glance

**Layout & signature element**
- Donation records are displayed as receipt cards: a light card with a subtle torn/perforated top edge (can be done with a repeating small-circle border or a jagged CSS clip-path), a dotted divider line separating "what was given" from "what happened to it," and amounts/timestamps set in the mono face, right-aligned.
- Each receipt card has a small circular stamp badge in the corner — empty/outlined while pending, filled solid green with a checkmark once proof-of-use is verified, filled red with an alert icon if AI flags it.
- Keep everything else quiet and restrained: generous whitespace, no gradients, no heavy shadows, thin 1px borders in the ink color at low opacity. Spend visual boldness only on the receipt cards and stamp badges.
- Fully responsive down to mobile. Visible keyboard focus states. Respect reduced-motion preferences; keep animation minimal (a subtle fill/checkmark animation on the stamp badge when proof is verified is the one moment worth animating).

## Screens to build (in this order)

1. **Landing / cause discovery page** — hero explaining the "receipt for every donation" concept, then a grid of causes/organisations, each showing name, short description, and a trust/reputation score (% of donations with proof submitted).
2. **Donor donation flow** — connect wallet (stub button), choose amount, toggle public/private identity, confirm screen, success state showing the donation now has a "pending" stamp.
3. **Donor dashboard** — list of the donor's past donations as receipt cards, each showing status (pending/received/verified), linking to the public proof page once available.
4. **Recipient dashboard** — simple, non-crypto-jargon interface: confirm receipt of funds button, upload proof of use (photo + short text field), add a short testimonial field, submit.
5. **Public impact/proof page** — the shareable receipt-style page per donation: donor name or "Anonymous," amount, recipient's uploaded proof, testimonial, and verification stamp. This is the page people would share on social media, so make it look good as a standalone shareable card too.
6. **Organisation dashboard** (build if time allows) — table of incoming donations and outgoing disbursements, linked recipients, and the org's own reputation score.

## Data model (mock/local for now)

```
Donation {
  id, donorName (or "Anonymous"), isPublic, amount, currency,
  recipientId, orgId (optional), status: "pending" | "received" | "verified" | "flagged",
  txHash (mock string), timestamp
}

Recipient {
  id, name, walletAddress (mock), proofOfUse: { photoUrl, description, testimonial } | null,
  reputationScore
}

Organisation {
  id, name, walletAddress (mock), reputationScore, recipients: [Recipient]
}
```

## Copy tone

Plain, active, specific — never "webhook config" language. A donor "sends a donation," a recipient "confirms receipt" and "uploads proof," never "submits payload." Status labels should read like a human wrote them: "Waiting to be received," "Received — proof pending," "Verified." Empty states should invite action: e.g. an empty recipient dashboard says "No donations yet — once someone donates to you, it'll show up here."