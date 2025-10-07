"use client"

import { Sidebar, MobileSidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import InspectorRoute from "@/components/inspector/inspector-route"

export default function InspectorLayout({ children }: { children: React.ReactNode }) {
  return (
    <InspectorRoute>
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
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </InspectorRoute>
  )
}
