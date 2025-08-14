"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"
import CitySearch from "@/components/city-search"
import type { City } from "@/lib/cities"
import { trackCitySelection } from "@/lib/mixpanel"

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
    trackCitySelection(city.name, 'header')
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
      {/* Premium cinematic background with travel inspiration */}
      <div className="absolute inset-0">
        {/* Base gradient layer - premium travel colors with enhanced blues */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/60 via-slate-100/40 to-indigo-100/50"></div>
        
        {/* Animated gradient overlay - breathing effect with stronger blues */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-200/30 via-amber-100/15 to-indigo-200/25 animate-gradient-travel"></div>
        <div className="absolute inset-0 bg-gradient-to-bl from-amber-100/20 via-sky-100/15 to-blue-200/30 animate-gradient-counter"></div>
        
        {/* Large floating world-inspired shapes - responsive sizing with enhanced blues */}
        <div className="absolute -top-40 md:-top-60 -right-40 md:-right-60 w-64 h-64 md:w-96 md:h-96 bg-gradient-to-br from-blue-400/25 to-indigo-400/20 rounded-full blur-3xl animate-orbit-slow"></div>
        <div className="absolute -bottom-40 md:-bottom-60 -left-40 md:-left-60 w-80 h-80 md:w-[30rem] md:h-[30rem] bg-gradient-to-tr from-sky-300/15 to-blue-400/20 rounded-full blur-3xl animate-drift-gentle"></div>
        
        {/* Medium floating elements - travel routes inspiration with more blue */}
        <div className="absolute top-1/4 right-1/3 w-28 h-28 md:w-40 md:h-40 bg-gradient-to-r from-blue-300/30 to-indigo-300/25 rounded-full blur-2xl animate-breathe-slow"></div>
        <div className="absolute bottom-1/3 left-1/4 w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-sky-300/25 to-blue-300/20 rounded-full blur-xl animate-float-vertical"></div>
        
        {/* Small accent particles - like distant destinations with blue emphasis */}
        <div className="hidden md:block absolute top-20 left-1/3 w-16 h-16 bg-gradient-to-r from-blue-400/30 to-indigo-400/25 rounded-full blur-lg animate-twinkle"></div>
        <div className="absolute top-2/3 right-1/4 w-16 h-16 md:w-20 md:h-20 bg-gradient-to-bl from-blue-400/30 to-sky-400/25 rounded-full blur-lg animate-pulse-gentle"></div>
        <div className="hidden md:block absolute bottom-1/4 left-2/3 w-12 h-12 bg-gradient-to-tr from-indigo-400/25 to-blue-400/30 rounded-full blur-md animate-drift-micro"></div>
        
        {/* Subtle travel path lines with enhanced blue tones */}
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent animate-travel-line"></div>
        <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-400/35 to-transparent animate-travel-line-reverse"></div>
        
        {/* Foreground overlay for optimal content legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/8 via-white/4 to-white/6"></div>
        <div className="absolute inset-0 backdrop-blur-[0.8px]"></div>
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
            className="group relative rounded-3xl bg-white/40 backdrop-blur-xl border border-white/20 p-4 md:p-6 shadow-2xl shadow-slate-900/5 hover:shadow-slate-900/10 transition-all duration-500 hover:bg-white/50 z-50"
            aria-label="Search Michelin restaurants"
          >
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <div className="relative flex-1 z-50">
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
          <div className="mt-8 md:mt-12 flex flex-wrap items-center justify-center gap-3 md:gap-4 relative z-0">
            <p className="text-sm md:text-base text-slate-400 font-light mb-4 md:mb-6 w-full text-center tracking-wide">Popular destinations</p>
            {["Tokyo", "Paris", "New York", "London", "Barcelona", "Hong Kong"].map((city) => (
              <button
                key={city}
                onClick={() => {
                  trackCitySelection(city, 'header')
                  router.push(`/map?cities=${encodeURIComponent(city)}`)
                }}
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
