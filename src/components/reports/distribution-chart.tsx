import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts"
import type { ExpensesByCategory, IncomesByType } from "@/lib/types"

interface DistributionChartProps {
  expenses: ExpensesByCategory[]
  incomes: IncomesByType[]
  title?: string
}

const COLORS = [
  "#3B6EF6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#14B8A6", "#F97316", "#EC4899", "#06B6D4"
]

export function DistributionChart({ expenses, incomes, title }: DistributionChartProps) {
  const expenseData = expenses.map((item, index) => ({
    name: item.category,
    value: item.total,
    color: item.color || COLORS[index % COLORS.length],
  })).sort((a, b) => b.value - a.value)

  const incomeData = incomes.map((item, index) => ({
    name: item.type,
    value: item.total,
    color: item.color || COLORS[index % COLORS.length],
  })).sort((a, b) => b.value - a.value)

  const renderChart = (data: any[], emptyMessage: string) => {
    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-[300px] text-sm font-semibold text-muted-foreground">
          {emptyMessage}
        </div>
      )
    }

    // Calculate dynamic height based on number of bars (min 200px)
    const chartHeight = Math.max(250, data.length * 40 + 60)

    return (
      <div style={{ height: chartHeight, width: '100%', marginTop: '16px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
            <XAxis 
              type="number" 
              tickFormatter={(value) => `$${value > 1000 ? (value/1000).toFixed(0) + 'k' : value}`} 
              fontSize={11} 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8' }}
            />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={100} 
              fontSize={12}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#475569', fontWeight: 600 }}
            />
            <RechartsTooltip 
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Total']}
              cursor={{ fill: 'rgba(0,0,0,0.03)' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <Card className="border-0 shadow-[0_6px_16px_rgba(30,40,80,.07)] rounded-[24px] bg-white overflow-hidden">
      <CardHeader className="p-6 pb-4">
        <CardTitle className="text-[17px] font-extrabold text-[#1E293B]">
          {title || "Distribución general"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <Tabs defaultValue="expenses" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#F1F5F9] rounded-xl p-1 h-auto mb-2">
            <TabsTrigger 
              value="expenses"
              className="rounded-lg py-2 text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-[#1E293B] data-[state=active]:shadow-sm transition-all"
            >
              Gastos
            </TabsTrigger>
            <TabsTrigger 
              value="incomes"
              className="rounded-lg py-2 text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-[#1E293B] data-[state=active]:shadow-sm transition-all"
            >
              Ingresos
            </TabsTrigger>
          </TabsList>
          <TabsContent value="expenses" className="mt-0 outline-none">
            {renderChart(expenseData, "No hay gastos registrados en este período")}
          </TabsContent>
          <TabsContent value="incomes" className="mt-0 outline-none">
            {renderChart(incomeData, "No hay ingresos registrados en este período")}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
