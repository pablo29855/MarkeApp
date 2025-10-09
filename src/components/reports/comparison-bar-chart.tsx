"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { ExpensesByCategory } from "@/lib/types"

interface ComparisonBarChartProps {
  data1: ExpensesByCategory[]
  data2: ExpensesByCategory[]
  label1: string
  label2: string
}

export function ComparisonBarChart({ data1, data2, label1, label2 }: ComparisonBarChartProps) {
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
    <Card>
      <CardHeader>
        <CardTitle>Comparación por Categoría</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey={label1} fill="#3b82f6" />
              <Bar dataKey={label2} fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            No hay datos para comparar
          </div>
        )}
      </CardContent>
    </Card>
  )
}
