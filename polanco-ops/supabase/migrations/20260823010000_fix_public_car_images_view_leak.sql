-- public_car_images_view (added in 20260623000000_add_public_showcase_views.sql)
-- has never filtered anything: it selects every row of car_images with no
-- WHERE clause, runs security_invoker = false (owner privileges, bypassing
-- RLS), and is granted to anon. public_cars_view filters on status,
-- lifecycle_status and is_public — the images view filters on none of them.
--
-- 20260709000000_add_car_is_public.sql reasoned that this was safe because
-- "a hidden car never resolves through public_cars_view, so its images are
-- never queried" — true for the app's own join, but anon holds SELECT on
-- public_car_images_view directly and can query it on its own, independent
-- of public_cars_view. Anyone with the anon key (shipped in every public
-- page's JS bundle) can read image URLs for sold, archived, deleted, and
-- explicitly-hidden cars.
--
-- Fix: join to cars and apply the identical visibility predicate
-- public_cars_view uses. The predicate is defined once, in
-- car_is_publicly_visible below, and both views call it — so they cannot
-- drift apart the way they already have.

create or replace function public.car_is_publicly_visible(c public.cars)
returns boolean
language sql
immutable
as $$
  select c.status != 'sold'
    and c.lifecycle_status = 'active'
    and c.is_public = true
$$;

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
from public.cars c
where public.car_is_publicly_visible(c);

-- Column list is unchanged from the original view (id, car_id, url,
-- sort_order, is_cover) — only the join and predicate are new.
create or replace view public.public_car_images_view
with (security_invoker = false) as
select
  ci.id,
  ci.car_id,
  ci.url,
  ci.sort_order,
  ci.is_cover
from public.car_images ci
join public.cars c on c.id = ci.car_id
where public.car_is_publicly_visible(c);

-- Idempotent. CREATE OR REPLACE already preserves both existing grants;
-- re-stated so this migration is self-contained.
grant select on public.public_cars_view to anon;
grant select on public.public_car_images_view to anon;
