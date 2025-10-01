import type React from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Sidebar, MobileSidebar } from "@/components/layout/sidebar"

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gray-50">
        <aside className="hidden md:block md:w-64 shrink-0 sticky top-0 h-svh overflow-y-auto bg-blue-700 border-r">
          <div className="pt-5">
            <Sidebar />
          </div>
        </aside>
        <div className="flex flex-col flex-1 overflow-hidden max-h-svh">
          <div className="md:hidden p-3">
            <MobileSidebar />
          </div>
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
