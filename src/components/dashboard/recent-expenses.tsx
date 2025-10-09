import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Expense } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { ListSkeleton } from "@/components/ui/skeleton-loader"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight } from "lucide-react"

interface RecentExpensesProps {
  expenses: Expense[]
  isLoading?: boolean
}

export function RecentExpenses({ expenses, isLoading }: RecentExpensesProps) {
  if (isLoading) {
    return (
      <Card className="col-span-full lg:col-span-1">
        <CardHeader>
          <CardTitle>Últimos Gastos</CardTitle>
        </CardHeader>
        <CardContent>
          <ListSkeleton items={5} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-full lg:col-span-1 animate-fade-in-up hover-glow transition-smooth overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center justify-between">
          <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Últimos Gastos
          </span>
          {expenses.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {expenses.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        {expenses.length > 0 ? (
          <div className="space-y-3">
            {expenses.map((expense, index) => (
              <div 
                key={expense.id} 
                className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-card hover:shadow-md transition-all duration-200 group/item animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm truncate group-hover/item:text-primary transition-colors">
                      {expense.name}
                    </p>
                    <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {expense.category?.name && (
                      <Badge variant="outline" className="text-xs px-2 py-0">
                        {expense.category.name}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(expense.purchase_date), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-lg bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
                    ${expense.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground gap-3">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <span className="text-3xl">💰</span>
            </div>
            <p className="text-sm">No hay gastos registrados</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
