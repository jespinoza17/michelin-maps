import { NextResponse } from "next/server"
import rawData from "@/data/restaurants_v2.json"
import type { RestaurantRaw, Restaurant } from "@/lib/types"

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

function generateId(name: string, index: number): string {
  const baseId = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 50)
  return `${baseId}-${index}`
}

function transformRestaurant(raw: RestaurantRaw, index: number): Restaurant {
  const { city, country } = parseLocation(raw.Location)
  
  return {
    id: generateId(raw.Name, index),
    name: raw.Name,
    address: raw.Address,
    location: raw.Location,
    stars: parseStars(raw.Award),
    cuisine: raw.Cuisine,
    price_level: parsePriceLevel(raw.Price),
    lat: parseFloat(raw.Latitude),
    lng: parseFloat(raw.Longitude),
    city,
    country,
    phone: raw.PhoneNumber || undefined,
    website: raw.WebsiteUrl || undefined,
    michelinUrl: raw.Url || undefined,
    greenStar: raw.GreenStar === "1",
    facilities: raw.FacilitiesAndServices ? raw.FacilitiesAndServices.split(",").map(f => f.trim()) : [],
    description: raw.Description
  }
}

export async function GET() {
  try {
    const transformedData = (rawData as RestaurantRaw[]).map((raw, index) => transformRestaurant(raw, index))
    return NextResponse.json(transformedData)
  } catch (error) {
    console.error("Error transforming restaurant data:", error)
    return NextResponse.json({ error: "Failed to load restaurants" }, { status: 500 })
  }
}
