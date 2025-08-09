import { NextResponse } from "next/server"
import { seedRestaurants } from "@/lib/supabase/seed"

export async function POST() {
  try {
    // Only allow seeding in development environment
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Seeding not allowed in production" }, { status: 403 })
    }
    
    const result = await seedRestaurants()
    
    if (!result.success) {
      console.error("Seeding failed:", result.error)
      return NextResponse.json({ error: "Failed to seed restaurants" }, { status: 500 })
    }
    
    return NextResponse.json({ 
      message: "Successfully seeded restaurants",
      count: result.count 
    })
  } catch (error) {
    console.error("Error in seed endpoint:", error)
    return NextResponse.json({ error: "Failed to seed restaurants" }, { status: 500 })
  }
}