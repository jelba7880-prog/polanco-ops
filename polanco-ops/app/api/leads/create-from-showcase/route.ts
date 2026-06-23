import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { normalizeNigerianPhone } from '@/lib/formatters'
import { checkRateLimit } from '@/lib/showcase/rateLimiter'

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
  if (normalizedPhone.replace(/\D/g, '').length < 10) {
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
  const { data: insertedRow, error } = await supabase
    .from('leads')
    .insert({
      name: sanitizedName,
      phone: normalizedPhone,
      car_interest,
      car_id,
      source: 'website',
      status: 'new',
    })
    .select('id')
    .single()

  // 5. Surface a write failure as a 500.
  if (error || !insertedRow) {
    console.error('Failed to create showcase lead:', error)
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
  }

  // 6. Success — the lead now exists in the pipeline.
  return NextResponse.json(
    { success: true, leadId: insertedRow.id },
    { status: 200 }
  )
}
