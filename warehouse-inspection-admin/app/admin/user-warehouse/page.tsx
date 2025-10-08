"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Trash2, Edit2 } from "lucide-react"
import {
  getUsers,
  getWarehouses,
  getUserWarehouseMaps,
  createUserWarehouseMap,
  updateUserWarehouseMap,
  deleteUserWarehouseMap,
  type ApiUserWarehouseMap,
} from "@/lib/api"

export default function UserWarehousePage() {
  const [maps, setMaps] = useState<ApiUserWarehouseMap[]>([])
  const [managers, setManagers] = useState<ApiUser[]>([])
  const [warehouses, setWarehouses] = useState<{ Id_Warehouse: number; Warehouse_Name: string }[]>([])
  const [managerId, setManagerId] = useState<string>("")
  const [warehouseId, setWarehouseId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingMap, setEditingMap] = useState<ApiUserWarehouseMap | null>(null)
  const [editManagerId, setEditManagerId] = useState<string>("")
  const [editWarehouseId, setEditWarehouseId] = useState<string>("")

  const load = async () => {
    setLoading(true)
    try {
      const [m, ms, ws] = await Promise.all([
        getUserWarehouseMaps(),
        getUsers({ role: "Manager" }),
        getWarehouses(),
      ])
      setMaps(m)
      setManagers(ms)
      setWarehouses(ws as any)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // Check if manager-warehouse mapping already exists
  const mappingExists = () => {
    if (!managerId || !warehouseId) return false
    const mid = Number(managerId)
    const wid = Number(warehouseId)
    return maps.some((mm) => mm.Manager_id === mid && mm.Warehouse_id === wid)
  }

  const handleAssign = async () => {
    if (!managerId || !warehouseId) return
    if (mappingExists()) return

    setSaving(true)
    try {
      await createUserWarehouseMap({
        Manager_id: Number(managerId),
        Warehouse_id: Number(warehouseId),
      })
      setManagerId("")
      setWarehouseId("")
      await load()
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (map: ApiUserWarehouseMap) => {
    setEditingMap(map)
    setEditManagerId(String(map.Manager_id))
    setEditWarehouseId(String(map.Warehouse_id))
  }

  const handleUpdate = async () => {
    if (!editingMap || !editManagerId || !editWarehouseId) return

    // Check if the new combination already exists (excluding current mapping)
    const newMid = Number(editManagerId)
    const newWid = Number(editWarehouseId)
    const exists = maps.some((mm) =>
      mm.Manager_id === newMid &&
      mm.Warehouse_id === newWid &&
      mm.Id_User_Warehouse_Map !== editingMap.Id_User_Warehouse_Map
    )

    if (exists) {
      alert("This manager-warehouse combination already exists!")
      return
    }

    setSaving(true)
    try {
      await updateUserWarehouseMap(editingMap.Id_User_Warehouse_Map, {
        Manager_id: newMid,
        Warehouse_id: newWid,
      })
      setEditingMap(null)
      setEditManagerId("")
      setEditWarehouseId("")
      await load()
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingMap(null)
    setEditManagerId("")
    setEditWarehouseId("")
  }

  const handleDelete = async (id: number) => {
    setSaving(true)
    try {
      await deleteUserWarehouseMap(id)
      await load()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Assign Manager to Warehouse</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <Label>Manager</Label>
            <Select value={managerId} onValueChange={setManagerId} disabled={loading || managers.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder={managers.length ? "Select Manager" : "No managers"} />
              </SelectTrigger>
              <SelectContent>
                {managers.map((m) => (
                  <SelectItem key={m.idusers} value={String(m.idusers)}>
                    {m.Full_Name || m.UserName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Warehouse</Label>
            <Select value={warehouseId} onValueChange={setWarehouseId} disabled={loading || warehouses.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder={warehouses.length ? "Select Warehouse" : "No warehouses"} />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((w) => (
                  <SelectItem key={w.Id_Warehouse} value={String(w.Id_Warehouse)}>
                    {w.Warehouse_Name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Button
              onClick={handleAssign}
              disabled={saving || !managerId || !warehouseId || mappingExists()}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Assign"
              )}
            </Button>
            {mappingExists() && (
              <p className="text-xs text-muted-foreground mt-1">This manager is already assigned to the selected warehouse.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {editingMap && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Manager-Warehouse Mapping</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label>Manager</Label>
              <Select value={editManagerId} onValueChange={setEditManagerId} disabled={saving}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Manager" />
                </SelectTrigger>
                <SelectContent>
                  {managers.map((m) => (
                    <SelectItem key={m.idusers} value={String(m.idusers)}>
                      {m.Full_Name || m.UserName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Warehouse</Label>
              <Select value={editWarehouseId} onValueChange={setEditWarehouseId} disabled={saving}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.Id_Warehouse} value={String(w.Id_Warehouse)}>
                      {w.Warehouse_Name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Button onClick={handleUpdate} disabled={saving || !editManagerId || !editWarehouseId}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update"
                )}
              </Button>
            </div>

            <div>
              <Button variant="outline" onClick={handleCancelEdit} disabled={saving}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Manager-Warehouse Mappings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Manager</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {maps
                .filter(m => m.Manager_id) // Only show manager-warehouse mappings (not user mappings)
                .map((m) => (
                <TableRow key={m.Id_User_Warehouse_Map}>
                  <TableCell>
                    {m.ManagerFullName || m.ManagerName || `Manager ${m.Manager_id}`}
                  </TableCell>
                  <TableCell>
                    {m.WarehouseName || `Warehouse ${m.Warehouse_id}`}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(m)}
                        disabled={saving || editingMap !== null}
                        aria-label="Edit mapping"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(m.Id_User_Warehouse_Map)}
                        disabled={saving}
                        aria-label="Delete mapping"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {maps.filter(m => m.Manager_id).length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No manager-warehouse mappings found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
