"use client"

import "leaflet/dist/leaflet.css"
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
import L, { type DivIcon } from "leaflet"
import type { Restaurant } from "@/lib/types"
import { useEffect, useMemo } from "react"

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

function createStarIcon(stars: number, selected: boolean): DivIcon {
  const size = selected ? 36 : 28
  const border = selected ? "3px solid #7c3aed" : "2px solid white" // violet-600 when selected
  const shadow = selected ? "0 8px 16px rgba(0,0,0,0.25)" : "0 4px 10px rgba(0,0,0,0.2)"
  const bg = starColor(stars)
  const html = `
    <div style="
      width:${size}px;
      height:${size}px;
      border-radius:50%;
      background:${bg};
      display:flex;
      align-items:center;
      justify-content:center;
      color:white;
      font-weight:700;
      font-size:${selected ? 14 : 12}px;
      border:${border};
      box-shadow:${shadow};
    ">${stars}</div>
  `
  return L.divIcon({
    html,
    className: "michelin-star-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  })
}

function MapEvents({
  onMove,
}: {
  onMove?: (center: [number, number], zoom: number) => void
}) {
  useMapEvents({
    moveend: (e) => {
      const m = e.target
      const c = m.getCenter()
      onMove?.([c.lat, c.lng], m.getZoom())
    },
    zoomend: (e) => {
      const m = e.target
      const c = m.getCenter()
      onMove?.([c.lat, c.lng], m.getZoom())
    },
  })
  return null
}

export default function MapView({
  restaurants = [],
  center = [20, 0],
  zoom = 2,
  selectedId,
  onMarkerClick,
  onMove,
}: Props) {
  // Ensure Leaflet knows how to render hi-DPI if needed (no default pngs used)
  useEffect(() => {
    // no-op placeholder for future map theming
  }, [])

  const positions = useMemo(() => restaurants.map((r) => ({ ...r })), [restaurants])

  return (
    <div className="w-full h-[calc(100dvh-56px)] md:h-[calc(100dvh-64px)]">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom style={{ width: "100%", height: "100%" }} worldCopyJump>
        <TileLayer
          attribution={"&copy; OpenStreetMap contributors"}
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents onMove={onMove} />
        {positions.map((r) => (
          <Marker
            key={r.id}
            position={[r.lat, r.lng]}
            icon={createStarIcon(r.stars, r.id === (selectedId ?? ""))}
            eventHandlers={{
              click: () => onMarkerClick?.(r),
            }}
          />
        ))}
      </MapContainer>
    </div>
  )
}
