create table if not exists public.training_arc_vaults (
  user_id uuid primary key references auth.users(id) on delete cascade,
  vault jsonb not null,
  updated_at timestamptz default now()
);

alter table public.training_arc_vaults enable row level security;

create policy "Users can read own vault"
on public.training_arc_vaults for select
using (auth.uid() = user_id);

create policy "Users can upsert own vault"
on public.training_arc_vaults for insert
with check (auth.uid() = user_id);

create policy "Users can update own vault"
on public.training_arc_vaults for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
