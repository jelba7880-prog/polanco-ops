'use client'

import { Car, Users, FileText } from 'lucide-react'
import { StatCard } from './StatCard'
import { QuickActionTile } from './QuickActionTile'
import { ActivityFeed } from './ActivityFeed'
import { PageHeaderSubtitle } from '@/components/layout/PageHeaderSubtitle'

interface Stats {
  available: number
  reserved: number
  leadsToday: number
  dealsThisWeek: number
}

interface DashboardClientProps {
  stats: Stats
}

export function DashboardClient({ stats }: DashboardClientProps) {
  return (
    <div className="px-4 py-6 pb-8">

      {/* Welcome */}
      <PageHeaderSubtitle>
        Here&apos;s what&apos;s happening at Polanco today.
      </PageHeaderSubtitle>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Available"    value={stats.available}     accentColor="success" delay={0} />
        <StatCard label="Reserved"     value={stats.reserved}      accentColor="warning" delay={80} />
        <StatCard label="Leads Today"  value={stats.leadsToday}    accentColor="navy"    delay={160} />
        <StatCard label="Deals / Week" value={stats.dealsThisWeek} accentColor="gold"    delay={240} />
      </div>

      {/* Quick actions */}
      <div className="mb-6">
        <p className="font-inter text-xs font-medium text-ink-muted mb-3">QUICK ACTIONS</p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickActionTile label="Add Vehicle"    href="/inventory/add" icon={Car}      delay={0} />
          <QuickActionTile label="Log Lead"       href="/leads/add"     icon={Users}    delay={60} />
          <QuickActionTile
            label="New Deal Sheet"
            href="/deals/new"
            icon={FileText}
            delay={120}
            horizontal
            className="col-span-2 lg:col-span-1"
          />
        </div>
      </div>

      {/* Activity feed — powered by activity_log with infinite scroll */}
      <ActivityFeed />

    </div>
  )
}
