-- SQL Schema for Phase 4: Leaderboard User Profiles

create table if not exists public.user_profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null,
  show_on_leaderboard boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.user_profiles enable row level security;

-- Policies
create policy "Users can view all profiles on leaderboard"
  on public.user_profiles for select
  using (show_on_leaderboard = true or auth.uid() = id);

create policy "Users can insert own profile"
  on public.user_profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.user_profiles for update
  using (auth.uid() = id);
