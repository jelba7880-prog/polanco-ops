import type { NextConfig } from "next";

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

export default nextConfig;
