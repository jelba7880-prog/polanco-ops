import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardClient } from '@/components/dashboard/DashboardClient'
import { toDisplayCase } from '@/lib/formatters'

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
    { data: recentCars },
    { data: recentLeads },
    { data: recentDeals },
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
    supabase
      .from('cars')
      .select('id, make, model, year, status, updated_at')
      .eq('lifecycle_status', 'active')
      .order('updated_at', { ascending: false })
      .limit(5),
    supabase
      .from('leads')
      .select('id, name, car_interest, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('deal_sheets')
      .select('id, client_name, car_snapshot, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const stats = {
    available: availableCount ?? 0,
    reserved: reservedCount ?? 0,
    leadsToday: leadsToday?.length ?? 0,
    dealsThisWeek: dealsThisWeek?.length ?? 0,
  }

  type ActivityItem = {
    id: string
    type: 'car' | 'lead' | 'deal'
    label: string
    timestamp: string
  }

  const activity: ActivityItem[] = [
    ...(recentCars ?? []).map((c) => ({
      id: c.id,
      type: 'car' as const,
      label: `${c.year} ${toDisplayCase(c.make)} ${toDisplayCase(c.model)} marked ${c.status}`,
      timestamp: c.updated_at,
    })),
    ...(recentLeads ?? []).map((l) => ({
      id: l.id,
      type: 'lead' as const,
      label: `New lead: ${l.name}${l.car_interest ? ` — ${toDisplayCase(l.car_interest)}` : ''}`,
      timestamp: l.created_at,
    })),
    ...(recentDeals ?? []).map((d) => {
      const snap = d.car_snapshot as { make: string; model: string; year: number }
      return {
        id: d.id,
        type: 'deal' as const,
        label: `Deal sheet for ${d.client_name} — ${snap?.year} ${toDisplayCase(snap?.make)} ${toDisplayCase(snap?.model)}`,
        timestamp: d.created_at,
      }
    }),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10)

  return <DashboardClient stats={stats} activity={activity} />
}
