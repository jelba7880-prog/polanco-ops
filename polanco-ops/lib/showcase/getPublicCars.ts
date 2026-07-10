import { createPublicClient } from '@/lib/supabase/publicClient'
import type { PublicCar, PublicCarDetail } from './types'

export type { PublicCarImage, PublicCar, PublicCarDetail } from './types'

// Two views are queried separately rather than embedded in one PostgREST
// select: public_cars_view / public_car_images_view have no FK relationship
// PostgREST can discover, since views don't carry the base tables' constraints.
export async function getPublicCars(): Promise<PublicCar[]> {
  const supabase = createPublicClient()

  const { data: cars, error: carsError } = await supabase
    .from('public_cars_view')
    .select('*')
    .order('created_at', { ascending: false })

  if (carsError) throw carsError
  if (!cars || cars.length === 0) return []

  const carIds = cars.map((car) => car.id)

  // Pull only the columns needed to resolve the listing URLs per car, ordered by
  // sort_order so the per-car grouping below can pick the hover photos
  // POSITIONALLY. "Photo N" means the Nth in sort_order, NOT sort_order === N-1:
  // deletions leave gaps in the sequence (see useDeleteCarImage), so only the
  // ordered position is stable. This resolution runs server-side under the
  // page's 60s ISR; the grid receives the cover plus up to 7 hover URLs per car
  // (photos 2-8), never the full gallery — and those hover images are only ever
  // fetched on desktop hover, so the mobile-3G image budget is unchanged.
  const { data: images, error: imagesError } = await supabase
    .from('public_car_images_view')
    .select('car_id, url, sort_order, is_cover')
    .in('car_id', carIds)
    .order('sort_order', { ascending: true })

  if (imagesError) throw imagesError

  // Group per car, preserving the ascending sort_order. A car's rows arrive as a
  // stable ascending subsequence of the globally-ordered result, so no re-sort
  // is needed.
  const imagesByCarId = new Map<string, { url: string; is_cover: boolean }[]>()
  for (const img of images ?? []) {
    const list = imagesByCarId.get(img.car_id)
    if (list) list.push({ url: img.url, is_cover: img.is_cover })
    else imagesByCarId.set(img.car_id, [{ url: img.url, is_cover: img.is_cover }])
  }

  return cars.map((car) => {
    const carImages = imagesByCarId.get(car.id) ?? []
    const coverImageUrl = carImages.find((img) => img.is_cover)?.url ?? null

    // Desktop hover cycle: photos 2 through min(8, total) by sort_order — i.e.
    // ordered indices 1 .. min(8, total) - 1. Empty when there's no cover to
    // start the cycle from or the car has fewer than 2 photos, so the card
    // treats it as "no hover behaviour" with no extra frontend logic.
    const hoverSequence =
      coverImageUrl && carImages.length >= 2
        ? carImages.slice(1, Math.min(8, carImages.length)).map((img) => img.url)
        : []

    return { ...car, coverImageUrl, hoverSequence }
  })
}

export async function getPublicCarBySlug(slug: string): Promise<PublicCarDetail | null> {
  const supabase = createPublicClient()

  const { data: car, error: carError } = await supabase
    .from('public_cars_view')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (carError) throw carError
  if (!car) return null

  const { data: images, error: imagesError } = await supabase
    .from('public_car_images_view')
    .select('*')
    .eq('car_id', car.id)
    .order('sort_order', { ascending: true })

  if (imagesError) throw imagesError

  return {
    ...car,
    images: images ?? [],
  }
}
