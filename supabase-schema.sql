-- EventOS schema + policies
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'user' check (role in ('user', 'admin')),
  interests text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  city text not null,
  venue_name text not null,
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  category text not null,
  date timestamptz not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  is_paid boolean not null default false,
  price numeric(10, 2),
  max_seats integer not null check (max_seats > 0),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  ticket_id text not null unique,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed')),
  created_at timestamptz not null default now(),
  unique (user_id, event_id)
);

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

create table if not exists public.saved_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, event_id)
);

create table if not exists public.admin_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists admin_requests_pending_unique
on public.admin_requests(user_id)
where status = 'pending';

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_admin_requests_updated_at on public.admin_requests;
create trigger set_admin_requests_updated_at
before update on public.admin_requests
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- IMPORTANT: replace the email value with your real main admin email.
create or replace function public.is_main_admin()
returns boolean as $$
begin
  return lower(coalesce(auth.jwt() ->> 'email', '')) = 'mainadmin@example.com';
end;
$$ language plpgsql stable security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.registrations enable row level security;
alter table public.event_sessions enable row level security;
alter table public.saved_events enable row level security;
alter table public.admin_requests enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles_select_main_admin" on public.profiles;
create policy "profiles_select_main_admin" on public.profiles for select using (public.is_main_admin());
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
drop policy if exists "profiles_update_main_admin" on public.profiles;
create policy "profiles_update_main_admin" on public.profiles for update using (public.is_main_admin());
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "events_select_all" on public.events;
create policy "events_select_all" on public.events for select using (true);
drop policy if exists "events_insert_admin_own" on public.events;
create policy "events_insert_admin_own" on public.events for insert with check (auth.uid() = created_by);
drop policy if exists "events_update_admin_own" on public.events;
create policy "events_update_admin_own" on public.events for update using (auth.uid() = created_by);
drop policy if exists "events_delete_admin_own" on public.events;
create policy "events_delete_admin_own" on public.events for delete using (auth.uid() = created_by);

drop policy if exists "registrations_select_own" on public.registrations;
create policy "registrations_select_own" on public.registrations for select using (auth.uid() = user_id);
drop policy if exists "registrations_select_all" on public.registrations;
create policy "registrations_select_all" on public.registrations for select using (true);
drop policy if exists "registrations_insert_own" on public.registrations;
create policy "registrations_insert_own" on public.registrations for insert with check (auth.uid() = user_id);
drop policy if exists "registrations_update_own" on public.registrations;
create policy "registrations_update_own" on public.registrations for update using (auth.uid() = user_id);
drop policy if exists "registrations_delete_own" on public.registrations;
create policy "registrations_delete_own" on public.registrations for delete using (auth.uid() = user_id);

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

drop policy if exists "saved_events_select_own" on public.saved_events;
create policy "saved_events_select_own" on public.saved_events for select using (auth.uid() = user_id);
drop policy if exists "saved_events_insert_own" on public.saved_events;
create policy "saved_events_insert_own" on public.saved_events for insert with check (auth.uid() = user_id);
drop policy if exists "saved_events_delete_own" on public.saved_events;
create policy "saved_events_delete_own" on public.saved_events for delete using (auth.uid() = user_id);

drop policy if exists "admin_requests_select_own" on public.admin_requests;
create policy "admin_requests_select_own" on public.admin_requests for select using (auth.uid() = user_id);
drop policy if exists "admin_requests_select_main_admin" on public.admin_requests;
create policy "admin_requests_select_main_admin" on public.admin_requests for select using (public.is_main_admin());
drop policy if exists "admin_requests_insert_own" on public.admin_requests;
create policy "admin_requests_insert_own" on public.admin_requests for insert with check (auth.uid() = user_id);
drop policy if exists "admin_requests_update_own" on public.admin_requests;
create policy "admin_requests_update_own" on public.admin_requests for update using (auth.uid() = user_id);
drop policy if exists "admin_requests_update_main_admin" on public.admin_requests;
create policy "admin_requests_update_main_admin" on public.admin_requests for update using (public.is_main_admin());

