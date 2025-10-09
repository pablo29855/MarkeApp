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
    <Card className="col-span-full lg:col-span-2 animate-fade-in-up hover-glow transition-smooth overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <CardHeader className="relative z-10 p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Gastos por Categoría
          </span>
          {chartData.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              ({chartData.length} categorías)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10 p-4 sm:p-6 pt-0">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300} className="sm:!h-[350px]">
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
                outerRadius={typeof window !== 'undefined' && window.innerWidth < 640 ? 70 : 100}
                innerRadius={typeof window !== 'undefined' && window.innerWidth < 640 ? 40 : 60}
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
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
                }}
              />
              <Legend 
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '12px' }}
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
