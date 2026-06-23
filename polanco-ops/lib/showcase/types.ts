export interface PublicCarImage {
  id: string
  car_id: string
  url: string
  sort_order: number
  is_cover: boolean
}

export interface PublicCar {
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

export interface PublicCarDetail extends Omit<PublicCar, 'coverImageUrl'> {
  images: PublicCarImage[]
}
