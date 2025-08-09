export type RestaurantRaw = {
  Name: string
  Address: string
  Location: string
  Price: string // "€€€€", "€€€", etc.
  Cuisine: string
  Longitude: string
  Latitude: string
  PhoneNumber: string
  Url: string
  WebsiteUrl: string
  Award: string // "3 Stars", "2 Stars", etc.
  GreenStar: string
  FacilitiesAndServices: string
  Description: string
}

export type Restaurant = {
  id: string
  name: string
  address: string
  location: string
  city: string
  country: string
  stars: 1 | 2 | 3
  cuisine: string
  price_level: 1 | 2 | 3 | 4
  lat: number
  lng: number
  phone?: string
  website?: string
  michelin_url?: string
  green_star: boolean
  facilities: string[]
  description: string
}
