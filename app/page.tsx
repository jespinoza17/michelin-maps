"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"
import CitySearch from "@/components/city-search"
import type { City } from "@/lib/cities"

export default function HomePage() {
  const [query, setQuery] = useState("")
  const [selectedCity, setSelectedCity] = useState<City | null>(null)
  const router = useRouter()

  async function goToMapWithLocation(city?: City) {
    // If a city is provided, use its coordinates instead of geolocation
    if (city) {
      router.push(`/map?ll=${city.latitude},${city.longitude}&cities=${encodeURIComponent(city.name)}&z=11`)
      return
    }

    // Otherwise use geolocation
    if (!navigator.geolocation) {
      router.push("/map?l=near%20me")
      return
    }
    try {
      await new Promise<void>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords
            router.push(`/map?ll=${latitude.toFixed(5)},${longitude.toFixed(5)}&z=12`)
            resolve()
          },
          () => {
            router.push("/map?l=near%20me")
            resolve()
          },
          { enableHighAccuracy: true, timeout: 7000 },
        )
      })
    } finally {
      // No longer using geoBusy state
    }
  }

  function onCitySelect(city: City) {
    setSelectedCity(city)
    setQuery(city.name)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    if (q.toLowerCase().includes("near me")) {
      await goToMapWithLocation()
      return
    }
    // If a city was selected, use its coordinates and location with cities parameter for API
    if (selectedCity) {
      router.push(`/map?ll=${selectedCity.latitude},${selectedCity.longitude}&cities=${encodeURIComponent(selectedCity.name)}&z=11`)
    } else {
      // Treat input as a city/country search with cities parameter
      router.push(`/map?cities=${encodeURIComponent(q)}`)
    }
  }

  return (
    <main className="min-h-dvh bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-100">
      <section className="container mx-auto px-4 flex min-h-dvh items-center justify-center">
        <div className="w-full max-w-3xl">
          <h1 className="sr-only">Find Michelin restaurants</h1>
          <div className="text-center mb-12">
            <div className="mb-4">
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 bg-clip-text text-transparent">
                Michelin Maps
              </h2>
              <p className="text-xl md:text-2xl font-medium text-slate-700 mt-2">
                Discover exceptional dining worldwide
              </p>
            </div>
            <p className="text-base text-slate-600 max-w-xl mx-auto">
              Find Michelin-starred restaurants, Bib Gourmand selections, and recommended establishments in cities around the globe.
            </p>
          </div>

          <form
            onSubmit={onSubmit}
            className="rounded-3xl bg-white/80 backdrop-blur-md border border-blue-100/50 p-4 shadow-xl shadow-blue-100/20"
            aria-label="Search Michelin restaurants"
          >
            <div className="flex gap-3">
              <div className="relative flex-1">
                <CitySearch
                  value={query}
                  onChange={(value) => {
                    setQuery(value)
                    // Clear selected city if user manually types
                    if (selectedCity && value !== selectedCity.name) {
                      setSelectedCity(null)
                    }
                  }}
                  onCitySelect={onCitySelect}
                  placeholder="Search by city or country..."
                  className="h-14 text-lg rounded-2xl border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <Button 
                type="submit" 
                className={`h-14 px-8 rounded-2xl font-semibold transition-all duration-200 ${
                  selectedCity 
                    ? "bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white shadow-lg shadow-blue-200" 
                    : "bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
                }`}
              >
                Search
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-14 px-4 rounded-2xl bg-white/90 border-slate-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                onClick={() => router.push('/map')}
                aria-label="Go to map"
              >
                <Globe className="size-6 text-blue-600" />
              </Button>
            </div>
          </form>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <p className="text-sm text-slate-500 font-medium mb-2 w-full text-center">Popular destinations</p>
            {["Tokyo", "Paris", "New York", "London", "Barcelona", "Hong Kong"].map((city) => (
              <button
                key={city}
                onClick={() => router.push(`/map?cities=${encodeURIComponent(city)}`)}
                className="text-sm rounded-2xl border border-blue-200/60 bg-white/80 backdrop-blur-sm px-4 py-2.5 text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200 font-medium"
                aria-label={`Search ${city}`}
              >
                {city}
              </button>
            ))}
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-slate-500">
              <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-sky-400 rounded-full"></div>
              <span>Powered by Michelin Guide data</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
