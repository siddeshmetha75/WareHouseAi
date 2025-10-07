'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Loader2 } from 'lucide-react'

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, hasRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      const returnUrl = window.location.pathname + window.location.search
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`)
      return
    }

    // Redirect to unauthorized if not an admin
    if (!hasRole('admin')) {
      router.push('/unauthorized')
    }
  }, [isAuthenticated, isLoading, hasRole, router])

  // Show loading state while checking auth
  if (isLoading || !isAuthenticated || !hasRole('admin')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
