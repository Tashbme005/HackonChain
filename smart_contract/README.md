# OpenImpact smart contracts

Foundry project for the on-chain accountability ledger used by OpenImpact.

## Contract

[`src/OpenImpact.sol`](src/OpenImpact.sol) (renamed from the draft `TrustFlow` contract).

### v1 settlement (decided)

- **Asset:** native **ETH** (not USDC yet).
- **Model:** **escrow on donate**, pay out on recipient confirm.
  1. Donor calls `createDonation{value}(organisation, recipient)` → status `Sent`, ETH held by the contract.
  2. Recipient calls `confirmReceipt(donationId)` → status `Received`, full amount transferred to recipient.
- **USDC / ERC-20** and **on-chain anonymity flags** are deferred.

### What stays off-chain (Supabase)

- Legal names, testimonials, photos, publication URLs, AI notes, org briefs, trust score.
- On-chain proof/publication fields are **content hashes only** (see hash scheme below).

### Verification

- Off-chain AI can flag proofs in Supabase immediately.
- Optional: platform `owner` calls `verifyRecipientProof` / `verifyPublication` to mirror a verdict on-chain.

## Hash scheme (proofs and publications)

Canonical UTF-8 string, then hex-encoded SHA-256 (prefixed `sha256:`):

```
proof:
v1|donation|{donationId}|{photoUrl}|{description}|{testimonial}

publication:
v1|publication|{donationId}|{url}|{type}|{caption}
```

Frontend helper: `frontend/src/lib/openimpact/content-hash.ts`.

The same string must be hashed before calling `submitRecipientProof` / `submitPublication` so chain and DB stay aligned.

## Develop

```bash
cd smart_contract
forge install   # if libs missing
forge build
forge test -vv
```

## Deploy (local anvil / Sepolia)

```bash
# Local smoke
anvil &
forge script script/DeployOI.s.sol:DeployOI \
  --rpc-url http://127.0.0.1:8545 \
  --private-key <anvil-key> \
  --broadcast

# Sepolia
forge script script/DeployOI.s.sol:DeployOI \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast
# optional: OPENIMPACT_OWNER=0x... 
```

Then set in `frontend/.env`:

```bash
VITE_OPENIMPACT_CONTRACT_ADDRESS=0x...
VITE_CHAIN_ID=11155111
```

Local anvil smoke (createDonation + confirmReceipt) was verified against a fresh deploy; Sepolia deploy needs `SEPOLIA_RPC_URL` + deployer key in CI/CD or a maintainer wallet.

## Integrate with the app

Do **not** merge the old `smart-contract` git branch into `main` (histories diverged). This folder was ported onto `integrate-contracts` from `main`.

Wire through `frontend/src/lib/openimpact/web3.ts` only. Supabase remains source of truth for PII and full proof content.
