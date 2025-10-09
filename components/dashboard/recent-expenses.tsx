import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Expense } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface RecentExpensesProps {
  expenses: Expense[]
}

export function RecentExpenses({ expenses }: RecentExpensesProps) {
  return (
    <Card className="col-span-full lg:col-span-1">
      <CardHeader>
        <CardTitle>Últimos Gastos</CardTitle>
      </CardHeader>
      <CardContent>
        {expenses.length > 0 ? (
          <div className="space-y-4">
            {expenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm">{expense.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {expense.category?.name} •{" "}
                    {formatDistanceToNow(new Date(expense.purchase_date), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${expense.amount.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
            No hay gastos registrados
          </div>
        )}
      </CardContent>
    </Card>
  )
}
