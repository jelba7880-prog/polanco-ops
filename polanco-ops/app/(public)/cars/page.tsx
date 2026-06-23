import { PublicHeader } from '@/components/showcase/PublicHeader'
import { PublicFooter } from '@/components/showcase/PublicFooter'
import { PublicCarGrid } from '@/components/showcase/PublicCarGrid'
import { getPublicCars } from '@/lib/showcase/getPublicCars'

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
