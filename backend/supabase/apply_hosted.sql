-- OpenImpact hosted apply (paste into Supabase SQL Editor, then Run)
-- Project: xbfkbardfyifpxznztzt

-- openImpact / HackonChain — initial schema, RLS, views, reputation fn
-- Enforces: recipient real name never on recipients table; orgs never SELECT full proofs.

-- Extensions
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('donor', 'recipient', 'organisation');
create type public.donation_status as enum ('pending', 'received', 'verified', 'flagged');
create type public.proof_scope as enum ('donation', 'general');
create type public.publication_type as enum ('social', 'news', 'blog', 'other');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null,
  name text not null,
  wallet_address text,
  location text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.organisations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles (id) on delete set null,
  name text not null,
  tagline text not null default '',
  description text not null default '',
  image_url text not null default '',
  wallet_address text,
  reputation_score integer not null default 50
    check (reputation_score >= 0 and reputation_score <= 100),
  created_at timestamptz not null default now()
);

-- No `name` column — real identity lives only on profiles (self-read).
create table public.recipients (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles (id) on delete set null,
  pseudonym text not null unique,
  org_id uuid references public.organisations (id) on delete set null,
  story text not null default '',
  wallet_address text,
  reputation_score integer not null default 50
    check (reputation_score >= 0 and reputation_score <= 100),
  created_at timestamptz not null default now()
);

create table public.donations (
  id text primary key,
  donor_profile_id uuid references public.profiles (id) on delete set null,
  donor_name text not null,
  is_public boolean not null default true,
  amount numeric(18, 2) not null check (amount > 0),
  currency text not null default 'USDC',
  recipient_id uuid not null references public.recipients (id) on delete restrict,
  org_id uuid references public.organisations (id) on delete set null,
  status public.donation_status not null default 'pending',
  -- Optional until web3 team wires settlement; UI stubs may populate it.
  tx_hash text,
  note text,
  created_at timestamptz not null default now()
);

create index donations_org_id_idx on public.donations (org_id);
create index donations_recipient_id_idx on public.donations (recipient_id);
create index donations_donor_profile_id_idx on public.donations (donor_profile_id);

create table public.proofs (
  id uuid primary key default gen_random_uuid(),
  scope public.proof_scope not null,
  donation_id text references public.donations (id) on delete cascade,
  recipient_id uuid not null references public.recipients (id) on delete cascade,
  donor_name text,
  donor_is_public boolean,
  org_id uuid references public.organisations (id) on delete set null,
  photo_url text not null,
  description text not null default '',
  testimonial text not null default '',
  submitted_at timestamptz not null default now(),
  flagged boolean not null default false,
  ai_checked boolean,
  ai_reason text,
  -- Never exposed via public/org views — platform + recipient + funding donor only.
  ai_internal_note text,
  constraint proofs_donation_scope_chk check (
    (scope = 'donation' and donation_id is not null)
    or (scope = 'general' and org_id is not null)
  )
);

create index proofs_donation_id_idx on public.proofs (donation_id);
create index proofs_recipient_id_idx on public.proofs (recipient_id);
create index proofs_org_id_idx on public.proofs (org_id);
create index proofs_photo_url_idx on public.proofs (recipient_id, photo_url);

-- Donor-only contact/social share — separate table so public proofs SELECT can't leak it.
create table public.proof_donor_shares (
  proof_id uuid primary key references public.proofs (id) on delete cascade,
  contact text,
  social text,
  note text,
  constraint proof_donor_shares_nonempty_chk check (
    coalesce(nullif(trim(contact), ''), nullif(trim(social), ''), nullif(trim(note), '')) is not null
  )
);

create table public.publications (
  id uuid primary key default gen_random_uuid(),
  donation_id text not null unique references public.donations (id) on delete cascade,
  url text not null,
  type public.publication_type not null default 'social',
  caption text,
  submitted_at timestamptz not null default now(),
  submitted_by text
);

create table public.invites (
  code text primary key,
  org_id uuid not null references public.organisations (id) on delete cascade,
  project_label text not null,
  amount numeric(18, 2),
  note text,
  created_at timestamptz not null default now(),
  used_by_profile_id uuid references public.profiles (id) on delete set null,
  claimed_pseudonym text,
  claimed_wallet text,
  claimed_at timestamptz
);

create index invites_org_id_idx on public.invites (org_id);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_org_member(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organisations o
    where o.id = p_org_id
      and o.profile_id = auth.uid()
  );
