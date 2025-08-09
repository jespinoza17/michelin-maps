import { supabase } from './client'
import rawData from '@/data/restaurants_v2.json'
import type { RestaurantRaw } from '@/lib/types'

function parseStars(award: string): 1 | 2 | 3 {
  if (award.includes("3 Stars") || award.includes("3 Star")) return 3
  if (award.includes("2 Stars") || award.includes("2 Star")) return 2
  return 1
}

function parsePriceLevel(price: string): 1 | 2 | 3 | 4 {
  const euroCount = (price.match(/€/g) || []).length
  return Math.min(Math.max(euroCount, 1), 4) as 1 | 2 | 3 | 4
}

function parseLocation(location: string): { city: string; country: string } {
  const parts = location.split(", ")
  if (parts.length >= 2) {
    return {
      city: parts[0],
      country: parts[parts.length - 1]
    }
  }
  return { city: location, country: "" }
}

function transformRestaurantForDb(raw: RestaurantRaw) {
  const { city, country } = parseLocation(raw.Location)
  
  return {
    name: raw.Name,
    address: raw.Address,
    location: raw.Location,
    city,
    country,
    stars: parseStars(raw.Award),
    cuisine: raw.Cuisine,
    price_level: parsePriceLevel(raw.Price),
    latitude: parseFloat(raw.Latitude),
    longitude: parseFloat(raw.Longitude),
    phone: raw.PhoneNumber || null,
    website: raw.WebsiteUrl || null,
    michelin_url: raw.Url || null,
    green_star: raw.GreenStar === "1",
    facilities: raw.FacilitiesAndServices ? raw.FacilitiesAndServices.split(",").map(f => f.trim()) : null,
    description: raw.Description
  }
}

export async function seedRestaurants() {
  try {
    console.log('Starting restaurant data seeding...')
    
    // Transform the data
    const restaurantsToInsert = (rawData as RestaurantRaw[]).map(transformRestaurantForDb)
    
    // Clear existing data (optional - comment out if you want to keep existing data)
    const { error: deleteError } = await supabase
      .from('restaurants')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all rows
    
    if (deleteError) {
      console.warn('Error clearing existing data:', deleteError)
    }
    
    // Insert new data in batches (Supabase has a limit on batch size)
    const batchSize = 100
    for (let i = 0; i < restaurantsToInsert.length; i += batchSize) {
      const batch = restaurantsToInsert.slice(i, i + batchSize)
      
      const { error } = await supabase
        .from('restaurants')
        .insert(batch)
      
      if (error) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, error)
        throw error
      }
      
      console.log(`Inserted batch ${i / batchSize + 1} (${batch.length} restaurants)`)
    }
    
    console.log(`Successfully seeded ${restaurantsToInsert.length} restaurants`)
    
    // Verify the data was inserted
    const { count, error: countError } = await supabase
      .from('restaurants')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('Error counting restaurants:', countError)
    } else {
      console.log(`Total restaurants in database: ${count}`)
    }
    
    return { success: true, count: restaurantsToInsert.length }
  } catch (error) {
    console.error('Error seeding restaurants:', error)
    return { success: false, error }
  }
}

// Export individual functions for flexibility
export async function clearRestaurants() {
  const { error } = await supabase
    .from('restaurants')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
  
  if (error) {
    throw error
  }
  
  console.log('All restaurants cleared from database')
}

export async function getRestaurantCount() {
  const { count, error } = await supabase
    .from('restaurants')
    .select('*', { count: 'exact', head: true })
  
  if (error) {
    throw error
  }
  
  return count
}