"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Trash2 } from "lucide-react"
import {
  getUserWarehouseMaps,
  createUserWarehouseMap,
  deleteUserWarehouseMap,
  type ApiUserWarehouseMap,
} from "@/lib/api"
import { getUsers, getWarehouses, type ApiUser } from "@/lib/api"

export default function UserWarehousePage() {
  const [maps, setMaps] = useState<ApiUserWarehouseMap[]>([])
  const [users, setUsers] = useState<ApiUser[]>([])
  const [managers, setManagers] = useState<ApiUser[]>([])
  const [warehouses, setWarehouses] = useState<{ Id_Warehouse: number; Warehouse_Name: string }[]>([])
  const [userId, setUserId] = useState<string>("")
  const [managerId, setManagerId] = useState<string>("")
  const [warehouseId, setWarehouseId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editUserId, setEditUserId] = useState<string>("")
  const [editManagerId, setEditManagerId] = useState<string>("")
  const [editWarehouseId, setEditWarehouseId] = useState<string>("")

  const load = async () => {
    setLoading(true)
    try {
      const [m, us, ms, ws] = await Promise.all([
        getUserWarehouseMaps(),
        getUsers({ role: "Inspector" }),
        getUsers({ role: "Manager" }),
        getWarehouses(),
      ])
      setMaps(m)
      setUsers(us)
      setManagers(ms)
      setWarehouses(ws as any)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleAssign = async () => {
    if (!userId || !managerId || !warehouseId) return
    setSaving(true)
    try {
      await createUserWarehouseMap({
        User_id: Number(userId),
        Manager_id: Number(managerId),
        Warehouse_id: Number(warehouseId),
      })
      setUserId("")
      setManagerId("")
      setWarehouseId("")
      await load()
    } finally {
      setSaving(false)
    }
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

  const startEdit = (m: ApiUserWarehouseMap) => {
    setEditingId(m.Id_User_Warehouse_Map)
    setEditUserId(String(m.User_id))
    setEditManagerId(String(m.Manager_id))
    setEditWarehouseId(String(m.Warehouse_id))
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditUserId("")
    setEditManagerId("")
    setEditWarehouseId("")
  }

  const saveEdit = async () => {
    if (!editingId || !editUserId || !editManagerId || !editWarehouseId) return
    setSaving(true)
    try {
      // reuse createUserWarehouseMap types for update helper
      const { updateUserWarehouseMap } = await import("@/lib/api")
      await updateUserWarehouseMap(editingId, {
        User_id: Number(editUserId),
        Manager_id: Number(editManagerId),
        Warehouse_id: Number(editWarehouseId),
      })
      cancelEdit()
      await load()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Assign User to Manager and Warehouse</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <Label>User</Label>
            <Select value={userId} onValueChange={setUserId} disabled={loading || users.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder={users.length ? "Select User" : "No users"} />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.idusers} value={String(u.idusers)}>
                    {u.Full_Name || u.UserName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
            <Button onClick={handleAssign} disabled={saving || !userId || !managerId || !warehouseId}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Assign"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Mappings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {maps.map((m) => (
                <TableRow key={m.Id_User_Warehouse_Map}>
                  <TableCell>
                    {editingId === m.Id_User_Warehouse_Map ? (
                      <Select value={editUserId} onValueChange={setEditUserId} disabled={saving || users.length === 0}>
                        <SelectTrigger>
                          <SelectValue placeholder={users.length ? "Select User" : "No users"} />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((u) => (
                            <SelectItem key={u.idusers} value={String(u.idusers)}>
                              {u.Full_Name || u.UserName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      m.UserFullName || m.UserName
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === m.Id_User_Warehouse_Map ? (
                      <Select value={editManagerId} onValueChange={setEditManagerId} disabled={saving || managers.length === 0}>
                        <SelectTrigger>
                          <SelectValue placeholder={managers.length ? "Select Manager" : "No managers"} />
                        </SelectTrigger>
                        <SelectContent>
                          {managers.map((u) => (
                            <SelectItem key={u.idusers} value={String(u.idusers)}>
                              {u.Full_Name || u.UserName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      m.ManagerFullName || m.ManagerName
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === m.Id_User_Warehouse_Map ? (
                      <Select value={editWarehouseId} onValueChange={setEditWarehouseId} disabled={saving || warehouses.length === 0}>
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
                    ) : (
                      m.WarehouseName
                    )}
                  </TableCell>
                  <TableCell className="flex gap-2">
                    {editingId === m.Id_User_Warehouse_Map ? (
                      <>
                        <Button size="sm" variant="default" onClick={saveEdit} disabled={saving || !editUserId || !editManagerId || !editWarehouseId}>
                          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit} disabled={saving}>Cancel</Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => startEdit(m)}>Edit</Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(m.Id_User_Warehouse_Map)} aria-label="Delete mapping">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {maps.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">No mappings found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
