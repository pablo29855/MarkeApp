import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface SkeletonCardProps {
  className?: string
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <Card className={cn("animate-pulse", className)}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Título y badge */}
          <div className="flex items-center gap-3">
            <div className="h-6 w-32 bg-muted rounded" />
            <div className="h-5 w-20 bg-muted rounded-full" />
          </div>
          
          {/* Contenido */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-3/4 bg-muted rounded" />
          </div>
          
          {/* Precio/Monto */}
          <div className="flex justify-between items-center">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-8 w-32 bg-primary/20 rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface SkeletonListProps {
  count?: number
  className?: string
}

export function SkeletonList({ count = 3, className }: SkeletonListProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonGrid({ count = 6, className }: SkeletonListProps) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="h-5 w-3/4 bg-muted rounded" />
              <div className="h-4 w-1/2 bg-muted rounded" />
              <div className="flex justify-between items-center pt-2">
                <div className="h-3 w-16 bg-muted rounded" />
                <div className="h-6 w-20 bg-primary/20 rounded" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
