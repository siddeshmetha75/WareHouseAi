"use client"

import { useEffect, useMemo, useState } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Plus, RefreshCw } from "lucide-react"
import { createWarehouse, deleteWarehouse, getWarehouses, updateWarehouse, type ApiWarehouse } from "@/lib/api"
import { AppShell } from "@/components/layout/app-shell"

type Mode = "list" | "create" | "edit"

interface FormState {
  Id_Warehouse?: number
  Warehouse_Name: string
  Location: string
  Code: string
  Capacity?: string
  Latitude?: string
  Longitude?: string
  Inventory?: string
}

export default function WarehousesPage() {
  const [mode, setMode] = useState<Mode>("list")
  const [rows, setRows] = useState<ApiWarehouse[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [form, setForm] = useState<FormState>({ Warehouse_Name: "", Location: "", Code: "", Capacity: "", Latitude: "", Longitude: "", Inventory: "" })

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await getWarehouses()
      setRows(data)
    } catch (e: any) {
      setError(e?.message || "Failed to load warehouses")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const resetForm = () => setForm({ Warehouse_Name: "", Location: "", Code: "", Capacity: "", Latitude: "", Longitude: "", Inventory: "" })

  const onCreate = async () => {
    setLoading(true)
    setError("")
    try {
      await createWarehouse({
        Warehouse_Name: form.Warehouse_Name,
        Location: form.Location || undefined,
        Code: form.Code || undefined,
        Capacity: form.Capacity ? Number(form.Capacity) : undefined,
        Latitude: form.Latitude ? Number(form.Latitude) : undefined,
        Longitude: form.Longitude ? Number(form.Longitude) : undefined,
        Inventory: form.Inventory || undefined,
      })
      resetForm()
      setMode("list")
      await load()
    } catch (e: any) {
      setError(e?.message || "Failed to create warehouse")
    } finally {
      setLoading(false)
    }
  }

  const onUpdate = async () => {
    if (!form.Id_Warehouse) return
    setLoading(true)
    setError("")
    try {
      await updateWarehouse(form.Id_Warehouse, {
        Warehouse_Name: form.Warehouse_Name,
        Location: form.Location || undefined,
        Code: form.Code || undefined,
        Capacity: form.Capacity ? Number(form.Capacity) : undefined,
        Latitude: form.Latitude ? Number(form.Latitude) : undefined,
        Longitude: form.Longitude ? Number(form.Longitude) : undefined,
        Inventory: form.Inventory || undefined,
      })
      resetForm()
      setMode("list")
      await load()
    } catch (e: any) {
      setError(e?.message || "Failed to update warehouse")
    } finally {
      setLoading(false)
    }
  }

  const onDelete = async (id: number) => {
    if (!confirm("Delete this warehouse?")) return
    setLoading(true)
    setError("")
    try {
      await deleteWarehouse(id)
      await load()
    } catch (e: any) {
      setError(e?.message || "Failed to delete warehouse")
    } finally {
      setLoading(false)
    }
  }

  const title = useMemo(() => (mode === "create" ? "Add Warehouse" : mode === "edit" ? "Edit Warehouse" : "Warehouses"), [mode])

  return (
    <ProtectedRoute requiredRoles={["Admin", "Manager"]}>
      <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground">Manage warehouses (Warehouse_Name, Location, Code, Capacity, Latitude, Longitude, Inventory)</p>
          </div>
          <div className="flex items-center gap-2">
            {mode === "list" && (
              <Button onClick={() => { resetForm(); setMode("create") }} disabled={loading}>
                <Plus className="mr-2 h-4 w-4" />
                Add Warehouse
              </Button>
            )}
            <Button variant="outline" onClick={load} disabled={loading} className="inline-flex items-center gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {mode !== "list" ? (
          <div className="rounded-md border p-4 max-w-2xl bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Warehouse Name<span className="text-red-500"> *</span></label>
                <Input value={form.Warehouse_Name} onChange={(e) => setForm({ ...form, Warehouse_Name: e.target.value })} placeholder="Enter warehouse name" disabled={loading} required />
              </div>
              <div>
                <label className="block text-sm mb-1">Location</label>
                <Input value={form.Location} onChange={(e) => setForm({ ...form, Location: e.target.value })} placeholder="Enter location" disabled={loading} />
              </div>
              <div>
                <label className="block text-sm mb-1">Code</label>
                <Input value={form.Code} onChange={(e) => setForm({ ...form, Code: e.target.value })} placeholder="Enter code" disabled={loading} required />
              </div>
              <div>
                <label className="block text-sm mb-1">Capacity</label>
                <Input type="number" value={form.Capacity} onChange={(e) => setForm({ ...form, Capacity: e.target.value })} placeholder="Enter capacity" disabled={loading} required />
              </div>
              <div>
                <label className="block text-sm mb-1">Latitude</label>
                <Input type="number" step="any" value={form.Latitude} onChange={(e) => setForm({ ...form, Latitude: e.target.value })} placeholder="Enter latitude" disabled={loading} required />
              </div>
              <div>
                <label className="block text-sm mb-1">Longitude</label>
                <Input type="number" step="any" value={form.Longitude} onChange={(e) => setForm({ ...form, Longitude: e.target.value })} placeholder="Enter longitude" disabled={loading} required />
              </div>
              {/* <div className="md:col-span-2">
                <label className="block text-sm mb-1">Inventory</label>
                <Input value={form.Inventory ?? ""} onChange={(e) => setForm({ ...form, Inventory: e.target.value })} placeholder="Enter inventory (optional)" disabled={loading} />
              </div> */}
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={mode === "create" ? onCreate : onUpdate} disabled={loading || !form.Warehouse_Name.trim() || !form.Code.trim() || !form.Capacity || !form.Latitude || !form.Longitude}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : (mode === "create" ? "Save" : "Save Changes")}
              </Button>
              <Button variant="outline" onClick={() => { resetForm(); setMode("list") }} disabled={loading}>
                Cancel
              </Button>
              {!form.Warehouse_Name.trim() && (
                <span className="text-sm text-muted-foreground self-center">Enter a name to enable Save</span>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto bg-white">
            {loading ? (
              <div className="p-6 flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Warehouse_Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Latitude</TableHead>
                    <TableHead>Longitude</TableHead>
      
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((w) => (
                    <TableRow key={w.Id_Warehouse}>
                      <TableCell>{w.Warehouse_Name}</TableCell>
                      <TableCell>{w.Location || "-"}</TableCell>
                      <TableCell>{w.Code || "-"}</TableCell>
                      <TableCell>{w.Capacity ?? "-"}</TableCell>
                      <TableCell>{w.Latitude ?? "-"}</TableCell>
                      <TableCell>{w.Longitude ?? "-"}</TableCell>
                     
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setForm({
                            Id_Warehouse: w.Id_Warehouse,
                            Warehouse_Name: w.Warehouse_Name || "",
                            Location: w.Location || "",
                            Code: w.Code || "",
                            Capacity: (w.Capacity ?? "").toString(),
                            Latitude: (w.Latitude ?? "").toString(),
                            Longitude: (w.Longitude ?? "").toString(),
                            Inventory: w.Inventory ?? "",
                          }); setMode("edit") }} disabled={loading}>Edit</Button>
                          <Button size="sm" variant="destructive" onClick={() => onDelete(w.Id_Warehouse)} disabled={loading}>Delete</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-6">No warehouses found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </div>
      </AppShell>
    </ProtectedRoute>
  )
}
