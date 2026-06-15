import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsClient } from '@/components/settings/SettingsClient'

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

  return <SettingsClient settings={settings} profiles={profiles ?? []} currentUserId={user.id} />
}
