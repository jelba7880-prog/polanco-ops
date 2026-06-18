import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardClient } from '@/components/dashboard/DashboardClient'

function startOfTodayISO(): string {
  return new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
}

function sevenDaysAgoISO(): string {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { count: availableCount },
    { count: reservedCount },
    { data: leadsToday },
    { data: dealsThisWeek },
  ] = await Promise.all([
    supabase
      .from('cars')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'available')
      .eq('lifecycle_status', 'active'),
    supabase
      .from('cars')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'reserved')
      .eq('lifecycle_status', 'active'),
    supabase
      .from('leads')
      .select('id, created_at')
      .gte('created_at', startOfTodayISO()),
    supabase
      .from('deal_sheets')
      .select('id, created_at')
      .gte('created_at', sevenDaysAgoISO()),
  ])

  const stats = {
    available: availableCount ?? 0,
    reserved: reservedCount ?? 0,
    leadsToday: leadsToday?.length ?? 0,
    dealsThisWeek: dealsThisWeek?.length ?? 0,
  }

  // The Recent Activity feed is now client-side (activity_log + infinite
  // scroll), so the Dashboard page only computes the stat-card counts.
  return <DashboardClient stats={stats} />
}
