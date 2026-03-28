-- Paste this into your Supabase SQL Editor to create the necessary table

create table if not exists public.relapses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  date timestamp with time zone not null,
  type text not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.relapses enable row level security;

-- Create policies so users can only see and edit their own data
create policy "Individuals can view their own relapses."
  on public.relapses for select
  using ( auth.uid() = user_id );

create policy "Individuals can insert their own relapses."
  on public.relapses for insert
  with check ( auth.uid() = user_id );

create policy "Individuals can update their own relapses."
  on public.relapses for update
  using ( auth.uid() = user_id );

create policy "Individuals can delete their own relapses."
  on public.relapses for delete
  using ( auth.uid() = user_id );

-- =======================================
-- TABLE: general_notes
-- =======================================
create table if not exists public.general_notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.general_notes enable row level security;

create policy "Individuals can view their own notes."
  on public.general_notes for select
  using ( auth.uid() = user_id );

create policy "Individuals can insert their own notes."
  on public.general_notes for insert
  with check ( auth.uid() = user_id );

create policy "Individuals can update their own notes."
  on public.general_notes for update
  using ( auth.uid() = user_id );

create policy "Individuals can delete their own notes."
  on public.general_notes for delete
  using ( auth.uid() = user_id );
