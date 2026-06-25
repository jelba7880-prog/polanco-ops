-- Fix incorrect capitalisation in cars.make / cars.model entered prior to
-- this migration. Uses ILIKE so any capitalisation variant is caught, not
-- just the exact wrong forms seen in the data at the time of writing.
-- slug is intentionally left untouched: slugs are URL identifiers generated
-- at insert time and changing them would break existing links.

-- Fix Rolls-Royce
update public.cars set make = 'Rolls-Royce' where make ilike 'rolls-royce';

-- Fix Mercedes-AMG
update public.cars set make = 'Mercedes-AMG' where make ilike 'mercedes-amg';

-- Fix Aventador SVJ
update public.cars set model = regexp_replace(model, 'svj', 'SVJ', 'gi') where model ilike '%svj%';

-- Fix GT3 RS
update public.cars set model = regexp_replace(model, 'gt3 rs', 'GT3 RS', 'gi') where model ilike '%gt3 rs%';

-- Fix RX350
update public.cars set model = 'RX350' where model ilike 'rx350';

-- Fix LX700h
update public.cars set model = 'LX700h' where model ilike 'lx700h';
