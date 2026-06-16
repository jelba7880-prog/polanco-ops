'use client'

import { useState } from 'react'
import {
  RefreshCw,
  Save,
  Shield,
  User,
  UserPlus,
  UserX,
  UserCheck,
  Trash2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { formatDate } from '@/lib/formatters'
import type { StaffMember } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

interface SettingsClientProps {
  settings: Record<string, string>
  staff: StaffMember[]
  currentUserId: string
}

export function SettingsClient({ settings, staff, currentUserId }: SettingsClientProps) {
  const [exchangeRate, setExchangeRate] = useState(settings.exchange_rate_usd_ngn ?? '1580')
  const [rateUpdatedAtValue, setRateUpdatedAtValue] = useState(settings.exchange_rate_updated_at ?? '')
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsapp_number ?? '')
  const [businessName, setBusinessName] = useState(settings.business_name ?? '')
  const [businessAddress, setBusinessAddress] = useState(settings.business_address ?? '')
  const [validityHours, setValidityHours] = useState(settings.proforma_validity_hours ?? '48')
  const [twilioNumber, setTwilioNumber] = useState(settings.twilio_notify_number ?? '')

  const [savingBusiness, setSavingBusiness] = useState(false)
  const [savingRate, setSavingRate] = useState(false)
  const [fetchingRate, setFetchingRate] = useState(false)
  const [savedSection, setSavedSection] = useState<string | null>(null)

  // Invite staff
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviting, setInviting] = useState(false)

  // Deactivate / reactivate confirmation
  const [statusTarget, setStatusTarget] = useState<{
    member: StaffMember
    action: 'deactivate' | 'reactivate'
  } | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  // Clear sold cars
  const [clearOpen, setClearOpen] = useState(false)
  const [clearCount, setClearCount] = useState<number | null>(null)
  const [clearing, setClearing] = useState(false)

  const showToast = useToast()

  const rateUpdatedAt = rateUpdatedAtValue ? formatDate(rateUpdatedAtValue) : 'Never'

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
      showToast('Business info saved', 'success')
    } catch (err) {
      console.error('Save failed:', err)
      showToast('Failed to save. Please try again.', 'error')
    } finally {
      setSavingBusiness(false)
    }
  }

  async function handleSaveRate() {
    setSavingRate(true)
    try {
      const updatedAt = new Date().toISOString()
      await saveSettings({
        exchange_rate_usd_ngn: exchangeRate,
        exchange_rate_updated_at: updatedAt,
      })
      setRateUpdatedAtValue(updatedAt)
      setSavedSection('rate')
      setTimeout(() => setSavedSection(null), 2000)
      showToast('Exchange rate saved', 'success')
    } catch (err) {
      console.error('Save failed:', err)
      showToast('Failed to save. Please try again.', 'error')
    } finally {
      setSavingRate(false)
    }
  }

  async function handleFetchLiveRate() {
    setFetchingRate(true)
    try {
      const res = await fetch('/api/exchange-rate')
      if (!res.ok) throw new Error('Failed to fetch')
      const { rate, updatedAt } = await res.json()
      // The API route persists the fetched rate to the settings table —
      // no separate client-side write is needed (and would race with it).
      setExchangeRate(String(rate))
      setRateUpdatedAtValue(updatedAt)
      setSavedSection('rate')
      setTimeout(() => setSavedSection(null), 2000)
      showToast('Live rate updated', 'success')
    } catch (err) {
      console.error('Fetch rate failed:', err)
      showToast('Failed to fetch live rate.', 'error')
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

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    try {
      const res = await fetch('/api/admin/invite-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, full_name: inviteName }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        showToast(data.error ?? 'Failed to send invitation.', 'error')
        return
      }
      showToast('Invitation sent', 'success')
      // Reload so the new (pending) staff row appears in the list.
      window.location.reload()
    } catch (err) {
      console.error('Invite failed:', err)
      showToast('Failed to send invitation.', 'error')
    } finally {
      setInviting(false)
    }
  }

  async function handleConfirmStatus() {
    if (!statusTarget) return
    setUpdatingStatus(true)
    try {
      const res = await fetch('/api/admin/staff-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: statusTarget.member.id,
          action: statusTarget.action,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        showToast(data.error ?? 'Failed to update account.', 'error')
        return
      }
      showToast(
        statusTarget.action === 'reactivate'
          ? 'Account reactivated'
          : 'Account deactivated',
        'success'
      )
      window.location.reload()
    } catch (err) {
      console.error('Status update failed:', err)
      showToast('Failed to update account.', 'error')
    } finally {
      setUpdatingStatus(false)
    }
  }

  async function openClearModal() {
    setClearOpen(true)
    setClearCount(null)
    try {
      const res = await fetch('/api/admin/clear-sold-cars')
      if (!res.ok) throw new Error('Failed to count')
      const { count } = await res.json()
      setClearCount(count)
    } catch (err) {
      console.error('Count sold cars failed:', err)
      showToast('Failed to load count.', 'error')
      setClearOpen(false)
    }
  }

  async function handleClearSold() {
    setClearing(true)
    try {
      const res = await fetch('/api/admin/clear-sold-cars', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        showToast(data.error ?? 'Failed to clear sold cars.', 'error')
        return
      }
      const count = data.count ?? 0
      showToast(
        count === 1
          ? '1 sold car older than 90 days was cleared'
          : `${count} sold cars older than 90 days were cleared`,
        'success'
      )
      setClearOpen(false)
    } catch (err) {
      console.error('Clear sold cars failed:', err)
      showToast('Failed to clear sold cars.', 'error')
    } finally {
      setClearing(false)
    }
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
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <p className="font-inter text-sm font-semibold text-ink">Staff Accounts</p>
          <Button
            variant="secondary"
            className="min-h-0 h-8 px-3 gap-1.5 text-xs"
            onClick={() => setInviteOpen(true)}
          >
            <UserPlus size={14} />
            Invite Staff
          </Button>
        </div>

        {staff.map((member, i) => {
          const isSelf = member.id === currentUserId
          const isDeactivated = member.status === 'deactivated'
          const isPending = member.status === 'pending'

          return (
            <div
              key={member.id}
              className={cn(
                'flex items-center justify-between px-4 py-3 gap-2',
                i < staff.length - 1 ? 'border-b border-[var(--border)]' : ''
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center shrink-0">
                  <User size={14} className="text-ink-muted" />
                </div>
                <div className="min-w-0">
                  <p className="font-inter text-sm font-medium text-ink truncate">
                    {member.full_name}
                  </p>
                  <p className="font-inter text-xs text-ink-muted truncate">
                    {member.email ?? (member.role === 'admin' ? 'Admin' : 'Staff')}
                    {' · '}
                    Joined {formatDate(member.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {isPending && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-inter font-medium bg-warning/10 text-warning border border-warning/20">
                    Pending
                  </span>
                )}
                {isDeactivated && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-inter font-medium bg-surface-muted text-ink-muted border border-[var(--border)]">
                    Deactivated
                  </span>
                )}

                {/* Role: interactive toggle for others, static label for self/deactivated */}
                {isSelf ? (
                  <span className="font-inter text-[10px] text-ink-muted">(you)</span>
                ) : isDeactivated ? null : (
                  <button
                    onClick={() => handleToggleRole(member.id, member.role)}
                    className={cn(
                      'flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-inter font-medium border transition-all duration-150 ease-out active:scale-[0.97]',
                      member.role === 'admin'
                        ? 'bg-navy-tint text-navy border-navy/20'
                        : 'bg-surface-muted text-ink-muted border-[var(--border)]'
                    )}
                  >
                    <Shield size={10} />
                    {member.role === 'admin' ? 'Admin' : 'Staff'}
                  </button>
                )}

                {/* Deactivate / reactivate — never on your own row */}
                {!isSelf && (
                  <button
                    onClick={() =>
                      setStatusTarget({
                        member,
                        action: isDeactivated ? 'reactivate' : 'deactivate',
                      })
                    }
                    aria-label={
                      isDeactivated ? 'Reactivate account' : 'Deactivate account'
                    }
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-150 ease-out active:scale-[0.97]',
                      isDeactivated
                        ? 'text-success border-success/30 hover:bg-success/10'
                        : 'text-danger border-danger/30 hover:bg-danger/10'
                    )}
                  >
                    {isDeactivated ? <UserCheck size={14} /> : <UserX size={14} />}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </section>

      {/* Data utilities */}
      <section className="bg-white rounded-xl border border-[var(--border)] p-4">
        <p className="font-inter text-sm font-semibold text-ink mb-1">Data Utilities</p>
        <p className="font-inter text-xs text-ink-muted mb-4">
          Permanently remove old sold inventory. Deal sheets that reference these
          cars are preserved.
        </p>
        <Button
          variant="destructive"
          className="w-full gap-2"
          onClick={openClearModal}
        >
          <Trash2 size={16} />
          Clear sold cars older than 90 days
        </Button>
      </section>

      {/* Invite staff modal */}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite Staff">
        <form onSubmit={handleInvite} className="flex flex-col gap-3">
          <Input
            label="Email address"
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="name@example.com"
          />
          <Input
            label="Full name (optional)"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            placeholder="Jane Doe"
          />
          <p className="font-inter text-xs text-ink-muted">
            They&apos;ll receive an email invitation to set a password and join as
            Staff. You can promote them to Admin afterwards.
          </p>
          <div className="flex gap-3 mt-1">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setInviteOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={inviting}>
              Send Invite
            </Button>
          </div>
        </form>
      </Modal>

      {/* Deactivate / reactivate confirmation modal */}
      <Modal
        open={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        title={
          statusTarget?.action === 'reactivate'
            ? 'Reactivate Account'
            : 'Deactivate Account'
        }
      >
        {statusTarget && (
          <>
            <p className="font-inter text-sm text-ink-soft mb-6">
              {statusTarget.action === 'reactivate' ? (
                <>
                  Reactivate <span className="font-medium text-ink">{statusTarget.member.full_name}</span>?
                  They&apos;ll be able to sign in again.
                </>
              ) : (
                <>
                  Deactivate <span className="font-medium text-ink">{statusTarget.member.full_name}</span>?
                  They&apos;ll no longer be able to sign in. Their leads and deal
                  sheets are kept, and you can reactivate them later.
                </>
              )}
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setStatusTarget(null)}
              >
                Cancel
              </Button>
              <Button
                variant={statusTarget.action === 'reactivate' ? 'primary' : 'destructive'}
                className="flex-1"
                onClick={handleConfirmStatus}
                loading={updatingStatus}
              >
                {statusTarget.action === 'reactivate' ? 'Reactivate' : 'Deactivate'}
              </Button>
            </div>
          </>
        )}
      </Modal>

      {/* Clear sold cars confirmation modal */}
      <Modal
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        title="Clear Sold Cars"
      >
        <p className="font-inter text-sm text-ink-soft mb-6">
          {clearCount === null ? (
            'Checking how many records match…'
          ) : clearCount === 0 ? (
            'There are no sold cars older than 90 days to clear.'
          ) : (
            <>
              This will permanently delete{' '}
              <span className="font-medium text-ink">
                {clearCount} sold {clearCount === 1 ? 'car' : 'cars'}
              </span>{' '}
              last updated more than 90 days ago, along with their photos. Deal
              sheets that reference them are preserved. This cannot be undone.
            </>
          )}
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setClearOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={handleClearSold}
            loading={clearing}
            disabled={clearCount === null || clearCount === 0}
          >
            Clear
          </Button>
        </div>
      </Modal>

    </div>
  )
}
