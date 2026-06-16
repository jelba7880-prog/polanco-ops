'use client'

import { usePathname } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  // Reset window scroll to top on every navigation. Next.js App Router normally
  // handles this, but the key-remount trick mounts a fresh DOM node and the
  // explicit reset ensures consistency across browsers and PWA mode.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div key={pathname} className="page-transition">
      {children}
    </div>
  )
}
