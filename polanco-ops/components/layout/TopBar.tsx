'use client'

import { usePathname } from 'next/navigation'

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

  // Match exact path first, then check prefixes for detail pages
  const title = PAGE_TITLES[pathname] ?? deriveTitle(pathname)

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-base border-b border-[var(--border)] flex items-center justify-between px-4">
      <h1 className="font-display text-xl font-semibold text-ink">
        {title}
      </h1>
      {action && <div>{action}</div>}
    </header>
  )
}

function deriveTitle(pathname: string): string {
  if (pathname.startsWith('/inventory')) return 'Inventory'
  if (pathname.startsWith('/leads')) return 'Leads'
  if (pathname.startsWith('/deals')) return 'Deal Sheets'
  return 'Polanco Ops'
}
