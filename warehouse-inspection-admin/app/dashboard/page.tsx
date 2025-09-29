"use client"

import { useEffect, useState } from "react"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { InspectionChart } from "@/components/dashboard/inspection-chart"
import { fetchDashboardStats } from "@/lib/api"
import type { DashboardStats } from "@/lib/types"
import { ModernCard, ModernCardHeader, ModernCardTitle, ModernCardContent } from "@/components/ui/modern-card"

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
      .then((data) => setStats(data))
      .catch((err) => console.error("Dashboard fetch error:", err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of warehouse inspection activities</p>
      </div>

      <StatsCards stats={stats || {} as DashboardStats} isLoading={loading} />

      <div className="grid gap-6 md:grid-cols-2">
        {/* <ModernCard isLoading={loading}>
          <ModernCardHeader>
            <ModernCardTitle>Inspection Trends</ModernCardTitle>
          </ModernCardHeader>
          <ModernCardContent>
            <InspectionChart />
          </ModernCardContent>
        </ModernCard> */}

        <ModernCard isLoading={loading}>
          <ModernCardHeader>
            <ModernCardTitle>Recent Activity</ModernCardTitle>
          </ModernCardHeader>
          <ModernCardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">3 inspections completed today</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-600">2 inspections pending review</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">1 new inspection started</span>
              </div>
            </div>
          </ModernCardContent>
        </ModernCard>
      </div>
    </div>
  )
}
