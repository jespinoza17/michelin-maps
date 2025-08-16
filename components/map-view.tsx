"use client"

import Map, { Marker, NavigationControl, GeolocateControl } from "react-map-gl/mapbox"
import type { Restaurant } from "@/lib/types"
import { useMemo, useCallback, useRef, useEffect } from "react"
import 'mapbox-gl/dist/mapbox-gl.css'

type Props = {
  restaurants?: Restaurant[]
  city?: string
  center: [number, number]
  zoom?: number
  selectedId?: string
  onMarkerClick?: (r: Restaurant) => void
  onMove?: (center: [number, number], zoom: number) => void
  isLoading?: boolean
}

function starColor(stars: number) {
  if (stars === 3) return "#7c3aed" // violet-600 (premium 3-star)
  if (stars === 2) return "#d946ef" // fuchsia-500 (premium 2-star)
  if (stars === 1) return "#14b8a6" // teal-500 (premium 1-star)
  if (stars === 0) return "#f59e0b" // amber-500 (Bib Gourmand)
  
  return "#14b8a6" // teal-500 (selected restaurants)
}

function createStarMarker(stars: number, selected: boolean) {
  const size = selected ? 40 : 32
  const border = selected ? "3px solid #1e293b" : "2px solid white"
  const shadow = selected 
    ? "0 10px 25px rgba(30, 41, 59, 0.3), 0 4px 10px rgba(0,0,0,0.1)" 
    : "0 6px 15px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1)"
  const bg = `linear-gradient(135deg, ${starColor(stars)}, ${starColor(stars)}dd)`

  // in future we want a logo for selected restaurants and bib gourmand
  const content = stars === -1 ? 'S' : stars === 0 ? 'BG' : stars
  
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontWeight: 600,
        fontSize: selected ? 15 : 13,
        border: border,
        boxShadow: shadow,
        cursor: "pointer",
        transform: selected ? "scale(1.1)" : "scale(1)",
      }}
    >
      {content}
    </div>
  )
}


export default function MapView({
  restaurants = [],
  city,
  center,
  zoom = 2,
  selectedId,
  onMarkerClick,
  onMove,
  isLoading = false,
}: Props) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
  const mapRef = useRef<any>(null)

  const handleMove = useCallback((evt: any) => {
    const { longitude, latitude } = evt.viewState
    const { zoom: newZoom } = evt.viewState
    onMove?.([latitude, longitude], newZoom)
  }, [onMove])

  // Update map view when city changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [center[1], center[0]], // [lng, lat]
        zoom: zoom,
        duration: 1000
      })
    }
  }, [city])

  const positions = useMemo(() => {
    const validRestaurants = restaurants.filter((r) => {
      const hasCoords = r.lat && r.lng
      const isFinite = Number.isFinite(r.lat) && Number.isFinite(r.lng)
      const isValid = hasCoords && isFinite
      
      return isValid
    })
    
    return validRestaurants.map((r) => ({ ...r }))
  }, [restaurants])

  if (!mapboxToken) {
    return (
      <div className="w-full h-[calc(100dvh-56px)] md:h-[calc(100dvh-64px)] flex items-center justify-center bg-gradient-to-br from-blue-100/60 via-slate-100/40 to-indigo-100/50">
        <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-3xl border border-white/30 shadow-lg">
          <p className="text-red-600 font-semibold text-lg">Mapbox access token is missing</p>
          <p className="text-sm text-slate-600 mt-2 font-light">
            Please add your Mapbox access token to the .env.local file
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-[calc(100dvh-56px)] md:h-[calc(100dvh-64px)] relative" suppressHydrationWarning>
      <Map
        ref={mapRef}
        mapboxAccessToken={mapboxToken}
        initialViewState={{
          longitude: center[1],
          latitude: center[0],
          zoom: zoom
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        onMove={handleMove}
      >
        <NavigationControl 
          position="top-right" 
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.5)",
            borderRadius: "12px",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)"
          }}
        />
        <GeolocateControl 
          position="top-right" 
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.5)",
            borderRadius: "12px",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)"
          }}
        />
        
        {!isLoading && positions.map((r) => (
          <Marker
            key={r.id}
            longitude={r.lng}
            latitude={r.lat}
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              onMarkerClick?.(r)
            }}
          >
            {createStarMarker(r.stars, r.id === (selectedId ?? ""))}
          </Marker>
        ))}
      </Map>
      
      {isLoading && (
        <div className="absolute inset-0 bg-white/85 flex items-center justify-center z-10">
          <div className="flex flex-col items-center space-y-4 bg-white rounded-2xl p-6 border border-slate-200 shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-sm text-slate-600 font-light">Loading restaurants...</p>
          </div>
        </div>
      )}
    </div>
  )
}
