# openImpact — Backend Plan (Supabase)

## Context

openImpact (HackonChain) is a donation-accountability platform (Blockchain DevFest Hackathon).
Frontend is a React + Vite + TanStack Router app already built (routes for
donor/recipient/organisation dashboards, public impact pages, auth). All
state currently lives in a React context persisted to `localStorage` — no
real backend, no real auth, plaintext passwords compared client-side.

**Goal of this pass:** replace localStorage with Supabase (Postgres + Auth +
Storage + Edge Functions), enforcing the platform's core privacy rule at the
database level, not just in UI code. This document covers only the backend
and data layer — donation settlement itself is a separate concern handled
elsewhere and isn't addressed here.

## The privacy rule this backend must enforce

This is the single most important constraint — get RLS wrong and the whole
pitch (donor accountability with recipient privacy) breaks:

- A recipient's **real name** is known only to them and the platform —
  never to the organisation, never to the public.
- Organisations and the public only ever see a recipient's **pseudonym +
  wallet address**.
- When a recipient submits proof of use (photo, description, testimonial),
  the **donor tied to that specific donation** sees it in full.
- The **organisation** sees only: submission status, a short truncated
  excerpt (~90 chars), and the date — never the full testimonial, never any
  AI-internal notes.
- Organisations carry their own accountability leg: they must submit
  **publication proof** (a public URL: article/social post/blog) per
  donation. A donation isn't "fully accounted for" until both legs exist.
- Reputation score = average of (% donations with recipient proof) and (%
  donations with org publication proof), computed server-side so it can't
  be spoofed from a modified client build.

Enforce this with **Row Level Security policies**, not application-layer
filtering — an org account hitting the API directly (bypassing the UI)
should still be structurally unable to read a full testimonial or a
recipient's real name.

## Data model

Tables (Postgres):

- **`profiles`** — one row per Supabase Auth user. `id` (= `auth.users.id`),
  `role` (`donor`/`recipient`/`organisation`), `name` (real identity — RLS
  restricts to self-read only), `wallet_address`, `location`, `is_demo`,
  `created_at`.
- **`organisations`** — `id`, optional `profile_id` (owning account), `name`,
  `tagline`, `description`, `image_url`, `wallet_address`,
  `reputation_score`, `created_at`. Public read (needed for cause discovery).
- **`recipients`** — `id`, optional `profile_id`, `pseudonym` (unique), `org_id`,
  `story`, `wallet_address`, `reputation_score`, `created_at`. **No `name`
  column at all** — real name lives only in `profiles`, and this table
  structurally cannot leak it. Public read is safe by construction.
- **`donations`** — `id`, `donor_profile_id`, `donor_name` (snapshot),
  `is_public`, `amount`, `currency`, `recipient_id`, `org_id`, `status`
  (`pending`/`received`/`verified`/`flagged`), `note`, `created_at`.
- **`proofs`** — `id`, `scope` (`donation`/`general`), `donation_id`,
  `recipient_id`, `donor_name`, `donor_is_public`, `org_id`, `photo_url`,
  `description`, `testimonial`, `submitted_at`, `flagged`, `ai_checked`,
  `ai_reason` (safe to show), `ai_internal_note` (**never** exposed to org
  or public — platform/recipient only).
- **`publications`** — `id`, `donation_id` (unique), `url`, `type`
  (`social`/`news`/`blog`/`other`), `caption`, `submitted_at`,
  `submitted_by`. Public read — a publication is by definition public.
- **`invites`** — unassigned recipient slots an org opens (`code` pk,
  `org_id`, `project_label`, `amount`, `note`, `claimed_pseudonym`,
  `claimed_wallet`, `claimed_at`). Org manages own; anyone can read an
  unclaimed code to redeem it.

## RLS policy summary (per table)

| Table | Who can SELECT full rows |
|---|---|
| `profiles` | Only the owning user (`auth.uid() = id`) |
| `organisations` | Everyone (no sensitive fields here) |
| `recipients` | Everyone (table has no name column, so this is safe) |
| `donations` | Donor (own), recipient (own), org (own routed-through), public (if `is_public = true`) |
| `proofs` | Recipient (own, full), donor (own donation, full). **No org policy** — orgs must use a view instead |
| `publications` | Everyone (inherently public) |
| `invites` | Org (own, full CRUD), anyone (unclaimed codes only, to redeem) |

