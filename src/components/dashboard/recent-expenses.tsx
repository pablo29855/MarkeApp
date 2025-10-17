import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Expense } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { parseLocalDate } from '@/lib/utils'
import { es } from "date-fns/locale"
import { ListSkeleton } from "@/components/ui/skeleton-loader"

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
    <Card className="col-span-full lg:col-span-1 border-muted/40">
      <CardHeader className="p-3 sm:p-4 lg:p-6 pb-2 sm:pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg lg:text-xl font-semibold">
            Últimos Gastos
          </CardTitle>
          {expenses.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                {expenses.length}
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 lg:p-6 pt-3 sm:pt-4">
        {expenses.length > 0 ? (
          <div className="space-y-2.5">
            {expenses.map((expense) => (
              <div 
                key={expense.id} 
                className="flex items-center justify-between p-3 sm:p-3.5 rounded-lg border border-muted/50 bg-muted/20 hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1 min-w-0 pr-3">
                  <p className="font-semibold text-sm sm:text-base truncate mb-1">
                    {expense.name}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {expense.category?.name && (
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                        <span className="text-xs sm:text-sm text-muted-foreground font-medium">
                          {expense.category.name}
                        </span>
                      </div>
                    )}
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {formatDistanceToNow(parseLocalDate(expense.purchase_date), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-base sm:text-lg lg:text-xl text-foreground">
                    ${expense.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground gap-3">
            <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-muted flex items-center justify-center">
              <span className="text-2xl sm:text-3xl">💰</span>
            </div>
            <p className="text-xs sm:text-sm">No hay gastos registrados</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
