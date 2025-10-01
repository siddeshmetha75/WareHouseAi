"use client"

import type React from "react"
import { Sidebar, MobileSidebar } from "@/components/layout/sidebar"

export default function InspectorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar (desktop + mobile) */}
      <aside className="hidden md:block md:w-64 shrink-0 sticky top-0 h-svh overflow-y-auto bg-blue-700 border-r">
        <div className="pt-5">
          <Sidebar />
        </div>
      </aside>
      <div className="md:hidden">
        <MobileSidebar />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden max-h-svh">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