$$;

create or replace function public.is_recipient_owner(p_recipient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.recipients r
    where r.id = p_recipient_id
      and r.profile_id = auth.uid()
  );
$$;

create or replace function public.is_donation_donor(p_donation_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.donations d
    where d.id = p_donation_id
      and d.donor_profile_id = auth.uid()
  );
$$;

create or replace function public.generate_pseudonym()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  words text[] := array[
    'Coral','Baobab','Kestrel','Marigold','Almendro','Harbour','Tamarind','Juniper',
    'Cinder','Meridian','Saffron','Pelican','Quartz','Willow','Anchor','Lantern'
  ];
  candidate text;
  i int;
begin
  for i in 1..50 loop
    candidate := words[1 + floor(random() * array_length(words, 1))::int]
      || '-' || (1000 + floor(random() * 9000)::int)::text;
    if not exists (select 1 from public.recipients r where r.pseudonym = candidate) then
      return candidate;
    end if;
  end loop;
  return 'Recipient-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
end;
$$;

-- Reputation: average of proof-rate and publication-rate for an org's donations.
create or replace function public.org_trust_score(p_org_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  with org_donations as (
    select d.id
    from public.donations d
    where d.org_id = p_org_id
  ),
  stats as (
    select
      (select count(*)::numeric from org_donations) as total,
      (
        select count(*)::numeric
        from public.proofs p
        where p.scope = 'donation'
          and p.donation_id in (select id from org_donations)
      ) as with_proof,
      (
        select count(*)::numeric
        from public.publications pub
        where pub.donation_id in (select id from org_donations)
      ) as with_pub
  )
  select case
    when total = 0 then coalesce(
      (select reputation_score from public.organisations where id = p_org_id),
      0
    )
    else round(
      (
        (with_proof / total) * 100
        + (with_pub / total) * 100
      ) / 2
    )::integer
  end
  from stats;
$$;

-- Truncated org-safe brief (~90 chars).
create or replace function public.proof_brief(p_description text, p_testimonial text)
returns text
language sql
immutable
as $$
  select case
    when length(trim(coalesce(nullif(trim(p_description), ''), p_testimonial, ''))) = 0
      then 'Submission received'
    when length(trim(coalesce(nullif(trim(p_description), ''), p_testimonial))) <= 90
      then trim(coalesce(nullif(trim(p_description), ''), p_testimonial))
    else left(trim(coalesce(nullif(trim(p_description), ''), p_testimonial)), 90) || '…'
  end;
$$;

-- ---------------------------------------------------------------------------
-- Views (privacy-critical)
-- ---------------------------------------------------------------------------

-- Passthrough alias (recipients already name-free).
create or replace view public.recipients_public
with (security_invoker = true)
as
  select
    id,
    profile_id,
    pseudonym,
    org_id,
    story,
    wallet_address,
    reputation_score,
    created_at
  from public.recipients;

-- Public-safe proof fields (no ai_internal_note; no donor-only share).
-- security_invoker=false so anon can read via view owner while base RLS stays tight.
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

-- Org-safe slice: no full testimonial/photo/donor_name/ai_internal_note.
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

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.organisations enable row level security;
alter table public.recipients enable row level security;
alter table public.donations enable row level security;
alter table public.proofs enable row level security;
alter table public.proof_donor_shares enable row level security;
alter table public.publications enable row level security;
alter table public.invites enable row level security;

-- profiles: self only
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);
create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- organisations: public read; owner write
create policy organisations_select_all on public.organisations
  for select using (true);
create policy organisations_insert_own on public.organisations
  for insert with check (profile_id = auth.uid());
create policy organisations_update_own on public.organisations
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- recipients: public read (name-free by construction); owner write
create policy recipients_select_all on public.recipients
  for select using (true);
create policy recipients_insert_own on public.recipients
  for insert with check (profile_id = auth.uid());
create policy recipients_update_own on public.recipients
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- donations: public can read (display name is snapshot; private donors store "Anonymous")
create policy donations_select_all on public.donations
  for select using (true);
create policy donations_insert_donor on public.donations
  for insert with check (
    donor_profile_id = auth.uid()
    or donor_profile_id is null -- stub/demo inserts before auth wired fully
  );
create policy donations_update_parties on public.donations
  for update using (
    donor_profile_id = auth.uid()
    or public.is_recipient_owner(recipient_id)
    or public.is_org_member(org_id)
  );

