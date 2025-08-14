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
    <main className="min-h-dvh relative overflow-hidden">
      {/* Premium gradient background with abstract shapes */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-slate-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-gradient-to-br from-indigo-300/30 to-blue-300/30 rounded-full blur-2xl"></div>
      </div>
      
      <section className="relative container mx-auto px-6 flex min-h-dvh items-center justify-center">
        <div className="w-full max-w-4xl">
          <h1 className="sr-only">Find Michelin restaurants</h1>
          
          {/* Premium header with enhanced spacing and typography */}
          <div className="text-center mb-16">
            <div className="mb-8">
              <h2 className="text-5xl md:text-7xl font-light tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-4">
                Michelin Maps
              </h2>
              <p className="text-2xl md:text-3xl font-light text-slate-600 tracking-wide">
                Discover exceptional dining worldwide
              </p>
            </div>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed font-light">
              Find Michelin-starred restaurants, Bib Gourmand selections, and recommended establishments in cities around the globe.
            </p>
          </div>

          {/* Premium glassmorphism search bar */}
          <form
            onSubmit={onSubmit}
            className="group relative rounded-3xl bg-white/40 backdrop-blur-xl border border-white/20 p-4 md:p-6 shadow-2xl shadow-slate-900/5 hover:shadow-slate-900/10 transition-all duration-500 hover:bg-white/50"
            aria-label="Search Michelin restaurants"
          >
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
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
                  className="h-14 md:h-16 text-lg md:text-xl rounded-2xl border-0 bg-white/60 backdrop-blur-sm focus:bg-white/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 placeholder:text-slate-400 font-light tracking-wide shadow-inner transition-all duration-300"
                />
              </div>
              <div className="flex gap-3">
                <Button 
                  type="submit" 
                  className={`flex-1 sm:flex-none h-14 md:h-16 px-6 md:px-10 rounded-2xl font-medium text-base md:text-lg tracking-wide transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                    selectedCity 
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40" 
                      : "bg-white/80 backdrop-blur-sm border border-slate-200/50 text-slate-700 hover:bg-white hover:text-blue-600 hover:border-blue-300/50 shadow-sm"
                  }`}
                >
                  Search
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-14 md:h-16 px-4 md:px-5 rounded-2xl bg-white/60 backdrop-blur-sm border-slate-200/50 hover:bg-white/80 hover:border-blue-300/50 transition-all duration-300 transform hover:scale-105 hover:shadow-lg group"
                  onClick={() => router.push('/map')}
                  aria-label="Go to map"
                >
                  <Globe className="size-6 md:size-7 text-slate-600 group-hover:text-blue-600 transition-colors duration-300" />
                </Button>
              </div>
            </div>
          </form>

          {/* Premium pill-shaped city buttons */}
          <div className="mt-8 md:mt-12 flex flex-wrap items-center justify-center gap-3 md:gap-4 z-10">
            <p className="text-sm md:text-base text-slate-400 font-light mb-4 md:mb-6 w-full text-center tracking-wide">Popular destinations</p>
            {["Tokyo", "Paris", "New York", "London", "Barcelona", "Hong Kong"].map((city) => (
              <button
                key={city}
                onClick={() => router.push(`/map?cities=${encodeURIComponent(city)}`)}
                className="group relative overflow-hidden rounded-full border border-slate-200/50 bg-white/50 backdrop-blur-sm px-6 md:px-8 py-3 md:py-4 text-sm md:text-base text-slate-600 font-light tracking-wide transition-all duration-300 hover:bg-white/80 hover:border-blue-300/50 hover:text-blue-600 hover:shadow-lg hover:shadow-blue-500/10 transform hover:scale-105 hover:-translate-y-0.5"
                aria-label={`Search ${city}`}
              >
                <span className="relative z-10">{city}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 via-blue-50/50 to-blue-50/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            ))}
          </div>

          {/* Refined branding */}
          <div className="mt-12 md:mt-16 text-center">
            <div className="inline-flex items-center gap-2 md:gap-3 text-sm md:text-base text-slate-400 font-light tracking-wide">
              <div className="w-2 h-2 md:w-3 md:h-3 bg-gradient-to-r from-blue-500/60 to-indigo-500/60 rounded-full shadow-sm"></div>
              <span>Powered by Michelin Guide data</span>
              <div className="w-2 h-2 md:w-3 md:h-3 bg-gradient-to-r from-indigo-500/60 to-blue-500/60 rounded-full shadow-sm"></div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
