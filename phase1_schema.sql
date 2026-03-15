-- Core Streak Tracker Schema (Phase 1)

create table if not exists public.relapses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  date timestamp with time zone not null,
  type text not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Relapses
alter table public.relapses enable row level security;

-- Setup Policies for Relapses
create policy "Users can view own relapses" on public.relapses for select using (auth.uid() = user_id);
create policy "Users can insert own relapses" on public.relapses for insert with check (auth.uid() = user_id);
create policy "Users can delete own relapses" on public.relapses for delete using (auth.uid() = user_id);
create policy "Users can update own relapses" on public.relapses for update using (auth.uid() = user_id);
