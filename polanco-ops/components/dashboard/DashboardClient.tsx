'use client'

import Link from 'next/link'
import { Car, Users, FileText } from 'lucide-react'
import { formatRelativeDate } from '@/lib/formatters'
import { cn } from '@/lib/utils'

interface Stats {
  available: number
  reserved: number
  leadsToday: number
  dealsThisWeek: number
}

interface ActivityItem {
  id: string
  type: 'car' | 'lead' | 'deal'
  label: string
  timestamp: string
}

interface DashboardClientProps {
  stats: Stats
  activity: ActivityItem[]
}

const STAT_CARDS = (stats: Stats) => [
  {
    label: 'Available',
    value: stats.available,
    color: 'text-success',
    bg: 'bg-success-tint',
    icon: Car,
    href: '/inventory?status=available',
  },
  {
    label: 'Reserved',
    value: stats.reserved,
    color: 'text-warning',
    bg: 'bg-warning-tint',
    icon: Car,
    href: '/inventory?status=reserved',
  },
  {
    label: 'Leads Today',
    value: stats.leadsToday,
    color: 'text-navy',
    bg: 'bg-navy-tint',
    icon: Users,
    href: '/leads',
  },
  {
    label: 'Deals / Week',
    value: stats.dealsThisWeek,
    color: 'text-gold-deep',
    bg: 'bg-gold-tint',
    icon: FileText,
    href: '/deals',
  },
]

const ACTIVITY_ICONS = {
  car: Car,
  lead: Users,
  deal: FileText,
}

const ACTIVITY_COLORS = {
  car: 'text-ink-muted',
  lead: 'text-navy',
  deal: 'text-gold-deep',
}

export function DashboardClient({ stats, activity }: DashboardClientProps) {
  return (
    <div className="px-4 py-6 pb-8">

      {/* Welcome */}
      <p className="font-inter text-sm text-ink-muted mb-5">
        Here&apos;s what&apos;s happening at Polanco today.
      </p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {STAT_CARDS(stats).map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.label}
              href={card.href}
              className="bg-white rounded-xl border border-[var(--border)] shadow-card p-4 active:scale-[0.98] transition-transform"
            >
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-3', card.bg)}>
                <Icon size={16} className={card.color} />
              </div>
              <p className={cn('font-display text-3xl font-semibold mb-0.5', card.color)}>
                {card.value}
              </p>
              <p className="font-inter text-xs text-ink-muted">{card.label}</p>
            </Link>
          )
        })}
      </div>

      {/* Quick actions */}
      <div className="mb-6">
        <p className="font-inter text-xs font-medium text-ink-muted mb-3">QUICK ACTIONS</p>
        <div className="flex flex-col gap-2">
          {[
            { label: 'Add Vehicle', href: '/inventory/add', icon: Car },
            { label: 'Log Lead', href: '/leads/add', icon: Users },
            { label: 'New Deal Sheet', href: '/deals/new', icon: FileText },
          ].map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 bg-white rounded-xl border border-[var(--border)] shadow-card px-4 py-3.5 active:scale-[0.98] transition-transform"
            >
              <div className="w-8 h-8 rounded-lg bg-gold-tint flex items-center justify-center shrink-0">
                <Icon size={16} className="text-gold-deep" />
              </div>
              <span className="font-inter text-sm font-medium text-ink">{label}</span>
              <div className="ml-auto text-ink-muted">
                <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
                  <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Activity feed */}
      {activity.length > 0 && (
        <div>
          <p className="font-inter text-xs font-medium text-ink-muted mb-3">RECENT ACTIVITY</p>
          <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
            {activity.map((item, i) => {
              const Icon = ACTIVITY_ICONS[item.type]
              const color = ACTIVITY_COLORS[item.type]
              return (
                <div
                  key={`${item.id}-${i}`}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3',
                    i < activity.length - 1 ? 'border-b border-[var(--border)]' : ''
                  )}
                >
                  <div className="shrink-0">
                    <Icon size={14} className={color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-inter text-xs text-ink truncate">{item.label}</p>
                  </div>
                  <p className="font-inter text-[10px] text-ink-muted shrink-0">
                    {formatRelativeDate(item.timestamp)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
