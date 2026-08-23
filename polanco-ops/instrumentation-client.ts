import * as Sentry from '@sentry/nextjs'

// Runs after the HTML loads, before hydration — see
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation-client.md.
// Same graceful no-op-without-a-dsn behavior as instrumentation.ts.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
