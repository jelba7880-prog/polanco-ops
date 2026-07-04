'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastVariant = 'success' | 'error' | 'info'

interface ToastData {
  id: number
  message: string
  variant: ToastVariant
}

type ShowToast = (message: string, variant?: ToastVariant) => void

const ToastContext = createContext<ShowToast | null>(null)

// Rest duration before the auto-dismiss begins. Unchanged per spec (3s).
const TOAST_DURATION = 3000

// Exit transition length — must stay in sync with the `toastExit` keyframe in
// globals.css. Actual removal from the DOM is driven by THIS timeout (not an
// animationend listener) so a toast can never linger past
// TOAST_DURATION + TOAST_EXIT_DURATION even when the animation is disabled
// (reduced motion) or interrupted.
const TOAST_EXIT_DURATION = 180

// Monotonic id source. A module-level counter guarantees every toast gets a
// unique, stable React key so its component instance — and therefore its timer
// and animation state — is never reused or reset by a sibling toast.
let nextId = 0

/**
 * Global toast host. Mounted once near the root (inside Providers) so it is
 * stable across route changes: a toast fired immediately before a navigation
 * completes its own lifecycle normally, with no duplicate timers and no
 * state-update-on-unmounted-component warnings.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback<ShowToast>((message, variant = 'info') => {
    setToasts((prev) => [...prev, { id: nextId++, message, variant }])
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="toast-host" role="region" aria-label="Notifications">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ShowToast {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return ctx
}

const VARIANT_STYLES: Record<
  ToastVariant,
  { className: string; Icon: typeof Info }
> = {
  success: { className: 'bg-success text-white dark:text-on-accent', Icon: CheckCircle2 },
  error: { className: 'bg-danger text-white dark:text-on-accent', Icon: AlertCircle },
  info: { className: 'bg-ink text-base', Icon: Info },
}

/**
 * A single toast with a fully independent lifecycle. Because each instance owns
 * its own `exiting` state and timers (keyed by a unique id), appending a new
 * toast never restarts another toast's timer or animation, nor delays or
 * interrupts another's dismissal.
 */
function ToastItem({
  toast,
  onRemove,
}: {
  toast: ToastData
  onRemove: (id: number) => void
}) {
  const [exiting, setExiting] = useState(false)
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Begin the exit transition. Idempotent — both the auto-dismiss timer and an
  // explicit tap route through here, and the auto-dismiss timer is cleared so
  // it can't fire again after a manual dismiss.
  const beginExit = useCallback(() => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current)
      dismissTimer.current = null
    }
    setExiting(true)
  }, [])

  // Auto-dismiss after the unchanged 3s rest. This timer belongs to this toast
  // alone; the cleanup clears it on unmount so no orphaned timer survives a
  // route change or an early manual dismiss.
  useEffect(() => {
    dismissTimer.current = setTimeout(beginExit, TOAST_DURATION)
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current)
    }
  }, [beginExit])

  // Once exiting, keep the toast mounted for the exit transition, then remove
  // it. Driven by setTimeout (not animationend) so removal is guaranteed even
  // when the animation is disabled (reduced motion) or interrupted — the toast
  // can never get stuck on screen.
  useEffect(() => {
    if (!exiting) return
    const removeTimer = setTimeout(() => onRemove(toast.id), TOAST_EXIT_DURATION)
    return () => clearTimeout(removeTimer)
  }, [exiting, toast.id, onRemove])

  const { className, Icon } = VARIANT_STYLES[toast.variant]
  const isError = toast.variant === 'error'

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      onClick={beginExit}
      className={cn(
        'flex items-center gap-2.5 w-full max-w-sm px-4 py-3 rounded-xl shadow-elevated font-inter text-sm font-medium cursor-pointer select-none',
        className,
        exiting ? 'toast-exit' : 'toast-enter'
      )}
    >
      <Icon size={18} className="shrink-0" aria-hidden="true" />
      <span className="flex-1">{toast.message}</span>
      <X size={16} className="shrink-0 opacity-70" aria-hidden="true" />
    </div>
  )
}
