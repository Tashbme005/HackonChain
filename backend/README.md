# openImpact backend (Supabase)

Replaces the frontend `localStorage` ledger with Postgres + Auth + Storage + Edge
Functions. **Web3 / on-chain settlement is out of scope** — `tx_hash` is optional
and wallet stubs stay in the React app until the web3 team wires them.

Privacy is enforced with **Row Level Security** (see `docs/backend.md`):

- Recipient real names live only on `profiles` (self-read).
- `recipients` has **no name column**.
- Orgs never `SELECT` the base `proofs` table — they use `proofs_org_brief`.
- Donor-only contact/social sits in `proof_donor_shares` (donor + recipient only).

## Layout

```
backend/
  README.md
  supabase/
    config.toml
    migrations/20260729140000_init.sql
    seed.sql
    functions/check-proof/
```

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Docker (for local Supabase)
- Node 20+

## Local setup

```bash
# from repo root
cd backend
supabase start
supabase db reset          # applies migrations + seed.sql
supabase status            # copy API URL + anon key
```

Create `frontend/.env.local`:

```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<anon key from supabase status>
```

Optional for the AI edge function:

```bash
supabase secrets set GEMINI_API_KEY=your_key
supabase functions serve check-proof
```

Without `GEMINI_API_KEY`, `check-proof` still runs the duplicate-image check and
**fails open** on Gemini (marks `ai_checked = false`).

## Migration sequence (frontend wiring)

1. **Auth** (this pass) — `signUp` / `signIn` / session via Supabase + `complete_signup` RPC
2. Reads — orgs/recipients/donations/proofs from Supabase
3. Donor flow — insert `donations`
4. Recipient flow — confirm + proof upload + Storage + `check-proof`
5. Org flow — publications + invites via org-safe views
6. Reputation — call `org_trust_score(org_id)`

## Demo Auth users

Seed SQL creates orgs/recipients/donations **without** Auth users. Create the
three judge demos after `supabase start`:

| Role | Email | Password |
|---|---|---|
| Donor | `demo.donor@openimpact.app` | `demo-demo` |
| Recipient | `demo.recipient@openimpact.app` | `demo-demo` |
| Organisation | `demo.org@openimpact.app` | `demo-demo` |

Link them in the dashboard (or a one-off script):

1. Create Auth users with those emails.
2. Insert matching `profiles` (`is_demo = true`).
3. Set `recipients.profile_id` / `organisations.profile_id` for Coral-4821 /
   Kilifi Water Trust (seed UUIDs in `seed.sql`).

Until demos are linked, use normal sign-up from the UI — `complete_signup` creates
the profile + recipient/org rows.

## Deploy (hosted Supabase)

```bash
supabase link --project-ref <ref>
supabase db push
supabase functions deploy check-proof
supabase secrets set GEMINI_API_KEY=...
```

Point `VITE_SUPABASE_*` at the hosted project for Vercel.
