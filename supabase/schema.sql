-- Run this in the Supabase SQL editor for your Stepwize project.

create table if not exists public.town_saves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  save jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.town_saves enable row level security;

create policy "Users read own save"
  on public.town_saves for select
  using (auth.uid() = user_id);

create policy "Users insert own save"
  on public.town_saves for insert
  with check (auth.uid() = user_id);

create policy "Users update own save"
  on public.town_saves for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
