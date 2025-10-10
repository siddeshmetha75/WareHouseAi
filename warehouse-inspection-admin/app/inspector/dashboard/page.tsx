"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { fetchInspectorWarehousesWithCommodities } from "@/lib/api"
import type { Warehouse } from "@/lib/types"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ModernCard, ModernCardHeader, ModernCardTitle, ModernCardContent } from "@/components/ui/modern-card"
import { ShimmerCard } from "@/components/ui/shimmer"
import { Warehouse as WarehouseIcon, MapPin, Package, Navigation, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export default function InspectorDashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [checkingId, setCheckingId] = useState<number | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingWarehouse, setPendingWarehouse] = useState<Warehouse | null>(null)
  const [dontAskAgain, setDontAskAgain] = useState(false)

  const SKIP_KEY = "inspector_geo_skip"

  // If permission already granted from a previous session, remember to skip our dialog
  useEffect(() => {
    (async () => {
      try {
        const perm = await getGeoPermissionState()
        if (perm === "granted") {
          localStorage.setItem(SKIP_KEY, "1")
        } else {
          // If permission is not granted anymore (prompt/denied), clear skip flag so dialog shows again
          localStorage.removeItem(SKIP_KEY)
        }
      } catch {}
    })()
  }, [])

  const { data, isLoading } = useQuery({
    queryKey: ["inspector-warehouses", user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('No user ID available')
        return []
      }

      console.log('Fetching warehouses with commodities for inspector ID:', user.id)
      const warehouseData = await fetchInspectorWarehousesWithCommodities(user.id)

      console.log('API returned warehouse data:', warehouseData)

      const mapped: Warehouse[] = warehouseData.map((item: any) => ({
        id: item.warehouse.Id_Warehouse,
        name: item.warehouse.Warehouse_Name,
        location: `${item.warehouse.Latitude ?? 0},${item.warehouse.Longitude ?? 0}`,
        address: item.warehouse.Location ?? "",
        capacityTons: item.warehouse.Capacity ?? 0,
        currentStockTons: 0,
        isActive: true,
        createdAt: "",
        updatedAt: "",
      }))
      return mapped
    },
    enabled: !!user?.id,
  })

  function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const handleWarehouseClick = async (warehouse: Warehouse) => {
    if (checkingId !== null) return
    const perm = await getGeoPermissionState()
    // Only bypass dialog when permission is actually granted
    if (perm === "granted") {
      performLocationCheck(warehouse)
      return
    }
    setPendingWarehouse(warehouse)
    setConfirmOpen(true)
  }

  async function getGeoPermissionState(): Promise<"granted" | "denied" | "prompt"> {
    try {
      // Some TS libs don't include geolocation in PermissionName; cast to any
      if ("permissions" in navigator && (navigator as any).permissions?.query) {
        const status = await (navigator as any).permissions.query({ name: "geolocation" as any })
        return status.state as any
      }
      return "prompt"
    } catch {
      return "prompt"
    }
  }

  const performLocationCheck = async (warehouse: Warehouse) => {
    setCheckingId(warehouse.id)
    if (!("geolocation" in navigator)) {
      toast({
        variant: "destructive",
        title: "Location not supported",
        description: "Geolocation is not supported by your browser.",
      })
      setCheckingId(null)
      return
    }

    const perm = await getGeoPermissionState()
    if (perm === "denied") {
      toast({
        variant: "destructive",
        title: "Location Permission Blocked",
        description: "Please enable location for this site in your browser settings and try again.",
      })
      setCheckingId(null)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        const [whLat, whLng] = warehouse.location.split(",").map((s) => Number(s))
        if (!isFinite(whLat) || !isFinite(whLng)) {
          toast({
            variant: "destructive",
            title: "Invalid Warehouse Location",
            description: `Warehouse ${warehouse.name} has invalid coordinates. Please contact support.`,
          })
          setCheckingId(null)
          return
        }
        const distance = getDistance(latitude, longitude, whLat, whLng)
        const BASE_TOLERANCE = 150 // meters
        const MAX_TOLERANCE = 500 // cap tolerance so poor accuracy doesn't allow too much
        const tolerance = Math.min(Math.max(BASE_TOLERANCE, Math.round(accuracy)), MAX_TOLERANCE)

        if (distance <= tolerance) {
          toast({
            title: "Location Matched ",
            description: `You are at ${warehouse.name}. Redirecting...`,
          })
          // Remember consent after a successful check
          try { localStorage.setItem(SKIP_KEY, "1") } catch {}
          setTimeout(() => {
            router.push(`/inspector/warehouses/${warehouse.id}`)
          }, 200)
        } else {
          toast({
            variant: "destructive",
            title: "Location Not Matched ",
            description: `Distance: ${Math.round(distance)}m (Allowed: ${Math.round(tolerance)}m)`,
          })
        }
        setCheckingId(null)
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          toast({
            variant: "destructive",
            title: "Permission Denied",
            description: "Please click Allow when prompted, or enable location for this site and try again.",
          })
        } else {
          toast({
            variant: "destructive",
            title: "Location Error",
            description: "Unable to fetch your location. Try again.",
          })
        }
        setCheckingId(null)
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 5000 }
    )
  }
  

  const warehouses = data ?? []

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Warehouses</h1>
        <p className="text-gray-600 mt-2">Select a warehouse to start inspection</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ShimmerCard key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {warehouses.map((wh) => (
            <ModernCard 
              key={wh.id} 
              className="cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105 group"
              onClick={() => handleWarehouseClick(wh)}
            >
              <ModernCardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <WarehouseIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <ModernCardTitle className="text-lg">{wh.name}</ModernCardTitle>
                </div>
              </ModernCardHeader>
              <ModernCardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{wh.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Package className="h-4 w-4" />
                    <span className="text-sm">Capacity: {wh.capacityTons} tons</span>
                  </div>
                  <div className={`flex items-center gap-2 text-sm font-medium ${checkingId === wh.id ? "text-gray-500" : "text-blue-600"}`}>
                    <Navigation className={`h-4 w-4 ${checkingId === wh.id ? "animate-spin" : ""}`} />
                    <span>{checkingId === wh.id ? "Checking location..." : "Tap to inspect"}</span>
                  </div>
                </div>
              </ModernCardContent>
            </ModernCard>
          ))}
        </div>
      )}

      {!isLoading && warehouses.length === 0 && (
        <div className="text-center py-12">
          <WarehouseIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No warehouses assigned to you.</p>
        </div>
      )}

      {/* Confirmation Dialog before requesting location */}
      <AlertDialog open={confirmOpen} onOpenChange={(open) => { setConfirmOpen(open); if (!open) setDontAskAgain(false) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Allow Location Access</AlertDialogTitle>
            <AlertDialogDescription>
              To verify you are at the warehouse, we need your current location. Your location will only be used to
              check proximity and will not be stored.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center gap-2 py-2">
            <Checkbox id="dont-ask" checked={dontAskAgain} onCheckedChange={(v) => setDontAskAgain(Boolean(v))} />
            <Label htmlFor="dont-ask" className="text-sm text-gray-600">Don't ask again</Label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setPendingWarehouse(null) }}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false)
                if (pendingWarehouse) {
                  if (dontAskAgain) {
                    try { localStorage.setItem(SKIP_KEY, "1") } catch {}
                  }
                  performLocationCheck(pendingWarehouse)
                }
              }}
            >
              Allow
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
