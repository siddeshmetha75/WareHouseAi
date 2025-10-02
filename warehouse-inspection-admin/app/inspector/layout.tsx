"use client"

import type React from "react"
import { Sidebar, MobileSidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export default function InspectorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar (desktop + mobile) */}
      <div className="hidden md:flex md:w-64 md:flex-col md:sticky md:top-0 md:h-screen">
        <div className="flex flex-col flex-grow pt-5 bg-blue-700 border-r">
          <Sidebar />
        </div>
      </div>
      <div className="md:hidden">
        <MobileSidebar />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
