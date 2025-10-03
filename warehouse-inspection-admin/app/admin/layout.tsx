import type React from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={["Admin"]} unauthorizedPath="/inspector/dashboard">
      <div className="flex min-h-screen bg-gray-50">
        <div className="hidden md:flex md:w-64 md:flex-col md:sticky md:top-0 md:h-screen">
          <div className="flex flex-col flex-grow pt-5 bg-blue-700 border-r">
            <Sidebar />
          </div>
        </div>
        <div className="flex flex-col flex-1">
          <Header />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
