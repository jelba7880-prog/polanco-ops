import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

/**
 * Back affordance for public detail pages. Always a plain Link to /cars —
 * a history.length-based router.back() was tried and dropped: it fires even
 * on a same-tab external referrer (e.g. an Instagram in-app browser opening
 * a DM link), which sent visitors back out of the site instead of to /cars,
 * and it didn't actually preserve listing scroll position in this app either.
 */
export function PublicBackButton() {
  return (
    <Link
      href="/cars"
      aria-label="Back to inventory"
      className="flex items-center justify-center w-12 h-12 shrink-0 rounded-full text-ink transition-all duration-150 ease-out active:scale-[0.97] hover:bg-ink/5"
    >
      <ArrowLeft size={20} />
    </Link>
  )
}
