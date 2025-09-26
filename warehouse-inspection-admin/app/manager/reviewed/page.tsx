"use client"

import { useQuery } from "@tanstack/react-query"
import { listInspections } from "@/lib/api"
import { useRouter } from "next/navigation"
import { ModernCard, ModernCardHeader, ModernCardTitle, ModernCardContent } from "@/components/ui/modern-card"
import { ModernButton } from "@/components/ui/modern-button"
import { StatusBadge } from "@/components/ui/status-badge"
import { ShimmerTableComponent } from "@/components/ui/modern-table"
import { Eye, RefreshCw, Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useMemo, useState } from "react"

export default function ReviewedInspectionsPage() {
  const router = useRouter()
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["reviewed-inspections"],
    queryFn: () => listInspections({ status: "Accepted,Rejected" }),
  })

  const rows = data || []

  const [query, setQuery] = useState("")
  const [fromDate, setFromDate] = useState<string>("")
  const [toDate, setToDate] = useState<string>("")

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((r: any) => {
      const matchesQuery = q
        ? (r.warehouse?.name || "").toLowerCase().includes(q) ||
          (r.commodity?.name || "").toLowerCase().includes(q) ||
          (r.inspector?.full_name || r.inspector?.username || "").toLowerCase().includes(q)
        : true
      let matchesDate = true
      if (fromDate || toDate) {
        const created = r.Created_At ? new Date(r.Created_At) : null
        if (!created) {
          matchesDate = false
        } else {
          if (fromDate) {
            const f = new Date(fromDate)
            f.setHours(0, 0, 0, 0)
            if (created < f) matchesDate = false
          }
          if (toDate) {
            const t = new Date(toDate)
            t.setHours(23, 59, 59, 999)
            if (created > t) matchesDate = false
          }
        }
      }
      return matchesQuery && matchesDate
    })
  }, [rows, query, fromDate, toDate])

  const handleViewDetails = (inspectionId: number) => {
    router.push(`/manager/inspections/${inspectionId}`)
  }

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Reviewed Inspections</h1>
        <p className="text-gray-600 mt-2">View all accepted and rejected inspections</p>
      </div>

      <div className="max-w-7xl mx-auto">
        <ModernCard>
          <ModernCardHeader>
            <div className="flex items-center justify-between gap-4">
              <ModernCardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Accepted / Rejected Inspections
              </ModernCardTitle>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">Total: {rows.length}</span>
                <ModernButton
                  size="sm"
                  variant="outline"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                  Refresh
                </ModernButton>
              </div>
            </div>
          </ModernCardHeader>
          <ModernCardContent>
            {/* Toolbar */}
            {!isLoading && (
              <div className="mb-4 flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                <div className="flex-1">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by warehouse, commodity, or inspector"
                    className="bg-white"
                  />
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
                  onClick={() => { setQuery(""); setFromDate(""); setToDate(""); }}
                  className="bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                  disabled={!query && !fromDate && !toDate}
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
                  <div key={i.Id_Inspections} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow transition">
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
                        <div className="text-xs uppercase text-slate-500">Inspector</div>
                        <div>{i.inspector?.full_name || i.inspector?.username || "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase text-slate-500">Status</div>
                        <div className="mt-1"><StatusBadge status={i.Status as "Accepted" | "Rejected"} /></div>
                      </div>
                      <div className="sm:col-span-2 lg:col-span-1">
                        <div className="text-xs uppercase text-slate-500">Submitted</div>
                        <div className="mt-1 flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{i.Created_At ? new Date(i.Created_At).toLocaleString() : ""}</span>
                        </div>
                      </div>
                      <div className="sm:col-span-2 lg:col-span-3">
                        <div className="text-xs uppercase text-slate-500">Manager Remarks</div>
                        <div className="mt-1 text-sm text-slate-700 line-clamp-2">{i.Manager_Remarks || "—"}</div>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <ModernButton
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(i.Id_Inspections)}
                        className="inline-flex items-center gap-2 bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
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
                <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No reviewed inspections found.</p>
              </div>
            )}
          </ModernCardContent>
        </ModernCard>
      </div>
    </div>
  )
}


