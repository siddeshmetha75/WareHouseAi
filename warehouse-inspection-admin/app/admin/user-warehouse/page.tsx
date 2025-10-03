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

  // Auto-select manager when a user is chosen based on existing mappings
  useEffect(() => {
    if (!userId) return
    const uid = Number(userId)
    const found = maps.find((mm) => mm.User_id === uid)
    if (found) {
      setManagerId(String(found.Manager_id))
    }
  }, [userId, maps])

  // If warehouse changes and user is already selected, try find manager for that specific warehouse mapping
  useEffect(() => {
    if (!userId || !warehouseId) return
    const uid = Number(userId)
    const wid = Number(warehouseId)
    const exact = maps.find((mm) => mm.User_id === uid && mm.Warehouse_id === wid)
    if (exact) {
      setManagerId(String(exact.Manager_id))
    }
  }, [warehouseId, userId, maps])

  // In edit mode, when changing the user, auto-pick the mapped manager if any
  useEffect(() => {
    if (!editingId || !editUserId) return
    const uid = Number(editUserId)
    const found = maps.find((mm) => mm.User_id === uid)
    if (found) {
      setEditManagerId(String(found.Manager_id))
    }
  }, [editUserId, editingId, maps])

  // In edit mode, if warehouse changes and user is set, pick manager for that mapping
  useEffect(() => {
    if (!editingId || !editUserId || !editWarehouseId) return
    const uid = Number(editUserId)
    const wid = Number(editWarehouseId)
    const exact = maps.find((mm) => mm.User_id === uid && mm.Warehouse_id === wid)
    if (exact) {
      setEditManagerId(String(exact.Manager_id))
    }
  }, [editWarehouseId, editUserId, editingId, maps])

  // Derived: mapped manager for create form
  const mappedManagerId = useMemo(() => {
    if (!userId) return null
    const uid = Number(userId)
    if (warehouseId) {
      const wid = Number(warehouseId)
      const exact = maps.find((mm) => mm.User_id === uid && mm.Warehouse_id === wid)
      if (exact) return String(exact.Manager_id)
    }
    const any = maps.find((mm) => mm.User_id === uid)
    return any ? String(any.Manager_id) : null
  }, [userId, warehouseId, maps])

  // Ensure state managerId follows mappedManagerId when present
  useEffect(() => {
    if (mappedManagerId && managerId !== mappedManagerId) {
      setManagerId(mappedManagerId)
    }
  }, [mappedManagerId])

  // Derived: mapped manager for edit row
  const mappedEditManagerId = useMemo(() => {
    if (!editingId || !editUserId) return null
    const uid = Number(editUserId)
    if (editWarehouseId) {
      const wid = Number(editWarehouseId)
      const exact = maps.find((mm) => mm.User_id === uid && mm.Warehouse_id === wid)
      if (exact) return String(exact.Manager_id)
    }
    const any = maps.find((mm) => mm.User_id === uid)
    return any ? String(any.Manager_id) : null
  }, [editingId, editUserId, editWarehouseId, maps])

  // Ensure editManagerId follows mappedEditManagerId when present
  useEffect(() => {
    if (mappedEditManagerId && editManagerId !== mappedEditManagerId) {
      setEditManagerId(mappedEditManagerId)
    }
  }, [mappedEditManagerId])

  // Prevent duplicates: check if exact mapping already exists for create form
  const assignExistsExact = useMemo(() => {
    if (!userId || !warehouseId) return false
    const uid = Number(userId)
    const wid = Number(warehouseId)
    return maps.some((mm) => mm.User_id === uid && mm.Warehouse_id === wid)
  }, [userId, warehouseId, maps])

  // Prevent duplicates on edit: same user+warehouse already mapped in a different row
  const editExistsExact = useMemo(() => {
    if (!editingId || !editUserId || !editWarehouseId) return false
    const uid = Number(editUserId)
    const wid = Number(editWarehouseId)
    return maps.some((mm) => mm.User_id === uid && mm.Warehouse_id === wid && mm.Id_User_Warehouse_Map !== editingId)
  }, [editingId, editUserId, editWarehouseId, maps])

  const handleAssign = async () => {
    if (!userId || !managerId || !warehouseId) return
    if (assignExistsExact) return
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
    <>
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
            <Select
              value={managerId}
              onValueChange={setManagerId}
              disabled={loading || managers.length === 0 || !!mappedManagerId}
            >
              <SelectTrigger>
                <SelectValue placeholder={managers.length ? "Select Manager" : "No managers"} />
              </SelectTrigger>
              <SelectContent>
                {mappedManagerId
                  ? (() => {
                      const m = managers.find((mm) => String(mm.idusers) === mappedManagerId)
                      return (
                        <SelectItem key={mappedManagerId} value={mappedManagerId}>
                          {m ? (m.Full_Name || m.UserName) : `Manager #${mappedManagerId}`}
                        </SelectItem>
                      )
                    })()
                  : managers.map((m) => (
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
            <Button onClick={handleAssign} disabled={saving || !userId || !managerId || !warehouseId || assignExistsExact}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Assign"
              )}
            </Button>
            {assignExistsExact && (
              <p className="text-xs text-muted-foreground mt-1">This user is already mapped to the selected warehouse.</p>
            )}
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
                      <Select
                        value={editManagerId}
                        onValueChange={setEditManagerId}
                        disabled={saving || managers.length === 0 || !!mappedEditManagerId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={managers.length ? "Select Manager" : "No managers"} />
                        </SelectTrigger>
                        <SelectContent>
                          {mappedEditManagerId
                            ? (() => {
                                const em = managers.find((mm) => String(mm.idusers) === mappedEditManagerId)
                                return (
                                  <SelectItem key={mappedEditManagerId} value={mappedEditManagerId}>
                                    {em ? (em.Full_Name || em.UserName) : `Manager #${mappedEditManagerId}`}
                                  </SelectItem>
                                )
                              })()
                            : managers.map((u) => (
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
                        <Button size="sm" variant="default" onClick={saveEdit} disabled={saving || !editUserId || !editManagerId || !editWarehouseId || editExistsExact}>
                          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit} disabled={saving}>Cancel</Button>
                        {editExistsExact && (
                          <span className="text-xs text-muted-foreground">Mapping already exists for this user and warehouse.</span>
                        )}
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
    </>
  )
}
