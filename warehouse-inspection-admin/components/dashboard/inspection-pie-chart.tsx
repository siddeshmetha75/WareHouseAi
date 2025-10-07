'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardStats } from "@/lib/types"

type InspectionPieChartProps = {
  stats: DashboardStats | null
  isLoading: boolean
}

// Colors for the pie chart segments
// Blue: Pending, Green: Accepted, Red: Rejected
const COLORS = {
  'Pending': '#3b82f6',
  'Accepted': '#10b981',
  'Rejected': '#ef4444'
}

export function InspectionPieChart({ stats, isLoading }: InspectionPieChartProps) {
  // Map the stats to the pie chart data format from API
  const data = [
    { name: 'Pending', value: stats?.pendingInspections || 0 },
    { name: 'Accepted', value: stats?.completedInspections || 0 },
    { name: 'Rejected', value: stats?.inProgressInspections || 0 }
  ].filter(item => item.value > 0) // Only show slices with values > 0

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inspection Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inspection Status</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => 
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
            >
              {data.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#999999'} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [`${value} inspections`, 'Count']}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
