-- Dedicated activity feed table. The Dashboard's Recent Activity feed was
-- previously assembled by querying cars/leads/deal_sheets and merging recent
-- rows, which cannot carry per-event actor attribution (cars only records who
-- originally added a car, and leads has no creator field at all). Each row here
-- is written at the moment an action happens, capturing who did it, what they
-- did, and a human-readable description, and also sets up clean pagination for
-- a later task. This is purely additive — the existing feed query is untouched.
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action_type text not null,      -- 'car_status_changed' | 'car_created' | 'lead_created' | 'deal_sheet_generated'
  entity_type text not null,      -- 'car' | 'lead' | 'deal_sheet'
  entity_id uuid,
  description text not null,       -- e.g. "marked 2025 Lexus RX350 as sold"
  created_at timestamptz not null default now()
);

-- Newest-first reads are the only access pattern (the feed), so index created_at
-- descending to keep that query and its future pagination fast.
create index activity_log_created_at_idx on public.activity_log (created_at desc);

alter table public.activity_log enable row level security;

-- Scoped TO authenticated (the Postgres role PostgREST reliably switches into
-- from the JWT) rather than gating on auth.role(), which is deprecated and
-- reads a request GUC PostgREST no longer sets — it would silently deny every
-- insert and hide every row.

-- Any signed-in user can read the shared activity feed.
create policy "authenticated_read" on public.activity_log
  for select to authenticated using (true);

-- Inserts must be attributed to the acting user themselves — a row can only be
-- written with actor_id set to the caller's own auth uid.
create policy "authenticated_insert" on public.activity_log
  for insert to authenticated with check (actor_id = auth.uid());
