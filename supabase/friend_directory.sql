-- Incremental update for Stepwize friend codes (run in SQL Editor)
-- Project: ogzcgzwzkdalsznmihpp

create table if not exists public.friend_directory (
  friend_code text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null default '',
  town_name text not null default 'My Town',
  email text not null default '',
  snapshot jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists friend_directory_user_idx
  on public.friend_directory (user_id);

alter table public.friend_directory enable row level security;

drop policy if exists "Anyone authenticated can look up friend codes" on public.friend_directory;
create policy "Anyone authenticated can look up friend codes"
  on public.friend_directory for select
  to authenticated
  using (true);

drop policy if exists "Users publish own directory row" on public.friend_directory;
create policy "Users publish own directory row"
  on public.friend_directory for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users update own directory row" on public.friend_directory;
create policy "Users update own directory row"
  on public.friend_directory for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own directory row" on public.friend_directory;
create policy "Users delete own directory row"
  on public.friend_directory for delete
  to authenticated
  using (auth.uid() = user_id);
