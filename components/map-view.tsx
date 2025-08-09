"use client"

import Map, { Marker, NavigationControl, GeolocateControl } from "react-map-gl/mapbox"
import type { Restaurant } from "@/lib/types"
import { useMemo, useCallback } from "react"
import 'mapbox-gl/dist/mapbox-gl.css'

type Props = {
  restaurants?: Restaurant[]
  center?: [number, number]
  zoom?: number
  selectedId?: string
  onMarkerClick?: (r: Restaurant) => void
  onMove?: (center: [number, number], zoom: number) => void
}

function starColor(stars: number) {
  if (stars === 3) return "#7c3aed" // violet-600
  if (stars === 2) return "#d946ef" // fuchsia-500
  return "#14b8a6" // teal-500
}

function createStarMarker(stars: number, selected: boolean) {
  const size = selected ? 36 : 28
  const border = selected ? "3px solid #7c3aed" : "2px solid white" // violet-600 when selected
  const shadow = selected ? "0 8px 16px rgba(0,0,0,0.25)" : "0 4px 10px rgba(0,0,0,0.2)"
  const bg = starColor(stars)
  
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
        fontWeight: 700,
        fontSize: selected ? 14 : 12,
        border: border,
        boxShadow: shadow,
        cursor: "pointer",
      }}
    >
      {stars}
    </div>
  )
}


export default function MapView({
  restaurants = [],
  center = [20, 0],
  zoom = 2,
  selectedId,
  onMarkerClick,
  onMove,
}: Props) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

  const handleMove = useCallback((evt: any) => {
    const { longitude, latitude } = evt.viewState
    const { zoom: newZoom } = evt.viewState
    onMove?.([latitude, longitude], newZoom)
  }, [onMove])

  const positions = useMemo(() => restaurants.map((r) => ({ ...r })), [restaurants])

  if (!mapboxToken) {
    return (
      <div className="w-full h-[calc(100dvh-56px)] md:h-[calc(100dvh-64px)] flex items-center justify-center bg-gray-100">
        <div className="text-center p-4">
          <p className="text-red-600 font-semibold">Mapbox access token is missing</p>
          <p className="text-sm text-gray-600 mt-2">
            Please add your Mapbox access token to the .env.local file
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-[calc(100dvh-56px)] md:h-[calc(100dvh-64px)]" suppressHydrationWarning>
      <Map
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
        <NavigationControl position="top-right" />
        <GeolocateControl position="top-right" />
        
        {positions.map((r) => (
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
    </div>
  )
}
