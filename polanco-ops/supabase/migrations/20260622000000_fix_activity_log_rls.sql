-- Fix: the Dashboard's Recent Activity feed was permanently empty.
--
-- Root cause: activity_log's RLS policies gate on `auth.role() = 'authenticated'`.
-- `auth.role()` is Supabase's deprecated JWT helper — it reads the
-- `request.jwt.claim.role` request GUC, which current PostgREST no longer sets,
-- so it evaluates to NULL at runtime. The INSERT policy's WITH CHECK therefore
-- failed for every caller and silently denied all three logging writes (car
-- status change, lead creation, deal sheet generation), leaving the table empty.
-- The SELECT policy would have hidden any rows for the same reason.
--
-- activity_log was the ONLY table in the schema using auth.role(), which is why
-- the underlying leads/cars/deal_sheets writes all succeeded while only their
-- activity_log companion writes failed. Every logActivity call site was already
-- correctly wired and runs under an authenticated user, so the only thing to fix
-- is the policy predicate — no table or column changes.
--
-- Replacement uses the pattern Supabase now recommends: scope the policies TO the
-- `authenticated` Postgres role (which PostgREST switches into reliably from the
-- JWT) and keep self-attribution enforced via auth.uid().

drop policy if exists "authenticated_read" on public.activity_log;
drop policy if exists "authenticated_insert" on public.activity_log;

-- Any signed-in user can read the shared activity feed.
create policy "authenticated_read" on public.activity_log
  for select to authenticated using (true);

-- Inserts must be attributed to the acting user themselves — a row can only be
-- written with actor_id set to the caller's own auth uid.
create policy "authenticated_insert" on public.activity_log
  for insert to authenticated with check (actor_id = auth.uid());
