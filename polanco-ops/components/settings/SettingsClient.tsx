'use client'

import { useState } from 'react'
import { RefreshCw, Save, Shield, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/formatters'
import type { Profile } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

interface SettingsClientProps {
  settings: Record<string, string>
  profiles: Profile[]
  currentUserId: string
}

export function SettingsClient({ settings, profiles, currentUserId }: SettingsClientProps) {
  const [exchangeRate, setExchangeRate] = useState(settings.exchange_rate_usd_ngn ?? '1580')
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsapp_number ?? '')
  const [businessName, setBusinessName] = useState(settings.business_name ?? '')
  const [businessAddress, setBusinessAddress] = useState(settings.business_address ?? '')
  const [validityHours, setValidityHours] = useState(settings.proforma_validity_hours ?? '48')
  const [twilioNumber, setTwilioNumber] = useState(settings.twilio_notify_number ?? '')

  const [savingBusiness, setSavingBusiness] = useState(false)
  const [savingRate, setSavingRate] = useState(false)
  const [fetchingRate, setFetchingRate] = useState(false)
  const [savedSection, setSavedSection] = useState<string | null>(null)

  const rateUpdatedAt = settings.exchange_rate_updated_at
    ? formatDate(settings.exchange_rate_updated_at)
    : 'Never'

  async function saveSettings(updates: Record<string, string>) {
    const supabase = createClient()
    const upserts = Object.entries(updates).map(([key, value]) => ({ key, value }))
    const { error } = await supabase.from('settings').upsert(upserts)
    if (error) throw error
  }

  async function handleSaveBusiness() {
    setSavingBusiness(true)
    try {
      await saveSettings({
        business_name: businessName,
        business_address: businessAddress,
        whatsapp_number: whatsappNumber,
        proforma_validity_hours: validityHours,
        twilio_notify_number: twilioNumber,
      })
      setSavedSection('business')
      setTimeout(() => setSavedSection(null), 2000)
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setSavingBusiness(false)
    }
  }

  async function handleSaveRate() {
    setSavingRate(true)
    try {
      await saveSettings({
        exchange_rate_usd_ngn: exchangeRate,
        exchange_rate_updated_at: new Date().toISOString(),
      })
      setSavedSection('rate')
      setTimeout(() => setSavedSection(null), 2000)
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setSavingRate(false)
    }
  }

  async function handleFetchLiveRate() {
    setFetchingRate(true)
    try {
      const res = await fetch('/api/exchange-rate')
      if (!res.ok) throw new Error('Failed to fetch')
      const { rate } = await res.json()
      setExchangeRate(String(rate))
      await saveSettings({
        exchange_rate_usd_ngn: String(rate),
        exchange_rate_updated_at: new Date().toISOString(),
      })
      setSavedSection('rate')
      setTimeout(() => setSavedSection(null), 2000)
    } catch (err) {
      console.error('Fetch rate failed:', err)
    } finally {
      setFetchingRate(false)
    }
  }

  async function handleToggleRole(profileId: string, currentRole: string) {
    if (profileId === currentUserId) return // cannot change own role
    const newRole = currentRole === 'admin' ? 'staff' : 'admin'
    const supabase = createClient()
    await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', profileId)
    // Refresh page to show updated roles
    window.location.reload()
  }

  return (
    <div className="px-4 py-6 pb-8 flex flex-col gap-6 max-w-lg mx-auto">

      {/* Exchange Rate */}
      <section className="bg-white rounded-xl border border-[var(--border)] p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="font-inter text-sm font-semibold text-ink">Exchange Rate</p>
          <p className="font-inter text-xs text-ink-muted">Updated {rateUpdatedAt}</p>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1">
            <Input
              label="₦ per US$1"
              type="number"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1 gap-2 text-xs"
            onClick={handleFetchLiveRate}
            loading={fetchingRate}
          >
            <RefreshCw size={14} />
            Fetch Live Rate
          </Button>
          <Button
            className="flex-1 gap-2 text-xs"
            onClick={handleSaveRate}
            loading={savingRate}
          >
            <Save size={14} />
            {savedSection === 'rate' ? 'Saved ✓' : 'Save Rate'}
          </Button>
        </div>
      </section>

      {/* Business Info */}
      <section className="bg-white rounded-xl border border-[var(--border)] p-4">
        <p className="font-inter text-sm font-semibold text-ink mb-4">Business Info</p>

        <div className="flex flex-col gap-3">
          <Input
            label="Business Name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
          />
          <Input
            label="Business Address"
            value={businessAddress}
            onChange={(e) => setBusinessAddress(e.target.value)}
          />
          <Input
            label="WhatsApp Number (for notifications)"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="+2349115648723"
          />
          <Input
            label="Proforma Validity (hours)"
            type="number"
            value={validityHours}
            onChange={(e) => setValidityHours(e.target.value)}
          />
          <Input
            label="Twilio Notify Number"
            value={twilioNumber}
            onChange={(e) => setTwilioNumber(e.target.value)}
            placeholder="+234XXXXXXXXXX"
          />
        </div>

        <Button
          className="w-full mt-4 gap-2"
          onClick={handleSaveBusiness}
          loading={savingBusiness}
        >
          <Save size={14} />
          {savedSection === 'business' ? 'Saved ✓' : 'Save Business Info'}
        </Button>
      </section>

      {/* Staff */}
      <section className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <p className="font-inter text-sm font-semibold text-ink">Staff Accounts</p>
        </div>

        {profiles.map((profile, i) => (
          <div
            key={profile.id}
            className={cn(
              'flex items-center justify-between px-4 py-3',
              i < profiles.length - 1 ? 'border-b border-[var(--border)]' : ''
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center">
                <User size={14} className="text-ink-muted" />
              </div>
              <div>
                <p className="font-inter text-sm font-medium text-ink">{profile.full_name}</p>
                <p className="font-inter text-xs text-ink-muted">
                  {profile.role === 'admin' ? 'Admin' : 'Staff'} · Joined {formatDate(profile.created_at)}
                </p>
              </div>
            </div>

            {profile.id !== currentUserId && (
              <button
                onClick={() => handleToggleRole(profile.id, profile.role)}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-inter font-medium border transition-colors',
                  profile.role === 'admin'
                    ? 'bg-navy-tint text-navy border-navy/20'
                    : 'bg-surface-muted text-ink-muted border-[var(--border)]'
                )}
              >
                <Shield size={10} />
                {profile.role === 'admin' ? 'Admin' : 'Staff'}
              </button>
            )}

            {profile.id === currentUserId && (
              <span className="font-inter text-[10px] text-ink-muted">(you)</span>
            )}
          </div>
        ))}
      </section>

    </div>
  )
}
