'use client'

import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { getInitials } from '@/lib/formatters'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/inventory': 'Inventory',
  '/inventory/add': 'Add Vehicle',
  '/leads': 'Leads',
  '/leads/add': 'Add Lead',
  '/deals': 'Deal Sheets',
  '/deals/new': 'New Deal',
  '/settings': 'Settings',
}

// Root (tab-level) screens — the ones reachable straight from the BottomNav.
// These are exactly the screens that have no back affordance, so the gold rule
// renders here and is suppressed on the deeper add/detail/edit screens.
const ROOT_PATHS = ['/dashboard', '/inventory', '/leads', '/deals', '/settings']

interface TopBarProps {
  action?: React.ReactNode
}

export function TopBar({ action }: TopBarProps) {
  const pathname = usePathname()
  const { data: currentUser } = useCurrentUser()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Match exact path first, then check prefixes for detail pages
  const title = PAGE_TITLES[pathname] ?? deriveTitle(pathname)

  // Gold rule renders only on root screens (those without a back affordance).
  const isRootScreen = ROOT_PATHS.includes(pathname)

  const initials = getInitials(currentUser?.full_name)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    // Full reload to clear any client-side cache (react-query) and let
    // middleware route the now-unauthenticated user to /login.
    window.location.href = '/login'
  }

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 md:h-20 lg:h-24 bg-base border-b border-[var(--border)]">
      <div className="h-full flex items-center justify-between px-4 lg:max-w-6xl lg:mx-auto">
        <div className="flex flex-col gap-1 md:gap-2">
          <h1 className="font-cormorant text-xl md:text-3xl lg:text-4xl font-semibold text-ink leading-tight">
            {title}
          </h1>
          {/* Gold rule echoes the login wordmark divider and BottomNav active-tab
              indicator. Flush left, directly below the title, as a real sibling in
              the flex column (not a ::after) so it contributes natural flow height
              and never shifts the layout. w-7 on mobile, scaling to w-10 at md+ to
              stay proportional with the larger title. Root screens only — tied to
              the same boolean that would hide a back affordance. */}
          {isRootScreen && (
            <div className="w-7 md:w-10 h-px bg-gold opacity-60" />
          )}
        </div>

        <div className="flex items-center gap-1">
          {action}

          {/* Avatar + dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Account menu"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="w-8 h-8 rounded-full bg-ink flex items-center justify-center text-white font-inter text-xs font-semibold transition-all duration-150 ease-out active:scale-[0.97]"
            >
              {initials}
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-10 w-52 bg-base rounded-xl shadow-elevated border border-[var(--border)] overflow-hidden z-50">
                {currentUser && (
                  <div className="px-4 py-3 border-b border-[var(--border)]">
                    <p className="font-inter text-xs font-semibold text-ink truncate">
                      {currentUser.full_name}
                    </p>
                    <p className="font-inter text-[10px] text-ink-muted capitalize">
                      {currentUser.role}
                    </p>
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm font-inter text-danger hover:bg-red-50 transition-all duration-150 ease-out active:scale-[0.97]"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

function deriveTitle(pathname: string): string {
  if (pathname.startsWith('/inventory')) return 'Inventory'
  if (pathname.startsWith('/leads')) return 'Leads'
  if (pathname.startsWith('/deals')) return 'Deal Sheets'
  return 'Polanco Ops'
}
