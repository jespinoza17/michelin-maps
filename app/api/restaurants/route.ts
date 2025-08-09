import { NextResponse } from "next/server"
import data from "@/data/restaurants.json"

export async function GET() {
  // In production, replace this with your database query (e.g., Neon + PostGIS or Supabase)
  return NextResponse.json(data)
}
