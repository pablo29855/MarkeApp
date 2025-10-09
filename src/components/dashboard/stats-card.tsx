import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="h-4 w-24 skeleton-shimmer" />
          <div className="h-4 w-4 skeleton-shimmer rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-32 skeleton-shimmer mb-2" />
          <div className="h-3 w-40 skeleton-shimmer" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="transition-smooth hover-glow hover:border-primary/50 animate-fade-in group overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          {title}
        </CardTitle>
        <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
          <Icon className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <span className={cn(
              "text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1",
              trend.isPositive 
                ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" 
                : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
            )}>
              <span>{trend.isPositive ? "↑" : "↓"}</span>
              <span>{trend.value}</span>
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
