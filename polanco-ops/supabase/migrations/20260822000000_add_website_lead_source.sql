-- The Phase C showcase enquiry flow (POST /api/leads/create-from-showcase)
-- inserts leads with source = 'website', but leads_source_check was never
-- widened to allow it — every showcase enquiry insert has been failing with
-- a 23514 check-constraint violation since that flow shipped, so the lead
-- never reaches the Ops Hub pipeline even though the request succeeds up to
-- that point. Add 'website' alongside the existing manually-entered sources.
alter table public.leads drop constraint leads_source_check;
alter table public.leads add constraint leads_source_check
  check (source in ('whatsapp', 'instagram', 'walkin', 'call', 'referral', 'website'));
