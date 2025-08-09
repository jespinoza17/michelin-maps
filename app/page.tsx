"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LocateFixed } from "lucide-react"
import CitySearch from "@/components/city-search"
import type { City } from "@/lib/cities"

export default function HomePage() {
  const [query, setQuery] = useState("")
  const [geoBusy, setGeoBusy] = useState(false)
  const [selectedCity, setSelectedCity] = useState<City | null>(null)
  const router = useRouter()

  async function goToMapWithLocation(city?: City) {
    // If a city is provided, use its coordinates instead of geolocation
    if (city) {
      router.push(`/map?ll=${city.latitude},${city.longitude}&l=${encodeURIComponent(city.name)}&cities=${encodeURIComponent(city.name)}&z=11`)
      return
    }

    // Otherwise use geolocation
    if (!navigator.geolocation) {
      router.push("/map?l=near%20me")
      return
    }
    try {
      setGeoBusy(true)
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
      setGeoBusy(false)
    }
  }

  async function handleLocationButtonClick() {
    await goToMapWithLocation()
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
      router.push(`/map?ll=${selectedCity.latitude},${selectedCity.longitude}&l=${encodeURIComponent(selectedCity.name)}&cities=${encodeURIComponent(selectedCity.name)}&z=11`)
    } else {
      // Treat input as a city/country search with cities parameter
      router.push(`/map?l=${encodeURIComponent(q)}&cities=${encodeURIComponent(q)}`)
    }
  }

  return (
    <main className="min-h-dvh bg-gradient-to-b from-fuchsia-50 to-violet-50">
      <section className="container mx-auto px-4 flex min-h-dvh items-center justify-center">
        <div className="w-full max-w-2xl">
          <h1 className="sr-only">Find Michelin restaurants</h1>
          <div className="text-center mb-8">
            <p className="text-2xl md:text-3xl font-semibold text-zinc-900">
              Discover Michelin-starred restaurants worldwide
            </p>
            <p className="mt-2 text-zinc-600">Search by city, country, or use your current location.</p>
          </div>

          <form
            onSubmit={onSubmit}
            className="rounded-2xl bg-white/70 backdrop-blur border border-violet-100 p-3 shadow-sm"
            aria-label="Search Michelin restaurants"
          >
            <div className="flex gap-2">
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
                  placeholder="Find Michelin restaurants near me"
                  className="h-12 text-base"
                />
              </div>
              <Button 
                type="submit" 
                className={`h-12 px-6 ${
                  selectedCity 
                    ? "bg-violet-600 hover:bg-violet-700 text-white" 
                    : "bg-white border border-gray-200 text-violet-600 hover:bg-gray-50"
                }`}
              >
                Search
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 px-3 bg-white/80"
                onClick={handleLocationButtonClick}
                disabled={geoBusy}
                aria-label="Use my location"
              >
                <LocateFixed className="size-5 text-violet-600" />
              </Button>
            </div>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {["Tokyo", "Paris", "New York", "London", "Barcelona"].map((city) => (
              <button
                key={city}
                onClick={() => router.push(`/map?l=${encodeURIComponent(city)}&cities=${encodeURIComponent(city)}`)}
                className="text-sm rounded-full border border-violet-200 bg-white/70 px-3 py-1.5 text-zinc-700 hover:bg-violet-50"
                aria-label={`Search ${city}`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
