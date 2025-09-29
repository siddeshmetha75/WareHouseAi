"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, MoreHorizontal, Edit, Trash2, UserPlus } from "lucide-react"
import { getUsers, type ApiUser } from "@/lib/api"
import { Badge } from "@/components/ui/badge"

interface UserTableProps {
  onCreateUser: () => void
  onEditUser: (user: ApiUser) => void
  onDeleteUser: (user: ApiUser) => void
  reloadKey?: number
}

export function UserTable({ onCreateUser, onEditUser, onDeleteUser, reloadKey = 0 }: UserTableProps) {
  const [rows, setRows] = useState<ApiUser[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [activeFilter, setActiveFilter] = useState<string>("all")
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (roleFilter !== "all") params.role = roleFilter
      if (activeFilter !== "all") params.active = activeFilter === "active" ? 1 : 0
      const data = await getUsers(params)
      setRows(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [roleFilter, activeFilter, reloadKey])

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return rows
    return rows.filter((u) =>
      (u.UserName || "").toLowerCase().includes(term) || (u.Full_Name || "").toLowerCase().includes(term)
    )
  }, [rows, searchTerm])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage users from the backend API</CardDescription>
          </div>
          <Button onClick={onCreateUser}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Inspector">Inspector</SelectItem>
                <SelectItem value="Manager">Manager</SelectItem>
              </SelectContent>
            </Select>
            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border overflow-x-auto">
          {loading ? (
            <div className="p-6 text-muted-foreground">Loading...</div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                  <TableHead>UserName</TableHead>
                  <TableHead>Full Name</TableHead>
                <TableHead>Role</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.idusers}>
                    <TableCell>{u.UserName}</TableCell>
                    <TableCell>{u.Full_Name || "-"}</TableCell>
                    <TableCell>{u.Role}</TableCell>
                    <TableCell>{u.EmailId || "-"}</TableCell>
                    <TableCell>
                      {(u.Is_Active ?? 0) === 1 ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                  <TableCell className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEditUser(u) }} aria-label="Edit user">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={(e) => { e.stopPropagation(); onDeleteUser(u) }} aria-label="Delete user">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">No users found.</TableCell>
                  </TableRow>
                )}
            </TableBody>
          </Table>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