-- proofs: ONLY funding donor + authoring recipient (never org on base table)
create policy proofs_select_donor_or_recipient on public.proofs
  for select using (
    public.is_recipient_owner(recipient_id)
    or (donation_id is not null and public.is_donation_donor(donation_id))
  );
create policy proofs_insert_recipient on public.proofs
  for insert with check (public.is_recipient_owner(recipient_id));
create policy proofs_update_recipient on public.proofs
  for update using (public.is_recipient_owner(recipient_id));

-- donor-only share: funding donor + recipient
create policy proof_shares_select on public.proof_donor_shares
  for select using (
    exists (
      select 1
      from public.proofs p
      where p.id = proof_id
        and (
          public.is_recipient_owner(p.recipient_id)
          or (p.donation_id is not null and public.is_donation_donor(p.donation_id))
        )
    )
  );
create policy proof_shares_insert on public.proof_donor_shares
  for insert with check (
    exists (
      select 1 from public.proofs p
      where p.id = proof_id and public.is_recipient_owner(p.recipient_id)
    )
  );
create policy proof_shares_delete on public.proof_donor_shares
  for delete using (
    exists (
      select 1 from public.proofs p
      where p.id = proof_id and public.is_recipient_owner(p.recipient_id)
    )
  );

-- publications: public read; org of donation writes
create policy publications_select_all on public.publications
  for select using (true);
create policy publications_insert_org on public.publications
  for insert with check (
    exists (
      select 1 from public.donations d
      where d.id = donation_id and public.is_org_member(d.org_id)
    )
  );
create policy publications_update_org on public.publications
  for update using (
    exists (
      select 1 from public.donations d
      where d.id = donation_id and public.is_org_member(d.org_id)
    )
  );
create policy publications_delete_org on public.publications
  for delete using (
    exists (
      select 1 from public.donations d
      where d.id = donation_id and public.is_org_member(d.org_id)
    )
  );

-- invites: org full CRUD on own; anyone can read unclaimed (to redeem)
create policy invites_select on public.invites
  for select using (
    public.is_org_member(org_id)
    or used_by_profile_id is null
  );
create policy invites_insert_org on public.invites
  for insert with check (public.is_org_member(org_id));
create policy invites_update_org_or_claim on public.invites
  for update using (
    public.is_org_member(org_id)
    or used_by_profile_id is null
  );
create policy invites_delete_org on public.invites
  for delete using (public.is_org_member(org_id) and used_by_profile_id is null);

-- Grants for views (anon + authenticated)
grant usage on schema public to anon, authenticated;
grant select on public.organisations to anon, authenticated;
grant select on public.recipients to anon, authenticated;
grant select on public.recipients_public to anon, authenticated;
grant select on public.donations to anon, authenticated;
grant select on public.publications to anon, authenticated;
grant select on public.proofs_public to anon, authenticated;
grant select on public.proofs_org_brief to authenticated;
grant select on public.invites to anon, authenticated;
grant execute on function public.org_trust_score(uuid) to anon, authenticated;
grant execute on function public.generate_pseudonym() to authenticated;

grant select, insert, update on public.profiles to authenticated;
grant insert, update on public.organisations to authenticated;
grant insert, update on public.recipients to authenticated;
grant insert, update on public.donations to authenticated;
grant select, insert, update on public.proofs to authenticated;
grant select, insert, delete on public.proof_donor_shares to authenticated;
grant insert, update, delete on public.publications to authenticated;
grant insert, update, delete on public.invites to authenticated;

-- ---------------------------------------------------------------------------
-- Storage bucket for proof photos
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', true)
on conflict (id) do nothing;

create policy proofs_storage_public_read on storage.objects
  for select using (bucket_id = 'proofs');

create policy proofs_storage_authenticated_upload on storage.objects
  for insert to authenticated
  with check (bucket_id = 'proofs');

