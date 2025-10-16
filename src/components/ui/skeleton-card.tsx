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
    <div className={cn("grid grid-cols-2 gap-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="animate-pulse overflow-hidden h-full">
          <CardContent className="p-3 sm:p-4 lg:p-5 h-full flex flex-col">
            {/* Header con título y badge */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex-1 min-w-0 space-y-2">
                {/* Título */}
                <div className="h-5 sm:h-6 lg:h-7 w-full bg-muted rounded" />
                {/* Badge */}
                <div className="h-5 sm:h-6 w-24 sm:w-28 bg-muted rounded-full" />
              </div>
              {/* Botones de acción */}
              <div className="flex items-center gap-1 shrink-0">
                <div className="h-8 w-8 sm:h-9 sm:w-9 bg-muted rounded" />
                <div className="h-8 w-8 sm:h-9 sm:w-9 bg-muted rounded" />
              </div>
            </div>

            {/* Información adicional */}
            <div className="space-y-1 mb-3 flex-1">
              <div className="h-3.5 sm:h-4 w-3/4 bg-muted rounded" />
              <div className="h-3.5 sm:h-4 w-1/2 bg-muted rounded" />
            </div>

            {/* Monto al final */}
            <div className="mt-auto pt-3 border-t">
              <div className="h-7 sm:h-8 lg:h-9 w-28 sm:w-32 lg:w-36 bg-primary/20 rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function SkeletonShoppingGrid({ count = 6, className }: SkeletonListProps) {
  return (
    <div className={cn("grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="animate-pulse overflow-hidden h-full">
          <CardContent className="p-3 sm:p-4 lg:p-5 h-full flex flex-col">
            {/* Header con título y badge */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex-1 min-w-0 space-y-2">
                {/* Título (producto) */}
                <div className="h-5 sm:h-6 lg:h-7 w-full bg-muted rounded" />
                {/* Badge de categoría */}
                <div className="h-5 sm:h-6 w-20 sm:w-24 bg-muted rounded-full" />
              </div>
              {/* Botones de acción (eliminar y editar) */}
              <div className="flex items-center gap-1 shrink-0">
                <div className="h-8 w-8 sm:h-9 sm:w-9 bg-muted rounded" />
                <div className="h-8 w-8 sm:h-9 sm:w-9 bg-muted rounded" />
              </div>
            </div>

            {/* Información de cantidad */}
            <div className="flex-1 mb-3">
              <div className="inline-flex items-center px-3 py-2 bg-muted rounded-lg w-32 sm:w-36">
                <div className="h-5 sm:h-6 w-full bg-muted-foreground/20 rounded" />
              </div>
            </div>

            {/* Botón de comprado al final */}
            <div className="h-10 sm:h-11 w-full bg-primary/20 rounded mt-auto" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
