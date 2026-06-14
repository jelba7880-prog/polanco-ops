import { normalizeNigerianPhone } from '@/lib/formatters'

// Generate WhatsApp deep link for manual tap (client-side)
export function generateWhatsAppLink(
  phone: string,
  name: string,
  carInterest?: string | null
): string {
  const normalized = normalizeNigerianPhone(phone)
  const e164 = normalized.replace('+', '')

  const carText = carInterest ? ` regarding the ${carInterest}` : ''
  const message = `Hi ${name}, following up on your enquiry${carText} at Polanco Exotic Cars. How can we assist you?`

  return `https://wa.me/${e164}?text=${encodeURIComponent(message)}`
}

// Server-side Twilio send (used in API routes only)
export async function sendWhatsAppNotification(
  to: string,
  message: string
): Promise<{ success: boolean; sid?: string; error?: string }> {
  try {
    const twilio = await import('twilio')
    const client = twilio.default(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    )

    const result = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM!,
      to: `whatsapp:${normalizeNigerianPhone(to)}`,
      body: message,
    })

    return { success: true, sid: result.sid }
  } catch (err) {
    console.error('Twilio send error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}
