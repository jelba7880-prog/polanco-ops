'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { ThemeProvider } from 'next-themes'
import { ToastProvider } from '@/components/ui/Toast'
import { ThemeMetaColor } from '@/components/theme/ThemeMetaColor'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {/* Single shared theme provider at the root, wrapping BOTH the (app) Ops
          Hub and the (public) Showcase — one preference, one localStorage key,
          no flash across route-group navigation. `attribute="class"` toggles a
          .dark class on <html> (matching globals.css's class-scoped dark
          variant); defaultTheme/enableSystem make first-visit follow the OS
          setting; disableTransitionOnChange suppresses the app's colour
          transitions during the switch so nothing animates on toggle. */}
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <ThemeMetaColor />
        <ToastProvider>{children}</ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
