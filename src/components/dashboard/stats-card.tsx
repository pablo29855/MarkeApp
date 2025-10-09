import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string
  icon: LucideIcon
  description?: string
  trend?: {
    value: string
    isPositive: boolean
  }
  isLoading?: boolean
}

export function StatsCard({ title, value, icon: Icon, description, trend, isLoading }: StatsCardProps) {
  if (isLoading) {
    return (
      <Card className="animate-fade-in overflow-hidden">
        <CardContent className="p-2 sm:p-3 lg:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-10 w-10 skeleton-shimmer rounded-lg" />
            <div className="flex-1">
              <div className="h-3 w-20 skeleton-shimmer mb-1" />
              <div className="h-5 w-24 skeleton-shimmer mb-1" />
              <div className="h-2 w-16 skeleton-shimmer" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden border-muted/40">
      {/* Layout vertical en móvil, horizontal en desktop */}
      <CardContent className="p-2 sm:p-3 lg:p-4">
        <div className="flex flex-col lg:flex-row items-center lg:items-center gap-2 lg:gap-3">
          {/* Icono */}
          <div className="flex-shrink-0 p-2 sm:p-2.5 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-6 lg:w-6 text-primary" />
          </div>
          
          {/* Contenido */}
          <div className="flex-1 min-w-0 text-center lg:text-left w-full">
            <p className="text-[10px] sm:text-xs lg:text-sm font-medium text-muted-foreground uppercase tracking-wide truncate">
              {title}
            </p>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">
              {value}
            </div>
            {description && (
              <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground mt-0.5 truncate line-clamp-1">
                {description}
              </p>
            )}
            {trend && (
              <div className="flex items-center justify-center lg:justify-start gap-1 mt-1">
                <span className={cn(
                  "text-[10px] sm:text-xs lg:text-sm font-medium px-1.5 py-0.5 rounded-full flex items-center gap-0.5",
                  trend.isPositive 
                    ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" 
                    : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                )}>
                  <span>{trend.isPositive ? "↑" : "↓"}</span>
                  <span>{trend.value}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
