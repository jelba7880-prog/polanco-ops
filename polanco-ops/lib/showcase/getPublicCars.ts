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

  // Pull only the columns needed to resolve the two listing URLs per car (cover
  // + hover), ordered by sort_order so the per-car grouping below can pick the
  // hover image POSITIONALLY. "8th image" means the 8th in sort_order, NOT
  // sort_order === 7: deletions leave gaps in the sequence (see useDeleteCarImage),
  // so only the ordered position is stable. This resolution runs server-side
  // under the page's 60s ISR; the grid only ever receives the two resolved URLs
  // per car, never the gallery — so the mobile-3G payload stays two images/card.
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

    // Hover target: the 8th image by sort_order (index 7) when the car has 8+
    // photos, otherwise the last one. Null — no hover behaviour — when there is
    // no cover to flip from, no images, or the resolved image is the cover
    // itself (e.g. a single-photo car, or the cover set to the 8th image).
    let hoverImageUrl: string | null = null
    if (coverImageUrl && carImages.length > 0) {
      const candidate =
        carImages.length >= 8 ? carImages[7] : carImages[carImages.length - 1]
      if (candidate.url !== coverImageUrl) hoverImageUrl = candidate.url
    }

    return { ...car, coverImageUrl, hoverImageUrl }
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
