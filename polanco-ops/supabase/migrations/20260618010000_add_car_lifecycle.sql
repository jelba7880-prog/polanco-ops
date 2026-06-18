-- Three-state lifecycle for cars, replacing the old hard-delete. Rows are now
-- never physically removed by any app action: 'active' is the default and the
-- only state shown in the main Inventory list; 'archived' is the everyday
-- "removed from the active lot" state (recoverable from the Archived tab);
-- 'deleted' is the rarer, more serious state that hides the car everywhere in
-- the app while keeping the row intact in Postgres for manual recovery.
--
-- The existing car_images ON DELETE CASCADE FK is intentionally left untouched:
-- it's harmless and simply never triggers anymore through any app action, since
-- nothing here issues a real DELETE FROM cars.
alter table public.cars
  add column lifecycle_status text not null default 'active'
    check (lifecycle_status in ('active', 'archived', 'deleted')),
  add column lifecycle_changed_at timestamptz;
