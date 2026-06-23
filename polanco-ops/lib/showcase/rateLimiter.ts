import { createServiceClient } from '@/lib/supabase/service'
import { normalizeNigerianPhone } from '@/lib/formatters'

// DB-backed rate limiter for the public showcase enquiry endpoint. No Redis or
// external service — it reuses the existing `leads` table to spot a recent
// submission from the same number. One enquiry per normalized phone per 5
// minutes: enough to stop accidental double-taps and spam, permissive enough
// that a real buyer who mistyped their number and retries isn't locked out.
const WINDOW_SECONDS = 300

export async function checkRateLimit(
  phone: string
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const normalizedPhone = normalizeNigerianPhone(phone)
  const windowStart = new Date(Date.now() - WINDOW_SECONDS * 1000).toISOString()

  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('leads')
      .select('id')
      .eq('phone', normalizedPhone)
      .eq('source', 'website')
      .gt('created_at', windowStart)
      .limit(1)

    // Fail open: a rate-limiter failure must never block a genuine enquiry.
    if (error) {
      console.error('Rate limiter query failed (failing open):', error)
      return { allowed: true }
    }

    if (data && data.length > 0) {
      return { allowed: false, retryAfterSeconds: WINDOW_SECONDS }
    }

    return { allowed: true }
  } catch (err) {
    console.error('Rate limiter error (failing open):', err)
    return { allowed: true }
  }
}
