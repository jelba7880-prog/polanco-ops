-- Soft-archive for deal sheets. deal_sheets is an audit trail and rows are
-- never hard-deleted; archived_at being NULL means the deal is active/visible
-- in the default /deals list, a timestamp means it's archived but still
-- fully intact and reachable via the Archived filter.
alter table public.deal_sheets
  add column archived_at timestamptz;
