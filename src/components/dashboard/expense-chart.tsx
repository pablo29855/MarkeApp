import type { ExpensesByCategory } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { chartColor, categoryIcon } from "@/lib/category-visuals"
import { BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ExpenseChartProps {
  data: ExpensesByCategory[]
  isLoading?: boolean
  className?: string
  style?: React.CSSProperties
}

export function ExpenseChart({ data, isLoading, className, style }: ExpenseChartProps) {
  const sorted = [...data].sort((a, b) => b.total - a.total)
  const max = sorted.length ? Math.max(...sorted.map((d) => d.total)) : 0

  return (
    <div
      className={cn("fade-up rounded-[24px] bg-card p-4 sm:p-5 shadow-card", className)}
      style={style}
    >
      <h3 className="mb-4 text-base font-black text-foreground">Gastos por categoría</h3>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 skeleton-shimmer rounded-xl" />
          ))}
        </div>
      ) : sorted.length > 0 ? (
        <div className="space-y-4">
          {sorted.map((item, index) => {
            const pct = max > 0 ? (item.total / max) * 100 : 0
            const Icon = categoryIcon(item.category)
            const color = chartColor(index)
            return (
              <div key={item.category}>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0" style={{ color }} strokeWidth={2.6} />
                    <span className="truncate text-[13px] font-bold text-foreground">
                      {item.category}
                    </span>
                  </div>
                  <span className="shrink-0 text-[13px] font-black text-foreground">
                    {formatCurrency(item.total)}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="progress-fill h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: color,
                      animationDelay: `${0.3 + index * 0.08}s`,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
            <BarChart3 className="h-7 w-7" />
          </div>
          <p className="text-sm">No hay gastos este mes</p>
        </div>
      )}
    </div>
  )
}
