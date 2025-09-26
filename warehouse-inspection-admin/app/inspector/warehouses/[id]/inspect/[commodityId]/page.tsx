 "use client"

import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { getQuestions, createInspectionWithAnswers, uploadEvidence, type ApiQuestion } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Play, X } from "lucide-react"

interface AnswerDraft {
  answer?: string
  remarks?: string
  files?: File[]
}

export default function InspectionFormPage() {
  const params = useParams() as { id: string; commodityId: string }
  const router = useRouter()
  const searchParams = useSearchParams()
  const warehouseId = Number(params.id)
  const commodityId = Number(params.commodityId)
  const seasonIdFromUrl = Number(searchParams.get("season") || 0)

  const { data: questions = [], isLoading } = useQuery<ApiQuestion[]>({ queryKey: ["questions"], queryFn: getQuestions })

  const [answers, setAnswers] = useState<Record<number, AnswerDraft>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")
  const [viewer, setViewer] = useState<null | { type: "image" | "video"; src: string; name?: string }>(null)

  const grouped = useMemo(() => {
    const groups: Record<string, any[]> = {}
    for (const q of questions) {
      const key = (q.category || "General").toString()
      if (!groups[key]) groups[key] = []
      groups[key].push(q)
    }
    return groups
  }, [questions])

  const handleAnswer = (qid: number, patch: Partial<AnswerDraft>) => {
    setAnswers((prev) => ({ ...prev, [qid]: { ...(prev[qid] || {}), ...patch } }))
  }

  // Append new files to the existing list for a question
  const addFiles = (qid: number, fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    const newFiles = Array.from(fileList)
    setAnswers((prev) => {
      const existing = prev[qid]?.files || []
      return { ...prev, [qid]: { ...(prev[qid] || {}), files: [...existing, ...newFiles] } }
    })
  }

  // Remove a file by index for a question
  const removeFile = (qid: number, index: number) => {
    setAnswers((prev) => {
      const existing = prev[qid]?.files || []
      const nextFiles = existing.filter((_, i) => i !== index)
      return { ...prev, [qid]: { ...(prev[qid] || {}), files: nextFiles } }
    })
  }
  const hasAnyAnswer = Object.values(answers).some(a => a.answer && a.answer.trim() !== "")

  const openPreview = (type: "image" | "video", src: string, name?: string) => {
    setViewer({ type, src, name })
  }
  const closePreview = () => {
    if (viewer?.src?.startsWith("blob:")) {
      try { URL.revokeObjectURL(viewer.src) } catch {}
    }
    setViewer(null)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setSubmitting(true)
    try {
      const inspectorId = Number(localStorage.getItem("id"))
      if (!inspectorId) throw new Error("Inspector not logged in")
      const seasonId = seasonIdFromUrl || Number(localStorage.getItem("Season_Id") || 0)
      // persist the chosen season for future defaults
      try { if (seasonId) localStorage.setItem("Season_Id", String(seasonId)) } catch {}
      const answerList = Object.entries(answers).map(([qid, a]) => ({ question_id: Number(qid), answer: a.answer || "", remarks: a.remarks || "" }))
      const { inspection_id } = await createInspectionWithAnswers({
        warehouse_id: warehouseId,
        commodity_id: commodityId,
        inspector_id: inspectorId,
        Season_Id: seasonId,
        answers: answerList,
      })
      // upload evidence files serially to simplify
      for (const [qidStr, a] of Object.entries(answers)) {
        if (a.files && a.files.length > 0) {
          for (const f of a.files) {
            await uploadEvidence(inspection_id, f, Number(qidStr)) // Pass question_id
          }
        }
      }
      setSuccess("Inspection submitted successfully")
      setTimeout(() => router.push("/inspector/dashboard"), 1200)
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401) {
        setError("Unauthorized. Please log in as an Inspector and try again.")
      } else if (status === 403) {
        setError("Forbidden. Only inspectors can create inspections.")
      } else {
        setError(err?.message || "Failed to submit inspection")
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading) return <p className="p-6">Loading questions...</p>

  return (
    <>
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Inspection Form</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <Accordion type="multiple" className="w-full">
              {Object.entries(grouped).map(([category, qs]) => (
                <AccordionItem key={category} value={category}>
                  <AccordionTrigger className="text-left">{category}</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-6">
                      {qs.map((q: any, idx: number) => (
                        <div key={q.id} className="border p-4 rounded-md space-y-3">
                          <div className="font-medium">{q.text}</div>
                          <div>
                            <Label className="mb-2 block">Response</Label>
                            <RadioGroup
                              value={answers[q.id]?.answer || ""}
                              onValueChange={(v) => handleAnswer(q.id, { answer: v })}
                              className="flex items-center gap-6"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Yes" id={`yes-${q.id}`} />
                                <Label htmlFor={`yes-${q.id}`}>Yes</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="No" id={`no-${q.id}`} />
                                <Label htmlFor={`no-${q.id}`}>No</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="NA" id={`na-${q.id}`} />
                                <Label htmlFor={`na-${q.id}`}>N/A</Label>
                              </div>
                            </RadioGroup>
                          </div>
                          <div>
                            <Label className="mb-2 block">Remarks</Label>
                            <Textarea
                              value={answers[q.id]?.remarks || ""}
                              onChange={(e) => handleAnswer(q.id, { remarks: e.target.value })}
                              placeholder="Enter remarks"
                            />
                          </div>
                         <div>
                          <Label className="mb-2 block">Evidence</Label>
                          {/* Hidden input to pick multiple files; we trigger it from the button below */}
                          <input
                            id={`file-${q.id}`}
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            onChange={(e) => addFiles(q.id, e.target.files)}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById(`file-${q.id}`)?.click()}
                            className="bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                          >
                            Add images/videos
                          </Button>
                          {/* Previews and remove controls */}
                          {answers[q.id]?.files && answers[q.id]?.files!.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-3">
                              {answers[q.id]!.files!.map((f, idx) => {
                                const isImage = f.type.startsWith("image/")
                                const blobUrl = URL.createObjectURL(f)
                                return (
                                  <div key={idx} className="relative w-24 h-24">
                                    {isImage ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={blobUrl}
                                        alt={f.name}
                                        className="w-24 h-24 object-cover rounded cursor-pointer"
                                        onClick={() => openPreview("image", blobUrl, f.name)}
                                      />
                                    ) : (
                                      <button
                                        type="button"
                                        title={f.name}
                                        onClick={() => openPreview("video", blobUrl, f.name)}
                                        className="w-24 h-24 rounded border flex flex-col items-center justify-center gap-1 text-xs text-gray-700 bg-gray-50 hover:bg-blue-50 transition-colors"
                                      >
                                        <Play className="h-5 w-5 text-blue-600" />
                                        <span className="truncate px-1">Video</span>
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => removeFile(q.id, idx)}
                                      aria-label={`Remove ${f.name}`}
                                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center shadow"
                                    >
                                      ×
                                    </button>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

             <Button type="submit" disabled={submitting || !hasAnyAnswer}>
    {submitting ? "Submitting..." : "Submit Inspection"}
  </Button>
    </form>
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
