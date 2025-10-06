'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Skeleton } from "@/components/ui/skeleton"

type InspectionPieChartProps = {
  stats: {
    totalInspections: number
    pendingInspections: number
    completedInspections: number
    inProgressInspections: number
  } | null
  isLoading: boolean
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']

export function InspectionPieChart({ stats, isLoading }: InspectionPieChartProps) {
  const data = [
    { name: 'Total', value: stats?.totalInspections || 0 },
    { name: 'Pending', value: stats?.pendingInspections || 0 },
    { name: 'Completed', value: stats?.completedInspections || 0 },
    { name: 'In Progress', value: stats?.inProgressInspections || 0 },
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
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
