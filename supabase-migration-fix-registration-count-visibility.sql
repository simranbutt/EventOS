-- Makes registration counts visible to all authenticated users,
-- so seats display consistently across different accounts.
drop policy if exists "registrations_select_all" on public.registrations;
create policy "registrations_select_all"
on public.registrations
for select
using (true);

