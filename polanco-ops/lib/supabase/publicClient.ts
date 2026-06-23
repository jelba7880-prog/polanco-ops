import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Anon-key client for the public showcase. Reads only from public_cars_view /
// public_car_images_view, which is what keeps internal columns out of reach —
// keep this file free of any elevated credential, even in comments.
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
