'use client'

import { useState } from 'react'
import { LogOut, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function SignOutButton() {
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    // Full reload to clear any client-side cache (react-query) and let
    // middleware route the now-unauthenticated user to /login.
    window.location.href = '/login'
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={signingOut}
      aria-label="Sign out"
      className="flex items-center justify-center h-9 w-9 rounded-lg text-ink-muted hover:text-ink hover:bg-ink/5 transition-colors disabled:opacity-60"
    >
      {signingOut ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <LogOut size={18} />
      )}
    </button>
  )
}
