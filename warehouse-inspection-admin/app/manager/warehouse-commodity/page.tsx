'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageLoader, TableLoader } from '@/components/ui/page-loader'
import { toast } from 'sonner'
import { Trash2, CheckCircle2, Clock, XCircle, Pencil, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/contexts/auth-context'
import {
  getWarehouseCommoditiesByManager,
  updateWarehouseCommodity,
  getWarehousesByManager,
  getCommodities,
  getSeasons,
  getManagerInspectors,
  ApiWarehouseCommodity,
  ApiWarehouse,
  ApiCommodity,
  ApiSeason,
  ApiManagerInspector,
} from '@/lib/api'
import { CreateWarehouseCommodityDialog } from '@/components/manager/create-warehouse-commodity-dialog'

export default function ManagerWarehouseCommodityPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [mappings, setMappings] = useState<ApiWarehouseCommodity[]>([])
  const [warehouses, setWarehouses] = useState<ApiWarehouse[]>([])
  const [commodities, setCommodities] = useState<ApiCommodity[]>([])
  const [seasons, setSeasons] = useState<ApiSeason[]>([])
  const [inspectors, setInspectors] = useState<ApiManagerInspector[]>([])
  const [editingRow, setEditingRow] = useState<number | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<ApiWarehouseCommodity>>({})

  // Fetch all data
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const [warehouseCommodities, warehousesRes, commoditiesRes, seasonsRes, inspectorsRes] = await Promise.all([
        getWarehouseCommoditiesByManager(user.id),
        getWarehousesByManager(user.id),
        getCommodities(),
        getSeasons(),
        getManagerInspectors(user.id),
      ])

      setMappings(warehouseCommodities)
      setWarehouses(warehousesRes)
      setCommodities(commoditiesRes)
      setSeasons(seasonsRes)
      setInspectors(inspectorsRes)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleEditMapping = (mapping: ApiWarehouseCommodity) => {
    setEditingRow(mapping.Idwarehouse_commodity)
    setEditFormData(mapping)
  }

  const handleSaveEdit = async () => {
    if (!editingRow) return

    try {
      await updateWarehouseCommodity(editingRow, {
        WarehouseId: editFormData.WarehouseId!,
        CommodityMasterId: editFormData.CommodityMasterId!,
        SeasonId: editFormData.SeasonId!,
        Manager_Id: editFormData.Manager_Id!,
        InspectorId: editFormData.InspectorId!,
        Is_Active: editFormData.Is_Active!,
      })

      toast.success('Mapping updated successfully')
      setEditingRow(null)
      setEditFormData({})
      fetchData()
    } catch (error) {
      console.error('Error updating mapping:', error)
      toast.error('Failed to update mapping')
    }
  }

  const handleCancelEdit = () => {
    setEditingRow(null)
    setEditFormData({})
  }

  const handleDeleteMapping = async (mappingId: number) => {
    if (!confirm('Are you sure you want to delete this warehouse-commodity mapping?')) {
      return
    }

    try {
      // For now, we'll show a message that deletion is not implemented
      // In a real implementation, you'd call an API to delete the mapping
      toast.info('Delete functionality not implemented yet')
      // await deleteCommodityWarehouseMap(mappingId)
      // toast.success('Mapping deleted successfully')
      // fetchData() // Refresh the data
    } catch (error) {
      console.error('Error deleting mapping:', error)
      toast.error('Failed to delete mapping')
    }
  }

  if (loading) {
    return <PageLoader message="Loading Warehouse-Commodity Mappings..." />
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <CreateWarehouseCommodityDialog onSuccess={fetchData} />
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
            <CardTitle className="text-sm font-medium text-gray-600">Active Mappings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mappings.filter(m => m.Is_Active === 1).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Unique Commodities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(mappings.map(m => m.CommodityMasterId)).size}
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
                  <TableHead>Season</TableHead>
                  <TableHead>Inspector</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((mapping) => {
                  const isEditing = editingRow === mapping.Idwarehouse_commodity

                  return (
                    <TableRow key={mapping.Idwarehouse_commodity}>
                      <TableCell className="font-medium">
                        {isEditing ? (
                          <Select
                            value={editFormData.WarehouseId?.toString()}
                            onValueChange={(value) =>
                              setEditFormData(prev => ({ ...prev, WarehouseId: parseInt(value) }))
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {warehouses.map((warehouse) => (
                                <SelectItem key={warehouse.Id_Warehouse} value={warehouse.Id_Warehouse.toString()}>
                                  {warehouse.Warehouse_Name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          mapping.WarehouseName
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Select
                            value={editFormData.CommodityMasterId?.toString()}
                            onValueChange={(value) =>
                              setEditFormData(prev => ({ ...prev, CommodityMasterId: parseInt(value) }))
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {commodities.map((commodity) => (
                                <SelectItem key={commodity.IdCommodity} value={commodity.IdCommodity.toString()}>
                                  {commodity.Commodity_Name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          mapping.CommodityName
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Select
                            value={editFormData.SeasonId?.toString()}
                            onValueChange={(value) =>
                              setEditFormData(prev => ({ ...prev, SeasonId: parseInt(value) }))
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {seasons.map((season) => (
                                <SelectItem key={season.IdSeason} value={season.IdSeason.toString()}>
                                  {season.Season_Name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          mapping.SeasonName
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Select
                            value={editFormData.InspectorId?.toString()}
                            onValueChange={(value) =>
                              setEditFormData(prev => ({ ...prev, InspectorId: parseInt(value) }))
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {inspectors.map((inspector) => (
                                <SelectItem key={inspector.id} value={inspector.id.toString()}>
                                  {inspector.Full_Name || inspector.UserName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          mapping.InspectorName || 'Not assigned'
                        )}
                      </TableCell>
                      <TableCell>
                        {mapping.ManagerName}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Select
                            value={editFormData.Is_Active?.toString()}
                            onValueChange={(value) =>
                              setEditFormData(prev => ({ ...prev, Is_Active: parseInt(value) }))
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Active</SelectItem>
                              <SelectItem value="0">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
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
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(mapping.Insert_Date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {isEditing ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSaveEdit}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCancelEdit}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditMapping(mapping)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteMapping(mapping.Idwarehouse_commodity)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
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
    </div>
  )
}
