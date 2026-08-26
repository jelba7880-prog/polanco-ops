import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createServiceClient } from '@/lib/supabase/service'
import { normalizeNigerianPhone, isPlausiblePhoneNumber } from '@/lib/formatters'
import { checkRateLimit } from '@/lib/showcase/rateLimiter'

// Postgres error codes that mean "car_id itself is the problem" rather than
// a real write failure: 22P02 is invalid UUID syntax (a malformed value),
// 23503 is a foreign-key violation (car_id pointing at a row that no longer
// exists). Either way the visitor's name and phone are still good — losing
// the whole lead over a stale/bad car reference is worse than saving it
// without one.
const CAR_ID_ERROR_CODES = new Set(['22P02', '23503'])

// Public, unauthenticated lead-capture endpoint for the showcase enquiry flow.
// This is the only unauthenticated write in the system, so it is locked down:
// service-role key stays server-side, the body is validated, and a rate limiter
// runs before anything touches the database. The lead must be created here
// FIRST so it is never lost if the visitor leaves once WhatsApp opens.
export async function POST(request: NextRequest) {
  // 1. Parse + validate the body.
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { name, phone, car_id, car_interest } = (body ?? {}) as Record<
    string,
    unknown
  >

  const isNonEmptyString = (v: unknown): v is string =>
    typeof v === 'string' && v.trim() !== ''

  if (
    !isNonEmptyString(phone) ||
    !isNonEmptyString(car_id) ||
    !isNonEmptyString(car_interest)
  ) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const sanitizedName = isNonEmptyString(name) ? name.trim() : 'Website Enquiry'

  // 2. Normalize the phone number and reject anything too short to be real.
  const normalizedPhone = normalizeNigerianPhone(phone)
  if (!isPlausiblePhoneNumber(normalizedPhone)) {
    return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
  }

  // 3. Rate limit before the write.
  const rate = await checkRateLimit(phone)
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: 'Too many requests. Please wait before submitting again.',
        retryAfterSeconds: rate.retryAfterSeconds,
      },
      { status: 429 }
    )
  }

  // 4. Insert the lead with the service-role client (bypasses RLS).
  const supabase = createServiceClient()
  const leadBase = {
    name: sanitizedName,
    phone: normalizedPhone,
    car_interest,
    source: 'website' as const,
    status: 'new' as const,
  }

  let { data: insertedRow, error } = await supabase
    .from('leads')
    .insert({ ...leadBase, car_id })
    .select('id')
    .single()

  // 4b. car_id was never validated as a real, existing UUID above — if it's
  // malformed or points at a car that's gone, retry once without it rather
  // than dropping a visitor who filled out the form correctly.
  if (error && CAR_ID_ERROR_CODES.has(error.code)) {
    console.error('Showcase lead car_id rejected, retrying without it:', error)
    Sentry.captureMessage('Showcase lead car_id rejected, retried without it', {
      level: 'warning',
      extra: { car_id, code: error.code },
    })
    ;({ data: insertedRow, error } = await supabase
      .from('leads')
      .insert({ ...leadBase, car_id: null })
      .select('id')
      .single())
  }

  // 5. Surface a write failure as a 500.
  if (error || !insertedRow) {
    console.error('Failed to create showcase lead:', error)
    Sentry.captureException(error ?? new Error('Failed to create showcase lead: no row returned'))
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
  }

  // 6. Success — the lead now exists in the pipeline.
  return NextResponse.json(
    { success: true, leadId: insertedRow.id },
    { status: 200 }
  )
}
