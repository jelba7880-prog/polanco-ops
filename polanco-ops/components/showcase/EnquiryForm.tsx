'use client'

import { useState } from 'react'

// E.164 without the leading + (as wa.me deep links require). Hardcoded for
// Phase C — not read from settings yet.
const WHATSAPP_NUMBER = '2349115648723'

interface EnquiryFormProps {
  car: {
    id: string
    slug: string
    year: number
    make: string
    model: string
  }
}

type Status = 'idle' | 'submitting' | 'success' | 'error' | 'rate_limited'

export function EnquiryForm({ car }: EnquiryFormProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [nameError, setNameError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)

  const carName = `${car.year} ${car.make} ${car.model}`

  function buildWhatsAppUrl() {
    const message = `Hi, I'm interested in the ${carName} listed on your website. My name is ${name}.`
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // 1. Client-side validation — inline errors, no toast.
    let valid = true
    if (name.trim() === '') {
      setNameError('Please enter your name')
      valid = false
    } else {
      setNameError(null)
    }
    if (phone.trim() === '') {
      setPhoneError('Please enter your WhatsApp number')
      valid = false
    } else {
      setPhoneError(null)
    }
    if (!valid) return

    // Open the tab synchronously, in the same gesture as the tap — iOS Safari
    // blocks window.open() called after an await. Passing 'noopener' here
    // would make window.open() return null (that's the spec behavior), so we
    // couldn't navigate this handle once the fetch resolves — we'd be left
    // with a permanent about:blank tab. Sever window.opener manually instead
    // so we keep a usable reference without exposing it to the target page.
    const waWindow = window.open('', '_blank')
    if (waWindow) waWindow.opener = null

    // 2. Submit — create the lead before WhatsApp opens.
    setStatus('submitting')

    try {
      const res = await fetch('/api/leads/create-from-showcase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          car_id: car.id,
          car_interest: carName,
        }),
      })

      if (res.status === 429) {
        // Duplicate within the window — still let the visitor chat, just don't
        // create another lead.
        setStatus('rate_limited')
        if (waWindow) waWindow.location.href = buildWhatsAppUrl()
        return
      }

      if (!res.ok) {
        // Lead logging failed — don't block the buyer, WhatsApp is the
        // fallback capture path even when our own write failed.
        console.error('create-from-showcase failed:', res.status, await res.text().catch(() => ''))
        setStatus('error')
        if (waWindow) waWindow.location.href = buildWhatsAppUrl()
        return
      }

      setStatus('success')
      if (waWindow) waWindow.location.href = buildWhatsAppUrl()
    } catch (err) {
      console.error('create-from-showcase request failed:', err)
      setStatus('error')
      if (waWindow) waWindow.location.href = buildWhatsAppUrl()
    }
  }

  const isSubmitting = status === 'submitting'

  // After the lead is recorded (or skipped as a duplicate) we replace the form
  // with a confirmation that also offers a manual retry link, in case the
  // browser blocked the WhatsApp tab.
  if (status === 'success' || status === 'rate_limited') {
    return (
      <section>
        <h3 className="font-display text-[20px] text-ink">
          Enquire About This Vehicle
        </h3>
        <p className="font-inter text-[13px] text-ink-muted mt-1">
          {status === 'rate_limited'
            ? "You've already sent an enquiry for this car recently. Opening WhatsApp now…"
            : "Your enquiry has been sent. We've opened WhatsApp for you — if it didn't open, "}
          {status === 'success' && (
            <a
              href={buildWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold-text underline underline-offset-2"
            >
              tap here
            </a>
          )}
          {status === 'success' ? '.' : ''}
        </p>
        {status === 'rate_limited' && (
          <p className="font-inter text-[13px] text-ink-muted mt-2">
            If WhatsApp didn&apos;t open,{' '}
            <a
              href={buildWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold-text underline underline-offset-2"
            >
              tap here
            </a>
            .
          </p>
        )}
      </section>
    )
  }

  const inputBase =
    'w-full h-12 rounded-lg bg-base px-4 font-inter text-sm text-ink placeholder:text-ink-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:border-navy disabled:opacity-50 disabled:cursor-not-allowed'

  return (
    <section>
      <h3 className="font-display text-[20px] text-ink">
        Enquire About This Vehicle
      </h3>
      <p className="font-inter text-[13px] text-ink-muted mt-1 mb-5">
        We&apos;ll open WhatsApp for you. Leave your details so we can follow up.
      </p>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="enquiry-name"
            className="font-inter text-sm font-medium text-ink"
          >
            Your Name
          </label>
          <input
            id="enquiry-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tunde Obaseki"
            disabled={isSubmitting}
            className={`${inputBase} border ${
              nameError ? 'border-danger' : 'border-[var(--border-strong)]'
            }`}
          />
          {nameError && (
            <p className="font-inter text-[12px] text-danger">{nameError}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="enquiry-phone"
            className="font-inter text-sm font-medium text-ink"
          >
            WhatsApp Number
          </label>
          <input
            id="enquiry-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08012345678"
            disabled={isSubmitting}
            className={`${inputBase} border ${
              phoneError ? 'border-danger' : 'border-[var(--border-strong)]'
            }`}
          />
          {phoneError && (
            <p className="font-inter text-[12px] text-danger">{phoneError}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 rounded-lg bg-gold text-on-accent font-inter text-[15px] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Sending…' : 'Enquire via WhatsApp →'}
        </button>

        {status === 'error' && (
          <p className="font-inter text-[13px] text-ink-muted">
            We couldn&apos;t log your enquiry, but WhatsApp should have opened. If it didn&apos;t,{' '}
            <a
              href={buildWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold-text underline underline-offset-2"
            >
              Open WhatsApp
            </a>
          </p>
        )}
      </form>
    </section>
  )
}
