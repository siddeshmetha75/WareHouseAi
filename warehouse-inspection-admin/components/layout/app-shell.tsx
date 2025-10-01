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
        <aside className="hidden md:block w-72 shrink-0 sticky top-0 h-svh overflow-y-auto">
          <Sidebar className="h-full" />
        </aside>

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0 max-h-svh">
          {/* Content */}
          <main className={cn("flex-1 min-w-0 overflow-auto", className)}>
            <div className="md:hidden p-3">
              <MobileSidebar />
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
