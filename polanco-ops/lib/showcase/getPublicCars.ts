import { createPublicClient } from '@/lib/supabase/publicClient'

export interface PublicCarImage {
  id: string
  car_id: string
  url: string
  sort_order: number
  is_cover: boolean
}

export interface PublicCarListItem {
  id: string
  slug: string
  make: string
  model: string
  year: number
  body_type: string | null
  color_exterior: string | null
  color_interior: string | null
  mileage_km: number
  condition: string
  transmission: string | null
  fuel_type: string | null
  engine_cc: number | null
  horsepower: number | null
  price_usd: number
  status: string
  created_at: string
  coverImageUrl: string | null
}

export interface PublicCarDetail extends Omit<PublicCarListItem, 'coverImageUrl'> {
  images: PublicCarImage[]
}

// Two views are queried separately rather than embedded in one PostgREST
// select: public_cars_view / public_car_images_view have no FK relationship
// PostgREST can discover, since views don't carry the base tables' constraints.
export async function getPublicCars(): Promise<PublicCarListItem[]> {
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
