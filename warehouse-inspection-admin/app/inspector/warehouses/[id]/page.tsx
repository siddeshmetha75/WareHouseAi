"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getCommodityWarehouseMappings, type ApiWarehouseCommodity } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function WarehouseDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  const [warehouseName, setWarehouseName] = useState<string>("")
  const [mappings, setMappings] = useState<ApiWarehouseCommodity[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    // Fetch warehouse name by inspector id (existing behavior)
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

  useEffect(() => {
    async function loadMappings() {
      if (!user?.id || !id) return
      setLoading(true)
      setError("")
      try {
        const data = await getCommodityWarehouseMappings(Number(id), user.id)
        setMappings(data)
      } catch (e: any) {
        console.error("Error fetching mappings:", e)
        setError(e?.message || "Failed to load mappings")
      } finally {
        setLoading(false)
      }
    }
    loadMappings()
  }, [id, user?.id])

  const handleSelectMapping = (map: ApiWarehouseCommodity) => {
    // Navigate directly to inspect page with commodity and season
    router.push(`/inspector/warehouses/${id}/inspect/${map.CommodityMasterId}?season=${map.SeasonId}`)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{warehouseName || "Warehouse"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {error && (
              <Alert>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {loading ? (
              <div className="text-sm text-gray-500">Loading mappings...</div>
            ) : mappings.length === 0 ? (
              <div className="text-sm text-gray-500">No mappings found for this warehouse.</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mappings.map((m) => (
                  <button
                    key={m.Idwarehouse_commodity}
                    type="button"
                    onClick={() => handleSelectMapping(m)}
                    className="border rounded-lg p-4 text-left hover:shadow-md hover:border-blue-300 transition-colors"
                  >
                    <div className="text-base font-semibold text-gray-900">{m.CommodityName}</div>
                    <div className="text-sm text-gray-600">Season: {m.SeasonName}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}