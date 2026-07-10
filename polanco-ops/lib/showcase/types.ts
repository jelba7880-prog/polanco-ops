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
  // Second image used only by the /cars listing grid's desktop hover page-turn
  // (see getPublicCars): the 8th photo by sort_order, or the last if fewer than
  // 8. Null when there is nothing distinct to reveal — no cover, no gallery, or
  // the resolved image is the cover itself — in which case the card shows no
  // hover behaviour at all. Not part of the detail page.
  hoverImageUrl: string | null
}

export interface PublicCarDetail extends Omit<PublicCar, 'coverImageUrl' | 'hoverImageUrl'> {
  images: PublicCarImage[]
}
