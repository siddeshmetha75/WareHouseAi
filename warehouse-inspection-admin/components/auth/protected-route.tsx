"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { hasRole } from "@/lib/auth"
import type { UserRole } from "@/lib/types"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: UserRole[]
  fallbackPath?: string
  unauthorizedPath?: string
}

export function ProtectedRoute({ children, requiredRoles = [], fallbackPath = "/login", unauthorizedPath = "/unauthorized" }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push(fallbackPath)
        return
      }

      if (requiredRoles.length > 0 && !hasRole(user, requiredRoles)) {
        router.push(unauthorizedPath)
        return
      }
    }
  }, [user, isLoading, requiredRoles, router, fallbackPath, unauthorizedPath])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || (requiredRoles.length > 0 && !hasRole(user, requiredRoles))) {
    return null
  }

  return <>{children}</>
}
