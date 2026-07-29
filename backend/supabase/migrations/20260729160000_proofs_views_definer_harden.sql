-- Intentional SECURITY DEFINER on proofs privacy views.
-- Supabase lint 0010_security_definer_view will still flag these — that is expected.
--
-- Why DEFINER (security_invoker = false):
--   Base public.proofs RLS only allows the funding donor + authoring recipient.
--   Public/org still need a column-safe projection. RLS cannot hide columns, only
--   rows, so INVOKER views would either break (no SELECT) or force opening the
--   base table (leaking ai_internal_note). These views are the privacy boundary.
--
-- Mitigations applied here:
--   * Views omit ai_internal_note (and org brief omits photo/testimonial/donor_name).
--   * anon has no SELECT on base public.proofs.
--   * API clients should read proofs_public / proofs_org_brief, never rely on
--     SELECT * FROM proofs as anon.

-- Harden table grants -------------------------------------------------------
revoke all on table public.proofs from anon;
revoke all on table public.proofs from public;

-- authenticated keeps SELECT/INSERT/UPDATE; row access is still gated by RLS
-- (donor or recipient only on base table).
grant select, insert, update on table public.proofs to authenticated;

-- Recreate views with explicit DEFINER + documentation ----------------------
create or replace view public.proofs_public
with (security_invoker = false)
as
  select
    id,
    scope,
    donation_id,
    recipient_id,
    donor_name,
    donor_is_public,
    org_id,
    photo_url,
    description,
    testimonial,
    submitted_at,
    flagged,
    ai_checked,
    case when flagged then ai_reason else null end as ai_reason
  from public.proofs;

create or replace view public.proofs_org_brief
with (security_invoker = false)
as
  select
    p.id,
    p.scope,
    p.donation_id,
    p.recipient_id,
    p.org_id,
    p.submitted_at,
    p.flagged,
    p.ai_checked,
    case when p.flagged then p.ai_reason else null end as ai_reason,
    public.proof_brief(p.description, p.testimonial) as brief
  from public.proofs p;

comment on view public.proofs_public is
  'SECURITY DEFINER by design: public-safe proof projection (no ai_internal_note). '
  'Bypasses base proofs RLS so anon can read safe columns only. Do not add sensitive columns.';

comment on view public.proofs_org_brief is
  'SECURITY DEFINER by design: org-safe brief (no photo/testimonial/donor_name/ai_internal_note). '
  'Bypasses base proofs RLS for organisation consoles. Do not add sensitive columns.';

grant select on public.proofs_public to anon, authenticated;
grant select on public.proofs_org_brief to authenticated;
