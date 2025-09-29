"use client"

import { ClipboardCheck, Clock, CheckCircle, XCircle, Warehouse, Users, TrendingUp } from "lucide-react"
import type { DashboardStats } from "@/lib/types"
import { ShimmerStatsCard } from "@/components/ui/shimmer"

interface StatsCardsProps {
  stats: DashboardStats
  isLoading?: boolean
}

export function StatsCards({ stats, isLoading = false }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Inspections",
      value: stats.totalInspections,
      icon: ClipboardCheck,
      description: "All time inspections",
      bgColor: "bg-blue-500",
    },
    {
      title: "Pending",
      value: stats.pendingInspections,
      icon: Clock,
      description: "Awaiting inspection",
      bgColor: "bg-yellow-500",
    },
    {
      title: "Completed",
      value: stats.completedInspections,
      icon: CheckCircle,
      description: "Successfully completed",
      bgColor: "bg-green-500",
    },
    {
      title: "In Progress",
      value: stats.inProgressInspections,
      icon: XCircle,
      description: "In Progress inspections",
      bgColor: "bg-red-500",
    },
    {
      title: "Warehouses",
      value: stats.totalWarehouses,
      icon: Warehouse,
      description: "Active locations",
      bgColor: "bg-purple-500",
    },
    {
      title: "Inspectors",
      value: stats.activeInspectors,
      icon: Users,
      description: "Active inspectors",
      bgColor: "bg-indigo-500",
    },
    {
      title: "Managers",
      value: stats.activeManagers,
      icon: Users,
      description: "Active Managers",
      bgColor: "bg-pink-500",
    },
   
  ]

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <ShimmerStatsCard key={index} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`${card.bgColor} rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-shadow`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-white/90">{card.title}</h3>
            <card.icon className="h-6 w-6 text-white/80" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">{card.value}</div>
          <p className="text-xs text-white/70">{card.description}</p>
        </div>
      ))}
    </div>
  )
}
