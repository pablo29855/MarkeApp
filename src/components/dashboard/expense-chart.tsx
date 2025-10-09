"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import type { ExpensesByCategory } from "@/lib/types"
import { ChartSkeleton } from "@/components/ui/skeleton-loader"

interface ExpenseChartProps {
  data: ExpensesByCategory[]
  isLoading?: boolean
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
]

export function ExpenseChart({ data, isLoading }: ExpenseChartProps) {
  if (isLoading) {
    return <ChartSkeleton className="col-span-full lg:col-span-2" />
  }

  const chartData = data.map((item, index) => ({
    name: item.category,
    value: item.total,
    color: item.color || COLORS[index % COLORS.length],
  }))

  return (
    <Card className="col-span-full lg:col-span-2 border-muted/40">
      <CardHeader className="p-3 sm:p-4 lg:p-6 pb-2 sm:pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl font-semibold">
            Gastos por Categoría
          </CardTitle>
          {chartData.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                {chartData.length} {chartData.length === 1 ? 'categoría' : 'categorías'}
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 lg:p-6 pt-3 sm:pt-4">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250} className="sm:!h-[300px] lg:!h-[350px]">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: any) => {
                  const { name, percent } = props
                  // En móvil, solo mostrar porcentaje si es mayor al 10%
                  if (typeof window !== 'undefined' && window.innerWidth < 640 && percent < 0.1) {
                    return null
                  }
                  return `${name} ${(percent * 100).toFixed(0)}%`
                }}
                outerRadius={typeof window !== 'undefined' && window.innerWidth < 640 ? 65 : 100}
                innerRadius={typeof window !== 'undefined' && window.innerWidth < 640 ? 35 : 60}
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => `$${value.toLocaleString()}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  fontSize: '12px',
                }}
              />
              <Legend 
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '11px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-[300px] sm:h-[350px] text-muted-foreground gap-3">
            <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-muted flex items-center justify-center">
              <span className="text-2xl sm:text-3xl">📊</span>
            </div>
            <p className="text-xs sm:text-sm">No hay datos de gastos para mostrar</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
