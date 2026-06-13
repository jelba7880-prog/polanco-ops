import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <main className="min-h-screen bg-base flex flex-col items-center justify-center px-6">
      <h1 className="font-display text-3xl font-semibold text-ink mb-2">
        Dashboard
      </h1>
      <p className="text-sm text-ink-muted font-inter">
        Logged in as {user.email}
      </p>
    </main>
  )
}
