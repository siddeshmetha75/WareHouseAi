'use client'

import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileSidebar } from "@/components/layout/sidebar"
import ManagerRoute from "@/components/manager/manager-route"

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ManagerRoute>
      <div className="flex min-h-screen bg-gray-50">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col md:sticky md:top-0 md:h-screen">
          <div className="flex flex-col flex-grow pt-5 bg-blue-700 border-r">
            <Sidebar />
          </div>
        </div>
        
        {/* Mobile Sidebar */}
        <div className="md:hidden">
          <MobileSidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </ManagerRoute>
  )
}
