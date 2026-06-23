import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PublicHeader } from '@/components/showcase/PublicHeader'
import { PublicFooter } from '@/components/showcase/PublicFooter'
import { PublicStatusBadge } from '@/components/showcase/PublicStatusBadge'
import { CarGallery } from '@/components/showcase/CarGallery'
import { EnquiryButton } from '@/components/showcase/EnquiryButton'
import { getPublicCarBySlug } from '@/lib/showcase/getPublicCars'
import { formatUSD, formatMileage, toDisplayCase } from '@/lib/formatters'

interface CarDetailPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: CarDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const car = await getPublicCarBySlug(slug)

  if (!car) return {}

  return {
    title: `${car.year} ${car.make} ${car.model} | Polanco Exotic Cars`,
    description: `${car.condition} · ${car.mileage_km.toLocaleString()} km · $${car.price_usd.toLocaleString()}`,
    openGraph: {
      images: car.images[0]?.url ? [car.images[0].url] : [],
    },
  }
}

export default async function CarDetailPage({ params }: CarDetailPageProps) {
  const { slug } = await params
  const car = await getPublicCarBySlug(slug)

  if (!car) notFound()

  const specs = [
    { label: 'Condition', value: toDisplayCase(car.condition) },
    { label: 'Body Type', value: car.body_type ? toDisplayCase(car.body_type) : null },
    { label: 'Transmission', value: car.transmission ? toDisplayCase(car.transmission) : null },
    { label: 'Fuel Type', value: car.fuel_type ? toDisplayCase(car.fuel_type) : null },
    { label: 'Mileage', value: formatMileage(car.mileage_km) },
    { label: 'Engine', value: car.engine_cc ? `${car.engine_cc.toLocaleString()} cc` : null },
    { label: 'Horsepower', value: car.horsepower ? `${car.horsepower} hp` : null },
    { label: 'Exterior Color', value: car.color_exterior ? toDisplayCase(car.color_exterior) : null },
    { label: 'Interior Color', value: car.color_interior ? toDisplayCase(car.color_interior) : null },
  ].filter((spec) => spec.value !== null)

  return (
    <>
      <PublicHeader />

      <main className="mx-auto max-w-[1280px] px-4 md:px-10 py-10">
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="lg:w-[55%]">
            <CarGallery
              images={car.images}
              carName={`${car.year} ${toDisplayCase(car.make)} ${toDisplayCase(car.model)}`}
            />
          </div>

          <div className="lg:w-[45%]">
            <PublicStatusBadge status={car.status} size="lg" />

            <p className="font-inter text-[13px] text-ink-muted uppercase tracking-wide mt-4">
              {car.year}
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-ink leading-tight mb-3">
              {toDisplayCase(car.make)} {toDisplayCase(car.model)}
            </h1>
            <p className="font-inter text-[28px] font-semibold text-gold">
              {formatUSD(car.price_usd)}
            </p>

            <hr className="border-t border-[var(--border)] my-6" />

            <div className="grid grid-cols-2 gap-4 mb-8">
              {specs.map((spec) => (
                <div key={spec.label}>
                  <p className="font-inter text-[11px] text-ink-muted uppercase tracking-wide mb-1">
                    {spec.label}
                  </p>
                  <p className="font-inter text-sm font-medium text-ink">{spec.value}</p>
                </div>
              ))}
            </div>

            <EnquiryButton />
          </div>
        </div>
      </main>

      <PublicFooter />
    </>
  )
}
