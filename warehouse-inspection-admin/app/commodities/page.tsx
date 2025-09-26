"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Search, MoreHorizontal, Edit, Trash2, Plus, Package, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createCommodity, deleteCommodity, getCommodities, updateCommodity, type ApiCommodity } from "@/lib/api"
import { AppShell } from "@/components/layout/app-shell"

type Mode = "list" | "create" | "edit"

interface FormState {
  IdCommodity?: number
  Commodity_Name: string
  CommodityStorage: string
  Category: string
  Description: string
  IsActive: 0 | 1
}

export default function CommoditiesPage() {
  const [mode, setMode] = useState<Mode>("list")
  const [rows, setRows] = useState<ApiCommodity[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [storageFilter, setStorageFilter] = useState<string>("all")
  const [activeFilter, setActiveFilter] = useState<string>("all")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState<FormState>({ Commodity_Name: "", CommodityStorage: "", Category: "", Description: "", IsActive: 1 })

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const params: any = {}
      if (categoryFilter !== "all") params.category = categoryFilter
      if (storageFilter !== "all") params.storage = storageFilter
      if (activeFilter !== "all") params.active = activeFilter === "active" ? 1 : 0
      if (searchTerm.trim()) params.name = searchTerm.trim()
      const data = await getCommodities(params)
      setRows(data)
    } catch (e: any) {
      setError(e?.message || "Failed to load commodities")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, storageFilter, activeFilter])

  const filtered = useMemo(() => rows, [rows])

  const uniqueCategories = useMemo(() => Array.from(new Set(rows.map((c) => c.Category).filter(Boolean))) as string[], [rows])

  return (
    <ProtectedRoute requiredRoles={["Admin", "Manager"]}>
      <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Commodities</h1>
            <p className="text-muted-foreground">Manage commodity types and categories</p>
          </div>
          <div className="flex items-center gap-2">
            {mode === "list" && (
              <Button onClick={() => { setForm({ Commodity_Name: "", CommodityStorage: "", Category: "", Description: "", IsActive: 1 }); setMode("create") }} disabled={loading}>
                <Plus className="mr-2 h-4 w-4" />
                Add Commodity
              </Button>
            )}
            <Button variant="outline" onClick={load} disabled={loading} className="inline-flex items-center gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Commodity Management</CardTitle>
                <CardDescription>Manage commodity types available for inspection</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {mode !== "list" && (
              <div className="rounded-md border p-4 bg-white mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Commodity Name<span className="text-red-500"> *</span></label>
                    <Input value={form.Commodity_Name} onChange={(e) => setForm({ ...form, Commodity_Name: e.target.value })} placeholder="Enter commodity name" disabled={loading} required />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Commodity Storage</label>
                    <Select value={form.CommodityStorage} onValueChange={(v) => setForm({ ...form, CommodityStorage: v })}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select storage" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cold">Cold</SelectItem>
                        <SelectItem value="Normal">Normal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Category</label>
                    <Input value={form.Category} onChange={(e) => setForm({ ...form, Category: e.target.value })} placeholder="Enter category" disabled={loading} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm mb-1">Description</label>
                    <Input value={form.Description} onChange={(e) => setForm({ ...form, Description: e.target.value })} placeholder="Enter description" disabled={loading} />
                  </div>
                  {/* IsActive hidden from UI as requested */}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={async () => {
                    try {
                      setLoading(true)
                      setError("")
                      if (mode === "create") {
                        await createCommodity({
                          Commodity_Name: form.Commodity_Name,
                          CommodityStorage: form.CommodityStorage || undefined,
                          Category: form.Category || undefined,
                          Description: form.Description || undefined,
                          IsActive: form.IsActive,
                        })
                      } else if (mode === "edit" && form.IdCommodity) {
                        await updateCommodity(form.IdCommodity, {
                          Commodity_Name: form.Commodity_Name,
                          CommodityStorage: form.CommodityStorage || undefined,
                          Category: form.Category || undefined,
                          Description: form.Description || undefined,
                          IsActive: form.IsActive,
                        })
                      }
                      setMode("list")
                      setForm({ Commodity_Name: "", CommodityStorage: "", Category: "", Description: "", IsActive: 1 })
                      await load()
                    } catch (e: any) {
                      setError(e?.message || "Failed to save commodity")
                    } finally {
                      setLoading(false)
                    }
                  }} disabled={loading || !form.Commodity_Name.trim()}>
                    Save
                  </Button>
                  <Button variant="outline" onClick={() => { setMode("list"); setForm({ Commodity_Name: "", CommodityStorage: "", Category: "", Description: "", IsActive: 1 }) }} disabled={loading}>Cancel</Button>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search commodities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && load()}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {uniqueCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={storageFilter} onValueChange={setStorageFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Storage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Storage</SelectItem>
                    <SelectItem value="Cold">Cold</SelectItem>
                    <SelectItem value="Normal">Normal</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={load}>Apply</Button>
              </div>
            </div>

            <div className="rounded-md border bg-white">
              {loading ? (
                <div className="p-6 text-muted-foreground">Loading...</div>
              ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Commodity_Name</TableHead>
                    <TableHead>CommodityStorage</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    {/* IsActive hidden from UI as requested */}
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.IdCommodity}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        {c.Commodity_Name}
                      </TableCell>
                      <TableCell>{c.CommodityStorage || "-"}</TableCell>
                      <TableCell>{c.Category || "-"}</TableCell>
                      <TableCell className="max-w-[240px] truncate" title={c.Description || undefined}>{c.Description || "-"}</TableCell>
                      {/* IsActive hidden from UI as requested */}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setForm({
                              IdCommodity: c.IdCommodity,
                              Commodity_Name: c.Commodity_Name || "",
                              CommodityStorage: c.CommodityStorage || "",
                              Category: c.Category || "",
                              Description: c.Description || "",
                              IsActive: c.IsActive ? 1 : 0,
                            }); setMode("edit") }}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteCommodity(c.IdCommodity).then(load)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              )}
            </div>

            {filtered.length === 0 && !loading && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No commodities found matching your criteria.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </AppShell>
    </ProtectedRoute>
  )
}
