# HackonChain — OpenImpact

A transparent donation accountability platform that tracks every donation from donor → organisation → end recipient, with proof-of-use uploads and an AI trust layer to flag suspicious submissions.

## Repo structure

```
frontend/          React + Vite SPA (TanStack Router, Tailwind CSS, shadcn/ui)
docs/              Product requirements, build prompts, and diagrams
LICENSE            MIT
CONTRIBUTING.md    How to contribute
```

## Getting started

```bash
cd frontend
npm install
npm run dev        # starts Vite dev server at http://localhost:5173
```

Other scripts:

```bash
npm run build      # production build → frontend/dist/
npm run preview    # preview the production build locally
npm run lint       # ESLint
npm run format     # Prettier
```

## Live demo

**[hackon-chain.vercel.app](https://hackon-chain.vercel.app/)**

## Deployment

The frontend is deployed on **Vercel** with the root directory set to `frontend`. The included `vercel.json` handles the build command, output directory, and SPA rewrites.

## Project summary

### The problem

Donors have little visibility into whether their donation reached the intended recipient or how it was actually used. Accountability often surfaces years later through audits or court cases — never at the point of transaction.

### The solution

OpenImpact treats every donation as a receipt you can verify:

- Donations are traceable end-to-end (donor → org/intermediary → recipient).
- Recipients publish **proof of use** (photos, receipts, testimonials).
- An AI trust layer flags likely duplicates or fakes for review.
- Donors can stay private: PII is kept off-chain while only wallet/transaction data lives on-chain.

### Privacy & accountability principles

- Recipient identity is private from the organisation (only wallet/pseudonym visible).
- The organisation sees submission status and a brief summary, not full proof or testimonials.
- The donor sees the full proof and testimonial for their specific donation.
- Organisations must publish impact proof too — a donation isn't fully accounted for until both sides submit.
- Reputation scores reflect both recipient proof and organisation publication proof.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | React 19, Vite 8 |
| Routing | TanStack Router |
| Styling | Tailwind CSS 4, shadcn/ui (Radix primitives) |
| State | TanStack Query, React context |
| Fonts | Fraunces (display), Inter (UI), IBM Plex Mono (on-chain data) |
| AI (stub) | Gemini-based proof check (currently client-side mock) |
| Web3 (stub) | `connectWallet()` / `submitToChain()` — placeholder functions for the web3 team |

## Screens

1. **Landing / cause discovery** — browse causes, see trust scores
2. **Donate flow** — connect wallet (stub), choose amount, public/private toggle
3. **Donor dashboard** — receipt cards with real-time status
4. **Recipient dashboard** — confirm receipt, upload proof, add testimonial
5. **Public impact page** — shareable proof page per donation
6. **Organisation dashboard** — fund flow overview and reputation

## Open questions (for the web3 team)

- Which chain/testnet are we deploying to?
- What data lives on-chain vs off-chain (must preserve the donor privacy split)?
- Is the AI counterfeit-check writing a verified/flagged flag on-chain, or staying fully off-chain?
- Do organisations need multi-sig / approval flows for disbursement?

## Documentation

- [`docs/donor-accountability-requirements.md`](docs/donor-accountability-requirements.md) — full requirements, personas, user stories, and MVP scope
- [`docs/lovable-build-prompt.md`](docs/lovable-build-prompt.md) — original UI/design direction and build prompt

## License

[MIT](LICENSE)
