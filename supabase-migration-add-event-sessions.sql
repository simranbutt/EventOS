-- Multi-day session support migration
create table if not exists public.event_sessions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  session_date date not null,
  start_time time not null,
  end_time time not null,
  title text,
  created_at timestamptz not null default now(),
  constraint event_sessions_end_after_start check (end_time > start_time)
);

create unique index if not exists event_sessions_unique_slot
on public.event_sessions (event_id, session_date, start_time);

-- Backfill one default session for events that don't have sessions.
insert into public.event_sessions (event_id, session_date, start_time, end_time, title)
select
  e.id,
  (coalesce(e.start_at, e.date))::date as session_date,
  (coalesce(e.start_at, e.date))::time as start_time,
  (coalesce(e.end_at, e.date + interval '1 hour'))::time as end_time,
  'Main session' as title
from public.events e
where not exists (
  select 1 from public.event_sessions s where s.event_id = e.id
);

alter table public.event_sessions enable row level security;

drop policy if exists "event_sessions_select_all" on public.event_sessions;
create policy "event_sessions_select_all" on public.event_sessions for select using (true);

drop policy if exists "event_sessions_insert_own_events" on public.event_sessions;
create policy "event_sessions_insert_own_events" on public.event_sessions
for insert
with check (
  exists (
    select 1 from public.events e
    where e.id = event_sessions.event_id
      and e.created_by = auth.uid()
  )
);

drop policy if exists "event_sessions_update_own_events" on public.event_sessions;
create policy "event_sessions_update_own_events" on public.event_sessions
for update
using (
  exists (
    select 1 from public.events e
    where e.id = event_sessions.event_id
      and e.created_by = auth.uid()
  )
);

drop policy if exists "event_sessions_delete_own_events" on public.event_sessions;
create policy "event_sessions_delete_own_events" on public.event_sessions
for delete
using (
  exists (
    select 1 from public.events e
    where e.id = event_sessions.event_id
      and e.created_by = auth.uid()
  )
);

