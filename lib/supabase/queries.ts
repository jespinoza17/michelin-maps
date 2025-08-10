import { supabase } from './client'
import type { Restaurant } from '@/lib/types'

export interface RestaurantFilters {
  stars?: number[]
  countries?: string[]
  cities?: string[]
  cuisines?: string[]
  priceLevel?: number[]
  greenStar?: boolean
  search?: string
}

export interface RestaurantQueryResult {
  data: Restaurant[]
  count: number
  error?: string
}

// Convert database row to Restaurant type
function dbRowToRestaurant(row: any): Restaurant {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    location: row.location,
    stars: row.stars,
    cuisine: row.cuisine,
    price_level: row.price_level,
    lat: row.latitude,
    lng: row.longitude,
    city: row.city,
    country: row.country,
    phone: row.phone,
    website: row.website,
    michelin_url: row.michelin_url, 
    green_star: row.green_star,
    facilities: row.facilities || [],
    description: row.description
  }
}

export async function getRestaurants(
  filters?: RestaurantFilters,
  limit?: number,
  offset?: number
): Promise<RestaurantQueryResult> {
  try {
    let query = supabase
      .from('restaurants')
      .select('*', { count: 'exact' })

    // Apply filters
    if (filters?.stars && filters.stars.length > 0) {
      query = query.in('stars', filters.stars)
    }

    if (filters?.countries && filters.countries.length > 0) {
      query = query.in('country', filters.countries)
    }

    if (filters?.cities && filters.cities.length > 0) {
      query = query.in('city', filters.cities)
    }

    if (filters?.cuisines && filters.cuisines.length > 0) {
      query = query.in('cuisine', filters.cuisines)
    }

    if (filters?.priceLevel && filters.priceLevel.length > 0) {
      query = query.in('price_level', filters.priceLevel)
    }

    if (filters?.greenStar !== undefined) {
      query = query.eq('green_star', filters.greenStar)
    }

    if (filters?.search && filters.search.trim()) {
      // Use full-text search
      query = query.textSearch('name,cuisine,description', filters.search.trim())
    }

    // Apply pagination
    if (limit) {
      query = query.limit(limit)
    }
    if (offset) {
      query = query.range(offset, offset + (limit || 50) - 1)
    }

    // Order by stars descending, then by name
    query = query.order('stars', { ascending: false }).order('name')

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching restaurants:', error)
      return { data: [], count: 0, error: error.message }
    }

    const restaurants = data?.map(dbRowToRestaurant) || []

    return { data: restaurants, count: count || 0 }
  } catch (error) {
    console.error('Unexpected error fetching restaurants:', error)
    return { data: [], count: 0, error: 'Unexpected error occurred' }
  }
}

export async function getRestaurantById(id: string): Promise<Restaurant | null> {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching restaurant by ID:', error)
      return null
    }

    return data ? dbRowToRestaurant(data) : null
  } catch (error) {
    console.error('Unexpected error fetching restaurant:', error)
    return null
  }
}

export async function getRestaurantsByLocation(
  latitude: number,
  longitude: number,
  radiusKm: number = 50
): Promise<Restaurant[]> {
  try {
    // Note: This is a simple distance calculation. For more precision, you might want to use PostGIS functions
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .gte('latitude', latitude - (radiusKm / 111)) // Rough conversion: 1 degree ≈ 111km
      .lte('latitude', latitude + (radiusKm / 111))
      .gte('longitude', longitude - (radiusKm / (111 * Math.cos(latitude * Math.PI / 180))))
      .lte('longitude', longitude + (radiusKm / (111 * Math.cos(latitude * Math.PI / 180))))

    if (error) {
      console.error('Error fetching restaurants by location:', error)
      return []
    }

    return data?.map(dbRowToRestaurant) || []
  } catch (error) {
    console.error('Unexpected error fetching restaurants by location:', error)
    return []
  }
}

export async function getFilterOptions() {
  try {
    const [countriesResult, citiesResult, cuisinesResult] = await Promise.all([
      supabase.from('restaurants').select('country').not('country', 'eq', ''),
      supabase.from('restaurants').select('city').not('city', 'eq', ''),
      supabase.from('restaurants').select('cuisine').not('cuisine', 'eq', '')
    ])

    const countries = [...new Set(countriesResult.data?.map((r: any) => r.country) || [])].sort()
    const cities = [...new Set(citiesResult.data?.map((r: any) => r.city) || [])].sort()
    const cuisines = [...new Set(cuisinesResult.data?.map((r: any) => r.cuisine) || [])].sort()

    return { countries, cities, cuisines }
  } catch (error) {
    console.error('Error fetching filter options:', error)
    return { countries: [], cities: [], cuisines: [] }
  }
}