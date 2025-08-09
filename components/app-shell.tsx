"use client"

import dynamic from "next/dynamic"
import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  MapPin,
  Star,
  Filter,
  Search,
  Share2,
  LocateFixed,
  Phone,
  Globe,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"
import type { Restaurant } from "@/lib/types"

// Dynamically import the Map to avoid SSR issues with Leaflet
const MapView = dynamic(() => import("@/components/map-view"), { ssr: false })

type Filters = {
  stars: number[] // 1..3
  cuisines: string[] // multi
  priceRange: [number, number] // 1..4
  locationQuery: string // matches city or country
  search: string // name contains
}

const DEFAULT_FILTERS: Filters = {
  stars: [1, 2, 3],
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true) // desktop sidebar
  const [center, setCenter] = useState<[number, number]>([20, 0])
  const [zoom, setZoom] = useState<number>(2)

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Load from backend API
  useEffect(() => {
    const run = async () => {
      try {
        setIsLoading(true)
        const res = await fetch("/api/restaurants", { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to load")
        const json = (await res.json()) as Restaurant[]
        setData(json)
      } catch (e) {
        toast({ title: "Failed to load data", description: "Please try again later.", variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    }
    run()
  }, [])

  // Decode initial URL params to restore state (selected, filters, center)
  useEffect(() => {
    const id = searchParams.get("id")
    const stars = searchParams.get("s")
    const cuisines = searchParams.get("c")
    const price = searchParams.get("p")
    const loc = searchParams.get("l")
    const q = searchParams.get("q")
    const ll = searchParams.get("ll")
    const z = searchParams.get("z")

    if (ll) {
      const [latStr, lngStr] = ll.split(",")
      const lat = Number.parseFloat(latStr)
      const lng = Number.parseFloat(lngStr)
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        setCenter([lat, lng])
        setZoom(z ? Math.max(2, Math.min(18, Number.parseInt(z, 10))) : 12)
      }
    }

    setSelectedId(id)
    setFilters((prev) => ({
      stars: stars
        ? stars
            .split(",")
            .map((n) => Number.parseInt(n, 10))
            .filter((n) => [1, 2, 3].includes(n))
        : prev.stars,
      cuisines: cuisines ? cuisines.split(",").map(decodeURIComponent) : prev.cuisines,
      priceRange: price ? (price.split("-").map((n) => Number.parseInt(n, 10)) as [number, number]) : prev.priceRange,
      locationQuery: loc ? decodeURIComponent(loc) : prev.locationQuery,
      search: q ? decodeURIComponent(q) : prev.search,
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // only run once

  // Compute filtered list
  const filtered = useMemo(() => {
    return data.filter((r) => {
      const starOk = filters.stars.includes(r.stars)
      const cuisineOk = filters.cuisines.length === 0 || filters.cuisines.includes(r.cuisine)
      const priceOk = r.price_level >= filters.priceRange[0] && r.price_level <= filters.priceRange[1]
      const loc = (r.city + " " + r.country).toLowerCase()
      const locOk = !filters.locationQuery || loc.includes(filters.locationQuery.toLowerCase())
      const nameOk = !filters.search || r.name.toLowerCase().includes(filters.search.toLowerCase())
      return starOk && cuisineOk && priceOk && locOk && nameOk
    })
  }, [data, filters])

  const cuisines = useMemo(() => {
    const s = new Set<string>()
    data.forEach((r) => s.add(r.cuisine))
    return Array.from(s).sort((a, b) => a.localeCompare(b))
  }, [data])

  const selected = useMemo(
    () => filtered.find((r) => r.id === selectedId) || data.find((r) => r.id === selectedId) || null,
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
      if (f.stars.length && f.stars.length < 3) params.set("s", f.stars.join(","))

      params.delete("c")
      if (f.cuisines.length) params.set("c", f.cuisines.map(encodeURIComponent).join(","))

      params.delete("p")
      if (!(f.priceRange[0] === 1 && f.priceRange[1] === 4)) params.set("p", `${f.priceRange[0]}-${f.priceRange[1]}`)

      params.delete("l")
      if (f.locationQuery) params.set("l", encodeURIComponent(f.locationQuery))

      router.replace(`${pathname}?${params.toString()}`)
    },
    [filters, pathname, router, searchParams, selectedId],
  )

  useEffect(() => {
    pushState()
  }, [filters, selectedId, pushState])

  const resetFilters = () => setFilters(DEFAULT_FILTERS)

  const onSelectRestaurant = (id: string, lat?: number, lng?: number) => {
    setSelectedId(id)
    if (lat !== undefined && lng !== undefined) {
      setCenter([lat, lng])
      setZoom(13)
    }
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link copied",
        description: "Share this URL with others to show your current view and selection.",
      })
    } catch {
      toast({ title: "Could not copy", description: "Please copy the URL from your browser.", variant: "destructive" })
    }
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation not supported", variant: "destructive" })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setCenter([latitude, longitude])
        setZoom(12)
      },
      () => {
        toast({ title: "Location denied", description: "We couldn't access your location.", variant: "destructive" })
      },
    )
  }

  const filteredCount = filtered.length

  return (
    <div className="grid grid-rows-[auto_1fr] min-h-dvh">
      {/* Header with subtle gradient */}
      <header className="flex items-center gap-2 px-4 md:px-6 py-3 border-b sticky top-0 z-40 bg-gradient-to-r from-fuchsia-50 to-violet-50">
        <MapPin className="size-5 text-violet-600" aria-hidden="true" />
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900">Michelin Map</h1>
        <Badge variant="secondary" className="ml-2 bg-violet-100 text-violet-700">
          {isLoading ? "Loading..." : `${filteredCount} places`}
        </Badge>

        <div className="ml-auto flex items-center gap-2">
          {/* Desktop: toggle sidebar */}

          <Button
            variant="outline"
            size="icon"
            onClick={useMyLocation}
            aria-label="Use my location"
            className="bg-white/70"
          >
            <LocateFixed className="size-4 text-violet-600" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleShare}
            aria-label="Copy shareable link"
            className="bg-white/70"
          >
            <Share2 className="size-4 text-violet-600" />
          </Button>

          {/* Mobile: open filters sheet */}
          <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="lg:hidden bg-white/70">
                <Filter className="size-4 mr-2 text-violet-600" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] sm:w-[420px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="py-4">
                <FiltersPanel filters={filters} cuisines={cuisines} onChange={setFilters} onReset={resetFilters} />
                <Separator className="my-4" />
                <p className="text-xs text-zinc-500">Data is loaded from the backend.</p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Content */}
      <div className={cn("grid grid-cols-1 min-h-0", isSidebarOpen ? "lg:grid-cols-[400px_1fr]" : "lg:grid-cols-1")}>
        {/* Sidebar (Desktop) */}
        {isSidebarOpen && (
          <aside className="hidden lg:flex relative flex-col border-r bg-white min-h-0">
            {/* Collapse handle on the right edge of the panel (ChatGPT-style) */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Hide filters"
              className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full border border-zinc-200 bg-white shadow hover:bg-violet-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
              title="Hide filters"
            >
              <PanelLeftClose className="mx-auto size-4 text-violet-700" />
            </button>

            <div className="p-4 border-b">
              <FiltersPanel filters={filters} cuisines={cuisines} onChange={setFilters} onReset={resetFilters} />
            </div>
            <div className="p-3 overflow-y-auto space-y-3 min-h-0">
              <SearchBar
                value={filters.search}
                onChange={(v) => setFilters((f) => ({ ...f, search: v }))}
                placeholder="Search by name"
              />
              <ListPanel
                items={filtered}
                selectedId={selectedId}
                onSelect={(r) => onSelectRestaurant(r.id, r.lat, r.lng)}
                isLoading={isLoading}
              />
            </div>
          </aside>
        )}

        {/* Map and Drawer Card */}
        <div className="relative">
          <MapView
            restaurants={filtered}
            center={center}
            zoom={zoom}
            selectedId={selectedId ?? undefined}
            onMarkerClick={(r) => onSelectRestaurant(r.id, r.lat, r.lng)}
            onMove={(c, z) => {
              setCenter(c)
              setZoom(z)
            }}
          />
          {!isSidebarOpen && (
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Show filters"
              className="hidden lg:flex items-center justify-center absolute left-3 top-1/2 -translate-y-1/2 z-30 h-9 w-9 rounded-full border border-zinc-200 bg-white shadow hover:bg-violet-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
              title="Show filters"
            >
              <PanelLeftOpen className="size-4 text-violet-700" />
            </button>
          )}

          {/* Floating search and quick filters on mobile */}
          <div className="absolute left-3 right-3 top-3 z-[30] md:hidden space-y-2">
            <div className="flex gap-2">
              <SearchBar
                value={filters.search}
                onChange={(v) => setFilters((f) => ({ ...f, search: v }))}
                placeholder="Search by name"
              />
              <Button variant="outline" onClick={() => setIsFiltersOpen(true)} className="bg-white/80">
                <Filter className="size-4 mr-2 text-violet-600" />
                Filters
              </Button>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {[1, 2, 3].map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={filters.stars.includes(s) ? "default" : "outline"}
                  className={cn(
                    filters.stars.includes(s)
                      ? "bg-violet-600 hover:bg-violet-700 text-white"
                      : "bg-white/80 text-zinc-800",
                  )}
                  onClick={() =>
                    setFilters((f) => {
                      const included = f.stars.includes(s)
                      const nextStars = included ? f.stars.filter((x) => x !== s) : [...f.stars, s]
                      return { ...f, stars: nextStars.length ? nextStars : [s] }
                    })
                  }
                >
                  <Star className="size-3 mr-1 fill-yellow-400 text-yellow-400" />
                  {s}
                </Button>
              ))}
            </div>
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
      <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Search"}
        className="pl-8"
        aria-label="Search restaurants"
      />
    </div>
  )
}

