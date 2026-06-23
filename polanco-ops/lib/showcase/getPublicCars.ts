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

  const { data: images, error: imagesError } = await supabase
    .from('public_car_images_view')
    .select('*')
    .in('car_id', carIds)
    .eq('is_cover', true)

  if (imagesError) throw imagesError

  const coverByCarId = new Map((images ?? []).map((img) => [img.car_id, img.url]))

  return cars.map((car) => ({
    ...car,
    coverImageUrl: coverByCarId.get(car.id) ?? null,
  }))
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
