import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="px-4 py-6">
      <p className="font-inter text-sm text-ink-muted">
        Welcome back — here&apos;s what&apos;s happening at Polanco today.
      </p>

      {/* Placeholder stat cards — replaced in Phase 1.6 */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        {[
          { label: 'Available Cars', value: '—' },
          { label: 'Active Leads', value: '—' },
          { label: 'Deals This Month', value: '—' },
          { label: 'Reserved', value: '—' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-base rounded-xl p-4 shadow-card border border-[var(--border)]"
          >
            <p className="font-inter text-xs text-ink-muted mb-1">{stat.label}</p>
            <p className="font-display text-2xl font-semibold text-ink">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
