-- Public showcase views. These are the only surface the `anon` role can read:
-- column-level filtering can't be done with RLS on cars/car_images directly
-- (RLS filters rows, not columns), so internal-only columns (notes,
-- reserved_for, added_by) are excluded by the view's column list instead.
-- security_invoker = false means these run as the view owner, so anon never
-- needs (and never gets) direct grants on the base tables.

create view public.public_cars_view
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
  and lifecycle_status = 'active';

create view public.public_car_images_view
with (security_invoker = false) as
select
  id,
  car_id,
  url,
  sort_order,
  is_cover
from public.car_images;

grant select on public.public_cars_view to anon;
grant select on public.public_car_images_view to anon;
