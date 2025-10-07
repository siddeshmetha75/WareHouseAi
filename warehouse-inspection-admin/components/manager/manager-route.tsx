'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Loader2 } from 'lucide-react'

export default function ManagerRoute({ children }: { children: React.ReactNode }) {
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

    // Redirect to unauthorized if not a manager
    if (!hasRole('manager')) {
      router.push('/unauthorized')
    }
  }, [isAuthenticated, isLoading, hasRole, router])

  // Show loading state while checking auth
  if (isLoading || !isAuthenticated || !hasRole('manager')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <p className="text-gray-600">Verifying manager access...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
