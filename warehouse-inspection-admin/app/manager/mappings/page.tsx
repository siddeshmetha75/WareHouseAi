"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Trash2 } from "lucide-react"
import {
  getManagerInspectors,
  getWarehouses,
  getCommodities,
  getSeasons,
  type ApiUser,
  type ApiWarehouse,
  type ApiCommodity,
  type ApiSeason,
  getAllCommodityWarehouseMaps,
  createCommodityWarehouseMap,
  deleteCommodityWarehouseMap,
  type ApiCommodityWarehouseMapAll,
  getUserWarehouseMaps,
  type ApiUserWarehouseMap,
} from "@/lib/api"

export default function ManagerInspectorMappingsPage() {
  const { user } = useAuth()

  const [inspectors, setInspectors] = useState<ApiUser[]>([])
  const [warehouses, setWarehouses] = useState<ApiWarehouse[]>([])
  const [commodities, setCommodities] = useState<ApiCommodity[]>([])
  const [seasons, setSeasons] = useState<ApiSeason[]>([])
  const [mappings, setMappings] = useState<ApiCommodityWarehouseMapAll[]>([])
  const [userWhMaps, setUserWhMaps] = useState<ApiUserWarehouseMap[]>([])

  const [inspectorId, setInspectorId] = useState<string>("")
  const [warehouseId, setWarehouseId] = useState<string>("")
  const [commodityId, setCommodityId] = useState<string>("")
  const [seasonId, setSeasonId] = useState<string>("")

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editInspectorId, setEditInspectorId] = useState<string>("")
  const [editWarehouseId, setEditWarehouseId] = useState<string>("")
  const [editCommodityId, setEditCommodityId] = useState<string>("")
  const [editSeasonId, setEditSeasonId] = useState<string>("")

  const managerId = user?.id ?? null

  const load = async () => {
    if (!managerId) return
    setLoading(true)
    try {
      const [ins, whs, coms, seas, maps, uwm] = await Promise.all([
        getManagerInspectors(managerId),
        getWarehouses(),
        getCommodities(),
        getSeasons(),
        getAllCommodityWarehouseMaps(),
        getUserWarehouseMaps(),
      ])
      setInspectors(ins as any)
      setWarehouses(whs)
      setCommodities(coms as any)
      setSeasons(seas)
      setMappings(maps)
      setUserWhMaps(uwm)
    } finally {
      setLoading(false)
    }
  }

  // Allowed warehouses for current create form based on selected inspector and current manager
  const allowedWarehouseIds = useMemo(() => {
    if (!managerId || !inspectorId) return new Set<number>()
    const ids = userWhMaps
      .filter((m) => m.Manager_id === managerId && m.User_id === Number(inspectorId))
      .map((m) => m.Warehouse_id)
    return new Set<number>(ids)
  }, [userWhMaps, managerId, inspectorId])

  // If selected warehouse no longer valid when inspector changes, reset it
  useEffect(() => {
    if (!warehouseId) return
    if (allowedWarehouseIds.size > 0 && !allowedWarehouseIds.has(Number(warehouseId))) {
      setWarehouseId("")
    }
  }, [allowedWarehouseIds])

  // For edit row: allowed warehouses depend on editInspectorId
  const allowedEditWarehouseIds = useMemo(() => {
    if (!managerId || !editInspectorId) return new Set<number>()
    const ids = userWhMaps
      .filter((m) => m.Manager_id === managerId && m.User_id === Number(editInspectorId))
      .map((m) => m.Warehouse_id)
    return new Set<number>(ids)
  }, [userWhMaps, managerId, editInspectorId])

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [managerId])

  const filteredMappings = useMemo(() => {
    return mappings.filter((m) => (managerId ? m.ManagerId === managerId : true))
  }, [mappings, managerId])

  const nameFor = {
    inspector: (id?: number | null) => {
      const u = inspectors.find((x: any) => (x.idusers ?? x.id) === id)
      return u ? (u.Full_Name || u.UserName) : `#${id}`
    },
    warehouse: (id?: number | null) => {
      const w = warehouses.find((x) => x.Id_Warehouse === id)
      return w ? w.Warehouse_Name : `#${id}`
    },
    commodity: (id?: number | null) => {
      const c = commodities.find((x: any) => (x.IdCommodity ?? x.id) === id)
      return c ? (c.Commodity_Name || (c as any).name) : `#${id}`
    },
    season: (id?: number | null) => {
      const s = seasons.find((x) => x.IdSeason === id)
      return s ? s.Season_Name : `#${id}`
    },
  }

  const handleCreate = async () => {
    if (!managerId || !inspectorId || !warehouseId || !commodityId || !seasonId) return
    setError("")

    // Client-side duplicate guard
    const dup = mappings.find(
      (m) =>
        m.Is_Active !== 0 &&
        m.ManagerId === managerId &&
        m.InspectorId === Number(inspectorId) &&
        m.WarehouseId === Number(warehouseId) &&
        m.CommodityId === Number(commodityId) &&
        m.SeasonId === Number(seasonId)
    )
    if (dup) {
      setError("Mapping already exists for selected Inspector, Warehouse, Commodity and Season.")
      return
    }
    setSaving(true)
    try {
      await createCommodityWarehouseMap({
        ManagerId: managerId,
        InspectorId: Number(inspectorId),
        WarehouseId: Number(warehouseId),
        CommodityId: Number(commodityId),
        SeasonId: Number(seasonId),
        Is_Active: 1,
      })
      // reset form
      setInspectorId("")
      setWarehouseId("")
      setCommodityId("")
      setSeasonId("")
      await load()
    } catch (e: any) {
      if (e?.response?.status === 409) {
        setError("Mapping already exists for selected Inspector, Warehouse, Commodity and Season.")
      } else {
        setError(e?.message || "Failed to create mapping")
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    setSaving(true)
    try {
      await deleteCommodityWarehouseMap(id)
      await load()
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (m: ApiCommodityWarehouseMapAll) => {
    setEditingId(m.Id_CommodityWarehouseMap)
    setEditInspectorId(String(m.InspectorId))
    setEditWarehouseId(String(m.WarehouseId))
    setEditCommodityId(String(m.CommodityId))
    setEditSeasonId(String(m.SeasonId))
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditInspectorId("")
    setEditWarehouseId("")
    setEditCommodityId("")
    setEditSeasonId("")
  }

  const saveEdit = async () => {
    if (!editingId) return
    setError("")

    // Client-side duplicate guard for the edited values
    const dup = mappings.find(
      (m) =>
        m.Id_CommodityWarehouseMap !== editingId &&
        m.Is_Active !== 0 &&
        m.ManagerId === managerId &&
        m.InspectorId === Number(editInspectorId) &&
        m.WarehouseId === Number(editWarehouseId) &&
        m.CommodityId === Number(editCommodityId) &&
        m.SeasonId === Number(editSeasonId)
    )
    if (dup) {
      setError("Mapping already exists for selected Inspector, Warehouse, Commodity and Season.")
      return
    }
    setSaving(true)
    try {
      const { updateCommodityWarehouseMap } = await import("@/lib/api")
      await updateCommodityWarehouseMap(editingId, {
        InspectorId: Number(editInspectorId),
        WarehouseId: Number(editWarehouseId),
        CommodityId: Number(editCommodityId),
        SeasonId: Number(editSeasonId),
      })
      cancelEdit()
      await load()
    } catch (e: any) {
      if (e?.response?.status === 409) {
        setError("Mapping already exists for selected Inspector, Warehouse, Commodity and Season.")
      } else {
        setError(e?.message || "Failed to update mapping")
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <Card className="border border-blue-100 shadow-sm">
        <CardHeader>
          <CardTitle>Map Inspector to Warehouse, Commodity & Season</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          {error && (
            <div className="md:col-span-5 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>
          )}
          <div className="space-y-2">
            <Label>Inspector</Label>
            <Select value={inspectorId} onValueChange={setInspectorId} disabled={loading || inspectors.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder={inspectors.length ? "Select Inspector" : "No inspectors"} />
              </SelectTrigger>
              <SelectContent>
                {inspectors.map((i: any) => {
                  const iid = i.idusers ?? i.id
                  return (
                    <SelectItem key={iid} value={String(iid)}>
                      {i.Full_Name || i.UserName}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Warehouse</Label>
            <Select
              value={warehouseId}
              onValueChange={setWarehouseId}
              disabled={loading || !inspectorId || warehouses.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !inspectorId
                      ? "Select Inspector first"
                      : (warehouses.length ? "Select Warehouse" : "No warehouses")
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {warehouses
                  .filter((w) => allowedWarehouseIds.size === 0 || allowedWarehouseIds.has(w.Id_Warehouse))
                  .map((w) => (
                    <SelectItem key={w.Id_Warehouse} value={String(w.Id_Warehouse)}>
                      {w.Warehouse_Name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Commodity</Label>
            <Select value={commodityId} onValueChange={setCommodityId} disabled={loading || commodities.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder={commodities.length ? "Select Commodity" : "No commodities"} />
              </SelectTrigger>
              <SelectContent>
                {commodities.map((c: any) => (
                  <SelectItem key={c.IdCommodity ?? c.id} value={String(c.IdCommodity ?? c.id)}>
                    {c.Commodity_Name || c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Season</Label>
            <Select value={seasonId} onValueChange={setSeasonId} disabled={loading || seasons.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder={seasons.length ? "Select Season" : "No seasons"} />
              </SelectTrigger>
              <SelectContent>
                {seasons.map((s) => (
                  <SelectItem key={s.IdSeason} value={String(s.IdSeason)}>
                    {s.Season_Name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Button onClick={handleCreate} disabled={saving || !inspectorId || !warehouseId || !commodityId || !seasonId} className="w-full md:w-auto">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Map"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-blue-100 shadow-sm">
        <CardHeader>
          <CardTitle>
            Current Mappings{user ? ` (Manager: ${user.fullName || user.username})` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Inspector</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Commodity</TableHead>
                <TableHead>Season</TableHead>
                <TableHead className="w-40 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMappings.map((m) => (
                <TableRow key={m.Id_CommodityWarehouseMap}>
                  <TableCell>
                    {editingId === m.Id_CommodityWarehouseMap ? (
                      <Select value={editInspectorId} onValueChange={setEditInspectorId} disabled={saving || inspectors.length === 0}>
                        <SelectTrigger>
                          <SelectValue placeholder={inspectors.length ? "Select Inspector" : "No inspectors"} />
                        </SelectTrigger>
                        <SelectContent>
                          {inspectors.map((i: any) => {
                            const iid = i.idusers ?? i.id
                            return (
                              <SelectItem key={iid} value={String(iid)}>
                                {i.Full_Name || i.UserName}
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    ) : (
                      nameFor.inspector(m.InspectorId)
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === m.Id_CommodityWarehouseMap ? (
                      <Select
                        value={editWarehouseId}
                        onValueChange={setEditWarehouseId}
                        disabled={saving || !editInspectorId || warehouses.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              !editInspectorId
                                ? "Select Inspector first"
                                : (warehouses.length ? "Select Warehouse" : "No warehouses")
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses
                            .filter((w) => allowedEditWarehouseIds.size === 0 || allowedEditWarehouseIds.has(w.Id_Warehouse))
                            .map((w) => (
                              <SelectItem key={w.Id_Warehouse} value={String(w.Id_Warehouse)}>
                                {w.Warehouse_Name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      nameFor.warehouse(m.WarehouseId)
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === m.Id_CommodityWarehouseMap ? (
                      <Select value={editCommodityId} onValueChange={setEditCommodityId} disabled={saving || commodities.length === 0}>
                        <SelectTrigger>
                          <SelectValue placeholder={commodities.length ? "Select Commodity" : "No commodities"} />
                        </SelectTrigger>
                        <SelectContent>
                          {commodities.map((c: any) => (
                            <SelectItem key={c.IdCommodity ?? c.id} value={String(c.IdCommodity ?? c.id)}>
                              {c.Commodity_Name || c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      nameFor.commodity(m.CommodityId)
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === m.Id_CommodityWarehouseMap ? (
                      <Select value={editSeasonId} onValueChange={setEditSeasonId} disabled={saving || seasons.length === 0}>
                        <SelectTrigger>
                          <SelectValue placeholder={seasons.length ? "Select Season" : "No seasons"} />
                        </SelectTrigger>
                        <SelectContent>
                          {seasons.map((s) => (
                            <SelectItem key={s.IdSeason} value={String(s.IdSeason)}>
                              {s.Season_Name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      nameFor.season(m.SeasonId)
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === m.Id_CommodityWarehouseMap ? (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="default" onClick={saveEdit} disabled={saving || !editInspectorId || !editWarehouseId || !editCommodityId || !editSeasonId}>
                          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit} disabled={saving}>Cancel</Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => startEdit(m)}>Edit</Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(m.Id_CommodityWarehouseMap)} aria-label="Delete mapping">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredMappings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">No mappings found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
