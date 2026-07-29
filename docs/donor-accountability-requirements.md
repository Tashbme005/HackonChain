# Project Requirements & User Stories
## Working title: "TrustFlow" (Transparent Donation Accountability Platform)

**Track fit:** Primary — DeFi & SocialFi (transparent money flows, reputation & trust). Secondary — Privacy & Security (donor privacy), Consumer AI & ML (counterfeit/receipt verification).

---

## 1. Problem Statement

Donors give money to causes and organisations but have little to no visibility into whether their donation reached the intended recipient, or how it was actually used. This leads to:

- Mismanagement of donor funds
- Poor or non-existent reporting/accountability from recipients
- Loss of donor trust, which reduces future giving
- No easy way to verify that "proof of use" (receipts, deliverables) is genuine

**Our solution:** a platform where every donation is trackable on-chain from donor → organisation → end recipient, recipients are required to publish proof of use (deliverables, testimonials, receipts), and AI helps flag suspicious/counterfeit proof — all while giving donors the option to remain private.

### Problem & Market Validation — Uganda Context

This is not a hypothetical problem. Documented cases across NGO, government, and individual-donor levels in Uganda show the same pattern: money is diverted or unaccounted for, and accountability only surfaces years later through audits or court cases — never at the point of transaction.

- **Global Fund grant suspension (2005):** Over $200 million in grants to Uganda's Ministry of Health was suspended after auditors flagged improper accounting; a commission of inquiry questioned 130 officials.
- **UNHCR Uganda mismanagement (2019):** A UN internal audit found tens of millions of dollars wasted through overpayment and improper contracting, prompting European donors to freeze refugee aid funding.
- **NGO donor freezes (2017–2021):** Major donors (Sweden, Ireland, UK) cut funding to Ugandan civil society organisations after forensic audits uncovered theft, improper procurement, and the same receipts being used to account to multiple donors. Government later blacklisted several NGOs over fraud allegations.
- **Iron Sheets Scandal (2023):** Government officials diverted over 12,000 relief iron sheets meant for vulnerable communities in Karamoja; several ministers were implicated, with court cases still ongoing as of late 2024.
- **COVID-19 Relief Funds Scandal (2020):** An estimated 10 billion UGX meant for pandemic relief was misappropriated by Ministry of Health officials; senior officials were arrested.
- **Individual-level fraud:** Documented orphanage and child-sponsorship scams exploit donor goodwill directly, and fraudulent posts impersonating organisations like UNICEF have circulated in Uganda promising mobile-money payouts to solicit personal information and money.
- **Macro indicator:** Uganda scored 25/100 on the 2025 Corruption Perceptions Index, ranking 148th of 182 countries; a recent Afrobarometer survey found seven in ten Ugandans view government anti-corruption efforts as poor.

**Pitch takeaway:** existing accountability relies on after-the-fact audits and inquiries — often years after funds are diverted. TrustFlow makes accountability visible at the moment of the transaction, not after a scandal breaks.

*Sources: The New Humanitarian, ReliefWeb, Daily Monitor, The Global Fund, allAfrica, Transparency International / TradingEconomics, Africa Check, Love Without Boundaries.*

---

## 2. Personas

### Persona A — The Donor
Wants to give to a cause and *know* the money got there and was used well. Motivated by trust and transparency, not by managing a crypto wallet.

### Persona B — The Recipient / Beneficiary
The individual or community receiving funds. Needs a simple way to prove funds were received and used (photos, receipts, short testimonial) without needing to understand blockchain. Their real identity and contact details are private from the organisation — only their wallet address or a system pseudonym is ever visible to the org.

### Persona C — The Organisation (intermediary, optional)
An NGO/charity that channels donor funds to recipients. Needs to show the full chain: donor → org → recipient, and maintain its own reputation. The organisation only ever sees a recipient's wallet/pseudonym and a brief submission summary — never the recipient's real identity, contact details, or full testimonial content. In exchange, the organisation carries its own accountability requirement: it must publish proof that it publicised each donation's impact (a news article, social media post, or similar).

