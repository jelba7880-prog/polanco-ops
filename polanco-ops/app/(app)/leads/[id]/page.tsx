'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useLead, useUpdateLeadStatus, useUpdateLead } from '@/hooks/useLeads'
import { WhatsAppButton } from '@/components/leads/WhatsAppButton'
import { Button } from '@/components/ui/Button'
import { formatDateTime, formatRelativeDate, formatPhoneDisplay, toDisplayCase } from '@/lib/formatters'
import type { LeadSource, LeadStatus } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS: { value: LeadStatus; label: string; colorClass: string }[] = [
  { value: 'new', label: 'New', colorClass: 'bg-navy-tint text-navy' },
  { value: 'contacted', label: 'Contacted', colorClass: 'bg-gold-tint text-gold-deep' },
  { value: 'test_drive', label: 'Test Drive', colorClass: 'bg-purple-50 text-purple-600' },
  { value: 'negotiating', label: 'Negotiating', colorClass: 'bg-warning-tint text-warning' },
  { value: 'closed_won', label: 'Closed Won', colorClass: 'bg-success-tint text-success' },
  { value: 'closed_lost', label: 'Closed Lost', colorClass: 'bg-neutral-tint text-neutral-tag' },
]

const SOURCE_LABELS: Record<LeadSource, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  walkin: 'Walk-in',
  call: 'Phone Call',
  referral: 'Referral',
}

interface NoteEntry {
  text: string
  created_at: string
}

function parseNotes(raw: string | null, fallbackDate: string): NoteEntry[] {
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed as NoteEntry[]
  } catch {
    // legacy plain-text notes — show as a single entry
  }

  return [{ text: raw, created_at: fallbackDate }]
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: lead, isLoading, error } = useLead(id)
  const updateStatus = useUpdateLeadStatus()
  const updateLead = useUpdateLead()

  const [optimisticStatus, setOptimisticStatus] = useState<LeadStatus | null>(null)
  const [noteText, setNoteText] = useState('')

  if (isLoading) {
    return (
      <div className="px-4 py-6">
        <div className="h-6 bg-surface-muted rounded-lg animate-pulse mb-4 w-1/3" />
        <div className="h-32 bg-surface-muted rounded-xl animate-pulse mb-4" />
        <div className="h-24 bg-surface-muted rounded-xl animate-pulse" />
      </div>
    )
  }

  if (error || !lead) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-sm text-danger font-inter mb-4">Lead not found.</p>
        <button
          onClick={() => router.back()}
          className="text-sm text-navy font-inter underline transition-all duration-150 ease-out active:scale-[0.97]"
        >
          Go back
        </button>
      </div>
    )
  }

  const currentLead = lead
  const currentStatus = optimisticStatus ?? currentLead.status
  const notes = parseNotes(currentLead.notes, currentLead.created_at)

  async function handleStatusChange(status: LeadStatus) {
    if (status === currentStatus) return

    const previousStatus = currentStatus
    setOptimisticStatus(status)

    try {
      await updateStatus.mutateAsync({ id: currentLead.id, status })
    } catch {
      setOptimisticStatus(previousStatus)
    }
  }

  async function handleAddNote() {
    const text = noteText.trim()
    if (!text) return

    const entry: NoteEntry = { text, created_at: new Date().toISOString() }
    const updatedNotes = [entry, ...notes]

    try {
      await updateLead.mutateAsync({
        id: currentLead.id,
        values: { notes: JSON.stringify(updatedNotes) },
      })
      setNoteText('')
    } catch {
      // error surfaced via updateLead.isError below
    }
  }

  return (
    <div className="px-4 py-6 pb-8">
      {/* Back button */}
      <button
        onClick={() => router.push('/leads')}
        className="flex items-center gap-1.5 text-sm text-ink-muted font-inter hover:text-ink transition-all duration-150 ease-out active:scale-[0.97] min-h-[44px] mb-2"
      >
        <ArrowLeft size={16} />
        Leads
      </button>

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink leading-tight mb-1">
          {currentLead.name}
        </h1>
        <p className="font-inter text-sm text-ink-muted mb-4">
          {formatPhoneDisplay(currentLead.phone)}
          {currentLead.email && <> · {currentLead.email}</>}
        </p>

        <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden mb-4">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <span className="font-inter text-sm text-ink-muted">Car Interest</span>
            <span className="font-inter text-sm font-medium text-ink text-right">
              {toDisplayCase(currentLead.car_interest) || '—'}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <span className="font-inter text-sm text-ink-muted">Source</span>
            <span className="font-inter text-sm font-medium text-ink">
              {SOURCE_LABELS[currentLead.source]}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="font-inter text-sm text-ink-muted">Assigned To</span>
            <span className="font-inter text-sm font-medium text-ink">
              {currentLead.profiles?.full_name ?? 'Unassigned'}
            </span>
          </div>
        </div>

        <WhatsAppButton
          phone={currentLead.phone}
          message={`Hi ${currentLead.name}, this is Polanco Motors${
            currentLead.car_interest ? ` regarding the ${toDisplayCase(currentLead.car_interest)}` : ' regarding your enquiry'
          }.`}
          className="w-full"
        />
      </div>

      {/* Status selector */}
      <div className="mb-6">
        <p className="font-inter text-xs font-medium text-ink-muted mb-2 uppercase tracking-wide">
          Status
        </p>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((option) => {
            const isActive = currentStatus === option.value

            return (
              <button
                key={option.value}
                onClick={() => handleStatusChange(option.value)}
                disabled={updateStatus.isPending}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-inter font-medium transition-all duration-150 ease-out active:scale-[0.97] disabled:opacity-50',
                  isActive ? option.colorClass : 'bg-surface-muted text-ink-muted'
                )}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Notes timeline */}
      <div className="mb-6">
        <p className="font-inter text-xs font-medium text-ink-muted mb-2 uppercase tracking-wide">
          Notes
        </p>

        <div className="flex flex-col gap-2 mb-4">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add a note..."
            rows={3}
            className="w-full px-4 py-3 rounded-lg border border-[var(--border-strong)] bg-white font-inter text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-navy resize-none"
          />

          {updateLead.isError && (
            <p className="text-sm text-danger font-inter">
              Failed to save note. Please try again.
            </p>
          )}

          <Button
            onClick={handleAddNote}
            loading={updateLead.isPending}
            disabled={!noteText.trim()}
            className="self-end"
          >
            Add Note
          </Button>
        </div>

        {notes.length === 0 ? (
          <p className="font-inter text-sm text-ink-muted">No notes yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {notes.map((note, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-[var(--border)] px-4 py-3"
              >
                <p className="font-inter text-sm text-ink whitespace-pre-wrap mb-1">
                  {note.text}
                </p>
                <p className="font-inter text-xs text-ink-muted">
                  {formatDateTime(note.created_at)} · {formatRelativeDate(note.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generate Deal Sheet (Phase 3) */}
      <Button disabled className="w-full" title="Coming in Phase 3">
        Generate Deal Sheet
      </Button>
    </div>
  )
}
