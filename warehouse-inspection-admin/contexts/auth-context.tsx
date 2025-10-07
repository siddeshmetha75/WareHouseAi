"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { AuthService, type AuthUser, type LoginCredentials } from "@/lib/auth"

// interface AuthContextType {
//   user: AuthUser | null
//   isLoading: boolean
//   login: (credentials: LoginCredentials) => Promise<void>
//   logout: () => void
//   isAuthenticated: boolean
// }
interface AuthContextType {
  user: AuthUser | null
  login: (credentials: LoginCredentials) => Promise<{ user: AuthUser; token: string }>
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
  hasRole: (role: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing authentication on mount
    const currentUser = AuthService.getCurrentUser()
    setUser(currentUser)
    setIsLoading(false)
  }, [])

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true)
    try {
      const { user: authUser, token } = await AuthService.login(credentials)
      setUser(authUser)
      return { user: authUser, token }
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    AuthService.logout()
    setUser(null)
  }

  const hasRole = (role: string): boolean => {
    if (!user || !user.role) {
      return false
    }
    return user.role.toLowerCase() === role.toLowerCase()
  }

  const value = {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user,
    hasRole,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
