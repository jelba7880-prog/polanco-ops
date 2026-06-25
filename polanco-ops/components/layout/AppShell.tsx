import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'
import { PageTransition } from './PageTransition'

interface AppShellProps {
  children: React.ReactNode
  topBarAction?: React.ReactNode
}

export function AppShell({ children, topBarAction }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <TopBar action={topBarAction} />
      {/* Centered white content column on desktop; the warm --bg-base (painted on
          body and this wrapper) fills the full viewport width around it. pt tracks
          the TopBar height at every breakpoint (h-14 / md:h-20 / lg:h-24). */}
      <main className="pt-14 md:pt-20 lg:pt-24 pb-20 min-h-screen lg:max-w-6xl lg:mx-auto lg:bg-base">
        <PageTransition>{children}</PageTransition>
      </main>
      <BottomNav />
    </div>
  )
}
