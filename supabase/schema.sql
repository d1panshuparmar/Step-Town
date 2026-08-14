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

-- Public profile + friend codes
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',
  friend_code text not null unique,
  display_name text not null default '',
  town_name text not null default 'My Town',
  updated_at timestamptz not null default now()
);

create index if not exists profiles_friend_code_idx on public.profiles (friend_code);

alter table public.profiles enable row level security;

create policy "Profiles are readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Friendships
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users (id) on delete cascade,
  addressee_id uuid not null references auth.users (id) on delete cascade,
  status text not null check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  unique (requester_id, addressee_id)
);

create index if not exists friendships_requester_idx on public.friendships (requester_id);
create index if not exists friendships_addressee_idx on public.friendships (addressee_id);

alter table public.friendships enable row level security;

create policy "Participants read friendships"
  on public.friendships for select
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "Users send friend requests"
  on public.friendships for insert
  to authenticated
  with check (auth.uid() = requester_id);

create policy "Participants update friendships"
  on public.friendships for update
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id)
  with check (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "Participants delete friendships"
  on public.friendships for delete
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Public town/steps snapshot for friends
create table if not exists public.friend_snapshots (
  user_id uuid primary key references auth.users (id) on delete cascade,
  snapshot jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.friend_snapshots enable row level security;

create policy "Owner upserts snapshot"
  on public.friend_snapshots for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Owner updates snapshot"
  on public.friend_snapshots for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Owner reads own snapshot"
  on public.friend_snapshots for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Friends read accepted snapshots"
  on public.friend_snapshots for select
  to authenticated
  using (
    exists (
      select 1
      from public.friendships f
      where f.status = 'accepted'
        and (
          (f.requester_id = auth.uid() and f.addressee_id = friend_snapshots.user_id)
          or (f.addressee_id = auth.uid() and f.requester_id = friend_snapshots.user_id)
        )
    )
  );
