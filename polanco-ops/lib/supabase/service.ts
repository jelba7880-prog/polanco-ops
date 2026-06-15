import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Service-role client for server-side writes that must bypass RLS
// (e.g. persisting system-fetched values like the live exchange rate).
// Never import this from client components.
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
