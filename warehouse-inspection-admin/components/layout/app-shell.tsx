"use client"

import { ReactNode } from "react"
import { Sidebar, MobileSidebar } from "@/components/layout/sidebar"
import { cn } from "@/lib/utils"

interface AppShellProps {
  children: ReactNode
  className?: string
}

export function AppShell({ children, className }: AppShellProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen w-full">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-72 shrink-0">
          <Sidebar className="h-full" />
        </aside>

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="sticky top-0 z-30 border-b bg-white">
            <div className="h-14 px-3 md:px-6 flex items-center gap-3">
              <MobileSidebar />
              <div className="font-semibold text-gray-800">Warehouse Inspection Admin</div>
            </div>
          </header>

          {/* Content */}
          <main className={cn("flex-1 min-w-0", className)}>
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
