import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWhatsAppNotification } from '@/lib/whatsapp'
import { leadSchema } from '@/lib/validations/lead.schema'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()

    // Validate with Zod (applies phone normalization)
    const parsed = leadSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const values = parsed.data

    // Create the lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        ...values,
        email: values.email || null,
        assigned_to: values.assigned_to || null,
        last_contacted: new Date().toISOString(),
      })
      .select()
      .single()

    if (leadError) throw leadError

    // NOTE: Twilio Sandbox requires recipient phones to opt in first.
    // Each test number must send "join [keyword]" to whatsapp:+14155238886.
    // In production with an approved WhatsApp Business API number, this is not required.

    // Fire notifications — never let this block the response
    try {
      // Get settings for Bash's number
      const { data: settings } = await supabase
        .from('settings')
        .select('key, value')

      const settingsMap = Object.fromEntries(
        (settings ?? []).map((s) => [s.key, s.value])
      )

      const bashNumber = settingsMap.whatsapp_number
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

      const carText = values.car_interest ? ` (${values.car_interest})` : ''
      const message = `🚗 New lead at Polanco:\n\n*${values.name}*${carText}\n📞 ${values.phone}\nSource: ${values.source}\n\n${appUrl}/leads/${lead.id}`

      // Notify Bash
      if (bashNumber) {
        await sendWhatsAppNotification(bashNumber, message)
      }

      // Notify assigned rep (if different from Bash's number)
      if (values.assigned_to) {
        const { data: assignedProfile } = await supabase
          .from('profiles')
          .select('phone')
          .eq('id', values.assigned_to)
          .single()

        if (assignedProfile?.phone && assignedProfile.phone !== bashNumber) {
          await sendWhatsAppNotification(assignedProfile.phone, message)
        }
      }
    } catch (notifyError) {
      // Log but don't fail — lead is already saved
      console.error('Notification failed (lead still saved):', notifyError)
    }

    return NextResponse.json({ lead }, { status: 201 })
  } catch (err) {
    console.error('Create lead error:', err)
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    )
  }
}
