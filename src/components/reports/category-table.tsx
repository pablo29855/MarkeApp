import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ExpensesByCategory } from "@/lib/types"


interface CategoryTableProps {
  data: ExpensesByCategory[]
  title: string
  isLoading?: boolean
}

export function CategoryTable({ data, title, isLoading }: CategoryTableProps) {
  if (isLoading) {
    return (
      <Card className="border-0 shadow-[0_6px_16px_rgba(30,40,80,.07)] rounded-[24px] bg-card">
        <CardContent className="p-6 space-y-4">
          <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
          <div className="h-8 bg-muted rounded animate-pulse" />
          <div className="h-8 bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  const total = data.reduce((sum, item) => sum + item.total, 0)

  return (
    <Card className="border-0 shadow-[0_6px_16px_rgba(30,40,80,.07)] rounded-[24px] bg-card">
      <CardHeader className="p-6 pb-2">
        <CardTitle className="text-[17px] font-extrabold text-foreground">
          {title || "Gastos por categoría"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-4 space-y-6">
        {data.length > 0 ? (
          data.map((item, _index) => {
            const percentage = total > 0 ? Math.round((item.total / total) * 100) : 0
            const color = item.color || "#3B6EF6"
            
            return (
              <div key={item.category} className="space-y-2.5">
                <div className="flex justify-between items-center text-sm font-bold text-foreground">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{item.icon}</span>
                    <span className="truncate max-w-[150px] sm:max-w-[200px]">{item.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">${item.total.toLocaleString()}</span>
                    <span>{percentage}%</span>
                  </div>
                </div>
                <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${percentage}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center py-6 text-muted-foreground text-sm font-medium">
            No hay gastos registrados en este período
          </div>
        )}
      </CardContent>
    </Card>
  )
}
