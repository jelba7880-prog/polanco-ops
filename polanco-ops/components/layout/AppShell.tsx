import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'
import { PageTransition } from './PageTransition'

interface AppShellProps {
  children: React.ReactNode
  topBarAction?: React.ReactNode
}

export function AppShell({ children, topBarAction }: AppShellProps) {
  return (
    <div className="min-h-screen bg-subtle">
      <TopBar action={topBarAction} />
      <main className="pt-14 pb-20 min-h-screen lg:max-w-6xl lg:mx-auto lg:bg-base">
        <PageTransition>{children}</PageTransition>
      </main>
      <BottomNav />
    </div>
  )
}
