"use client"

import { useAuth } from "@/contexts/auth-context"
import { useQuery } from "@tanstack/react-query"
import { getManagerInspectors, listInspections } from "@/lib/api"
import { useState } from "react"
import { ModernCard, ModernCardHeader, ModernCardTitle, ModernCardContent } from "@/components/ui/modern-card"
import { ModernTable, ModernTableHeader, ModernTableBody, ModernTableRow, ModernTableCell, ShimmerTableComponent } from "@/components/ui/modern-table"
import { ModernButton } from "@/components/ui/modern-button"
import { StatusBadge } from "@/components/ui/status-badge"
import { Badge } from "@/components/ui/badge"
import { Eye, Users, RefreshCw } from "lucide-react"

export default function ManagerInspectorsPage() {
  const { user } = useAuth()
  const managerId = user?.id || 0
  const [selectedInspector, setSelectedInspector] = useState<number | null>(null)

  const { data: inspectors, isLoading: inspectorsLoading } = useQuery({
    queryKey: ["manager-inspectors", managerId],
    queryFn: () => getManagerInspectors(managerId),
    enabled: !!managerId,
  })

  const { data: inspections, isLoading: inspectionsLoading, refetch: refetchInspections, isFetching: inspectionsFetching } = useQuery({
    queryKey: ["inspector-inspections", selectedInspector],
    queryFn: () => listInspections({ inspector_id: selectedInspector }),
    enabled: !!selectedInspector,
  })

  const selectedInspectorData = inspectors?.find(ins => ins.id === selectedInspector)

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Inspectors</h1>
        <p className="text-gray-600 mt-2">Manage inspectors under your supervision</p>
      </div>

      <ModernCard>
        <ModernCardHeader>
          <ModernCardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Inspectors under you
          </ModernCardTitle>
        </ModernCardHeader>
        <ModernCardContent>
          {inspectorsLoading ? (
            <ShimmerTableComponent rows={5} columns={4} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(inspectors || []).map((ins) => {
                const selected = selectedInspector === ins.id
                return (
                  <div
                    key={ins.id}
                    className={`rounded-xl border p-4 bg-white transition shadow-sm hover:shadow ${selected ? "border-blue-300 bg-blue-50" : "border-slate-200"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase text-slate-500">Username</div>
                        <div className="font-medium text-gray-900">{ins.UserName}</div>
                        <div className="mt-2 text-xs uppercase text-slate-500">Full Name</div>
                        <div className="text-gray-800">{ins.Full_Name || "—"}</div>
                      </div>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Inspector</Badge>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <ModernButton
                        size="sm"
                        variant={selected ? "primary" : "outline"}
                        onClick={() => setSelectedInspector(ins.id)}
                        className={selected
                          ? "inline-flex items-center gap-2"
                          : "inline-flex items-center gap-2 bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"}
                      >
                        <Eye className="h-4 w-4" />
                        View Inspections
                      </ModernButton>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {!inspectorsLoading && (!inspectors || inspectors.length === 0) && (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No inspectors found under your supervision.</p>
            </div>
          )}
        </ModernCardContent>
      </ModernCard>

      {selectedInspector && selectedInspectorData && (
        <ModernCard>
          <ModernCardHeader>
            <div className="flex items-center justify-between gap-4">
              <ModernCardTitle>
                Inspections by {selectedInspectorData.Full_Name || selectedInspectorData.UserName}
              </ModernCardTitle>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">Total: {inspections?.length ?? 0}</span>
                <ModernButton
                  size="sm"
                  variant="outline"
                  onClick={() => refetchInspections()}
                  disabled={inspectionsFetching}
                  className="flex items-center gap-2 bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                >
                  <RefreshCw className={`h-4 w-4 ${inspectionsFetching ? "animate-spin" : ""}`} />
                  Refresh
                </ModernButton>
                <ModernButton
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedInspector(null)}
                  className="bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                >
                  Clear Selection
                </ModernButton>
              </div>
            </div>
          </ModernCardHeader>
          <ModernCardContent>
            {inspectionsLoading ? (
              <ShimmerTableComponent rows={5} columns={4} />
            ) : (
              <ModernTable>
                
                <ModernTableBody>
                  {(inspections || []).map((i) => (
                    <ModernTableRow key={i.Id_Inspections}>
                      <ModernTableCell className="font-medium">{i.warehouse?.name ?? "—"}</ModernTableCell>
                      <ModernTableCell>{i.commodity?.name ?? "—"}</ModernTableCell>
                      <ModernTableCell>{i.Created_At ? new Date(i.Created_At).toLocaleString() : ""}</ModernTableCell>
                      <ModernTableCell>
                        <StatusBadge status={i.Status as "Pending" | "Accepted" | "Rejected"} />
                      </ModernTableCell>
                    </ModernTableRow>
                  ))}
                </ModernTableBody>
              </ModernTable>
            )}
            {!inspectionsLoading && (!inspections || inspections.length === 0) && (
              <div className="text-center py-12 text-gray-500">
                <p>No inspections found for this inspector.</p>
              </div>
            )}
          </ModernCardContent>
        </ModernCard>
      )}
    </div>
  )
}


