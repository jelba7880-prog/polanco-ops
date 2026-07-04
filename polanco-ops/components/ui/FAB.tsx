'use client'

import Link from 'next/link'
import { Plus, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FABProps {
  /** Destination route the FAB links to. */
  href: string
  /** Button label, e.g. "Add Vehicle". */
  label: string
  /** Leading icon — defaults to Plus, matching every current FAB. */
  icon?: LucideIcon
  className?: string
}

/**
 * Shared floating action button — the gold pill fixed near the bottom-right
 * above the bottom nav (Add Vehicle / Add Lead / New Deal). Consolidates what
 * were three identical inline <Link>s so the shell, press feedback, and hover
 * treatment live in one place.
 *
 * Press feedback (Item 10) is the `active:scale-[0.97]` here; the desktop-only
 * hover lift + scale-up and reduced-motion handling live on the `.fab` class in
 * globals.css (gated behind `@media (hover: hover)`, Item 11's mechanism).
 */
export function FAB({ href, label, icon: Icon = Plus, className }: FABProps) {
  return (
    <Link
      href={href}
      className={cn(
        'fab fixed bottom-20 right-4 z-30 flex items-center gap-2',
        'bg-gold text-on-accent font-inter font-medium text-sm px-4 h-12 rounded-full shadow-elevated',
        'active:scale-[0.97] transition-transform duration-150 ease-out',
        className,
      )}
    >
      <Icon size={18} />
      {label}
    </Link>
  )
}
