"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  MapPin,
  Star,
  Filter,
  Search,
  Phone,
  Globe,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  Check,
} from "lucide-react"
import type { Restaurant } from "@/lib/types"
import type { City } from "@/lib/cities"
import CitySearch from "@/components/city-search"
import { findCitiesByName } from "@/lib/cities"
import { trackCitySelection } from "@/lib/mixpanel"

// Dynamically import the Map to avoid SSR issues
const MapView = dynamic(() => import("@/components/map-view"), { ssr: false })

type Filters = {
  stars: number[] // 1..3
  cuisines: string[] // multi
  priceRange: [number, number] // 1..4
  locationQuery: string // matches city or country
  search: string // name contains
}

const DEFAULT_FILTERS: Filters = {
  stars: [-1, 0, 1, 2, 3],  
  cuisines: [],
  priceRange: [1, 4],
  locationQuery: "",
  search: "",
}

export default function AppShell() {
  const [data, setData] = useState<Restaurant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false) // mobile sheet
  const [isSidebarOpen, setIsSidebarOpen] = useState(false) // desktop sidebar
  const [headerSearchValue, setHeaderSearchValue] = useState("")
  const [sidebarSearchValue, setSidebarSearchValue] = useState("")

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const defaultMap = useMemo(() => {
    const cities = searchParams.get("cities")
    if (cities) {
      const cityResults = findCitiesByName(cities)
      const city = cityResults.find((c) => c.name === cities) || cityResults[0]
      return { center: [city.latitude, city.longitude] as [number, number], zoom: 11 }
    }

    // USA center
    const center = [39.8, -98.6] as [number, number]
    const zoom = 2
    return { center, zoom }
  }, [filters.locationQuery])

  const [center, setCenter] = useState<[number, number]>(defaultMap.center)

  const [zoom, setZoom] = useState<number>(defaultMap.zoom)

  // Load from backend API
  useEffect(() => {
    const run = async () => {
      try {
        setIsLoading(true)
        
        // Build query parameters from URL
        const params = new URLSearchParams()
        const cities = searchParams.get("cities")
        const stars = searchParams.get("s")
        const cuisines = searchParams.get("c")
        const price = searchParams.get("p")
        const q = searchParams.get("q")
        
        if (cities) params.set("cities", cities)
        if (stars) params.set("stars", stars)
        if (cuisines) params.set("cuisines", cuisines)
        if (price) params.set("priceLevel", price)
        if (q) params.set("search", q)
        
        const queryString = params.toString()
        const url = queryString ? `/api/restaurants?${queryString}` : "/api/restaurants"
        
        const res = await fetch(url, { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to load")
        const json = (await res.json())
        
        // Handle both possible response structures
        const restaurantData = json.data || json
        
        setData(restaurantData || [])
      } catch (e) {
        toast({ title: "Failed to load data", description: "Please try again later.", variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    }
    run()
  }, [searchParams])

  // Decode initial URL params to restore state (selected, filters, center)
  useEffect(() => {
    const id = searchParams.get("id")
    const stars = searchParams.get("s")
    const cuisines = searchParams.get("c")
    const price = searchParams.get("p")
    const cities = searchParams.get("cities")
    const q = searchParams.get("q")
    const ll = searchParams.get("ll")

    if (ll) {
      const [latStr, lngStr] = ll.split(",")
      const lat = Number.parseFloat(latStr)
      const lng = Number.parseFloat(lngStr)
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        setCenter([lat, lng])
        setZoom(12)
      }
    }

    setSelectedId(id)
    setFilters((prev) => ({
      stars: stars
        ? stars
            .split(",")
            .map((n) => Number.parseInt(n, 10))
            .filter((n) => [-1, 0, 1, 2, 3].includes(n))
        : prev.stars,
      cuisines: cuisines ? cuisines.split(",") : prev.cuisines,
      priceRange: price ? (price.split("-").map((n) => Number.parseInt(n, 10)) as [number, number]) : prev.priceRange,
      locationQuery: cities || prev.locationQuery,
      search: q || prev.search,
    }))

    // If location query exists but no coordinates, try to find and center on city
    if (cities && !ll) {
      const cityResults = findCitiesByName(cities)
        if (cityResults.length > 0) {
          // find the most similar city with the exact name
          const city = cityResults.find((c) => c.name === cities) || cityResults[0]
          setCenter([city.latitude, city.longitude])
          setZoom(11) // Good zoom level for city view
      }
    }
  }, [])


  // Compute filtered list
  const filtered = useMemo(() => {
    if (!Array.isArray(data)) {
      return []
    }
    
    const result = data.filter((r) => {
      const starOk = filters.stars.includes(r.stars)
      const priceOk = r.price_level >= filters.priceRange[0] && r.price_level <= filters.priceRange[1]
      const loc = (r.city + " " + r.country).toLowerCase()
      const locOk = !filters.locationQuery || loc.includes(filters.locationQuery.toLowerCase())
      const nameOk = !filters.search || r.name.toLowerCase().includes(filters.search.toLowerCase())
      return starOk && priceOk && locOk && nameOk
    })

    return result
  }, [data, filters])


  const selected = useMemo(
    () => filtered.find((r) => r.id === selectedId) || (Array.isArray(data) ? data.find((r) => r.id === selectedId) : null) || null,
    [filtered, data, selectedId],
  )

  // Update URL with shareable state
  const pushState = useCallback(
    (next?: Partial<{ id: string | null; filters: Filters }>) => {
      const f = next?.filters ?? filters
      const id = next?.id !== undefined ? next.id : selectedId
      const params = new URLSearchParams(searchParams.toString())
      params.delete("ll")
      params.delete("z")
      params.delete("q") // we don't set name search from this page automatically

      params.delete("id")
      if (id) params.set("id", id)

      params.delete("s")
      if (f.stars.length && f.stars.length < 5) params.set("s", f.stars.join(","))

      params.delete("c")
      if (f.cuisines.length) params.set("c", f.cuisines.join(","))

      params.delete("p")
      if (!(f.priceRange[0] === 1 && f.priceRange[1] === 4)) params.set("p", `${f.priceRange[0]}-${f.priceRange[1]}`)

      params.delete("cities")
      if (f.locationQuery) params.set("cities", f.locationQuery)

      router.replace(`${pathname}?${params.toString()}`)
    },
    [filters, pathname, router, searchParams, selectedId],
  )

  useEffect(() => {
    pushState()
  }, [filters, selectedId, pushState])

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS)
    setSidebarSearchValue("")
  }

  const onSelectRestaurant = (id: string, lat?: number, long?: number) => {
    setSelectedId(id)
    if (lat !== undefined && long !== undefined) {
      setCenter([lat, long])
      setZoom(13)
    }
  }

  const onCitySelect = (city: City) => {
    setCenter([city.latitude, city.longitude])
    setZoom(11)
    setFilters((f) => ({ ...f, locationQuery: city.name }))
  }


  const filteredCount = filtered.length

  return (
    <div className="grid grid-rows-[auto_1fr] min-h-dvh">
      {/* Header with premium glassmorphism styling */}
      <header className="grid grid-cols-[1fr_auto] lg:grid-cols-3 items-center gap-2 lg:gap-4 px-3 lg:px-6 py-3 lg:py-4 sticky top-0 z-40 bg-white/40 backdrop-blur-xl border-b border-white/20 shadow-lg shadow-slate-900/5">
        {/* Left section */}
        <div className="flex items-center gap-1 lg:gap-2 min-w-0 overflow-hidden">
          <MapPin className="size-4 lg:size-5 text-blue-600 flex-shrink-0" aria-hidden="true" />
          <Link href="/" className="flex items-center gap-1 lg:gap-2 hover:opacity-80 transition-all duration-300 min-w-0">
            <h1 className="text-sm lg:text-2xl font-light tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent truncate">Michelin Maps</h1>
          </Link>
          {filters.locationQuery && (
            <span className="text-xs lg:text-lg text-slate-600 font-light tracking-wide whitespace-nowrap">
              {filters.locationQuery}
            </span>
          )}
          <div className="hidden lg:block">
            <Badge variant="secondary" className="ml-2 bg-white/60 backdrop-blur-sm border border-blue-200/50 text-blue-700 whitespace-nowrap rounded-full px-3 py-1 font-light">
              {isLoading ? "Loading..." : `${filteredCount} places`}
            </Badge>
          </div>
        </div>
        
        {/* Mobile badge section */}
        <div className="lg:hidden">
          <Badge variant="secondary" className="text-xs bg-white/60 backdrop-blur-sm border border-blue-200/50 text-blue-700 whitespace-nowrap rounded-full px-2 py-1 font-light">
            {isLoading ? "Loading..." : `${filteredCount} places`}
          </Badge>
        </div>

        {/* Center section - Empty for now */}
        <div className="hidden lg:block"></div>

        {/* Right section */}
        <div className="hidden lg:flex justify-end items-center gap-3">
          <CitySearch
            value={headerSearchValue}
            onChange={setHeaderSearchValue}
            onCitySelect={(city) => {
              onCitySelect(city)
              setHeaderSearchValue("")
              trackCitySelection(city.name, 'header')
            }}
            placeholder="Search cities..."
            className="w-64 bg-white/80 border-white/50 rounded-2xl focus:bg-white focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500/50 placeholder:text-slate-400 font-light tracking-wide transition-colors duration-150"
          />
          
          <AwardFilter
            selectedStars={filters.stars}
            onChange={(stars) => setFilters((f) => ({ ...f, stars }))}
            className="w-48 bg-white/80 backdrop-blur-sm border border-slate-200/50 text-slate-700 hover:bg-white hover:border-blue-300/50 rounded-full font-light tracking-wide transition-all duration-300"
          />

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label={isSidebarOpen ? "Hide filters" : "Show filters"}
            className="bg-white/80 backdrop-blur-sm border border-slate-200/50 text-slate-700 hover:bg-white hover:text-blue-600 hover:border-blue-300/50 rounded-full gap-2 font-light tracking-wide transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
          >
            <Filter className="size-4 text-blue-600" />
            Filters
          </Button>
        </div>

      </header>

      {/* Content */}
      <div className={cn("grid grid-cols-1 h-[calc(100vh-56px)] md:h-[calc(100vh-64px)]", isSidebarOpen ? "lg:grid-cols-[400px_1fr]" : "lg:grid-cols-1")}>
        {/* Sidebar (Desktop) */}
        {isSidebarOpen && (
          <aside className="hidden lg:flex relative flex-col h-full overflow-hidden bg-white/40 backdrop-blur-xl border-r border-white/20 shadow-2xl shadow-slate-900/10">
            {/* Collapse handle on the right edge of the panel (ChatGPT-style) */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Hide filters"
              className="absolute right-2 top-20 z-30 h-8 w-8 rounded-full border border-white/30 bg-white/80 shadow-lg hover:bg-white/90 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors duration-200"
              title="Hide filters"
            >
              <PanelLeftClose className="mx-auto size-4 text-blue-700" />
            </button>

            <div className="p-4 border-b border-white/20">
              <FiltersPanel 
                filters={filters} 
                onChange={setFilters} 
                onReset={resetFilters} 
                onCitySelect={(city) => {
                  onCitySelect(city)
                  setSidebarSearchValue("")
                  trackCitySelection(city.name, 'sidebar')
                }}
                searchInputValue={sidebarSearchValue}
                onSearchInputChange={setSidebarSearchValue}
              />
            </div>
            <div className="flex flex-col min-h-0">
              <div className="p-3 border-b border-white/20 space-y-2">
                <SearchBar
                  value={filters.search}
                  onChange={(v) => setFilters((f) => ({ ...f, search: v }))}
                  placeholder="Search restaurant names..."
                />
                <Button
                  disabled={!filters.locationQuery}
                  className={cn(
                    "w-full rounded-2xl font-light tracking-wide transition-all duration-300 transform hover:scale-105",
                    filters.locationQuery
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                      : "bg-white/60 backdrop-blur-sm border border-slate-200/50 text-slate-400 cursor-not-allowed hover:bg-white/60"
                  )}
                  onClick={() => {
                    // Optional: Add search action here if needed
                    toast({ title: "Search applied", description: `Searching in ${filters.locationQuery}` })
                  }}
                >
                  <Search className="size-4 mr-2" />
                  Search
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 min-h-0">
                <ListPanel
                  items={filtered}
                  selectedId={selectedId}
                  onSelect={(r) => onSelectRestaurant(r.id, r.lat, r.lng)}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </aside>
        )}

        {/* Map and Drawer Card */}
        <div className="relative">
          <MapView
            restaurants={filtered}
            city={filters.locationQuery}
            center={center}
            zoom={zoom}
            selectedId={selectedId ?? undefined}
            onMarkerClick={(r) => onSelectRestaurant(r.id, r.lat, r.lng)}
            onMove={(c, z) => {
              setCenter(c)
              setZoom(z)
            }}
            isLoading={isLoading}
          />
          {!isSidebarOpen && (
            <>
              {/* Show filters button when panel is closed (desktop only) */}
              <div className="hidden lg:block absolute left-3 top-3 z-30">
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(true)}
                  aria-label="Show filters"
                  className="h-10 w-10 rounded-full border border-white/30 bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white/90 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 flex items-center justify-center transition-all duration-300 transform hover:scale-105"
                  title="Show filters"
                >
                  <PanelLeftOpen className="size-4 text-blue-700" />
                </button>
              </div>
            </>
          )}

          {/* Floating search and quick filters on mobile */}
          <div className="absolute left-3 right-3 top-3 z-[30] md:hidden space-y-4">
            <CitySearch
              value={headerSearchValue}
              onChange={setHeaderSearchValue}
              onCitySelect={(city) => {
                onCitySelect(city)
                setHeaderSearchValue("")
                trackCitySelection(city.name, 'mobile')
              }}
              placeholder="Search cities..."
              className="bg-white/90 border border-white/50 rounded-2xl shadow-md w-[80%] font-light tracking-wide"
            />
            <AwardFilter
              selectedStars={filters.stars}
              onChange={(stars) => setFilters((f) => ({ ...f, stars }))}
              className="w-40 bg-white/90 backdrop-blur-sm border border-white/50 text-slate-800 rounded-2xl font-light tracking-wide shadow-lg"
            />
          </div>

          {/* Selected restaurant card (bottom sheet on mobile) */}
          {selected && (
            <div className="absolute left-3 right-3 bottom-3 z-[30] md:left-auto md:right-3 md:bottom-3 md:max-w-sm">
              <RestaurantCard restaurant={selected} onClose={() => setSelectedId(null)} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SearchBar({
  value,
  onChange,
  placeholder,
}: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Search"}
        className="pl-10 bg-white/80 border-white/50 rounded-2xl focus:bg-white focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500/50 placeholder:text-slate-400 font-light tracking-wide transition-colors duration-150"
        aria-label="Search restaurants"
      />
    </div>
  )
}

function FiltersPanel({
  filters,
  onChange,
  onReset,
  onCitySelect,
  searchInputValue,
  onSearchInputChange,
}: {
  filters: { stars: number[]; cuisines: string[]; priceRange: [number, number]; locationQuery: string; search: string }
  onChange: (f: Filters) => void
  onReset: () => void
  onCitySelect: (city: City) => void
  searchInputValue: string
  onSearchInputChange: (value: string) => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-light text-lg tracking-wide bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">Filters</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="px-3 py-1 text-blue-700 hover:text-blue-800 hover:bg-blue-50/50 rounded-full font-light tracking-wide transition-all duration-300"
          aria-label="Reset filters"
        >
          Reset
        </Button>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-light text-slate-700 tracking-wide">Award</Label>
        <AwardFilter
          selectedStars={filters.stars}
          onChange={(stars) => onChange({ ...filters, stars })}
          className="bg-white/80 border-white/50 rounded-2xl focus:bg-white focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500/50 font-light tracking-wide transition-colors duration-150"
        />
      </div>


      <div className="space-y-3">
        <Label className="text-sm font-light text-slate-700 tracking-wide">Price</Label>
        <div className="px-2 py-3 rounded-xl bg-white/40 backdrop-blur-sm border border-white/30">
          <Slider
            min={1}
            max={4}
            step={1}
            value={[filters.priceRange[0], filters.priceRange[1]]}
            onValueChange={(v) => onChange({ ...filters, priceRange: [v[0], v[1]] as [number, number] })}
            className="w-full"
          />
          <div className="flex justify-between mt-2 text-xs text-slate-500 font-light">
            <span>$</span>
            <span>$$</span>
            <span>$$$</span>
            <span>$$$$</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-light text-slate-700 tracking-wide">Location</Label>
        <CitySearch
          value={searchInputValue}
          onChange={onSearchInputChange}
          onCitySelect={onCitySelect}
          placeholder="Search cities..."
          className="bg-white/80 border-white/50 rounded-2xl focus:bg-white focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500/50 placeholder:text-slate-400 font-light tracking-wide transition-colors duration-150"
        />
      </div>
    </div>
  )
}

function ListPanel({
  items,
  selectedId,
  onSelect,
  isLoading,
}: {
  items: Restaurant[]
  selectedId: string | null
  onSelect: (r: Restaurant) => void
  isLoading?: boolean
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-2xl bg-white/40 backdrop-blur-sm border border-white/30 p-4 shadow-sm">
            <div className="h-4 w-1/2 bg-slate-200 rounded-lg" />
            <div className="mt-2 h-3 w-1/3 bg-slate-200 rounded-lg" />
            <div className="mt-2 h-3 w-1/4 bg-slate-200 rounded-lg" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((r) => (
        <button
          key={r.id}
          onClick={() => onSelect(r)}
          className={cn(
            "w-full text-left rounded-2xl p-4 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg",
            selectedId === r.id 
              ? "bg-white/80 backdrop-blur-sm border-2 border-blue-500/50 ring-2 ring-blue-500/20 shadow-lg shadow-blue-500/10" 
              : "bg-white/50 backdrop-blur-sm border border-white/30 hover:bg-white/70 hover:border-blue-300/50 shadow-sm",
          )}
          aria-label={`Select ${r.name}`}
        >
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-slate-900 truncate text-base tracking-wide">{r.name}</div>
              <div className="text-sm text-slate-600 truncate font-light mt-1">
                {r.city}, {r.country}
              </div>
              <div className="mt-3 flex items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500 text-white rounded-full text-xs font-light">
                  {r.stars > 0 && <Star className="size-3 fill-white text-white" />} 
                  {r.stars === -1 ? "Selected" : r.stars === 0 ? "Bib Gourmand" : `${r.stars} Star${r.stars > 1 ? "s" : ""}`}
                </span>
                <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-light">{r.cuisine}</span>
                <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-light">{"$".repeat(Math.max(1, Math.min(4, r.price_level)))}</span>
              </div>
            </div>
          </div>
        </button>
      ))}
      {items.length === 0 && (
        <Card className="bg-white/50 backdrop-blur-sm border border-white/30 rounded-2xl shadow-sm">
          <CardContent className="p-4 text-sm text-slate-600 font-light text-center">No results. Try adjusting your filters.</CardContent>
        </Card>
      )}
    </div>
  )
}

function RestaurantCard({ restaurant, onClose }: { restaurant: Restaurant; onClose: () => void }) {
  // TODO: get image from restaurant.image for all restaurants
  const img = `/placeholder.svg?height=200&width=400&query=michelin%20star%20restaurant%20interior`
  
  return (
    <Card className="bg-white/90 backdrop-blur-xl border border-white/30 shadow-2xl shadow-slate-900/10 rounded-3xl overflow-hidden">
      <CardContent className="p-0">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img}
            alt={`${restaurant.name} image`}
            className="w-full h-40 object-cover rounded-t-3xl"
          />
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm border border-white/30 rounded-full shadow-lg hover:bg-white transition-all duration-300 transform hover:scale-105"
            onClick={onClose}
            aria-label="Close details"
          >
            <X className="size-4" />
          </Button>
          {restaurant.green_star && (
            <Badge className="absolute top-3 left-3 bg-green-600 text-white rounded-full px-3 py-1 font-light shadow-lg">
              Green Star
            </Badge>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="font-semibold text-lg text-slate-900 tracking-wide">{restaurant.name}</div>
              <div className="text-sm text-slate-600 font-light mt-1">
                {restaurant.city}, {restaurant.country}
              </div>
              <div className="text-sm text-slate-500 mt-1 font-light">
                {restaurant.address}
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full px-3 py-1 font-light shadow-lg">
              {restaurant.stars === -1 ? "Selected" : restaurant.stars === 0 ? "Bib Gourmand" : `${restaurant.stars}★`}
            </Badge>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-light">{restaurant.cuisine}</span>
            <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-light">{"$".repeat(Math.max(1, Math.min(4, restaurant.price_level)))}</span>
          </div>
          {restaurant.facilities.length > 0 && (
            <div className="mt-3 text-sm text-slate-500 font-light">
              {restaurant.facilities.slice(0, 3).join(", ")}
              {restaurant.facilities.length > 3 && "..."}
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {restaurant.phone && (
              <Button asChild size="sm" variant="outline" className="bg-white/80 backdrop-blur-sm border border-slate-200/50 text-slate-700 hover:bg-white hover:text-blue-600 hover:border-blue-300/50 rounded-full font-light tracking-wide transition-all duration-300 transform hover:scale-105">
                <a href={`tel:${restaurant.phone}`} aria-label="Call restaurant">
                  <Phone className="size-4 mr-2" />
                  Call
                </a>
              </Button>
            )}
            {restaurant.website && (
              <Button asChild size="sm" variant="outline" className="bg-white/80 backdrop-blur-sm border border-slate-200/50 text-slate-700 hover:bg-white hover:text-blue-600 hover:border-blue-300/50 rounded-full font-light tracking-wide transition-all duration-300 transform hover:scale-105">
                <a href={restaurant.website} target="_blank" rel="noopener noreferrer" aria-label="Visit website">
                  <Globe className="size-4 mr-2" />
                  Website
                </a>
              </Button>
            )}
            <Button asChild size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full font-light tracking-wide transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${restaurant.lat},${restaurant.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Get directions"
              >
                <MapPin className="size-4 mr-2" />
                Directions
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AwardFilter({
  selectedStars,
  onChange,
  className,
}: {
  selectedStars: number[]
  onChange: (stars: number[]) => void
  className?: string
}) {
  const awardOptions = [
    { value: 3, label: "3 Stars" },
    { value: 2, label: "2 Stars" },
    { value: 1, label: "1 Star" },
    { value: 0, label: "Bib Gourmand" },
    { value: -1, label: "Selected Restaurants" },
  ]

  const toggleStar = (starValue: number) => {
    const isSelected = selectedStars.includes(starValue)
    if (isSelected) {
      // Remove the star value
      const newStars = selectedStars.filter(s => s !== starValue)
      onChange(newStars.length > 0 ? newStars : [starValue]) // Prevent empty selection
    } else {
      // Add the star value
      onChange([...selectedStars, starValue].sort((a, b) => b - a))
    }
  }

  const getDisplayText = () => {
    if (selectedStars.length === 5) return "Award"
    if (selectedStars.length === 1) {
      const option = awardOptions.find(opt => opt.value === selectedStars[0])
      return option?.label || "Award"
    }
    return `${selectedStars.length} selected`
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("justify-between", className)}
        >
          {getDisplayText()}
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0 bg-white/95 backdrop-blur-xl border border-white/30 rounded-xl shadow-xl">
        <div className="p-2">
          {awardOptions.map((option) => (
            <div
              key={option.value}
              className="flex items-center space-x-2 rounded-lg p-2 hover:bg-slate-100/50 cursor-pointer"
              onClick={() => toggleStar(option.value)}
            >
              <Checkbox
                checked={selectedStars.includes(option.value)}
                onChange={() => toggleStar(option.value)}
                className="rounded-md"
              />
              <span className="text-sm font-light tracking-wide flex-1">
                {option.label}
              </span>
              {selectedStars.includes(option.value) && (
                <Check className="h-4 w-4 text-blue-600" />
              )}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
