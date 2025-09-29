"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { Inspection, CreateInspectionForm } from "@/lib/types"
import { mockWarehouses, mockCommodities, mockUsers, mockChecklists } from "@/lib/mock-data"

interface InspectionFormProps {
  inspection?: Inspection
  onSubmit: (data: CreateInspectionForm) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function InspectionForm({ inspection, onSubmit, onCancel, isLoading = false }: InspectionFormProps) {
  const [formData, setFormData] = useState<CreateInspectionForm>({
    warehouseId: inspection?.warehouseId || 0,
    commodityId: inspection?.commodityId || 0,
    checklistId: inspection?.checklistId || 0,
    inspectionDate: inspection?.inspectionDate || "",
    notes: inspection?.notes || "",
  })
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    inspection?.inspectionDate ? new Date(inspection.inspectionDate) : undefined,
  )
  const [error, setError] = useState("")

 
  const inspectors = mockUsers.filter((user) => user.role === "Inspector" || user.role === "Admin")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Basic validation
    if (!formData.warehouseId || !formData.commodityId || !formData.checklistId || !selectedDate) {
      setError("Please fill in all required fields")
      return
    }

    const submissionData = {
      ...formData,
      inspectionDate: format(selectedDate, "yyyy-MM-dd"),
    }

    try {
      await onSubmit(submissionData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    }
  }

  const handleInputChange = (field: keyof CreateInspectionForm, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{inspection ? "Edit Inspection" : "Schedule New Inspection"}</CardTitle>
        <CardDescription>
          {inspection ? "Update inspection details and schedule" : "Schedule a new warehouse inspection"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="warehouse">Warehouse *</Label>
              <Select
                value={formData.warehouseId.toString()}
                onValueChange={(value) => handleInputChange("warehouseId", Number.parseInt(value))}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {mockWarehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                      {warehouse.name} - {warehouse.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="commodity">Commodity *</Label>
              <Select
                value={formData.commodityId.toString()}
                onValueChange={(value) => handleInputChange("commodityId", Number.parseInt(value))}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select commodity" />
                </SelectTrigger>
                <SelectContent>
                  {mockCommodities.map((commodity) => (
                    <SelectItem key={commodity.id} value={commodity.id.toString()}>
                      {commodity.name} ({commodity.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="checklist">Inspection Checklist *</Label>
            <Select
              value={formData.checklistId.toString()}
              onValueChange={(value) => handleInputChange("checklistId", Number.parseInt(value))}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select checklist" />
              </SelectTrigger>
              <SelectContent>
                {mockChecklists.map((checklist) => (
                  <SelectItem key={checklist.id} value={checklist.id.toString()}>
                    {checklist.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Inspection Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
                  disabled={isLoading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Add any additional notes or special instructions"
              disabled={isLoading}
              rows={3}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {inspection ? "Updating..." : "Scheduling..."}
                </>
              ) : inspection ? (
                "Update Inspection"
              ) : (
                "Schedule Inspection"
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
