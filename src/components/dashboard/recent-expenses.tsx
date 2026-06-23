import { formatDistanceToNow } from "date-fns"
import { parseLocalDate, formatCurrency } from '@/lib/utils'
import { es } from "date-fns/locale"
import { categoryIcon, chartColor, tintColor } from "@/lib/category-visuals"
import { Wallet, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Movement {
  id: string
  name: string
  amount: number
  date: string
  type: 'income' | 'expense'
  categoryName?: string
}

interface RecentExpensesProps {
  expenses: Movement[]
  isLoading?: boolean
  className?: string
  style?: React.CSSProperties
}

export function RecentExpenses({ expenses, isLoading, className, style }: RecentExpensesProps) {
  return (
    <div className={cn("fade-up", className)} style={style}>
      <h3 className="mb-3 px-1 text-base font-black text-foreground">Movimientos recientes</h3>

      {isLoading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 skeleton-shimmer rounded-[20px]" />
          ))}
        </div>
      ) : expenses.length > 0 ? (
        <div className="space-y-2.5">
          {expenses.map((movement, index) => {
            const isIncome = movement.type === 'income'
            const Icon = isIncome ? TrendingUp : categoryIcon(movement.categoryName)
            const color = isIncome ? '#3B6EF6' : chartColor(index)
            const bgTintColor = isIncome ? 'rgba(59,110,246,0.14)' : tintColor(index)

            return (
              <div
                key={`${movement.type}-${movement.id}`}
                className="flex items-center gap-3 rounded-[20px] bg-card p-3 shadow-card transition-transform active:scale-[.98]"
              >
                <div
                  className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: bgTintColor }}
                >
                  <Icon className="h-5 w-5" style={{ color }} strokeWidth={2.6} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-foreground">{movement.name}</p>
                  <p className="truncate text-[11.5px] text-muted-foreground">
                    {movement.categoryName ? `${movement.categoryName} · ` : ""}
                    {formatDistanceToNow(parseLocalDate(movement.date), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </p>
                </div>
                <span className={cn("shrink-0 text-sm font-black", isIncome ? "text-[#3B6EF6]" : "text-coral")}>
                  {isIncome ? '+' : '−'}{formatCurrency(movement.amount)}
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-[20px] bg-card py-12 text-muted-foreground shadow-card">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
            <Wallet className="h-7 w-7" />
          </div>
          <p className="text-sm">No hay movimientos registrados</p>
        </div>
      )}
    </div>
  )
}
