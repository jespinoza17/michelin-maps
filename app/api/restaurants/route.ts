import { NextResponse } from "next/server"
import { getRestaurants } from "@/lib/supabase/queries"
import type { RestaurantFilters } from "@/lib/supabase/queries"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse filter parameters
    const filters: RestaurantFilters = {}
    
    // Parse stars filter (e.g., ?stars=1,3)
    const starsParam = searchParams.get('stars')
    if (starsParam) {
      filters.stars = starsParam.split(',').map(s => parseInt(s.trim())).filter(s => [-1, 0, 1, 2, 3].includes(s))
    }
    
    // Parse countries filter (e.g., ?countries=France,Italy)
    const countriesParam = searchParams.get('countries')
    if (countriesParam) {
      filters.countries = countriesParam.split(',').map(c => c.trim()).filter(c => c.length > 0)
    }
    
    // Parse cities filter (e.g., ?cities=Paris,Rome)
    const citiesParam = searchParams.get('cities')
    if (citiesParam) {
      filters.cities = citiesParam.split(',').map(c => c.trim()).filter(c => c.length > 0)
    }
    
    // Parse cuisines filter (e.g., ?cuisines=French,Italian)
    const cuisinesParam = searchParams.get('cuisines')
    if (cuisinesParam) {
      filters.cuisines = cuisinesParam.split(',').map(c => c.trim()).filter(c => c.length > 0)
    }
    
    // Parse price level filter (e.g., ?priceLevel=1,2,3)
    const priceLevelParam = searchParams.get('priceLevel')
    if (priceLevelParam) {
      filters.priceLevel = priceLevelParam.split(',').map(p => parseInt(p.trim())).filter(p => [1, 2, 3, 4].includes(p))
    }
    
    // Parse green star filter (e.g., ?greenStar=true)
    const greenStarParam = searchParams.get('greenStar')
    if (greenStarParam !== null) {
      filters.greenStar = greenStarParam.toLowerCase() === 'true'
    }
    
    // Parse search query (e.g., ?search=french restaurant)
    const searchParam = searchParams.get('search')
    if (searchParam && searchParam.trim()) {
      filters.search = searchParam.trim()
    }
    
    // Parse pagination parameters
    const limitParam = searchParams.get('limit')
    const offsetParam = searchParams.get('offset')
    const limit = limitParam ? parseInt(limitParam) : undefined
    const offset = offsetParam ? parseInt(offsetParam) : undefined
    
    // Get restaurants from database
    const result = await getRestaurants(filters, limit, offset)
    
    if (result.error) {
      console.error("Error fetching restaurants:", result.error)
      return NextResponse.json({ error: "Failed to load restaurants" }, { status: 500 })
    }
    
    return NextResponse.json({
      data: result.data,
      count: result.count,
      pagination: {
        limit: limit || null,
        offset: offset || 0,
        total: result.count
      }
    })
  } catch (error) {
    console.error("Unexpected error in restaurants API:", error)
    return NextResponse.json({ error: "Failed to load restaurants" }, { status: 500 })
  }
}
