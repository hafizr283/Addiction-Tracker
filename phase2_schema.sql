-- SQL Schema for Phase 2

-- Create Urges table
create table public.urges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  intensity integer not null check (intensity >= 1 and intensity <= 10),
  trigger_note text
);

-- Enable RLS for Urges
alter table public.urges enable row level security;
create policy "Users can view own urges" on public.urges for select using (auth.uid() = user_id);
create policy "Users can insert own urges" on public.urges for insert with check (auth.uid() = user_id);
create policy "Users can delete own urges" on public.urges for delete using (auth.uid() = user_id);

-- Create Moods table
create table public.moods (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  mood_type text not null, -- e.g., 'Happy', 'Anxious', 'Depressed', 'Motivated', 'Stressed'
  note text
);

-- Enable RLS for Moods
alter table public.moods enable row level security;
create policy "Users can view own moods" on public.moods for select using (auth.uid() = user_id);
create policy "Users can insert own moods" on public.moods for insert with check (auth.uid() = user_id);
create policy "Users can delete own moods" on public.moods for delete using (auth.uid() = user_id);
