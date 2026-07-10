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
  // Ordered photos the /cars listing grid cycles through on desktop hover (see
  // getPublicCars): photos 2 through min(8, total) by sort_order, positionally
  // resolved (gap-safe). Empty when the car has fewer than 2 photos or no cover
  // — the card then shows no hover behaviour at all. Not part of the detail page.
  hoverSequence: string[]
}

export interface PublicCarDetail extends Omit<PublicCar, 'coverImageUrl' | 'hoverSequence'> {
  images: PublicCarImage[]
}