function FiltersPanel({
  filters,
  cuisines,
  onChange,
  onReset,
}: {
  filters: { stars: number[]; cuisines: string[]; priceRange: [number, number]; locationQuery: string; search: string }
  cuisines: string[]
  onChange: (f: Filters) => void
  onReset: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Filters</h2>
      </div>
      {/* Reset under the heading on the left */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="px-0 text-violet-700 hover:text-violet-800 hover:bg-transparent"
          aria-label="Reset filters"
        >
          Reset
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Stars</Label>
        <div className="flex gap-3">
          {[1, 2, 3].map((s) => (
            <label key={s} className="inline-flex items-center gap-2">
              <Checkbox
                checked={filters.stars.includes(s)}
                onCheckedChange={(checked) => {
                  onChange({
                    ...filters,
                    stars: checked
                      ? Array.from(new Set([...filters.stars, s])).sort()
                      : filters.stars.filter((x) => x !== s),
                  })
                }}
                aria-label={`${s} star${s > 1 ? "s" : ""}`}
              />
              <span className="text-sm flex items-center gap-1">
                <Star className="size-3 fill-yellow-400 text-yellow-400" /> {s}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Cuisine</Label>
        <div className="grid grid-cols-2 gap-2">
          {cuisines.map((c) => (
            <label key={c} className="flex items-center gap-2">
              <Checkbox
                checked={filters.cuisines.includes(c)}
                onCheckedChange={(checked) => {
                  onChange({
                    ...filters,
                    cuisines: checked ? [...filters.cuisines, c] : filters.cuisines.filter((x) => x !== c),
                  })
                }}
              />
              <span className="text-sm">{c}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Price</Label>
        <div className="px-1">
          <Slider
            min={1}
            max={4}
            step={1}
            value={[filters.priceRange[0], filters.priceRange[1]]}
            onValueChange={(v) => onChange({ ...filters, priceRange: [v[0], v[1]] as [number, number] })}
          />
          <div className="flex justify-between mt-1 text-xs text-zinc-500">
            <span>$</span>
            <span>$$</span>
            <span>$$$</span>
            <span>$$$$</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Location</Label>
        <Input
          value={filters.locationQuery}
          onChange={(e) => onChange({ ...filters, locationQuery: e.target.value })}
          placeholder="City or country"
          aria-label="Filter by city or country"
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
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-md border border-zinc-200 p-3">
            <div className="h-4 w-1/2 bg-zinc-200 rounded" />
            <div className="mt-2 h-3 w-1/3 bg-zinc-200 rounded" />
            <div className="mt-2 h-3 w-1/4 bg-zinc-200 rounded" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((r) => (
        <button
          key={r.id}
          onClick={() => onSelect(r)}
          className={cn(
            "w-full text-left rounded-md border p-3 hover:bg-violet-50/60 transition",
            selectedId === r.id ? "border-violet-600 ring-2 ring-violet-100" : "border-zinc-200",
          )}
          aria-label={`Select ${r.name}`}
        >
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <div className="font-medium truncate">{r.name}</div>
              <div className="text-xs text-zinc-500 truncate">
                {r.city}, {r.country}
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1">
                  <Star className="size-3 fill-yellow-400 text-yellow-400" /> {r.stars}
                </span>
                <span className="text-zinc-400">•</span>
                <span>{r.cuisine}</span>
                <span className="text-zinc-400">•</span>
                <span>{"$".repeat(Math.max(1, Math.min(4, r.price_level)))}</span>
              </div>
            </div>
          </div>
        </button>
      ))}
      {items.length === 0 && (
        <Card>
          <CardContent className="p-4 text-sm text-zinc-600">No results. Try adjusting your filters.</CardContent>
        </Card>
      )}
    </div>
  )
}

function RestaurantCard({ restaurant, onClose }: { restaurant: Restaurant; onClose: () => void }) {
  const img =
    restaurant.image_url || `/placeholder.svg?height=200&width=400&query=michelin%20star%20restaurant%20interior`
  return (
    <Card className="shadow-lg border-violet-200">
      <CardContent className="p-0">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img || "/placeholder.svg"}
            alt={`${restaurant.name} image`}
            className="w-full h-40 object-cover rounded-t-md"
          />
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-2 right-2 bg-white/80"
            onClick={onClose}
            aria-label="Close details"
          >
            <X className="size-4" />
          </Button>
        </div>
        <div className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-semibold">{restaurant.name}</div>
              <div className="text-xs text-zinc-500">
                {restaurant.city}, {restaurant.country}
              </div>
            </div>
            <Badge className="bg-violet-600">{restaurant.stars}★</Badge>
          </div>
          <div className="mt-2 text-sm text-zinc-700">
            {restaurant.cuisine} • {"$".repeat(Math.max(1, Math.min(4, restaurant.price_level)))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {restaurant.phone && (
              <Button asChild size="sm" variant="outline">
                <a href={`tel:${restaurant.phone}`} aria-label="Call restaurant">
                  <Phone className="size-4 mr-2" />
                  Call
                </a>
              </Button>
            )}
            {restaurant.website && (
              <Button asChild size="sm" variant="outline">
                <a href={restaurant.website} target="_blank" rel="noopener noreferrer" aria-label="Visit website">
                  <Globe className="size-4 mr-2" />
                  Website
                </a>
              </Button>
            )}
            <Button asChild size="sm" className="bg-violet-600 hover:bg-violet-700">
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
