"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LocateFixed, Search } from "lucide-react"

export default function HomePage() {
  const [query, setQuery] = useState("")
  const [geoBusy, setGeoBusy] = useState(false)
  const router = useRouter()

  async function goToMapWithLocation() {
    if (!navigator.geolocation) {
      router.push("/map?l=near%20me")
      return
    }
    try {
      setGeoBusy(true)
      await new Promise<void>((resolve, reject) => {
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    if (q.toLowerCase().includes("near me")) {
      await goToMapWithLocation()
      return
    }
    // Treat input as a city/country search
    router.push(`/map?l=${encodeURIComponent(q)}`)
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-zinc-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Find Michelin restaurants near me"
                  className="pl-10 h-12 text-base"
                  aria-label="Search"
                />
              </div>
              <Button type="submit" className="h-12 px-6 bg-violet-600 hover:bg-violet-700">
                Search
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 px-3 bg-white/80"
                onClick={goToMapWithLocation}
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
                onClick={() => router.push(`/map?l=${encodeURIComponent(city)}`)}
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
