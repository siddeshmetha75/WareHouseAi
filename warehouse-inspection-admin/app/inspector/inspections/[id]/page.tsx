"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getInspectionDetail, deleteEvidence, uploadEvidence } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Play, X } from "lucide-react"

export default function InspectionDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id)
  const router = useRouter()
  const [viewer, setViewer] = useState<null | { type: "image" | "video"; src: string; name?: string }>(null)

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["inspection-detail", id],
    queryFn: () => getInspectionDetail(id),
    enabled: Number.isFinite(id),
  })

  if (isLoading || !data) return <p className="p-6">Loading...</p>

  const inspection = data.inspection
  const answers = data.answers
  const evidence = data.evidence
  const canEdit = ["pending", "rejected"].includes((inspection.status || "").toLowerCase())

  const normalizedStatus = (inspection.status || "").toString().toLowerCase()
  const statusBadgeClasses =
    normalizedStatus === "accepted"
      ? "bg-green-100 text-green-700 border-green-200"
      : normalizedStatus === "rejected"
      ? "bg-red-100 text-red-700 border-red-200"
      : "bg-amber-100 text-amber-700 border-amber-200" // pending/others as warning

  const openPreview = (type: "image" | "video", src: string, name?: string) => {
    setViewer({ type, src, name })
  }
  const closePreview = () => {
    setViewer(null)
  }
  const onDeleteEvidence = async (evidenceId: number) => {
    try {
      await deleteEvidence(id, evidenceId)
      await refetch()
    } catch (e) {
      console.error("Failed to delete evidence", e)
    }
  }
  const onReplaceEvidence = async (questionId: number, evidenceId: number, file: File) => {
    try {
      // Replace = delete old then upload new bound to same question
      await deleteEvidence(id, evidenceId)
      await uploadEvidence(id, file, questionId)
      await refetch()
    } catch (e) {
      console.error("Failed to replace evidence", e)
    }
  }
  const getNameFromUrl = (url: string) => {
    try {
      const last = url.split("/").pop() || "File"
      return decodeURIComponent(last.split("?")[0])
    } catch {
      return "File"
    }
  }

  return (
    <>
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Inspection {inspection.commodity?.name ?? "—"}</h1>
      {canEdit && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => router.push(`/inspector/inspections/${id}/edit`)}
            className="bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
          >
            Edit Inspection
          </Button>
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-muted-foreground">Warehouse:</span> {inspection.warehouse?.name ?? "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Commodity:</span> {inspection.commodity?.name ?? "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Season:</span> {inspection.SeasonName ?? "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Inspector:</span> {inspection.inspector?.full_name || inspection.inspector?.username || "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>{' '}
              <Badge variant="outline" className={statusBadgeClasses}>
                {inspection.status}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Manager Remarks:</span> {inspection.manager_remarks ?? "—"}
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Responses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[70vh] overflow-y-auto p-4 space-y-4">
            {answers.length === 0 && <div className="text-muted-foreground">No answers recorded.</div>}
            {answers.map((a) => (
              <div key={a.question_id} className="rounded-xl shadow p-4">
                <p className="font-semibold">{a.question_text}</p>
                <p>Answer: {a.answer ?? "—"}</p>
                {Array.isArray(a.remarks) ? (
                  a.remarks.length > 0 ? (
                    <div className="mt-2">
                      <p className="font-medium">Manager Remarks</p>
                      <ul className="list-disc pl-5 space-y-1">
                        {a.remarks.map((r: any, idx: number) => (
                          <li key={idx} className="text-sm text-gray-700">
                            {r.status ? (<span className="mr-2 inline-block rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700 border border-gray-200">{r.status}</span>) : null}
                            {r.manager_remarks || r.Remarks || "—"}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null
                ) : (
                  a.remarks ? <p>Remarks: {a.remarks}</p> : null
                )}
                {a.evidence && a.evidence.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-3">
                    {a.evidence.map((ev: any) => (
                      <div key={ev.id} className="w-28">
                        {ev.file_type?.startsWith("image/") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={ev.file_url}
                            alt="evidence"
                            className="w-24 h-24 object-cover rounded cursor-pointer"
                            onClick={() => openPreview("image", ev.file_url, getNameFromUrl(ev.file_url))}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => openPreview("video", ev.file_url, getNameFromUrl(ev.file_url))}
                            className="w-24 h-24 rounded border flex flex-col items-center justify-center gap-1 text-xs text-gray-700 bg-gray-50 hover:bg-blue-50 transition-colors"
                            title={getNameFromUrl(ev.file_url) || "Video"}
                          >
                            <Play className="h-5 w-5 text-blue-600" />
                            <span className="truncate px-1">Video</span>
                          </button>
                        )}
                       
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {!answers.length && evidence.length > 0 && (
              <div className="rounded-xl shadow p-4">
                <p className="font-semibold mb-2">Evidence</p>
                <div className="flex flex-wrap gap-3">
                  {evidence.map((e: any) => (
                    <div key={e.id} className="w-28">
                      {e.file_type?.startsWith("image/") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={e.file_url}
                          alt="evidence"
                          className="w-24 h-24 object-cover rounded cursor-pointer"
                          onClick={() => openPreview("image", e.file_url, getNameFromUrl(e.file_url))}
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => openPreview("video", e.file_url, getNameFromUrl(e.file_url))}
                          className="w-24 h-24 rounded border flex flex-col items-center justify-center gap-1 text-xs text-gray-700 bg-gray-50 hover:bg-blue-50 transition-colors"
                        >
                          <Play className="h-5 w-5 text-blue-600" />
                          <span className="truncate px-1">Video</span>
                        </button>
                      )}
                      <div className="mt-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onDeleteEvidence(e.id)}
                          className="text-xs text-red-600 hover:underline disabled:opacity-50"
                          disabled={isFetching}
                        >
                          Delete
                        </button>
                        <label className="text-xs text-blue-600 hover:underline cursor-pointer disabled:opacity-50">
                          Replace
                          <input
                            type="file"
                            accept="image/*,video/*"
                            className="hidden"
                            onChange={(ev2) => {
                              const f = ev2.target.files?.[0]
                              if (f) onReplaceEvidence(e.question_id, e.id, f)
                              ev2.currentTarget.value = ""
                            }}
                            disabled={isFetching}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
    {viewer && (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/70" onClick={closePreview} />
        <div className="relative z-10 h-full w-full flex items-center justify-center p-4">
          <button
            type="button"
            onClick={closePreview}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/90 hover:bg-white text-gray-700 flex items-center justify-center shadow"
            aria-label="Close preview"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="max-w-[95vw] max-h-[90vh]">
            {viewer.type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={viewer.src} alt={viewer.name || "preview"} className="max-w-full max-h-[90vh] rounded shadow-2xl" />
            ) : (
              <video
                src={viewer.src}
                controls
                autoPlay
                className="max-w-full max-h-[90vh] rounded shadow-2xl bg-black"
              />
            )}
            {viewer.name && (
              <div className="mt-2 text-center text-sm text-white/90 truncate">{viewer.name}</div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  )
}


