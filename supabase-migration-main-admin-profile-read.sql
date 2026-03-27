-- Allow main admin to read profiles (for admin request requester details).
drop policy if exists "profiles_select_main_admin" on public.profiles;
create policy "profiles_select_main_admin"
on public.profiles
for select
using (public.is_main_admin());

