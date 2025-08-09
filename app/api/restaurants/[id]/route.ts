import { NextResponse } from "next/server"
import { getRestaurantById } from "@/lib/supabase/queries"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const restaurant = await getRestaurantById(params.id)
    
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 })
    }
    
    return NextResponse.json(restaurant)
  } catch (error) {
    console.error("Error fetching restaurant:", error)
    return NextResponse.json({ error: "Failed to load restaurant" }, { status: 500 })
  }
}