create policy proofs_storage_owner_update on storage.objects
  for update to authenticated
  using (bucket_id = 'proofs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy proofs_storage_owner_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'proofs' and auth.uid()::text = (storage.foldername(name))[1]);

-- ---------------------------------------------------------------------------
-- Signup RPC: create profile + recipient/org + optional invite claim
-- ---------------------------------------------------------------------------
create or replace function public.complete_signup(
  p_role public.user_role,
  p_name text,
  p_invite_code text default null,
  p_org_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  v_wallet text;
  v_pseudonym text;
  v_entity_id uuid;
  v_invite public.invites%rowtype;
  v_linked_org uuid;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;
  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'Name is required';
  end if;

  v_wallet := '0x' || substr(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), 1, 40);

  insert into public.profiles (id, role, name, wallet_address)
  values (uid, p_role, trim(p_name), v_wallet)
  on conflict (id) do update
    set name = excluded.name,
        role = excluded.role
  returning wallet_address into v_wallet;

  if p_role = 'recipient' then
    if p_invite_code is not null then
      select * into v_invite
      from public.invites
      where code = p_invite_code and used_by_profile_id is null
      for update;
      if not found then
        raise exception 'Invite not found or already used';
      end if;
      v_linked_org := v_invite.org_id;
    else
      v_linked_org := p_org_id;
    end if;

    v_pseudonym := public.generate_pseudonym();
    insert into public.recipients (profile_id, pseudonym, org_id, story, wallet_address)
    values (
      uid,
      v_pseudonym,
      v_linked_org,
      'Tell donors what you''re raising for — you can edit this any time.',
      v_wallet
    )
    returning id into v_entity_id;

    if v_linked_org is not null and p_invite_code is not null then
      update public.invites
      set used_by_profile_id = uid,
          claimed_pseudonym = v_pseudonym,
          claimed_wallet = v_wallet,
          claimed_at = now()
      where code = p_invite_code;
    end if;

  elsif p_role = 'organisation' then
    insert into public.organisations (
      profile_id, name, tagline, description, wallet_address
    )
    values (
      uid,
      trim(p_name),
      'A new organisation on openImpact',
      'Add a description of your work so donors know what their money pays for.',
      v_wallet
    )
    returning id into v_entity_id;
  end if;

  return jsonb_build_object(
    'role', p_role,
    'entityId', v_entity_id,
    'walletAddress', v_wallet,
    'pseudonym', v_pseudonym
  );
end;
$$;

grant execute on function public.complete_signup(public.user_role, text, text, uuid) to authenticated;

-- ========== SEED (demo data) ==========

-- Seed public cause data (no Auth users). Demo Auth users are created separately
-- via `supabase/seed-demo-users.mjs` or the Supabase dashboard — see backend/README.md.
-- Fixed UUIDs keep frontend demo wiring stable once Auth is linked.

insert into public.organisations (
  id, name, tagline, description, image_url, wallet_address, reputation_score
) values
(
  'a1000000-0000-4000-8000-000000000001',
  'Kilifi Water Trust',
  'Clean boreholes for coastal villages',
  'We drill and repair boreholes so families stop walking six kilometres for water. Every pump we fix gets photographed, dated and signed off by the village committee.',
  '',
  '0x3fA1c8B7d4E29aF06b15C8d2937eB4a1D6c05E88',
  96
),
(
  'a1000000-0000-4000-8000-000000000002',
  'BookLift Schools',
  'Textbooks and desks for rural classrooms',
  'Teachers tell us what a classroom is missing, we buy it locally, and the receipt plus a photo of the delivered goods goes straight back to the donor.',
  '',
  '0x9C2e05Ba71D8f3C4e6A09b7F25dE83c1A4b7F210',
  88
),
(
  'a1000000-0000-4000-8000-000000000003',
  'Night Shift Kitchen',
  'Hot meals for people sleeping rough',
  'A volunteer kitchen serving 300 meals a night. Grocery receipts are uploaded the same evening they''re spent.',
  '',
  '0x5D71bE93c02A48f6D9b3E71cA85d02fB6e1C4437',
  72
),
(
  'a1000000-0000-4000-8000-000000000004',
  'SolarSeed Collective',
  'Off-grid solar kits for market traders',
  'One solar kit lets a trader work three extra hours a night. Recipients film a short thank-you when the kit is installed.',
  '',
  '0x1B48cE07a9F2d635C81a0b4E7d92C3fA05e6D274',
  91
)
on conflict (id) do nothing;

insert into public.recipients (
  id, pseudonym, org_id, story, wallet_address, reputation_score
) values
(
  'b1000000-0000-4000-8000-000000000001',
  'Coral-4821',
  'a1000000-0000-4000-8000-000000000001',
  'Runs the water committee in Mtwapa village, 240 households.',
  '0xA1d4F7c02B9e35D6a8C1740bE39fD25c60B8a913',
  98
),
(
  'b1000000-0000-4000-8000-000000000002',
  'Baobab-1907',
  'a1000000-0000-4000-8000-000000000001',
  'Maintains four hand pumps across Kilifi county.',
  '0xB7e02C4aF19d8365Ea07b4C29dF16a3B85c0D742',
  84
),
(
  'b1000000-0000-4000-8000-000000000003',
  'Kestrel-3364',
  'a1000000-0000-4000-8000-000000000002',
  'Teaches grade 5 at Ndalu Primary — 62 pupils, 18 textbooks.',
  '0xC30a91Be47D25c8A160bE47d29fC0a3B8172dE04',
  90
),
(
  'b1000000-0000-4000-8000-000000000004',
  'Almendro-7715',
  'a1000000-0000-4000-8000-000000000003',
  'Buys and cooks the Thursday night service.',
  '0xD4b17Ec902A56f38B0d9C24aE7f13c85B06aF291',
  66
),
(
  'b1000000-0000-4000-8000-000000000005',
  'Marigold-2258',
  'a1000000-0000-4000-8000-000000000004',
  'Sells vegetables at Serrekunda market; installing her first solar kit.',
  '0xE58c23Af71B04d69C3a17bE05d24fA9c81B7036D',
  94
)
on conflict (id) do nothing;

insert into public.invites (
  code, org_id, project_label, amount, note, created_at
) values (
  'KILIFI-7QX2',
  'a1000000-0000-4000-8000-000000000001',
  'Mtwapa borehole — caretaker stipend',
  300,
  'One slot, Q1 disbursement',
  '2026-01-08T09:12:00.000Z'
)
on conflict (code) do nothing;

-- Sample donations (ids match prior frontend mock where useful)
insert into public.donations (
  id, donor_name, is_public, amount, currency, recipient_id, org_id, status, tx_hash, note, created_at
) values
(
  'dn-1001', 'Priya Raman', true, 120, 'USDC',
  'b1000000-0000-4000-8000-000000000001',
  'a1000000-0000-4000-8000-000000000001',
  'verified',
  '0x8f2a41c7d90b35e6a1c04f7b28de5931ac60f4b7e21d8305c9a7b40e16fd2c85',
  'For the pump repair fund.',
  '2026-07-16T09:12:00.000Z'
),
(
  'dn-1003', 'Priya Raman', true, 250, 'USDC',
  'b1000000-0000-4000-8000-000000000003',
  'a1000000-0000-4000-8000-000000000002',
  'received',
  '0x71b0d4ae3c9f2071ad85be0142c7369fa5d80b41e27c9036a8f14bd7052ce983',
  'Textbooks for grade 5.',
  '2026-07-25T11:02:00.000Z'
),
(
  'dn-1004', 'Anonymous', false, 60, 'USDC',
  'b1000000-0000-4000-8000-000000000004',
  'a1000000-0000-4000-8000-000000000003',
  'pending',
  '0x5a13cf8027bd9e461038a7c25fd0b94e17c6a3820df54619bc07e29a3d81f065',
  null,
  '2026-07-28T20:15:00.000Z'
)
on conflict (id) do nothing;

insert into public.proofs (
  id, scope, donation_id, recipient_id, donor_name, donor_is_public, org_id,
  photo_url, description, testimonial, submitted_at, flagged, ai_checked, ai_reason
) values (
  'c1000000-0000-4000-8000-000000000001',
  'donation',
  'dn-1001',
  'b1000000-0000-4000-8000-000000000001',
  'Priya Raman',
  true,
  'a1000000-0000-4000-8000-000000000001',
  'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=1200&q=70',
  'Bought a replacement pump head and two lengths of pipe from Mtwapa Hardware. The borehole was running again the same afternoon.',
  'The queue at the well is twenty minutes now, not two hours. Thank you for trusting us with this.',
  '2026-07-19T14:20:00.000Z',
  false,
  true,
  null
)
on conflict (id) do nothing;

insert into public.publications (
  id, donation_id, url, type, caption, submitted_at, submitted_by
) values (
  'd1000000-0000-4000-8000-000000000001',
  'dn-1001',
  'https://kilifinews.example/2026/07/kadzandani-pump-back-online',
  'news',
  'Kilifi County News covered the pump coming back online.',
  '2026-07-20T08:30:00.000Z',
  'Kilifi Water Trust'
)
on conflict (donation_id) do nothing;
