'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoader, TableLoader } from '@/components/ui/page-loader'
import { toast } from 'sonner'
import { 
  getAllCommodityWarehouseMaps, 
  createCommodityWarehouseMap, 
  updateCommodityWarehouseMap, 
  deleteCommodityWarehouseMap,
  getWarehouses,
  getCommodities,
  getSeasons,
  getUsers
} from '@/lib/api'

interface Warehouse {
  Id_Warehouse: number
  Warehouse_Name: string
}

interface Commodity {
  IdCommodity: number
  Commodity_Name: string
}

interface Season {
  IdSeason: number
  Season_Name: string
}

interface User {
  idusers: number
  UserName: string
  Full_Name: string | null
  Role: string
}

interface WarehouseCommodityMap {
  Idwarehouse_commodity?: number
  Id_CommodityWarehouseMap?: number
  WarehouseId: number
  CommodityMasterId?: number
  CommodityId?: number
  SeasonId: number
  ManagerId?: number
  InspectorId?: number
  Is_Active: number
  Insert_Date?: string
}

export default function WarehouseCommodityPage() {
  const [mappings, setMappings] = useState<WarehouseCommodityMap[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [managers, setManagers] = useState<User[]>([])
  const [inspectors, setInspectors] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentMapping, setCurrentMapping] = useState<Partial<WarehouseCommodityMap>>({})
  const [isDuplicate, setIsDuplicate] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData()
      fetchWarehouses()
      fetchCommodities()
      fetchSeasons()
      fetchManagers()
      fetchInspectors()
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  // Check for duplicates whenever currentMapping changes
  useEffect(() => {
    if (!currentMapping.WarehouseId || !currentMapping.CommodityMasterId || !currentMapping.SeasonId || !currentMapping.ManagerId || !currentMapping.InspectorId) {
      setIsDuplicate(false)
      return
    }

    const exists = mappings.find(
      (m) =>
        m.WarehouseId === currentMapping.WarehouseId &&
        (m.CommodityId || m.CommodityMasterId) === currentMapping.CommodityMasterId &&
        m.SeasonId === currentMapping.SeasonId &&
        m.ManagerId === currentMapping.ManagerId &&
        m.InspectorId === currentMapping.InspectorId &&
        m.Is_Active === 1 &&
        (isEditing ? (m.Idwarehouse_commodity || m.Id_CommodityWarehouseMap) !== (currentMapping.Idwarehouse_commodity || currentMapping.Id_CommodityWarehouseMap) : true)
    )

    setIsDuplicate(!!exists)
  }, [currentMapping, mappings, isEditing])

  const fetchData = async () => {
    try {
      const data = await getAllCommodityWarehouseMaps()
      setMappings(data as any)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to fetch warehouse-commodity mappings')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchWarehouses = async () => {
    try {
      const data = await getWarehouses()
      setWarehouses(data)
    } catch (error) {
      console.error('Error fetching warehouses:', error)
    }
  }

  const fetchCommodities = async () => {
    try {
      const data = await getCommodities()
      setCommodities(data)
    } catch (error) {
      console.error('Error fetching commodities:', error)
    }
  }

  const fetchSeasons = async () => {
    try {
      const data = await getSeasons()
      setSeasons(data)
    } catch (error) {
      console.error('Error fetching seasons:', error)
    }
  }

  const fetchManagers = async () => {
    try {
      const data = await getUsers({ role: 'Manager' })
      setManagers(data)
    } catch (error) {
      console.error('Error fetching managers:', error)
    }
  }

  const fetchInspectors = async (managerId?: number) => {
    try {
      const data = await getUsers({ role: 'Inspector' })
      // If managerId is provided, filter inspectors by that manager
      if (managerId) {
        const filteredInspectors = data.filter(inspector => inspector.UserId === managerId)
        setInspectors(filteredInspectors)
      } else {
        setInspectors(data)
      }
    } catch (error) {
      console.error('Error fetching inspectors:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentMapping.WarehouseId || !currentMapping.CommodityMasterId || !currentMapping.SeasonId || !currentMapping.ManagerId || !currentMapping.InspectorId) {
      toast.error('Please fill all required fields')
      return
    }

    // Check if mapping already exists
    const exists = mappings.find(
      (m) =>
        m.WarehouseId === currentMapping.WarehouseId &&
        (m.CommodityId || m.CommodityMasterId) === currentMapping.CommodityMasterId &&
        m.SeasonId === currentMapping.SeasonId &&
        m.ManagerId === currentMapping.ManagerId &&
        m.InspectorId === currentMapping.InspectorId &&
        m.Is_Active === 1 &&
        // Exclude current mapping when editing
        (isEditing ? (m.Idwarehouse_commodity || m.Id_CommodityWarehouseMap) !== (currentMapping.Idwarehouse_commodity || currentMapping.Id_CommodityWarehouseMap) : true)
    )

    if (exists) {
      const warehouseName = warehouses.find(w => w.Id_Warehouse === currentMapping.WarehouseId)?.Warehouse_Name || 'Unknown'
      const commodityName = commodities.find(c => c.IdCommodity === currentMapping.CommodityMasterId)?.Commodity_Name || 'Unknown'
      const seasonName = seasons.find(s => s.IdSeason === currentMapping.SeasonId)?.Season_Name || 'Unknown'
      const managerName = managers.find(m => m.idusers === currentMapping.ManagerId)?.Full_Name || managers.find(m => m.idusers === currentMapping.ManagerId)?.UserName || 'Unknown'
      const inspectorName = inspectors.find(i => i.idusers === currentMapping.InspectorId)?.Full_Name || inspectors.find(i => i.idusers === currentMapping.InspectorId)?.UserName || 'Unknown'
      
      toast.error(
        `Duplicate mapping detected! This combination already exists:\n` +
        `Warehouse: ${warehouseName}\n` +
        `Commodity: ${commodityName}\n` +
        `Season: ${seasonName}\n` +
        `Manager: ${managerName}\n` +
        `Inspector: ${inspectorName}`,
        { duration: 6000 }
      )
      return
    }

    try {
      setIsSubmitting(true)
      
      // Prepare payload with correct field names for the API
      const payload = {
        WarehouseId: currentMapping.WarehouseId,
        CommodityId: currentMapping.CommodityMasterId, // API expects CommodityId
        SeasonId: currentMapping.SeasonId,
        ManagerId: currentMapping.ManagerId,
        InspectorId: currentMapping.InspectorId,
        Is_Active: currentMapping.Is_Active ?? 1
      }
      
      if (isEditing && currentMapping.Idwarehouse_commodity) {
        await updateCommodityWarehouseMap(currentMapping.Idwarehouse_commodity, payload as any)
        toast.success('Mapping updated successfully')
      } else {
        await createCommodityWarehouseMap(payload as any)
        toast.success('Mapping created successfully')
      }
      setShowDialog(false)
      setCurrentMapping({})
      setIsEditing(false)
      fetchData()
    } catch (error: any) {
      console.error('Error saving mapping:', error)
      // Check if error is 409 (conflict/duplicate)
      if (error?.response?.status === 409) {
        const errorMessage = error?.response?.data?.detail || 'This mapping already exists!'
        toast.error(`Duplicate Error: ${errorMessage}`, { duration: 5000 })
      } else if (error?.response?.data?.detail) {
        // Show backend error message if available
        toast.error(`Error: ${error.response.data.detail}`, { duration: 5000 })
      } else {
        toast.error('Failed to save mapping. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (mapping: WarehouseCommodityMap) => {
    // Map CommodityId to CommodityMasterId for the form
    const mappingForEdit = {
      ...mapping,
      CommodityMasterId: mapping.CommodityId || mapping.CommodityMasterId
    }
    setCurrentMapping(mappingForEdit)
    setIsEditing(true)
    setShowDialog(true)
    // Fetch inspectors for the selected manager
    if (mapping.ManagerId) {
      fetchInspectors(mapping.ManagerId)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this mapping?')) return

    try {
      await deleteCommodityWarehouseMap(id)
      toast.success('Mapping deleted successfully')
      fetchData()
    } catch (error) {
      console.error('Error deleting mapping:', error)
      toast.error('Failed to delete mapping')
    }
  }

  const handleAddNew = () => {
    setCurrentMapping({ Is_Active: 1 })
    setIsEditing(false)
    setShowDialog(true)
  }

  if (isLoading) {
    return <PageLoader message="Loading Warehouse-Commodity Mappings..." />
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Warehouse-Commodity Mappings</h1>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" /> Add New Mapping
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Warehouse</TableHead>
                <TableHead>Commodity</TableHead>
                <TableHead>Season</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Inspector</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No mappings found
                  </TableCell>
                </TableRow>
              ) : (
                mappings.map((mapping) => (
                  <TableRow key={mapping.Idwarehouse_commodity}>
                    <TableCell>
                      {warehouses.find((w) => w.Id_Warehouse === mapping.WarehouseId)?.Warehouse_Name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {commodities.find((c) => c.IdCommodity === (mapping.CommodityId || mapping.CommodityMasterId))?.Commodity_Name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {seasons.find((s) => s.IdSeason === mapping.SeasonId)?.Season_Name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {managers.find((m) => m.idusers === mapping.ManagerId)?.Full_Name || managers.find((m) => m.idusers === mapping.ManagerId)?.UserName || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {inspectors.find((i) => i.idusers === mapping.InspectorId)?.Full_Name || inspectors.find((i) => i.idusers === mapping.InspectorId)?.UserName || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          mapping.Is_Active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {mapping.Is_Active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(mapping)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(mapping.Idwarehouse_commodity || mapping.Id_CommodityWarehouseMap || 0)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {isEditing ? 'Edit Mapping' : 'Add New Mapping'}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowDialog(false)
                    setCurrentMapping({})
                    setIsEditing(false)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Warehouse *</label>
                  <Select
                    value={currentMapping.WarehouseId?.toString() || ''}
                    onValueChange={(value) =>
                      setCurrentMapping({ ...currentMapping, WarehouseId: parseInt(value) })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem
                          key={warehouse.Id_Warehouse}
                          value={warehouse.Id_Warehouse.toString()}
                        >
                          {warehouse.Warehouse_Name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Commodity *</label>
                  <Select
                    value={currentMapping.CommodityMasterId?.toString() || ''}
                    onValueChange={(value) =>
                      setCurrentMapping({ ...currentMapping, CommodityMasterId: parseInt(value) })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select commodity" />
                    </SelectTrigger>
                    <SelectContent>
                      {commodities.map((commodity) => (
                        <SelectItem
                          key={commodity.IdCommodity}
                          value={commodity.IdCommodity.toString()}
                        >
                          {commodity.Commodity_Name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Season *</label>
                  <Select
                    value={currentMapping.SeasonId?.toString() || ''}
                    onValueChange={(value) =>
                      setCurrentMapping({ ...currentMapping, SeasonId: parseInt(value) })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select season" />
                    </SelectTrigger>
                    <SelectContent>
                      {seasons.map((season) => (
                        <SelectItem
                          key={season.IdSeason}
                          value={season.IdSeason.toString()}
                        >
                          {season.Season_Name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Manager *</label>
                  <Select
                    value={currentMapping.ManagerId?.toString() || ''}
                    onValueChange={(value) => {
                      const managerId = parseInt(value)
                      setCurrentMapping({ ...currentMapping, ManagerId: managerId, InspectorId: undefined })
                      fetchInspectors(managerId)
                    }}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select manager" />
                    </SelectTrigger>
                    <SelectContent>
                      {managers.map((manager) => (
                        <SelectItem
                          key={manager.idusers}
                          value={manager.idusers.toString()}
                        >
                          {manager.Full_Name || manager.UserName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Inspector *</label>
                  <Select
                    value={currentMapping.InspectorId?.toString() || ''}
                    onValueChange={(value) =>
                      setCurrentMapping({ ...currentMapping, InspectorId: parseInt(value) })
                    }
                    required
                    disabled={!currentMapping.ManagerId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={currentMapping.ManagerId ? "Select inspector" : "Select manager first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {inspectors.map((inspector) => (
                        <SelectItem
                          key={inspector.idusers}
                          value={inspector.idusers.toString()}
                        >
                          {inspector.Full_Name || inspector.UserName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowDialog(false)
                      setCurrentMapping({})
                      setIsEditing(false)
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || isDuplicate}>
                    {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
                  </Button>
                </div>
                
                {/* Duplicate Warning */}
                {isDuplicate && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800 font-medium">
                      ⚠️ This mapping already exists! Please change the selection.
                    </p>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
