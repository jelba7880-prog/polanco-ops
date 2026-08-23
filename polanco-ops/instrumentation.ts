import * as Sentry from '@sentry/nextjs'

// register() runs once per server instance, before it handles any request,
// in both the Node and Edge runtimes — see
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation.md.
// Sentry.init() is safe to call with an unset dsn: it logs a notice and
// simply never sends events, so this is a no-op until SENTRY_DSN is
// configured, rather than failing local dev or a preview deploy.
export async function register() {
  Sentry.init({
    // Sentry DSNs are not secret (they're a write-only ingest endpoint, the
    // same convention as this project's other NEXT_PUBLIC_* client keys) —
    // one value, shared with instrumentation-client.ts, instead of a second
    // server-only copy to keep in sync.
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    // Lead phone numbers/names are PII the app already handles carefully
    // (see lib/formatters normalizeNigerianPhone) — don't also let Sentry
    // start attaching request headers/IPs/cookies by default.
    sendDefaultPii: false,
  })
}

// Reports errors from Server Components, Route Handlers, and Server Actions
// that Next.js itself catches — the 32 console.error-only call sites Phase 1
// found are a separate, narrower gap (this covers the framework-level path,
// not every internal catch block) but this is what makes App/-Vercel
// Hobby's ~1-hour log retention stop being the only record of a production
// error, which is what item 6 in the audit exists to fix.
export const onRequestError = Sentry.captureRequestError
