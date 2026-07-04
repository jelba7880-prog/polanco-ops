'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Car,
  Users,
  FileText,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/inventory', label: 'Inventory', icon: Car },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/deals', label: 'Deals', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[var(--border)] pb-safe">
      <div className="flex items-stretch h-16 lg:max-w-6xl lg:mx-auto">
        {/* Active state is signaled by ink vs muted icon/label color alone; the
            former gold indicator dot has been removed. */}
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href ||
            (href !== '/dashboard' && pathname.startsWith(href))

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[48px] transition-all duration-150 ease-out active:scale-[0.97]',
                isActive ? 'text-ink' : 'text-ink-muted hover:text-ink-soft'
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2 : 1.5} />
              <span className="text-[10px] font-inter font-medium tracking-wide">
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
