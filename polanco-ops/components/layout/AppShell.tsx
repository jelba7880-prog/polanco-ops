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
          the TopBar height at every breakpoint (h-14 / md:h-20 / lg:h-24).
          Light-only effect: --surface and --bg-base are both near-black in the
          dark-family themes, so the same split would read as a stray seam down
          the page rather than a deliberate frame — dark:lg: pins the column back
          to the identical --bg-base the wrapper already uses, so there's a single
          background source of truth there instead of two adjacent near-black
          tones. */}
      <main className="pt-14 md:pt-20 lg:pt-24 pb-20 min-h-screen lg:max-w-6xl lg:mx-auto lg:bg-base dark:lg:bg-[var(--bg-base)]">
        <PageTransition>{children}</PageTransition>
      </main>
      <BottomNav />
    </div>
  )
}
