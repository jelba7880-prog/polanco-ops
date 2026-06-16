'use client'

import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCurrentUser } from '@/hooks/useCurrentUser'

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

  const initials = currentUser?.full_name
    ? currentUser.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

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
    <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-base border-b border-[var(--border)] flex items-center justify-between px-4">
      <h1 className="font-cormorant text-xl font-semibold text-ink">
        {title}
      </h1>

      <div className="flex items-center gap-1">
        {action}

        {/* Avatar + dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Account menu"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="w-8 h-8 rounded-full bg-ink flex items-center justify-center text-white font-inter text-xs font-semibold"
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
                className="flex items-center gap-3 w-full px-4 py-3 text-sm font-inter text-danger hover:bg-red-50 transition-colors"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          )}
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
