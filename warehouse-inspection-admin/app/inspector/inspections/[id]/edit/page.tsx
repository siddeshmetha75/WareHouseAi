"use client"

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { getInspectionDetail, uploadEvidence, updateInspectionDetails, getQuestions, type ApiQuestion, deleteEvidence } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Play, Upload } from "lucide-react"

interface AnswerDraft {
  answer?: string
  remarks?: string
  files?: File[]
}

export default function EditInspectionPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = Number(params.id)
  const focusQ = Number(searchParams.get("q") || 0)

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["inspection-detail", id],
    queryFn: () => getInspectionDetail(id),
    enabled: isFinite(id) && id > 0,
  })

  const { data: allQuestions = [], isLoading: isLoadingQuestions } = useQuery<ApiQuestion[]>({
    queryKey: ["questions"],
    queryFn: getQuestions,
  })

  const [answers, setAnswers] = useState<Record<number, AnswerDraft>>({})
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState<string>("")
  const [err, setErr] = useState<string>("")
  const qRefs = useRef<Record<number, HTMLDivElement | null>>({})

  useEffect(() => {
    if (!data) return
    // Prefill answers from API
    const map: Record<number, AnswerDraft> = {}
    data.answers.forEach(a => {
      map[a.question_id] = {
        answer: a.answer || "",
        remarks: a.remarks || "",
        files: [],
      }
    })
    setAnswers(map)
  }, [data])

  useEffect(() => {
    // Optional: scroll to a specific question if ?q=question_id is provided
    if (focusQ && qRefs.current[focusQ]) {
      qRefs.current[focusQ]?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [focusQ, data])

  const handleAnswer = (qid: number, patch: Partial<AnswerDraft>) => {
    setAnswers(prev => ({ ...prev, [qid]: { ...(prev[qid] || {}), ...patch } }))
  }

  const addFiles = (qid: number, fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    const newFiles = Array.from(fileList)
    setAnswers(prev => {
      const existing = prev[qid]?.files || []
      return { ...prev, [qid]: { ...(prev[qid] || {}), files: [...existing, ...newFiles] } }
    })
  }

  const removeFile = (qid: number, index: number) => {
    setAnswers(prev => {
      const existing = prev[qid]?.files || []
      const nextFiles = existing.filter((_, i) => i !== index)
      return { ...prev, [qid]: { ...(prev[qid] || {}), files: nextFiles } }
    })
  }

  // Handlers for existing evidence operations
  const onDeleteExistingEvidence = async (evidenceId: number) => {
    try {
      setMsg("")
      setErr("")
      await deleteEvidence(id, evidenceId)
      await refetch()
    } catch (e: any) {
      setErr(e?.message || "Failed to delete evidence")
    }
  }

  const onReplaceExistingEvidence = async (qid: number, evidenceId: number, file: File) => {
    try {
      setMsg("")
      setErr("")
      await deleteEvidence(id, evidenceId)
      await uploadEvidence(id, file, qid)
      await refetch()
      setMsg("Evidence replaced successfully")
    } catch (e: any) {
      setErr(e?.message || "Failed to replace evidence")
    }
  }

  const uploadNewEvidence = async (qid: number) => {
    try {
      setMsg("")
      setErr("")
      const files = answers[qid]?.files || []
      if (!files.length) return
      for (const f of files) {
        await uploadEvidence(id, f, qid)
      }
      setMsg("Evidence uploaded successfully")
      // clear file list for that qid after upload
      setAnswers(prev => ({ ...prev, [qid]: { ...(prev[qid] || {}), files: [] } }))
    } catch (e: any) {
      setErr(e?.message || "Failed to upload evidence")
    }
  }

  const grouped = useMemo(() => {
    if (!data) return {}
    // Build a map of existing answers by question_id
    const byId = new Map<number, any>()
    data.answers.forEach((a) => byId.set(a.question_id, a))
    // Map question id -> category
    const catMap = new Map<number, string | null | undefined>()
    ;(allQuestions || []).forEach(q => catMap.set(q.id, (q as any).category))

    // Merge all questions so unanswered appear too and attach category
    const merged = (allQuestions || []).map((q) => {
      const found = byId.get(q.id)
      const base = found
        ? found
        : {
            question_id: q.id,
            question_text: q.text,
            answer: "",
            remarks: "",
            evidence: [],
          }
      return { ...base, category: (q as any).category || "General" }
    })

    // Group by category
    const groups: Record<string, any[]> = {}
    merged.forEach(item => {
      const key = (item.category || "General").toString()
      if (!groups[key]) groups[key] = []
      groups[key].push(item)
    })
    return groups
  }, [data, allQuestions])

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Edit Inspection</h1>
        <Button variant="outline" onClick={() => router.back()} className="bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors">
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Editor</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <div className="text-gray-500">Loading inspection...</div>}
          {error && (
            <Alert variant="destructive"><AlertDescription>Failed to load inspection.</AlertDescription></Alert>
          )}
          {data && (
            <form
              className="space-y-6"
              onSubmit={async (e) => {
                e.preventDefault()
                try {
                  setMsg("")
                  setErr("")
                  const answerList = Object.entries(answers).map(([qid, a]) => ({
                    question_id: Number(qid),
                    answer: a?.answer || "",
                    remarks: a?.remarks || "",
                  }))
                  // Build payload to align with backend schema; include IDs when available
                  const insp = data.inspection
                  const payload: any = {
                    Status: "Pending",
                    Data: JSON.stringify(answerList),
                  }
                  if (insp?.warehouse?.id) payload.Warehouse_Id = insp.warehouse.id
                  if (insp?.inspector?.id) payload.Inspector_Id = insp.inspector.id
                  if (insp?.commodity?.id) payload.Commodity_Id = insp.commodity.id
                  if (insp?.Season_Id) payload.Season_Id = insp.Season_Id
                  await updateInspectionDetails(id, payload)
                } catch (e: any) {
                  setErr(e?.message || "Failed to update inspection")
                }
              }}
            >
              <Accordion type="multiple" className="w-full">
                {Object.entries(grouped).map(([groupName, items]) => (
                  <AccordionItem key={groupName} value={groupName}>
                    <AccordionTrigger className="text-left">{groupName}</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-6">
                        {(items as any[]).map((qa: any) => (
                          <div
                            key={qa.question_id}
                            ref={(el) => {
                              qRefs.current[qa.question_id] = el
                            }}
                            className="border p-4 rounded-md space-y-3"
                          >
                            <div className="font-medium">{qa.question_text}</div>
                            <div>
                              <Label className="mb-2 block">Response</Label>
                              <RadioGroup
                                value={answers[qa.question_id]?.answer || ""}
                                onValueChange={(v) => handleAnswer(qa.question_id, { answer: v })}
                                className="flex items-center gap-6"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="Yes" id={`yes-${qa.question_id}`} />
                                  <Label htmlFor={`yes-${qa.question_id}`}>Yes</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="No" id={`no-${qa.question_id}`} />
                                  <Label htmlFor={`no-${qa.question_id}`}>No</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="NA" id={`na-${qa.question_id}`} />
                                  <Label htmlFor={`na-${qa.question_id}`}>N/A</Label>
                                </div>
                              </RadioGroup>
                            </div>
                            <div>
                              <Label className="mb-2 block">Remarks</Label>
                              <Textarea
                                value={answers[qa.question_id]?.remarks || ""}
                                onChange={(e) => handleAnswer(qa.question_id, { remarks: e.target.value })}
                                placeholder="Enter remarks"
                              />
                            </div>
                            {qa.manager_remarks || qa.Manager_Remarks || qa.manager_remark ? (
                              <div className="text-sm text-gray-600">
                                <span className="text-muted-foreground">Manager Remark: </span>
                                {qa.manager_remarks || qa.Manager_Remarks || qa.manager_remark}
                              </div>
                            ) : null}
                            {qa.evidence && qa.evidence.length > 0 && (
                              <div>
                                <Label className="mb-2 block">Existing Evidence</Label>
                                <div className="mt-2 flex flex-wrap gap-3">
                                  {qa.evidence.map((ev: any) => {
                                    const type = (ev.file_type || "").toLowerCase()
                                    const isImage = type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp)$/i.test(ev.file_url)
                                    const isVideo = type.startsWith("video/") || /\.(mp4|webm|mov|avi|mkv)$/i.test(ev.file_url)
                                    return (
                                      <div key={ev.id} className="relative w-28">
                                        {isImage ? (
                                          // eslint-disable-next-line @next/next/no-img-element
                                          <a href={ev.file_url} target="_blank" rel="noreferrer">
                                            <img src={ev.file_url} alt="evidence" className="w-24 h-24 object-cover rounded" />
                                          </a>
                                        ) : isVideo ? (
                                          <a href={ev.file_url} target="_blank" rel="noreferrer" title="Open video" className="w-24 h-24 rounded border flex flex-col items-center justify-center gap-1 text-xs text-gray-700 bg-gray-50 hover:bg-blue-50">
                                            <Play className="h-5 w-5 text-blue-600" />
                                            <span className="truncate px-1">Video</span>
                                          </a>
                                        ) : (
                                          <a href={ev.file_url} target="_blank" rel="noreferrer" className="w-24 h-24 rounded border flex flex-col items-center justify-center gap-1 text-xs text-gray-700 bg-gray-50 hover:bg-blue-50">
                                            <span className="truncate px-1">Open</span>
                                          </a>
                                        )}
                                        <div className="mt-1 flex items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() => onDeleteExistingEvidence(ev.id)}
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
                                              onChange={(e) => {
                                                const f = e.target.files?.[0]
                                                if (f) onReplaceExistingEvidence(qa.question_id, ev.id, f)
                                                e.currentTarget.value = ""
                                              }}
                                              disabled={isFetching}
                                            />
                                          </label>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                            <div>
                              <Label className="mb-2 block">Add Evidence</Label>
                              <input
                                id={`file-${qa.question_id}`}
                                type="file"
                                accept="image/*,video/*"
                                multiple
                                onChange={(e: ChangeEvent<HTMLInputElement>) => addFiles(qa.question_id, e.target.files)}
                                className="hidden"
                              />
                              <div className="flex items-center gap-2">
                                <Button type="button" variant="outline" onClick={() => document.getElementById(`file-${qa.question_id}`)?.click()} className="bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors">
                                  Add files
                                </Button>
                                <Button type="button" onClick={() => uploadNewEvidence(qa.question_id)} disabled={!answers[qa.question_id]?.files?.length}>
                                  <Upload className="h-4 w-4 mr-2" /> Upload
                                </Button>
                              </div>
                              {answers[qa.question_id]?.files && answers[qa.question_id]!.files!.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-3">
                                  {answers[qa.question_id]!.files!.map((f, idx) => {
                                    const isImage = f.type.startsWith("image/")
                                    const blobUrl = URL.createObjectURL(f)
                                    return (
                                      <div key={idx} className="relative w-24 h-24">
                                        {isImage ? (
                                          // eslint-disable-next-line @next/next/no-img-element
                                          <img src={blobUrl} alt={f.name} className="w-24 h-24 object-cover rounded" />
                                        ) : (
                                          <div className="w-24 h-24 rounded border flex flex-col items-center justify-center gap-1 text-xs text-gray-700 bg-gray-50">
                                            <Play className="h-5 w-5 text-blue-600" />
                                            <span className="truncate px-1">Video</span>
                                          </div>
                                        )}
                                        <button type="button" onClick={() => removeFile(qa.question_id, idx)} aria-label={`Remove ${f.name}`} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center shadow">×</button>
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

              {err && (
                <Alert variant="destructive"><AlertDescription>{err}</AlertDescription></Alert>
              )}
              {msg && (
                <Alert><AlertDescription>{msg}</AlertDescription></Alert>
              )}

              <div className="flex items-center gap-3">
                <Button type="submit">Save Changes</Button>
                <Button type="button" variant="outline" onClick={() => router.back()} className="bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors">Cancel</Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