### Persona D — The Verifier (AI + community)
Not a human user per se — the system layer that checks submitted deliverables/receipts for signs of being fake or reused, and flags them for review.

---

## 3. User Stories

### Donor stories
- As a donor, I want to create a wallet-linked profile so my donations are tied to a verifiable identity.
- As a donor, I want to choose to donate publicly or privately, so I can control how much of my identity is exposed.
- As a donor, I want to see a real-time status of my donation (sent → received → funds used), so I know it's not sitting idle or lost.
- As a donor, I want to see proof (photos, receipts, testimonials) of how my donation was used, so I can trust the process.
- As a donor, I want to see a trust/reputation score for an organisation or recipient before I donate, so I can make an informed choice.
- As a donor, I want to be notified when a recipient publishes a deliverable linked to my donation, so I stay engaged.
- As a donor, I want to see the full testimonial and any contact/social details a recipient chooses to share, so I get the complete picture that only I, as the donor, am entitled to.

### Recipient stories
- As a recipient, I want a simple interface (not crypto-jargon heavy) to confirm I've received funds, so donors know money arrived.
- As a recipient, I want to upload proof of use (photo, receipt, short write-up) in a few taps, so I can fulfill accountability requirements without friction.
- As a recipient, I want to record a short testimonial or thank-you, so donors feel the human impact of their gift.
- As a recipient, I want my submitted proof to be timestamped and stored on-chain, so I have a permanent, tamper-proof record of my accountability.
- As a recipient, I want my real identity and contact details hidden from the organisation, so only my wallet address or pseudonym is ever visible to them.

### Organisation stories
- As an organisation, I want a dashboard showing all incoming donations and outgoing disbursements, so I can manage fund flow transparently.
- As an organisation, I want to link each donor's contribution to a specific recipient/project, so the chain of custody is clear.
- As an organisation, I want my own reputation score (based on accountability history) to be visible to donors, so trustworthy orgs are rewarded with more donations.
- As an organisation, I want to see only that a recipient submitted proof (status and a brief summary), not their contact details or full testimonial, so recipient privacy is protected while I retain enough oversight to manage the relationship.
- As an organisation, I want to be required to submit proof that I publicised a donation's impact (an article, social media post, or similar), so accountability applies to organisations as well as recipients, not just one side of the chain.