Two views do the privacy-critical work of exposing org-safe slices without
ever granting the org role SELECT on the base `proofs` table:

- **`recipients_public`** — passthrough of `recipients` (already name-free).
- **`proofs_org_brief`** — same columns as `proofs` minus `testimonial`,
  `photo_url`, `donor_name`, `ai_internal_note`; adds a computed `brief`
  column (description or testimonial, truncated to ~90 chars, "Submission
  received" if empty). `ai_reason` only surfaces if `flagged = true`.

A server-side function `org_trust_score(org_id)` computes reputation from
`proofs`/`publications` counts against that org's donations — average of
proof-rate and publication-rate, matching the product spec.

## Auth

Supabase Auth (email/password) replaces plaintext client-side comparison.

- Sign-up: `auth.signUp()` → insert matching `profiles` row (role, name,
  wallet address). If role is `recipient`, also create a `recipients` row
  (generate a pseudonym, e.g. `Word-1234`, guaranteed unique against
  existing pseudonyms); if `organisation`, create an `organisations` row.
  Handle invite-code claiming here too (mark the invite used, link
  recipient → org).
- Sign-in: `auth.signInWithPassword()`, then fetch the `profiles` row to
  reconstruct the account (role, name, wallet, entity link).
- Session restore: `auth.getSession()` on load + `onAuthStateChange`
  subscription so login state survives refresh and syncs across tabs.
- Demo accounts (for judges to log straight in): three seeded real Supabase
  Auth users (donor/recipient/org), each with a matching `profiles` +
  `recipients`/`organisations` row. "Demo login" buttons just sign in with
  fixed demo credentials — no separate mock-auth code path.

## AI proof-of-use check (Gemini)

Must run **server-side** (Supabase Edge Function), never in the browser —
the Gemini API key can't ship to the client.

Flow:
1. Recipient uploads a proof (photo + description + testimonial) →
   photo goes to Supabase Storage, get back a public URL.
2. Call the edge function with `{ photoUrl, description, testimonial,
   amount, currency, recipientId }`.
3. Function first does a cheap deterministic check: does this `photo_url`
   match any prior submission from the same recipient? If so, flag
   immediately without calling Gemini (catches the most common fraud
   pattern — reused image — for free).
4. Otherwise, call Gemini (vision + text) asking it to flag manipulation,
   stock-photo/watermark signs, or description/image mismatch. Respond with
   strict JSON: `{ suspicious: boolean, reason: string }`.
5. Fail open on any Gemini error — mark `ai_checked = false` and let the
   submission through rather than blocking a legitimate recipient because
   an external API is down.
6. Write `ai_checked`, `flagged`, `ai_reason` (public-safe), `ai_internal_note`
   (org/platform only) back onto the `proofs` row.

## Storage

One public bucket, `proofs`, for uploaded receipt/proof photos. Public is
fine — a proof photo is only ever attached to a donation the donor already
sees in full, and publication proofs are public by definition anyway.

## Migration sequencing (do in this order — each step is independently testable)

1. **Auth**: sign-up/sign-in/sign-out/session-restore against Supabase,
   replacing localStorage credential checks entirely.
2. **Reads**: point `getRecipient`/`getOrg`/proof-listing at Supabase
   instead of local mock arrays.
3. **Donor flow**: creating a donation writes a `donations` row.
4. **Recipient flow**: confirm-receipt updates `donations.status`; proof
   upload inserts into `proofs` + uploads to Storage + calls the AI edge
   function, then patches the row with the verdict.
5. **Org flow**: publication proof → insert into `publications`; recipient
   invites → insert/update `invites`. Any org-facing read of recipient or
   proof data must go through `recipients_public` / `proofs_org_brief`, never
   the base tables.
6. **Reputation**: replace client-computed trust score with a call to
   `org_trust_score(org_id)`.