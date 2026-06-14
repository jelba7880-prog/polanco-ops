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
  },
};

export default nextConfig;
