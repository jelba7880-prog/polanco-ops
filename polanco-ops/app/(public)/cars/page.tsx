import { PublicHeader } from '@/components/showcase/PublicHeader'
import { PublicFooter } from '@/components/showcase/PublicFooter'
import { PublicCarGrid } from '@/components/showcase/PublicCarGrid'
import { getPublicCars } from '@/lib/showcase/getPublicCars'

// Without this, the listing is prerendered once at build (Next marks it ○
// Static) and freezes at the last deploy, so cars added afterward never appear.
// Writes go through the browser Supabase client, not a Server Action, so
// revalidatePath isn't a lever — instead re-run getPublicCars() at most once
// per 60s. The anon supabase-js fetch sets no `cache`/`no-store` option, so the
// segment stays prerender-compatible and this is true ISR, not a dynamic render
// on every request — 60s keeps Supabase off the hot path for Instagram-driven
// mobile-3G visitors while surfacing new/hidden cars within a minute, no rebuild.
export const revalidate = 60

export const metadata = {
  title: 'Inventory | Polanco Exotic Cars',
  description:
    'Browse our current selection of exotic and luxury vehicles available in Lagos, Nigeria.',
  openGraph: {
    title: 'Inventory | Polanco Exotic Cars',
    description:
      'Browse our current selection of exotic and luxury vehicles available in Lagos, Nigeria.',
    type: 'website',
    url: `${process.env.NEXT_PUBLIC_APP_URL}/cars`,
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default async function CarsPage() {
  const cars = await getPublicCars()

  return (
    <>
      <PublicHeader />

      <main className="mx-auto max-w-[1280px] px-4 md:px-10">
        <div className="py-12">
          <h1 className="font-display text-4xl md:text-5xl text-ink mb-3">
            Our Inventory
          </h1>
          <p className="font-inter text-base text-ink-soft">
            Handpicked exotic and luxury vehicles available now in Lagos.
          </p>
        </div>

        <PublicCarGrid cars={cars} />
      </main>

      <PublicFooter />
    </>
  )
}
