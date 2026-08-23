-- Replaces the insert-car -> insert-images -> compensating-delete pattern in
-- hooks/useCars.ts's useCreateCar with a single atomic write. That pattern had
-- three holes: the compensating DELETE's error was discarded (so if RLS denies
-- staff a DELETE on `cars`, a photo-less car silently survives while the user
-- is told creation failed); it ran in the browser, so a closed tab or dropped
-- connection between the two inserts left no rollback at all; and it wasn't
-- actually atomic even when it worked — there's a real window where the car
-- exists with zero images.
--
-- A Postgres function executes inside a single implicit transaction, so
-- raising an exception from the image insert automatically rolls back the
-- car insert too — no manual transaction control, no compensating delete, no
-- discarded error to hide a partial write.
--
-- SECURITY INVOKER (not DEFINER): this must run with the calling user's own
-- privileges, so it is bound by exactly the same RLS policies that would
-- apply to two separate inserts. It grants no additional access — a staff
-- member who couldn't insert into `cars`/`car_images` directly still can't
-- through this function.
create or replace function public.create_car_with_images(
  car jsonb,
  images jsonb default '[]'::jsonb
)
returns public.cars
language plpgsql
security invoker
set search_path = public
as $$
declare
  new_car public.cars;
begin
  insert into public.cars (
    make, model, year, body_type, color_exterior, color_interior,
    mileage_km, condition, transmission, fuel_type, engine_cc, horsepower,
    price_usd, status, reserved_for, notes, is_public, slug, added_by
  )
  values (
    car->>'make',
    car->>'model',
    (car->>'year')::int,
    car->>'body_type',
    car->>'color_exterior',
    car->>'color_interior',
    coalesce((car->>'mileage_km')::int, 0),
    car->>'condition',
    car->>'transmission',
    car->>'fuel_type',
    (car->>'engine_cc')::int,
    (car->>'horsepower')::int,
    (car->>'price_usd')::numeric,
    coalesce(car->>'status', 'available'),
    car->>'reserved_for',
    car->>'notes',
    coalesce((car->>'is_public')::boolean, true),
    car->>'slug',
    nullif(car->>'added_by', '')::uuid
  )
  returning * into new_car;

  if jsonb_array_length(images) > 0 then
    insert into public.car_images (car_id, url, sort_order, is_cover)
    select
      new_car.id,
      img->>'url',
      (img->>'sort_order')::int,
      coalesce((img->>'is_cover')::boolean, false)
    from jsonb_array_elements(images) as img;
  end if;

  return new_car;
end;
$$;

-- Callable by any signed-in staff member — RLS on the two tables inside the
-- function body is what actually restricts who can succeed, exactly as it
-- did for the two separate inserts this replaces.
grant execute on function public.create_car_with_images(jsonb, jsonb) to authenticated;
