'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

/**
 * Back affordance for public detail pages. Renders as a real Link to /cars so
 * it always works (no-JS, direct-link visits from an Instagram DM with no
 * history). On click, if there's a prior entry in this tab's history we
 * intercept and use router.back() instead, which preserves the listing's
 * scroll position/filters — a plain Link would hard-reset it.
 */
export function PublicBackButton() {
  const router = useRouter()

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (window.history.length > 1) {
      e.preventDefault()
      router.back()
    }
  }

  return (
    <Link
      href="/cars"
      onClick={handleClick}
      aria-label="Back to inventory"
      className="flex items-center justify-center w-12 h-12 shrink-0 rounded-full text-ink transition-all duration-150 ease-out active:scale-[0.97] hover:bg-ink/5"
    >
      <ArrowLeft size={20} />
    </Link>
  )
}
