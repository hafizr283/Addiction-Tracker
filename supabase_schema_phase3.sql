-- SQL Schema for Phase 3: Hourly Followups

create table if not exists public.sent_relapse_followups (
  id uuid default gen_random_uuid() primary key,
  relapse_id uuid references public.relapses on delete cascade not null,
  user_id uuid references auth.users not null,
  followup_type text not null, -- e.g., 'hour_2', 'hour_6', 'hour_12', 'hour_24'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(relapse_id, followup_type)
);

-- Enable RLS for Followups
alter table public.sent_relapse_followups enable row level security;
create policy "Users can view own followups" on public.sent_relapse_followups for select using (auth.uid() = user_id);
create policy "Users can insert own followups" on public.sent_relapse_followups for insert with check (auth.uid() = user_id);
create policy "Users can delete own followups" on public.sent_relapse_followups for delete using (auth.uid() = user_id);
