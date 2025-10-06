"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { GoogleMap, useLoadScript, MarkerF, InfoWindow } from "@react-google-maps/api"
import { Button } from "@/components/ui/button"
import { Loader2, MapPin, X, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogPortal,
  DialogOverlay
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

type LatLngLiteral = {
  lat: number
  lng: number
  address?: string
}

export interface GoogleMapComponentProps {
  onLocationSelect: (lat: number, lng: number, address?: string) => void
  initialPosition?: LatLngLiteral
  className?: string
  buttonText?: string
}

import type { Libraries } from "@react-google-maps/api"

const libraries: Libraries = ["places"]

export function GoogleMapComponent({
  onLocationSelect,
  initialPosition,
  className = "h-[400px] w-full rounded-lg",
  buttonText = "Open Map"
}: GoogleMapComponentProps) {
  const [selectedPosition, setSelectedPosition] = useState<LatLngLiteral | null>(
    initialPosition || null
  )
  const [temporaryPosition, setTemporaryPosition] = useState<LatLngLiteral | null>(null)
  const [temporaryAddress, setTemporaryAddress] = useState<string>("")
  const [address, setAddress] = useState<string>("")
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  })

  const center = useMemo<LatLngLiteral>(
    () => selectedPosition || { lat: 20.5937, lng: 78.9629 },
    [selectedPosition]
  )

  const mapOptions = useMemo<google.maps.MapOptions>(
    () => ({
      disableDefaultUI: false,
      clickableIcons: true,
      scrollwheel: true,
      zoomControl: true,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    }),
    []
  )

  // Initialize geocoder when the component mounts and Google Maps is loaded
  useEffect(() => {
    if (isLoaded && window.google) {
      setGeocoder(new window.google.maps.Geocoder())
    }
  }, [isLoaded])

  const getAddressFromLatLng = useCallback(
    async (lat: number, lng: number): Promise<string> => {
      if (!geocoder) return `${lat.toFixed(6)}, ${lng.toFixed(6)}`

      try {
        const response = await new Promise<google.maps.GeocoderResponse>((resolve, reject) => {
          geocoder.geocode(
            { 
              location: { lat, lng },
              language: 'en',
              region: 'in'
            },
            (results, status) => {
              if (status === 'OK' && results && results.length > 0) {
                resolve({ results });
              } else {
                reject(new Error('No results found'));
              }
            }
          );
        });

        // Try to get the most detailed address possible
        const result = response.results[0];
        if (result) {
          // First try formatted_address
          if (result.formatted_address) {
            return result.formatted_address;
          }
          
          // If no formatted_address, try to build it from address_components
          if (result.address_components) {
            return result.address_components
              .map(component => component.long_name)
              .filter(Boolean)
              .join(', ');
          }
        }
        
        // Fallback to coordinates if we can't get an address
        return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      } catch (error) {
        console.error("Error getting address:", error);
        return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      }
    },
    [geocoder]
  )

  const handleMapClick = useCallback(
    async (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return

      const lat = e.latLng.lat()
      const lng = e.latLng.lng()
      
      try {
        // Show loading state immediately
        setTemporaryPosition({ lat, lng })
        setTemporaryAddress('Fetching address...')
        setIsInfoOpen(true)
        
        // Fetch the address
        const address = await getAddressFromLatLng(lat, lng)
        
        // Update the state with the new address
        const newPosition = { lat, lng, address }
        setTemporaryPosition(newPosition)
        setTemporaryAddress(address)
        setAddress(address)
        
        // Immediately update the parent component with the new location
        onLocationSelect(lat, lng, address)
        
        // Also update the input field directly to ensure it's updated
        const locationInput = document.querySelector('input[placeholder="Enter location or select on map"]') as HTMLInputElement
        if (locationInput) {
          locationInput.value = address
          // Trigger React's change detection
          const event = new Event('input', { bubbles: true })
          locationInput.dispatchEvent(event)
        }
      } catch (error) {
        console.error('Error handling map click:', error)
        const coords = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
        setTemporaryAddress(coords)
        setAddress(coords)
        onLocationSelect(lat, lng, coords)
      }
    },
    [getAddressFromLatLng, onLocationSelect]
  )

  useEffect(() => {
    if (initialPosition) {
      setSelectedPosition(initialPosition)
      // Use the provided address if available, otherwise fetch it
      if (initialPosition.address) {
        setAddress(initialPosition.address)
        setTemporaryAddress(initialPosition.address)
        setTemporaryPosition(initialPosition)
      } else {
        getAddressFromLatLng(initialPosition.lat, initialPosition.lng).then(addr => {
          setAddress(addr)
          setTemporaryAddress(addr)
          setTemporaryPosition(initialPosition)
        })
      }
    }
  }, [initialPosition, getAddressFromLatLng])

  const handleSelectLocation = useCallback(async () => {
    if (!temporaryPosition) return;
    
    try {
      // First, ensure we have the latest address
      let addressToUse = temporaryAddress;
      
      // If we don't have a valid address yet, try to get one
      if (!addressToUse || addressToUse === 'Fetching address...') {
        addressToUse = await getAddressFromLatLng(temporaryPosition.lat, temporaryPosition.lng);
      }
      
      // If we still don't have an address, use coordinates as fallback
      if (!addressToUse || addressToUse === 'Fetching address...') {
        addressToUse = `${temporaryPosition.lat.toFixed(6)}, ${temporaryPosition.lng.toFixed(6)}`;
      }
      
      // Update the parent component with the selected location and address
      onLocationSelect(temporaryPosition.lat, temporaryPosition.lng, addressToUse);
      
      // Also update the input field directly to ensure it's updated
      const locationInput = document.querySelector('input[placeholder="Enter location or select on map"]') as HTMLInputElement;
      if (locationInput) {
        locationInput.value = addressToUse;
        
        // Create and dispatch input event
        const inputEvent = new Event('input', { bubbles: true });
        locationInput.dispatchEvent(inputEvent);
        
        // Also trigger change event
        const changeEvent = new Event('change', { bubbles: true });
        locationInput.dispatchEvent(changeEvent);
      }
      
      // Update local state
      setSelectedPosition({
        ...temporaryPosition,
        address: addressToUse
      });
      setAddress(addressToUse);
      
      // Close the dialog
      setIsOpen(false);
    } catch (error) {
      console.error('Error selecting location:', error);
      // Fallback to coordinates if there's an error
      const coords = `${temporaryPosition.lat.toFixed(6)}, ${temporaryPosition.lng.toFixed(6)}`;
      onLocationSelect(temporaryPosition.lat, temporaryPosition.lng, coords);
    }
  }, [temporaryPosition, temporaryAddress, onLocationSelect, getAddressFromLatLng]);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open)
    if (open && selectedPosition) {
      setTemporaryPosition(selectedPosition)
      setTemporaryAddress(address)
    }
  }, [selectedPosition, address])

  if (loadError) {
    return (
      <div className={`${className} flex flex-col items-center justify-center bg-gray-100 p-4 rounded-lg`}>
        <div className="text-center text-red-600 mb-4">
          <p>Error loading Google Maps. Please check your API key and try again.</p>
          <p className="text-sm mt-2">{loadError.message}</p>
        </div>
        <Button 
          onClick={() => window.location.reload()}
          variant="outline"
          className="flex items-center gap-2"
        >
          <MapPin className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 rounded-lg`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p>Loading map...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Input 
            value={address || "No location selected"} 
            readOnly 
            placeholder="Click to select a location"
            className="flex-1 cursor-pointer"
            onClick={() => setIsOpen(true)}
          />
          <DialogTrigger asChild>
            <Button variant="outline" type="button">
              <MapPin className="h-4 w-4 mr-2" />
              Select
            </Button>
          </DialogTrigger>
        </div>
      </div>

      <DialogPortal>
        <DialogOverlay className="fixed inset-0 bg-black/50 z-50" />
        <DialogContent className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-4xl h-[80vh] bg-white rounded-lg shadow-lg z-50 flex flex-col p-4">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-semibold">Select Location</DialogTitle>
          </DialogHeader>
          
        <div className="flex-1 relative">
          {!isLoaded ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p>Loading map...</p>
              </div>
            </div>
          ) : (
            <GoogleMap
              zoom={temporaryPosition ? 15 : 5}
              center={temporaryPosition || center}
              mapContainerClassName="w-full h-full rounded-lg border"
              options={mapOptions}
              onClick={handleMapClick}
              onLoad={(map) => setMap(map)}
            >
              {temporaryPosition && (
                <MarkerF
                  position={temporaryPosition}
                  onClick={() => setIsInfoOpen(true)}
                  icon={{
                    url: "/marker-icon.png",
                    scaledSize: map ? new window.google.maps.Size(32, 32) : undefined,
                    origin: map ? new window.google.maps.Point(0, 0) : undefined,
                    anchor: map ? new window.google.maps.Point(16, 32) : undefined,
                  }}
                >
                  {isInfoOpen && temporaryAddress && (
                    <InfoWindow
                      position={temporaryPosition}
                      onCloseClick={() => setIsInfoOpen(false)}
                    >
                      <div className="text-sm max-w-xs">
                        <p className="font-medium">Selected Location</p>
                        <p className="text-gray-600">{temporaryAddress}</p>
                      </div>
                    </InfoWindow>
                  )}
                </MarkerF>
              )}
            </GoogleMap>
          )}
        </div>

        <div className="space-y-4 p-4 border-t">
          <div className="space-y-2">
            <div className="text-sm font-medium">Selected Location:</div>
            <div className="text-sm bg-gray-50 p-3 rounded-md border">
              {temporaryAddress || "Click on the map to select a location"}
            </div>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Latitude</label>
                <Input 
                  value={temporaryPosition?.lat.toFixed(6) || ""} 
                  readOnly 
                  className="bg-gray-50"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Longitude</label>
                <Input 
                  value={temporaryPosition?.lng.toFixed(6) || ""} 
                  readOnly 
                  className="bg-gray-50"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              onClick={handleSelectLocation}
              disabled={!temporaryPosition}
            >
              <Check className="h-4 w-4 mr-2" />
              Select Location
            </Button>
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </Dialog>
  )
}
