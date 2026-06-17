'use client'

import Link from 'next/link'
import { Car, Users, FileText } from 'lucide-react'
import { formatRelativeDate } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { StatCard } from './StatCard'
import { QuickActionTile } from './QuickActionTile'

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
        <StatCard label="Available"    value={stats.available}     accentColor="success" delay={0} />
        <StatCard label="Reserved"     value={stats.reserved}      accentColor="warning" delay={80} />
        <StatCard label="Leads Today"  value={stats.leadsToday}    accentColor="navy"    delay={160} />
        <StatCard label="Deals / Week" value={stats.dealsThisWeek} accentColor="gold"    delay={240} />
      </div>

      {/* Quick actions */}
      <div className="mb-6">
        <p className="font-inter text-xs font-medium text-ink-muted mb-3">QUICK ACTIONS</p>
        <div className="grid grid-cols-2 gap-3">
          <QuickActionTile label="Add Vehicle"    href="/inventory/add" icon={Car}      delay={0} />
          <QuickActionTile label="Log Lead"       href="/leads/add"     icon={Users}    delay={60} />
          <QuickActionTile
            label="New Deal Sheet"
            href="/deals/new"
            icon={FileText}
            delay={120}
            horizontal
            className="col-span-2"
          />
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
