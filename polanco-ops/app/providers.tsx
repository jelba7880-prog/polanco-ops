'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SerwistProvider } from '@serwist/turbopack/react'
import { useState } from 'react'
import { ThemeProvider } from 'next-themes'
import { ToastProvider } from '@/components/ui/Toast'
import { ThemeMetaColor } from '@/components/theme/ThemeMetaColor'
import { ThemeVariantMemory } from '@/components/theme/ThemeVariantMemory'
import { THEMES, THEME_CLASS_MAP } from '@/lib/theme'

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
      {/* Disabled outside production so local dev never fights a stale
          service-worker cache; React Query (see queryClient above) is what
          actually refreshes data on reconnect, so reloadOnOnline is off to
          avoid a jarring full-page reload stepping on that. */}
      <SerwistProvider
        swUrl="/serwist/sw.js"
        disable={process.env.NODE_ENV !== 'production'}
        reloadOnOnline={false}
      >
        {/* Single shared theme provider at the root, wrapping BOTH the (app) Ops
            Hub and the (public) Showcase — one preference, one localStorage key,
            no flash across route-group navigation.

            `attribute="class"` + `value={THEME_CLASS_MAP}` toggles a .dark / .dim
            class on <html>. THEME_CLASS_MAP is the ONE place the System→Dim rule
            lives: next-themes resolves the OS dark-scheme to its internal 'dark'
            key, which the map sends to the `dim` class; the explicit true-black
            option is keyed 'black' and maps to the `dark` class (see lib/theme.ts
            for why the true-black key can't be 'dark' itself).

            enableColorScheme is off because next-themes only tints native UI for
            its built-in 'light'/'dark' — the mid-tone Dim key wouldn't get a dark
            tint — so color-scheme is set in globals.css instead. defaultTheme/
            enableSystem make first-visit follow the OS; disableTransitionOnChange
            suppresses colour transitions during the switch. */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          enableColorScheme={false}
          disableTransitionOnChange
          themes={THEMES}
          value={THEME_CLASS_MAP}
        >
          <ThemeMetaColor />
          <ThemeVariantMemory />
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </SerwistProvider>
    </QueryClientProvider>
  )
}
