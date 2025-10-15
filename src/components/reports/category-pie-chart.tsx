"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from "recharts"
import type { ExpensesByCategory } from "@/lib/types"

interface CategoryPieChartProps {
  data: ExpensesByCategory[]
  title: string
}

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#ef4444",
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#64748b",
]

export function CategoryPieChart({ data, title }: CategoryPieChartProps) {
  const chartData = data.map((item, index) => ({
    name: item.category,
    value: item.total,
    color: item.color || COLORS[index % COLORS.length],
  }))

  return (
    <Card>
        <CardHeader className="p-3 sm:p-4 lg:p-6 pb-2 sm:pb-3">
          <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg break-words leading-tight">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6 pt-2 sm:pt-3">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => {
                    const { name, percent } = props
                    return `${name} ${(percent * 100).toFixed(0)}%`
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Total']} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] sm:h-[300px] text-xs sm:text-sm text-muted-foreground">
              No hay datos para este período
            </div>
          )}
        </CardContent>
      </Card>
  )
}
