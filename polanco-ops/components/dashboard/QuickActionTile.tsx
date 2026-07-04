'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

interface QuickActionTileProps {
  label: string
  href: string
  icon: LucideIcon
  delay?: number
  horizontal?: boolean
  className?: string
}

export function QuickActionTile({
  label,
  href,
  icon: Icon,
  delay = 0,
  horizontal = false,
  className = '',
}: QuickActionTileProps) {
  return (
    <Link
      href={href}
      className={[
        'tile-enter card-hoverable',
        // Neutral action surface: borderless, shadow defines the edge. The only
        // gold accent here is the icon itself; the card carries no colored border.
        'bg-base rounded-xl shadow-card',
        'active:scale-[0.97] transition-transform duration-150 ease-out',
        horizontal
          ? 'flex flex-row items-center gap-4 px-4 py-4 min-h-[64px]'
          : 'flex flex-col items-start justify-between px-4 py-4 min-h-[88px]',
        className,
      ].join(' ')}
      style={{ animationDelay: `${delay}ms` }}
    >
      <Icon size={28} className="text-gold shrink-0" />
      <span className="font-cormorant font-semibold text-xl leading-tight text-ink">
        {label}
      </span>
    </Link>
  )
}
