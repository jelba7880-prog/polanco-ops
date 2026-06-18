import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  ActivityActionType,
  ActivityEntityType,
} from '@/lib/supabase/types'

export interface ActivityLogEntry {
  // The acting user. Pass the id you already have on hand (e.g. an API route's
  // authenticated user, or a deal sheet's generated_by) rather than re-deriving
  // it. The DB's RLS insert policy requires this to equal the caller's auth uid.
  actor_id: string | null
  action_type: ActivityActionType
  entity_type: ActivityEntityType
  entity_id: string | null
  description: string
}

/**
 * Best-effort write of a single activity_log row. This is intentionally
 * fire-and-forgettable: it NEVER throws and NEVER rejects, so a logging bug or
 * a transient insert failure can never break or roll back the real action that
 * triggered it. Failures are surfaced only to the console.
 *
 * Works with either the browser or the server Supabase client.
 */
export async function logActivity(
  supabase: SupabaseClient,
  entry: ActivityLogEntry
): Promise<void> {
  try {
    const { error } = await supabase.from('activity_log').insert(entry)
    if (error) throw error
  } catch (err) {
    console.error(
      'Failed to write activity_log entry:',
      err instanceof Error ? err.message : String(err)
    )
  }
}
