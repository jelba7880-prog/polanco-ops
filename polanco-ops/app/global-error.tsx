'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

// Errors thrown while rendering the root layout itself (not just a page)
// only surface here — instrumentation.ts's onRequestError doesn't see them,
// so this is the one place that needs its own Sentry.captureException call.
// Per Next.js convention this file replaces the root layout when it
// activates, so it needs its own <html>/<body>.
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body className="min-h-full flex items-center justify-center p-6 font-sans">
        <div className="text-center">
          <p className="text-lg font-semibold">Something went wrong</p>
          <p className="text-sm text-gray-500 mt-1">
            Please refresh the page. If this keeps happening, contact support.
          </p>
        </div>
      </body>
    </html>
  )
}
