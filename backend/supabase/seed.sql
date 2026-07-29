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
