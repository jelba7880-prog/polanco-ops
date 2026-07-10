-- Per-car public-visibility opt-out. Every car is public by default; a staff
-- member can hide an individual car from the public showcase without changing
-- how it is seen or managed inside the authenticated Ops Hub.
--
-- is_public is a SEPARATE dimension from the pre-existing columns and must not
-- be conflated with them: lifecycle_status governs active/archived/deleted
-- across the whole app, status governs the sales state (available/sold/…), and
-- is_public ONLY ever gates the public showcase view recreated below.

-- NOT NULL DEFAULT true backfills every existing row to true in the same
-- statement, so nothing currently on the showcase disappears when this ships.
alter table public.cars
  add column is_public boolean not null default true;

-- Recreate the public listing view to ALSO require is_public = true, alongside
-- the existing status/lifecycle conditions (left unchanged). The column list is
-- byte-for-byte identical to the original view — is_public is used only in the
-- WHERE, never exposed — so CREATE OR REPLACE is valid, the security_invoker =
-- false owner-privilege model is preserved, and the existing grant to anon
-- survives. public_car_images_view is intentionally left untouched: a hidden
-- car never resolves through public_cars_view, so its images are never queried.
create or replace view public.public_cars_view
with (security_invoker = false) as
select
  id,
  slug,
  make,
  model,
  year,
  body_type,
  color_exterior,
  color_interior,
  mileage_km,
  condition,
  transmission,
  fuel_type,
  engine_cc,
  horsepower,
  price_usd,
  status,
  created_at
from public.cars
where status != 'sold'
  and lifecycle_status = 'active'
  and is_public = true;

-- Idempotent. CREATE OR REPLACE already preserves the existing grant; re-stated
-- so this migration is self-contained and the anon read surface stays explicit.
grant select on public.public_cars_view to anon;
