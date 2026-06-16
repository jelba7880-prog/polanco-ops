import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { SettingsClient } from '@/components/settings/SettingsClient'
import type { Profile, StaffMember, StaffStatus } from '@/lib/supabase/types'

/**
 * Enrich the profiles list with auth-only fields (email + account status) that
 * live in auth.users rather than profiles. Runs server-side with the service
 * client and degrades gracefully: if the admin API is unavailable the list
 * still renders from profiles alone. Kept out of the component body so the
 * unavoidable `Date.now()` call isn't flagged by the render-purity lint rule.
 */
async function buildStaffList(profiles: Profile[]): Promise<StaffMember[]> {
  const authById = new Map<
    string,
    { email: string | null; banned: boolean; pending: boolean }
  >()

  try {
    const service = createServiceClient()
    const { data: authData } = await service.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })
    const now = Date.now()
    for (const u of authData?.users ?? []) {
      const bannedUntil = (u as { banned_until?: string | null }).banned_until
      authById.set(u.id, {
        email: u.email ?? null,
        banned: !!bannedUntil && new Date(bannedUntil).getTime() > now,
        pending: !u.email_confirmed_at,
      })
    }
  } catch (err) {
    console.error('Failed to load auth user data for staff list:', err)
  }

  return profiles.map((p) => {
    const authInfo = authById.get(p.id)
    let status: StaffStatus = 'active'
    if (authInfo?.banned) status = 'deactivated'
    else if (authInfo?.pending) status = 'pending'

    return {
      id: p.id,
      full_name: p.full_name,
      role: p.role,
      email: authInfo?.email ?? null,
      status,
      created_at: p.created_at,
    }
  })
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const [{ data: settingsRows }, { data: profiles }] = await Promise.all([
    supabase.from('settings').select('key, value'),
    supabase.from('profiles').select('*').order('full_name'),
  ])

  const settings = Object.fromEntries(
    (settingsRows ?? []).map((s) => [s.key, s.value])
  )

  const staff = await buildStaffList(profiles ?? [])

  return <SettingsClient settings={settings} staff={staff} currentUserId={user.id} />
}
