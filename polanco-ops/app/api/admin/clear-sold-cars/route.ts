import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createServiceClient } from '@/lib/supabase/service'

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000

function cutoffIso() {
  return new Date(Date.now() - NINETY_DAYS_MS).toISOString()
}

/**
 * Admin-only: clear sold cars older than 90 days.
 *
 * GET  → returns a live count of matching rows (drives the confirmation modal).
 * POST → hard-deletes them, returning how many were removed.
 *
 * "Older than 90 days" is scoped by `updated_at`, the only timestamp we have
 * that approximates when a car was marked sold. Note that updated_at moves on
 * ANY edit, so a dedicated `sold_at` column would be a more precise follow-up.
 *
 * Deletion relies on the database's foreign keys: car_images cascade-delete,
 * and deal_sheets.car_id is set NULL (deal sheets also keep their car_snapshot
 * jsonb), so deal sheet history survives the car row being removed.
 */
async function matchingQuery() {
  return createServiceClient()
    .from('cars')
    .select('id')
    .eq('status', 'sold')
    .lt('updated_at', cutoffIso())
}

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { data, error } = await (await matchingQuery())
  if (error) {
    return NextResponse.json(
      { error: 'Failed to count sold cars.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ count: data?.length ?? 0 })
}

export async function POST() {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const service = createServiceClient()
  const { data, error } = await service
    .from('cars')
    .delete()
    .eq('status', 'sold')
    .lt('updated_at', cutoffIso())
    .select('id')

  if (error) {
    return NextResponse.json(
      { error: 'Failed to clear sold cars.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ count: data?.length ?? 0 })
}
