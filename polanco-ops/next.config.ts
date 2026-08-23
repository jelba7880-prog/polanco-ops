import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    // Car photos are served from Supabase Storage (e.g. <project>.supabase.co).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/**",
      },
    ],
    // Required since Next.js 16 — quality values must be allowlisted or they
    // silently fall back to the closest allowed value (default [75]).
    qualities: [70, 75, 85],
  },
};

export default withSentryConfig(nextConfig, {
  // Only used for build-time sourcemap upload; no-ops (with a console
  // notice, not a failure) when unset, e.g. in local dev or before a Sentry
  // project exists yet.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  webpack: {
    // This already defaults to false, but stated explicitly: a project
    // that also installs the Vercel-Sentry marketplace integration can end
    // up with Cron Monitors defined through both paths at once. This app
    // has no vercel.json crons today, but keep this off so it can't
    // collide with monitors the Vercel integration creates if one is ever
    // added there instead.
    automaticVercelMonitors: false,
  },
});