### Platform / AI stories
- As the platform, I want to scan uploaded receipts/deliverables for signs of duplication or manipulation using Gemini (via Lovable's built-in AI Connector), so counterfeit proof gets flagged before it damages trust, without needing to manage a separate API key.
- As the platform, I want to auto-generate a public, shareable "impact report" link per donation, so recipients/orgs can post proof to social media easily.
- As the platform, I want to keep donor personal details in a local/off-chain database while only exposing wallet addresses on-chain, so donor privacy is preserved without breaking traceability.

---

## 4. Core Feature List (from your brainstorm, organised)

| Category | Feature |
|---|---|
| **Transparency** | Wallet interface for donor, org, and recipient — every donation traceable end-to-end |
| **Accountability** | Recipient can log/report how funds were used |
| **Trust signals** | Donor receives confirmation when funds are received |
| **Social proof** | Every donation auto-generates a shareable social media post/link |
| **Human connection** | Testimonial + contact/social details from recipient |
| **Privacy** | Donor can choose private vs public donation identity |
| **Data handling** | Donor PII stored in local DB, only wallet/tx data on-chain |
| **Proof of use** | Deliverables (receipts, photos, reports) pushed on-chain and to donor |
| **AI trust layer** | AI (Google Gemini, via Lovable's built-in AI Connector) checks deliverables for counterfeit/duplicate/fraud signals |
| **Reputation** | Trust score for organisations/recipients based on accountability history |
| **Recipient privacy** | Organisation only sees recipient's wallet/pseudonym and a brief submission summary — never real identity, contact details, or full testimonial |
| **Org accountability** | Organisations must submit proof they publicised each donation's impact (article, social media post, etc.) before it counts as fully accounted for |

---

## 5. Suggested MVP Scope (realistic for a hackathon build)

Given time constraints, cut ruthlessly to what's demoable in a short build. Suggested MVP:

1. **Donor flow:** connect wallet → pick a cause/recipient → donate → see status (sent/received)
2. **Recipient flow:** confirm receipt → upload one piece of proof (photo/receipt + short text) → publish
3. **Public impact page:** a shareable page per donation showing donor (or "Anonymous"), amount, and recipient's proof
4. **Basic reputation score:** simple % of donations with proof submitted, shown on org/recipient profile
5. **AI counterfeit check (lightweight demo):** even a simple "flag if this image matches a previously submitted one" or a basic authenticity heuristic is enough to show the concept for a hackathon

Push to "nice to have" (mention in pitch, don't build unless time allows): full differential-privacy donor anonymity, advanced fraud-detection ML model, multi-org disbursement chains.

**Build sequencing note:** the current build phase is UI/frontend only — `connectWallet()` and `submitToChain()` remain stub functions using mock data, with real blockchain/wallet integration to be wired in by the web3 team afterward. The AI counterfeit-check feature is the one exception that's live now rather than stubbed, implemented via Lovable's built-in AI Connector using Google Gemini — this doesn't require a separately managed API key.

---

## 6. Privacy & Accountability Rules

These rules govern who can see what, and are strict enough to affect data modeling — flag them clearly to your web3 team since they shape what needs to live on-chain vs. off-chain, and what gets exposed per role.

- **Recipient identity is private from the organisation.** The organisation never sees a recipient's real name or contact details (phone, email, address, socials) — only a wallet address or a system-generated pseudonym.
- **The organisation sees status, not detail.** When a recipient submits proof of use or a testimonial, the organisation sees only: submission status (submitted / verified / flagged), a short auto-generated or truncated summary, and the date. The full testimonial text, full proof detail, and any contact/social info the recipient chooses to share are reserved for the specific donor who made that donation.
- **The donor sees everything relevant to their own donation.** Full testimonial, full proof of use, and any contact/social details the recipient chose to share are visible to the donor who funded that specific donation — this is the one relationship in the system with full transparency.
- **Organisations carry their own accountability requirement.** Alongside the recipient's proof of use, the organisation must submit proof that it publicised the donation's impact — a link to a news article, social media post, blog entry, or similar — with a caption and type tag. A donation is not considered fully accounted for until both the recipient's proof of use and the organisation's publication proof exist.
- **Reputation reflects both sides.** An organisation's public reputation score should factor in both "% of donations with recipient proof submitted" and "% of donations with publication proof submitted," so donors can see accountability on both halves of the chain.

---

## 7. Screens to design first (for Lovable)

1. **Landing / cause discovery page** — browse causes/organisations, see trust scores
2. **Donor donation flow** — connect wallet, choose amount, choose public/private, confirm
3. **Donor dashboard** — donation history + status tracker per donation
4. **Recipient dashboard** — confirm receipt, upload proof of use, add testimonial
5. **Public impact/proof page** — the shareable page per donation (this is your social/marketing surface)
6. **Organisation dashboard** (if in scope) — fund flow overview, linked recipients, reputation

---

## 8. Open questions to confirm with your web3 team

- Which chain/testnet are we deploying to, and does that affect wallet UX (e.g. wallet connect flow)?
- What data actually lives on-chain vs. off-chain (confirm the donor-privacy split above works with their contract design)?
- Is the AI counterfeit check running off-chain and just writing a "verified" flag on-chain, or is it fully on-chain (unlikely, but confirm)?
- Do organisations need multi-sig / approval flows for disbursement, or is it a direct donor→recipient flow with org as pass-through?

