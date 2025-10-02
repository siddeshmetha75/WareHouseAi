"use client"

import { useState } from "react"
import { UserTable } from "@/components/users/user-table"
import { UserForm } from "@/components/users/user-form"
import { DeleteUserDialog } from "@/components/users/delete-user-dialog"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import type { CreateUserForm } from "@/lib/types"
import type { ApiUser } from "@/lib/api"
import { createUser, deleteUser, updateUser } from "@/lib/api"

type ViewMode = "list" | "create" | "edit"

export default function UsersPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null)
  const [userToDelete, setUserToDelete] = useState<ApiUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const handleCreateUser = () => {
    setSelectedUser(null)
    setViewMode("create")
  }

  const handleEditUser = (user: ApiUser) => {
    setSelectedUser(user)
    setViewMode("edit")
  }

  const handleDeleteUser = (user: ApiUser) => {
    setUserToDelete(user)
  }

  const handleFormSubmit = async (data: CreateUserForm) => {
    setIsLoading(true)
    try {
      if (viewMode === "create") {
        await createUser({
          UserName: data.username,
          Full_Name: data.fullName,
          Role: data.role,
          EmailId: data.email,
          Password: data.password,
          Is_Active: data.isActive ? 1 : 0,
          UserId: data.supervisorId,
        })
      } else {
        await updateUser(selectedUser!.idusers, {
          UserName: data.username,
          Full_Name: data.fullName,
          Role: data.role,
          EmailId: data.email,
          Password: data.password,
          Is_Active: data.isActive ? 1 : 0,
          UserId: data.supervisorId,
        })
      }
      setViewMode("list")
      setSelectedUser(null)
      setReloadKey((k) => k + 1)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFormCancel = () => {
    setViewMode("list")
    setSelectedUser(null)
  }

  const handleConfirmDelete = async (user: ApiUser) => {
    await deleteUser(user.idusers)
    setUserToDelete(null)
    setReloadKey((k) => k + 1)
  }

  return (
    <>
      <div className="space-y-6 p-6">
        {viewMode === "list" ? (
          <>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Users</h1>
              <p className="text-muted-foreground">Manage system users and their access permissions</p>
            </div>
            <UserTable reloadKey={reloadKey} onCreateUser={handleCreateUser} onEditUser={handleEditUser} onDeleteUser={handleDeleteUser} />
          </>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={handleFormCancel}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {viewMode === "create" ? "Create User" : "Edit User"}
                </h1>
                <p className="text-muted-foreground">
                  {viewMode === "create"
                    ? "Add a new user to the system"
                    : `Update ${(selectedUser?.Full_Name || selectedUser?.UserName || "user")}'s information`}
                </p>
              </div>
            </div>
            <UserForm
              user={selectedUser ? {
                username: selectedUser.UserName,
                email: selectedUser.EmailId || "",
                fullName: selectedUser.Full_Name || "",
                role: (selectedUser.Role as any),
                isActive: (selectedUser.Is_Active ?? 1) === 1,
                supervisorId: selectedUser.UserId ?? undefined,
                password: selectedUser.Password || "",
              } : undefined}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              isLoading={isLoading}
            />
          </>
        )}
      </div>

      <DeleteUserDialog
        user={userToDelete}
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}
