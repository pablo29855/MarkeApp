import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils"
import { useCountUp } from "@/hooks/use-count-up"

type Accent = "blue" | "coral" | "amber" | "violet"

interface StatsCardProps {
  title: string
  /** Texto a mostrar cuando no hay valor numérico (p.ej. conteos) */
  value?: string
  /** Valor numérico a animar (conteo). Si se pasa, se formatea como moneda. */
  numericValue?: number
  icon: LucideIcon
  description?: string
  accent?: Accent
  /** Si es true y hay numericValue, se muestra como número entero (no moneda) */
  plain?: boolean
  isLoading?: boolean
  style?: React.CSSProperties
  className?: string
}

const ACCENTS: Record<Accent, { box: string; icon: string }> = {
  blue: { box: "bg-[hsl(var(--chart-1)/0.14)]", icon: "text-[hsl(var(--chart-1))]" },
  coral: { box: "bg-[hsl(var(--chart-2)/0.16)]", icon: "text-[hsl(var(--chart-2))]" },
  amber: { box: "bg-[hsl(var(--chart-3)/0.18)]", icon: "text-[hsl(var(--chart-3))]" },
  violet: { box: "bg-[hsl(var(--chart-4)/0.16)]", icon: "text-[hsl(var(--chart-4))]" },
}

export function StatsCard({
  title,
  value,
  numericValue,
  icon: Icon,
  description,
  accent = "blue",
  plain = false,
  isLoading,
  style,
  className,
}: StatsCardProps) {
  const animated = useCountUp(numericValue ?? 0)
  const a = ACCENTS[accent]

  if (isLoading) {
    return (
      <div className="rounded-[22px] bg-card p-3 sm:p-4 shadow-card animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 skeleton-shimmer rounded-2xl" />
          <div className="flex-1">
            <div className="h-3 w-20 skeleton-shimmer mb-1.5" />
            <div className="h-5 w-24 skeleton-shimmer" />
          </div>
        </div>
      </div>
    )
  }

  const displayValue =
    numericValue !== undefined
      ? plain
        ? Math.round(animated).toLocaleString("es-CO")
        : formatCurrency(animated)
      : value

  return (
    <div
      className={cn(
        "fade-up rounded-[22px] bg-card p-3 sm:p-4 shadow-card transition-transform active:scale-[.98]",
        className,
      )}
      style={style}
    >
      <div className="flex items-center gap-3">
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", a.box)}>
          <Icon className={cn("h-[22px] w-[22px]", a.icon)} strokeWidth={2.4} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            {title}
          </p>
          <div className="truncate text-lg sm:text-xl font-black text-foreground">
            {displayValue}
          </div>
          {description && (
            <p className="truncate text-[11px] text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    </div>
  )
}
