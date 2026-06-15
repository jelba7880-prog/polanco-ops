-- Seed/fixup for local & preview environments.
-- Run in the Supabase SQL editor (or via `supabase db execute`) after
-- creating the test auth users via the dashboard.
--
-- The auth signup flow / profile trigger defaults new accounts to
-- role = 'staff'. This promotes the admin test account so that
-- /settings (admin-only) is reachable in fresh databases.

update public.profiles
set role = 'admin'
where full_name = 'admin@polanco.test';

update public.profiles
set role = 'staff'
where full_name = 'staff@polanco.test';
