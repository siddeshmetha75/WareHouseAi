"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useQuery } from "@tanstack/react-query"
import { listInspections } from "@/lib/api"
import { ModernCard, ModernCardHeader, ModernCardTitle, ModernCardContent } from "@/components/ui/modern-card"
import { ModernTable, ModernTableHeader, ModernTableBody, ModernTableRow, ModernTableCell, ShimmerTableComponent } from "@/components/ui/modern-table"
import { ModernButton } from "@/components/ui/modern-button"
import { StatusBadge } from "@/components/ui/status-badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Eye, Calendar, MessageSquare } from "lucide-react"

export default function InspectorInspectionsPage() {
  const { user } = useAuth()
  const router = useRouter()

  const { data, isLoading } = useQuery({
    queryKey: ["inspections", user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as any[]
      return await listInspections({ inspector_id: user.id })
    },
    enabled: !!user?.id,
  })

  const rows = data ?? []

  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<"All" | "Pending" | "Accepted" | "Rejected">("All")
  const [fromDate, setFromDate] = useState<string>("")
  const [toDate, setToDate] = useState<string>("")
  const [season, setSeason] = useState<string>("All")

  // Build distinct season options from API rows
  const seasonOptions = useMemo(() => {
    const set = new Set<string>()
    ;(rows || []).forEach((r: any) => {
      const s = r.SeasonName || r.season?.name || r.Season?.Name || r.season_name
      if (s && typeof s === "string" && s.trim()) set.add(s)
    })
    return Array.from(set)
  }, [rows])

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((r: any) => {
      const matchesQuery = q
        ? (r.warehouse?.name || "").toLowerCase().includes(q) ||
          (r.commodity?.name || "").toLowerCase().includes(q) ||
          (r.Manager_Remarks || "").toLowerCase().includes(q)
        : true
      const matchesStatus = status === "All" ? true : (r.Status || "").toLowerCase() === status.toLowerCase()
      const sName = r.SeasonName || r.season?.name || r.Season?.Name || r.season_name || ""
      const matchesSeason = season === "All" ? true : String(sName) === season
      // Date filtering
      let matchesDate = true
      if (fromDate || toDate) {
        const created = r.Created_At ? new Date(r.Created_At) : null
        if (!created) {
          matchesDate = false
        } else {
          if (fromDate) {
            const from = new Date(fromDate)
            // normalize to start of day
            from.setHours(0, 0, 0, 0)
            if (created < from) matchesDate = false
          }
          if (toDate) {
            const to = new Date(toDate)
            // normalize to end of day
            to.setHours(23, 59, 59, 999)
            if (created > to) matchesDate = false
          }
        }
      }
      return matchesQuery && matchesStatus && matchesSeason && matchesDate
    })
  }, [rows, query, status, season, fromDate, toDate])

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Inspections</h1>
        <p className="text-gray-600 mt-2">View all your submitted inspections</p>
      </div>

      <ModernCard>
        <ModernCardHeader>
          <ModernCardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Inspection History
          </ModernCardTitle>
        </ModernCardHeader>
        <ModernCardContent>
          {/* Toolbar */}
          {!isLoading && (
            <div className="mb-4 flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
              <div className="flex-1">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by warehouse, commodity, or remarks"
                  className="bg-white"
                />
              </div>
              <div className="w-full sm:w-48">
                <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Accepted">Accepted</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-48">
                <Select value={season} onValueChange={(v: any) => setSeason(v)}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Season" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All seasons</SelectItem>
                    {seasonOptions.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                  aria-label="From date"
                />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                  aria-label="To date"
                />
              </div>
              <div className="text-sm text-gray-500">{filteredRows.length} result(s)</div>
              <ModernButton
                size="sm"
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setStatus("All");
                  setFromDate("");
                  setToDate("");
                  setSeason("All");
                }}
                className="bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                disabled={!query && status === "All" && season === "All" && !fromDate && !toDate}
              >
                Clear
              </ModernButton>
            </div>
          )}

          {isLoading ? (
            <ShimmerTableComponent rows={5} columns={6} />
          ) : (
            <div className="space-y-3">
              {filteredRows.map((i: any) => (
                <div
                  key={i.Id_Inspections}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow transition"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs uppercase text-slate-500">Warehouse</div>
                      <div className="font-medium">{i.warehouse?.name ?? "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase text-slate-500">Commodity</div>
                      <div>{i.commodity?.name ?? "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase text-slate-500">Season</div>
                      <div>{i.SeasonName || i.season?.name || i.Season?.Name || i.season_name || "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase text-slate-500">Status</div>
                      <div className="mt-1"><StatusBadge status={i.Status as "Pending" | "Accepted" | "Rejected"} /></div>
                    </div>
                    <div className="sm:col-span-2">
                      <div className="text-xs uppercase text-slate-500">Manager Remarks</div>
                      {i.Manager_Remarks ? (
                        <div className="mt-1 flex items-center gap-2" title={i.Manager_Remarks}>
                          <MessageSquare className="h-4 w-4 text-gray-400" />
                          <span className="text-sm truncate">{i.Manager_Remarks}</span>
                        </div>
                      ) : (
                        <div className="mt-1 text-gray-400">—</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs uppercase text-slate-500">Created</div>
                      <div className="mt-1 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{i.Created_At ? new Date(i.Created_At).toLocaleDateString() : ""}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <ModernButton
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/inspector/inspections/${i.Id_Inspections}`)}
                      className="inline-flex items-center gap-2 bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 focus-visible:ring-blue-200 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </ModernButton>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!isLoading && rows.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No inspections submitted yet.</p>
              <p className="text-sm mt-2">Start by selecting a warehouse from the dashboard.</p>
            </div>
          )}
          {!isLoading && rows.length > 0 && filteredRows.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No results match your filters.</p>
              <p className="text-sm mt-2">Try adjusting your search or status filter.</p>
            </div>
          )}
        </ModernCardContent>
      </ModernCard>
    </div>
  )
}


