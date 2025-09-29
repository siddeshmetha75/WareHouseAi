"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import type { UserRole, CreateUserForm } from "@/lib/types"
import { getUsers, type ApiUser } from "@/lib/api"

interface UserFormProps {
  user?: {
    username?: string
    email?: string
    fullName?: string
    role?: UserRole
    isActive?: boolean
    supervisorId?: number
    password?: string
  }
  onSubmit: (data: CreateUserForm) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function UserForm({ user, onSubmit, onCancel, isLoading = false }: UserFormProps) {
  const [formData, setFormData] = useState<CreateUserForm>({
    username: user?.username || "",
    email: user?.email || "",
    password: user?.password || "",
    fullName: user?.fullName || "",
    role: user?.role || "Inspector",
  })
  const [isActive, setIsActive] = useState(user?.isActive ?? true)
  const [supervisors, setSupervisors] = useState<ApiUser[]>([])
  const [supervisorId, setSupervisorId] = useState<number | undefined>(user?.supervisorId)
  const [supervisorsLoading, setSupervisorsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  // Reset form when incoming user prop changes (e.g., open different user or switch create/edit)
  useEffect(() => {
    setFormData({
      username: user?.username || "",
      email: user?.email || "",
      password: user?.password || "",
      fullName: user?.fullName || "",
      role: user?.role || "Inspector",
    })
    setIsActive(user?.isActive ?? true)
    setSupervisorId(user?.supervisorId)
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Basic validation
    if (!formData.username || !formData.email || !formData.fullName) {
      setError("Please fill in all required fields")
      return
    }

    if (!user && !formData.password) {
      setError("Password is required for new users")
      return
    }

    if (formData.password && formData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    // Require hierarchy selection when role is not Admin
    if (formData.role !== "Admin" && (supervisorId === undefined || Number.isNaN(supervisorId))) {
      setError(`Please select a ${formData.role === "Inspector" ? "Manager" : "Admin"}`)
      return
    }

    try {
      await onSubmit({ ...formData, isActive, supervisorId })
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    }
  }

  const handleInputChange = (field: keyof CreateUserForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Load supervisor options based on selected role
  useEffect(() => {
    const fetchSupervisors = async () => {
      setSupervisorsLoading(true)
      try {
        if (formData.role === "Inspector") {
          const managers = await getUsers({ role: "Manager" })
          setSupervisors(managers)
        } else if (formData.role === "Manager") {
          const admins = await getUsers({ role: "Admin" })
          setSupervisors(admins)
        } else {
          setSupervisors([])
        }
      } catch {
        setSupervisors([])
      } finally {
        setSupervisorsLoading(false)
      }
    }
    fetchSupervisors()
  }, [formData.role])

  // Ensure a valid selection when editing: use existing user's supervisor if available; otherwise leave empty
  useEffect(() => {
    if (formData.role === "Admin") return
    if (!supervisors || supervisors.length === 0) return
    if (supervisorId && supervisors.some((s) => s.idusers === supervisorId)) return
    if (user?.supervisorId && supervisors.some((s) => s.idusers === user.supervisorId)) {
      setSupervisorId(user.supervisorId)
    } else {
      setSupervisorId(undefined)
    }
  }, [supervisors])

  // If role changes and current supervisor is not part of the new list, clear selection (force user to choose)
  useEffect(() => {
    if (formData.role === "Admin") {
      setSupervisorId(undefined)
      return
    }
    if (!supervisors || supervisors.length === 0) return
    if (supervisorId !== undefined && !supervisors.some((s) => s.idusers === supervisorId)) {
      setSupervisorId(undefined)
    }
  }, [formData.role, supervisors])

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{user ? "Edit User" : "Create New User"}</CardTitle>
        <CardDescription>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                placeholder="Enter username"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter email address"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => handleInputChange("fullName", e.target.value)}
              placeholder="Enter full name"
              required
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: UserRole) => handleInputChange("role", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Inspector">Inspector</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.role !== "Admin" && (
              <div className="space-y-2">
                <Label htmlFor="supervisor">{formData.role === "Inspector" ? "Manager" : "Admin"}</Label>
                <Select
                  value={supervisorId !== undefined ? String(supervisorId) : ""}
                  onValueChange={(val) => setSupervisorId(Number(val))}
                  disabled={isLoading || supervisorsLoading || supervisors.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={supervisorsLoading ? "Loading..." : (supervisors.length ? `Select ${formData.role === "Inspector" ? "Manager" : "Admin"}` : "No options")} />
                  </SelectTrigger>
                  <SelectContent>
                    {supervisors.map((s) => (
                      <SelectItem key={s.idusers} value={String(s.idusers)}>
                        {s.Full_Name || s.UserName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{user ? "Password (leave blank to keep current)" : "Password *"}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder={user ? "Enter new password" : "Enter password"}
                required={!user}
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-2 flex items-center text-muted-foreground"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {user && (
            <div className="flex items-center space-x-2">
              <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} disabled={isLoading} />
              <Label htmlFor="isActive">Active User</Label>
            </div>
          )}

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
                  {user ? "Updating..." : "Creating..."}
                </>
              ) : user ? (
                "Update User"
              ) : (
                "Create User"
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
