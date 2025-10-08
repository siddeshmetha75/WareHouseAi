'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoader, TableLoader } from '@/components/ui/page-loader'
import { toast } from 'sonner'
import { Trash2, Eye, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { 
  getAllCommodityWarehouseMaps, 
  createCommodityWarehouseMap, 
  updateCommodityWarehouseMap, 
  deleteCommodityWarehouseMap,
  getWarehouses,
  getCommodities,
  getSeasons,
  getUsers,
  getManagerInspectors,
  listInspections
} from '@/lib/api'

interface Warehouse {
  Id_Warehouse: number
  Warehouse_Name: string
  Location?: string | null
  Code?: string | null
}

interface Commodity {
  IdCommodity: number
  Commodity_Name: string
}

interface Season {
  IdSeason: number
  Season_Name: string
}

interface WarehouseCommodityMap {
  Id_CommodityWarehouseMap: number
  WarehouseId: number
  ManagerId: number
  InspectorId: number
  CommodityId: number
  SeasonId: number
  Is_Active: number | null
  WarehouseName?: string
  CommodityName?: string
  InspectorName?: string
  ManagerName?: string
  SeasonName?: string
}

interface User {
  id: number
  UserName?: string
  Full_Name?: string
  EmailId?: string
  Role?: string
  idusers?: number
}

export default function ManagerWarehouseCommodityPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [mappings, setMappings] = useState<WarehouseCommodityMap[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [inspectors, setInspectors] = useState<User[]>([])
  const [inspections, setInspections] = useState<any[]>([])

  // Fetch all data
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [mappingsRes, warehousesRes, commoditiesRes, seasonsRes, inspectorsRes, inspectionsRes] = await Promise.all([
        getAllCommodityWarehouseMaps(),
        getWarehouses(),
        getCommodities(),
        getSeasons(),
        getManagerInspectors(user?.id || 0),
        listInspections()
      ])

      // Deduplicate mappings by Id_CommodityWarehouseMap
      const uniqueMappings = mappingsRes.filter((mapping: any, index: number, self: any[]) =>
        index === self.findIndex((m: any) => m.Id_CommodityWarehouseMap === mapping.Id_CommodityWarehouseMap)
      )

      setMappings(uniqueMappings)
      setWarehouses(warehousesRes)
      setCommodities(commoditiesRes)
      setSeasons(seasonsRes)
      setInspectors(inspectorsRes)
      setInspections(inspectionsRes)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const handleDeleteMapping = async (mappingId: number) => {
    if (!confirm('Are you sure you want to delete this warehouse-commodity mapping?')) {
      return
    }

    try {
      await deleteCommodityWarehouseMap(mappingId)
      toast.success('Mapping deleted successfully')
      fetchData() // Refresh the data
    } catch (error) {
      console.error('Error deleting mapping:', error)
      toast.error('Failed to delete mapping')
    }
  }

  const getInspectorInspections = (inspectorId: number) => {
    return inspections.filter(inspection => {
      const inspector = inspection.inspector
      if (!inspector) return false

      const inspectorIdentifier = inspector.idusers || inspector.id
      return inspectorIdentifier === inspectorId
    })
  }

  const getCompletedInspectionsCount = (inspectorId: number) => {
    return getInspectorInspections(inspectorId).filter(
      inspection => inspection.Status.toLowerCase() === 'accepted'
    ).length
  }

  if (loading) {
    return <PageLoader message="Loading Warehouse-Commodity Mappings..." />
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Warehouse-Commodity Management</h1>
        <p className="text-gray-600 mt-2">
          Manage warehouse-commodity mappings for your inspectors and track completed inspections.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Summary Cards */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Mappings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mappings.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Inspectors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inspectors.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed Inspections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inspections.filter(i => i.Status.toLowerCase() === 'accepted').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Warehouse-Commodity Mappings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Commodity</TableHead>
                  <TableHead>Inspector</TableHead>
                  <TableHead>Season</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Completed Inspections</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((mapping) => {
                  const inspectorInspections = getInspectorInspections(mapping.InspectorId)
                  const completedCount = inspectorInspections.filter(
                    i => i.Status?.toLowerCase() === 'accepted'
                  ).length

                  return (
                    <TableRow key={mapping.Id_CommodityWarehouseMap}>
                      <TableCell className="font-medium">
                        {warehouses.find(w => w.Id_Warehouse === mapping.WarehouseId)?.Warehouse_Name || `Warehouse ${mapping.WarehouseId}`}
                      </TableCell>
                      <TableCell>
                        {commodities.find(c => c.IdCommodity === mapping.CommodityId)?.Commodity_Name || `Commodity ${mapping.CommodityId}`}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const inspector = inspectors.find(i => {
                            const inspectorId = i.idusers || i.id
                            return inspectorId === mapping.InspectorId
                          })
                          return inspector?.UserName || `Inspector ${mapping.InspectorId}`
                        })()}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          // Try to find season by SeasonId
                          const season = seasons.find(s => s.IdSeason === mapping.SeasonId)
                          if (season) return season.Season_Name

                          // If seasons array is empty, show loading message
                          if (seasons.length === 0) return 'Loading seasons...'

                          // Fallback to SeasonId if no name found
                          return mapping.SeasonId ? `Season ${mapping.SeasonId}` : 'No Season'
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {mapping.Is_Active === 1 ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-green-600">Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span className="text-sm text-red-600">Inactive</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          completedCount > 0
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {completedCount} completed
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const inspector = inspectors.find(i => {
                                const inspectorId = i.idusers || i.id
                                return inspectorId === mapping.InspectorId
                              })

                              if (inspector) {
                                // Show loading toast and navigate to inspector's inspection list
                                toast.info(`Loading inspections for ${inspector.UserName}...`)
                                router.push(`/manager/inspections?inspector=${mapping.InspectorId}`)
                              } else {
                                toast.error('Inspector not found')
                              }
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {completedCount > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteMapping(mapping.Id_CommodityWarehouseMap)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {mappings.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No warehouse-commodity mappings found.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Inspections Summary */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Inspection Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {inspectors.slice(0, 5).map((inspector) => {
              const inspectorId = inspector.idusers || inspector.id
              if (!inspectorId) return null

              const inspectorInspections = getInspectorInspections(inspectorId)
              const completedCount = inspectorInspections.filter(
                i => i.Status?.toLowerCase() === 'accepted'
              ).length

              return (
                <div key={inspectorId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{inspector.UserName || 'Unknown'}</p>
                    <p className="text-sm text-gray-600">{inspector.Full_Name || ''}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Completed Inspections</p>
                      <p className="font-semibold">{completedCount}</p>
                    </div>
                    <div className="flex gap-2">
                      {getStatusIcon('pending')}
                      {getStatusIcon('accepted')}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
