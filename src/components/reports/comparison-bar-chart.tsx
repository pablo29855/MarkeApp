"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { ExpensesByCategory } from "@/lib/types"
import { ChartSkeleton } from "@/components/ui/skeleton-loader"
import { TrendingUp } from "lucide-react"

interface ComparisonBarChartProps {
  data1: ExpensesByCategory[]
  data2: ExpensesByCategory[]
  label1: string
  label2: string
  isLoading?: boolean
}

export function ComparisonBarChart({ data1, data2, label1, label2, isLoading }: ComparisonBarChartProps) {
  if (isLoading) {
    return <ChartSkeleton />
  }

  // Combine categories from both datasets
  const allCategories = new Set([...data1.map((d) => d.category), ...data2.map((d) => d.category)])

  const chartData = Array.from(allCategories).map((category) => {
    const value1 = data1.find((d) => d.category === category)?.total || 0
    const value2 = data2.find((d) => d.category === category)?.total || 0

    return {
      category,
      [label1]: value1,
      [label2]: value2,
    }
  })

  return (
    <Card className="animate-fade-in-up hover-glow transition-smooth overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <CardHeader className="relative z-10 p-3 sm:p-4 lg:p-6 pb-2 sm:pb-3">
        <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base lg:text-lg">
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent truncate">
            Comparación por Categoría
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10 p-3 sm:p-4 lg:p-6 pt-2 sm:pt-3">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300} className="sm:h-[400px] lg:h-[450px]">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="category" 
                angle={-45} 
                textAnchor="end" 
                height={80}
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '10px' }}
                className="sm:text-xs"
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '10px' }}
                className="sm:text-xs"
              />
              <Tooltip 
                formatter={(value: number) => `$${value.toLocaleString()}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '12px', fontSize: '11px' }}
                iconType="circle"
              />
              <Bar 
                dataKey={label1} 
                fill="hsl(var(--chart-1))" 
                radius={[8, 8, 0, 0]}
                animationBegin={0}
                animationDuration={800}
              />
              <Bar 
                dataKey={label2} 
                fill="hsl(var(--chart-2))" 
                radius={[8, 8, 0, 0]}
                animationBegin={200}
                animationDuration={800}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-[300px] sm:h-[400px] lg:h-[450px] text-muted-foreground gap-2 sm:gap-3">
            <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-muted flex items-center justify-center">
              <span className="text-2xl sm:text-3xl">📊</span>
            </div>
            <p className="text-xs sm:text-sm">No hay datos para comparar</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
