"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { fetchCommodities } from "@/lib/api"
import type { Commodity } from "@/lib/types"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

export default function WarehouseDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [selectedCommodity, setSelectedCommodity] = useState<Commodity | null>(null)
  const [warehouseName, setWarehouseName] = useState<string>("")
  type Season = { Season_Name: string; IdSeason: number }
  const [seasons, setSeasons] = useState<Season[]>([])
  const [seasonsLoading, setSeasonsLoading] = useState<boolean>(false)
  const [seasonsError, setSeasonsError] = useState<string>("")
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("")

  useEffect(() => {
    fetchCommodities()
      .then(setCommodities)
      .catch(err => console.error("Error fetching commodities:", err))

    // Fetch warehouse name by inspector id
    if (user?.id) {
      fetch(`http://127.0.0.1:8000/api/warehouses?inspector_id=${user.id}`)
        .then(res => res.json())
        .then((warehouses: any[]) => {
          console.log("Warehouses API response:", warehouses)
          // Try both 'id' and 'Id_Warehouse' for matching
          const found = warehouses.find(w => 
            w.id?.toString() === id || w.Id_Warehouse?.toString() === id
          )
          // Try both 'name' and 'Warehouse_Name' for display
          setWarehouseName(found?.name ?? found?.Warehouse_Name ?? "")
        })
        .catch(err => console.error("Error fetching warehouses:", err))
    }
  }, [id, user?.id])

  const handleCommoditySelect = (value: string) => {
    const commodity = commodities.find(c => c.id.toString() === value)
    setSelectedCommodity(commodity || null)
    // Reset season state whenever commodity changes
    setSelectedSeasonId("")
    setSeasons([])
    setSeasonsError("")

    if (commodity?.Storage === "Cold") {
      return
    }
    // For non-cold commodities, fetch seasons and show season selector
    setSeasonsLoading(true)
    fetch("http://localhost:8000/seasons/")
      .then(res => {
        if (!res.ok) throw new Error(`Failed to fetch seasons: ${res.status}`)
        return res.json()
      })
      .then((data: Season[]) => {
        setSeasons(data || [])
      })
      .catch(err => {
        console.error("Error fetching seasons:", err)
        setSeasonsError("Unable to load seasons. Please try again.")
      })
      .finally(() => setSeasonsLoading(false))
  }

  const handleSeasonSelect = (value: string) => {
    setSelectedSeasonId(value)
    const commodityId = selectedCommodity?.id?.toString()
    if (!commodityId) return
    // Navigate with season as query param to keep existing route structure
    router.push(`/inspector/warehouses/${id}/inspect/${commodityId}?season=${value}`)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{warehouseName || "Warehouse"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Select Commodity</Label>
              <Select onValueChange={handleCommoditySelect}>
                <SelectTrigger className="border-blue-300 hover:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-colors">
                  <SelectValue placeholder="Choose a commodity" />
                </SelectTrigger>
                <SelectContent className="border border-blue-200 bg-white shadow-lg ring-1 ring-blue-100">
                  {commodities.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">No commodities found</div>
                  ) : (
                    commodities.map((c) => (
                      <SelectItem
                        key={c.id}
                        value={c.id.toString()}
                        className="focus:bg-blue-100 focus:text-blue-800 data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-700"
                      >
                        {c.Commodity_Name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            {selectedCommodity?.Storage === "Cold" && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Cold Storage Form Arriving Soon</strong>
                  <br />
                  The inspection form for cold storage commodities is currently under development. 
                  Please check back later or contact your manager for assistance.
                </AlertDescription>
              </Alert>
            )}
            {selectedCommodity && selectedCommodity.Storage !== "Cold" && (
              <div className="space-y-2">
                <Label>Select Season</Label>
                <Select onValueChange={handleSeasonSelect} disabled={seasonsLoading || !!seasonsError}>
                  <SelectTrigger className="border-blue-300 hover:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-colors">
                    <SelectValue placeholder={seasonsLoading ? "Loading seasons..." : "Choose a season"} />
                  </SelectTrigger>
                  <SelectContent className="border border-blue-200 bg-white shadow-lg ring-1 ring-blue-100">
                    {seasonsError ? (
                      <div className="p-2 text-sm text-red-600">{seasonsError}</div>
                    ) : seasons.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500">{seasonsLoading ? "Loading..." : "No seasons found"}</div>
                    ) : (
                      seasons.map((s) => (
                        <SelectItem
                          key={s.IdSeason}
                          value={s.IdSeason.toString()}
                          className="focus:bg-blue-100 focus:text-blue-800 data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-700"
                        >
                          {s.Season_Name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}