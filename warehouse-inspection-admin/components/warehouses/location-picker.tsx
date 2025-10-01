"use client"

import React, { useCallback, useMemo, useRef, useState } from "react"
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api"
import { Button } from "@/components/ui/button"

export interface LocationResult {
  lat: number
  lng: number
  address?: string
}

interface LocationPickerProps {
  initialLat?: number
  initialLng?: number
  onConfirm: (loc: LocationResult) => void
  onCancel: () => void
  height?: number | string
  onPick?: (loc: LocationResult) => void
}

export default function LocationPicker({
  initialLat,
  initialLng,
  onConfirm,
  onCancel,
  height = 420,
  onPick,
}: LocationPickerProps) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  })

  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  )
  const [address, setAddress] = useState<string | undefined>(undefined)
  const mapRef = useRef<any>(null)

  const defaultCenter = useMemo(() => {
    return position || { lat: 22.9734, lng: 78.6569 }
  }, [position])

  const onMapLoad = useCallback((map: any) => {
    mapRef.current = map
  }, [])

  const onMapClick = useCallback((e: any) => {
    if (!e.latLng) return
    const lat = e.latLng.lat()
    const lng = e.latLng.lng()
    setPosition({ lat, lng })

    // Reverse geocode to fetch a human-readable address
    const g = (window as any).google
    if (g?.maps?.Geocoder) {
      const geocoder = new g.maps.Geocoder()
      geocoder.geocode({ location: { lat, lng } }, (results: any, status: string) => {
        if (status === "OK" && results && results.length > 0) {
          const addr = results[0].formatted_address
          setAddress(addr)
          onPick?.({ lat, lng, address: addr })
        } else {
          // Fallback to OpenStreetMap Nominatim if Google geocoder didn't return an address
          fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
            { headers: { "Accept": "application/json" } })
            .then((r) => r.json())
            .then((data) => {
              const addr = data?.display_name as string | undefined
              if (addr) {
                setAddress(addr)
                onPick?.({ lat, lng, address: addr })
              } else {
                setAddress(undefined)
                onPick?.({ lat, lng })
              }
            })
            .catch(() => {
              setAddress(undefined)
              onPick?.({ lat, lng })
            })
        }
      })
    } else {
      // If Google Maps isn't available, try Nominatim directly
      fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        { headers: { "Accept": "application/json" } })
        .then((r) => r.json())
        .then((data) => {
          const addr = data?.display_name as string | undefined
          if (addr) {
            setAddress(addr)
            onPick?.({ lat, lng, address: addr })
          } else {
            setAddress(undefined)
            onPick?.({ lat, lng })
          }
        })
        .catch(() => {
          onPick?.({ lat, lng })
        })
    }
  }, [])

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        Loading map...
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="rounded-md overflow-hidden border" style={{ height }}>
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={defaultCenter}
          zoom={position ? 14 : 5}
          onLoad={onMapLoad}
          onClick={onMapClick}
          options={{ streetViewControl: false, mapTypeControl: false }}
        >
          {position && <Marker position={position} />}
        </GoogleMap>
      </div>
      <div className="text-sm text-muted-foreground">
        {position ? (
          <div>
            <div>Lat: {position.lat.toFixed(6)}, Lng: {position.lng.toFixed(6)}</div>
            {address && <div className="truncate" title={address}>Address: {address}</div>}
          </div>
        ) : (
          <div>Click on the map to choose a location.</div>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
        <Button
          type="button"
          onClick={() => position && onConfirm({ lat: position.lat, lng: position.lng, address })}
          disabled={!position}
        >
          Use this location
        </Button>
      </div>
    </div>
  )
}
