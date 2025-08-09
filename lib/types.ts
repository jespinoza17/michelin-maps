export type Restaurant = {
  id: string
  name: string
  stars: 1 | 2 | 3
  cuisine: string
  price_level: 1 | 2 | 3 | 4
  lat: number
  lng: number
  city: string
  country: string
  phone?: string
  website?: string
  image_url?: string
}
