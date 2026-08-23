-- ============================================================================
-- RECONSTRUCTED BASELINE — read this comment before trusting this file.
-- ============================================================================
-- Every table below (profiles, cars, car_images, leads, deal_sheets,
-- settings) was created by hand in the Supabase SQL editor and has never
-- had a migration in this repo. That is the root cause the 22 Aug outage
-- traced back to: leads_source_check was invisible to every reader of this
-- codebase, including the engineer who shipped the showcase feature against
-- it. This file exists to close that gap — but it was written by reading
-- lib/supabase/types.ts, the *.schema.ts Zod validators, and comments in the
-- app's own commit history, NOT by dumping the real database (this
-- environment has no network path to Supabase). It was validated by running
-- it, plus every other migration in this directory in order, against a local
-- Postgres 16 instance — the full chain applies cleanly, and
-- create_car_with_images, public_car_images_view's fixed predicate, and
-- leads_source_check's 'website' value were all exercised empirically
-- against the result. What it CANNOT verify, and does NOT attempt to guess:
--
--   1. RLS policies on all six tables below. None are defined here. Cars,
--      car_images, leads, deal_sheets and settings almost certainly have
--      real policies in production (staff can write, anon can't touch them
--      directly) — item 5 of the audit (car creation's discarded rollback
--      error) hinges specifically on whether `cars` has a DELETE policy for
--      staff, which is exactly the kind of thing this file cannot answer.
--      Deliberately NOT calling `enable row level security` here either:
--      doing so without the matching policies would default-deny every
--      table on a fresh environment built from these migrations, which is
--      worse than the current gap.
--   2. Grants beyond what 20260623000000 and 20260709000000 already state
--      (anon's SELECT on the two showcase views).
--   3. The profiles-on-signup trigger. seed.sql's comment ("The auth
--      signup flow / profile trigger defaults new accounts to role =
--      'staff'") confirms one exists, but not its name or body — fabricating
--      one here would risk masking the real trigger's actual behavior.
--   4. Whether any column below is subtly wrong. mileage_km is deliberately
--      left NULLABLE rather than `not null default 0`, contradicting
--      lib/supabase/types.ts's Car.mileage_km: number (non-null) — because
--      app/(public)/cars/[slug]/page.tsx:29 crashing on
--      car.mileage_km.toLocaleString() only reproduces if real NULLs exist
--      in prod, which means the hand-written TS type is the thing that's
--      wrong here, not this column. leads.car_id and deal_sheets.car_id are
--      deliberately left WITHOUT a foreign key: the "Add linked car preview"
--      commit (481328a) states this explicitly for both, independent of
--      this file.
--
-- The correct replacement for this file, once SUPABASE_PROJECT_REF is fixed
-- (see the migration-CI finding) and the project can be linked:
--
--   supabase db dump --schema public -f supabase/migrations/<timestamp>_baseline.sql
--
-- That command reads the actual database and will capture RLS policies,
-- grants, and the signup trigger this file cannot. Once it exists, diff it
-- against this file — anywhere they disagree, the real dump is correct and
-- this file should be replaced (not merged with) it. Before the very first
-- `supabase db push` against production succeeds, also run
-- `supabase migration repair --status applied <version>` for every
-- timestamp already listed in supabase/migrations/ as of this commit: since
-- the migration workflow has never once succeeded (six runs, six failures,
-- all at `supabase link`), the CLI's remote migration-history ledger almost
-- certainly has none of them recorded, and `db push` will otherwise try to
-- replay non-idempotent statements (e.g. 20260618010000's
-- `alter table cars add column lifecycle_status ...`, which has no
-- `if not exists`) against columns that already exist by hand, and fail.
-- create table/view/function statements in every migration from
-- 20260601000000 onward are written defensively (`if not exists`,
-- `create or replace`) precisely so a first push is safe either way, but the
-- pre-existing migrations before this one were not written with that in
-- mind and are left as-is here rather than retroactively rewritten.
-- ============================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'staff' check (role in ('admin', 'staff')),
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.cars (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  make text not null,
  model text not null,
  year int not null,
  body_type text,
  color_exterior text,
  color_interior text,
  mileage_km int,
  condition text not null check (condition in ('New', 'Foreign Used', 'Locally Used')),
  transmission text check (transmission in ('Automatic', 'Manual')),
  fuel_type text check (fuel_type in ('Petrol', 'Diesel', 'Electric', 'Hybrid')),
  engine_cc int,
  horsepower int,
  price_usd numeric not null check (price_usd > 0),
  status text not null default 'available' check (status in ('available', 'reserved', 'sold', 'in_transit')),
  reserved_for text,
  notes text,
  added_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ON DELETE CASCADE confirmed by 20260618010000_add_car_lifecycle.sql's own
-- comment ("the existing car_images ON DELETE CASCADE FK is intentionally
-- left untouched").
create table if not exists public.car_images (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars(id) on delete cascade,
  url text not null,
  sort_order int not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  car_interest text,
  car_id uuid,
  source text not null check (source in ('whatsapp', 'instagram', 'walkin', 'call', 'referral')),
  status text not null default 'new' check (status in ('new', 'contacted', 'test_drive', 'negotiating', 'closed_won', 'closed_lost')),
  assigned_to uuid references public.profiles(id) on delete set null,
  notes text,
  last_contacted timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deal_sheets (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  car_id uuid,
  car_snapshot jsonb not null,
  client_name text not null,
  price_usd numeric not null,
  exchange_rate numeric not null,
  price_ngn numeric not null,
  extras jsonb not null default '[]'::jsonb,
  total_usd numeric not null,
  total_ngn numeric not null,
  valid_hours int not null,
  generated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- key/value store; the app's upsert() calls rely on `key` being the conflict
-- target, which supabase-js defaults to the table's primary key.
create table if not exists public.settings (
  key text primary key,
  value text not null
);
