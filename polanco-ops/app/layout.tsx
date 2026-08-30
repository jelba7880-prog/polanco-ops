import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

function resolveAppUrl(): URL {
  const fallback = "https://project-6rmw6.vercel.app";
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();

  try {
    return new URL(raw || fallback);
  } catch {
    return new URL(fallback);
  }
}

export const metadata: Metadata = {
  metadataBase: resolveAppUrl(),
  title: "Polanco Operations Hub",
  description: "Polanco Exotic Cars · Operations Hub",
  // No explicit `manifest` field — app/manifest.ts is auto-discovered and
  // linked by Next.js.
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Polanco Ops",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // next-themes writes the resolved theme class onto <html> from an inline
      // pre-paint script, so the server-rendered markup (no class) won't match
      // the client's first paint. suppressHydrationWarning scopes that expected
      // mismatch to this element only.
      suppressHydrationWarning
      className={`${cormorant.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-inter">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
