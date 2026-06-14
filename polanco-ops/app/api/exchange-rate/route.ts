import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getExchangeRate } from '@/lib/exchangeRate'

export async function GET() {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await getExchangeRate()
    return NextResponse.json(result)
  } catch (err) {
    console.error('Exchange rate route error:', err)
    return NextResponse.json(
      { error: 'Failed to get exchange rate' },
      { status: 500 }
    )
  }
}
