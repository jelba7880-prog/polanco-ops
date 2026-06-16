import { createClient } from '@/lib/supabase/server'

export type AdminCheck =
  | { ok: true; userId: string }
  | { ok: false; status: number; error: string }

/**
 * Server-side admin gate for privileged API routes.
 *
 * The /settings *page* is protected by a redirect in its Server Component, but
 * API routes are reachable directly regardless of which page rendered the
 * button that calls them — so every privileged route must re-verify the caller
 * independently. This checks there is an authenticated session AND that the
 * session's profile has role = 'admin' before any service-role work is done.
 */
export async function requireAdmin(): Promise<AdminCheck> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, status: 401, error: 'Unauthorized' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { ok: false, status: 403, error: 'Forbidden' }
  }

  return { ok: true, userId: user.id }
}
