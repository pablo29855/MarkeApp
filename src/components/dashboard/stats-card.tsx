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
    <Card className="transition-smooth hover-glow hover:border-primary/50 animate-fade-in group overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Layout móvil compacto */}
      <CardContent className="p-2 sm:p-3 lg:p-4 relative z-10">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Icono */}
          <div className="flex-shrink-0 p-1.5 sm:p-2 lg:p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-primary group-hover:scale-110 transition-transform" />
          </div>
          
          {/* Contenido */}
          <div className="flex-1 min-w-0">
            <p className="text-[9px] sm:text-[10px] lg:text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-wide truncate">
              {title}
            </p>
            <div className="text-base sm:text-xl lg:text-2xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text truncate">
              {value}
            </div>
            {description && (
              <p className="text-[8px] sm:text-[9px] lg:text-xs text-muted-foreground mt-0.5 truncate">
                {description}
              </p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-1">
                <span className={cn(
                  "text-[8px] sm:text-xs font-medium px-1.5 py-0.5 rounded-full flex items-center gap-0.5",
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
