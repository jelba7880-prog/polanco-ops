'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

// Exit transition length — must stay in sync with the slowest of the
// `sheetExit` / `modalBackdropExit` keyframes in globals.css. Actual unmount
// is driven by THIS timeout (not an animationend listener) so the sheet can
// never linger past this duration even under reduced motion or if the
// animation is interrupted.
const EXIT_DURATION = 200

export function Modal({ open, onClose, title, children }: ModalProps) {
  // `rendered` keeps the sheet mounted for the brief exit transition after
  // `open` flips to false, so the slide-down/fade-out actually has a window
  // to play instead of the sheet disappearing instantly.
  const [rendered, setRendered] = useState(open)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (open) {
      setClosing(false)
      setRendered(true)
      return
    }
    if (!rendered) return
    setClosing(true)
    const timer = setTimeout(() => {
      setRendered(false)
      setClosing(false)
    }, EXIT_DURATION)
    return () => clearTimeout(timer)
  }, [open, rendered])

  // Close on Escape while open
  useEffect(() => {
    if (!open) return

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // Lock body scroll for as long as the sheet is on screen, including the
  // exit transition, so the background can't scroll behind a still-visible
  // (mid-close) sheet.
  useEffect(() => {
    if (!rendered) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [rendered])

  if (!rendered) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 bg-black/40',
          closing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative w-full sm:max-w-md bg-base rounded-t-2xl sm:rounded-2xl shadow-elevated px-4 pt-4 pb-6 pb-safe',
          closing ? 'modal-sheet-exit' : 'modal-sheet-enter'
        )}
      >
        {/* Drag handle (mobile sheet affordance) */}
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border-base sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          {title && (
            <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
          )}
          <button
            onClick={onClose}
            aria-label="Close"
            className="ml-auto -mr-1 flex h-9 w-9 items-center justify-center rounded-full text-ink-muted hover:bg-surface-muted transition-all duration-150 ease-out active:scale-[0.97]"
          >
            <X size={18} />
          </button>
        </div>

        {children}
      </div>
    </div>
  )
}
