import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Polanco Ops",
    short_name: "Polanco",
    description: "Internal operations for Polanco Exotic Cars",
    start_url: "/dashboard",
    display: "standalone",
    // Fixed splash-screen/browser-chrome colors per the PWA spec — not tied to
    // the light/dark theme tokens (see ThemeMetaColor for the live theme-color
    // meta tag, which is the one that actually updates with the theme).
    background_color: "#FFFFFF",
    theme_color: "#0A0A0A",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
