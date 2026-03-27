-- Run this in Supabase SQL editor if your `events` table already exists.
alter table public.events
add column if not exists start_at timestamptz,
add column if not exists end_at timestamptz;

-- Backfill current rows from old `date` value.
update public.events
set
  start_at = coalesce(start_at, date),
  end_at = coalesce(end_at, date);

-- Enforce required values for new and existing rows.
alter table public.events
alter column start_at set not null,
alter column end_at set not null;

-- Optional: keep date as legacy alias to start_at for older code paths.
update public.events
set date = start_at
where date is distinct from start_at;

