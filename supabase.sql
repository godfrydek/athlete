-- Training Arc OS v7 Supabase setup
-- Run in Supabase SQL editor.
-- Stores ONLY encrypted vault JSON. The client never uploads decrypted data unless you intentionally change the app.

create table if not exists public.training_arc_vaults (
  user_id uuid primary key references auth.users(id) on delete cascade,
  vault jsonb not null,
  device_id text,
  updated_at timestamptz not null default now()
);

alter table public.training_arc_vaults enable row level security;

drop policy if exists "Users can read own training arc vault" on public.training_arc_vaults;
create policy "Users can read own training arc vault"
  on public.training_arc_vaults
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own training arc vault" on public.training_arc_vaults;
create policy "Users can insert own training arc vault"
  on public.training_arc_vaults
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own training arc vault" on public.training_arc_vaults;
create policy "Users can update own training arc vault"
  on public.training_arc_vaults
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists training_arc_vaults_updated_at_idx on public.training_arc_vaults(updated_at desc);

-- Optional: if you later add Supabase Storage food photos instead of storing compressed base64 in the vault:
-- 1) Create a private bucket named training-arc-food-images
-- 2) Add storage policies limiting object access to auth.uid() folders
-- Current v7 stores food images inside encrypted vault for simplicity.
