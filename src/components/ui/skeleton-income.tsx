import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function SkeletonIncome() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="overflow-hidden h-full animate-pulse">
          <CardContent className="p-3 sm:p-4 lg:p-5 h-full flex flex-col">
            {/* Header con título y badge */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex-1 min-w-0 space-y-2">
                <Skeleton className="h-5 sm:h-6 lg:h-7 w-3/4" />
                <Skeleton className="h-5 w-24" />
              </div>
              
              {/* Botones de acción */}
              <div className="flex items-center gap-1 shrink-0">
                <Skeleton className="h-8 w-8 sm:h-9 sm:w-9 rounded-md" />
                <Skeleton className="h-8 w-8 sm:h-9 sm:w-9 rounded-md" />
              </div>
            </div>

            {/* Información adicional */}
            <div className="space-y-2 mb-3 flex-1">
              <Skeleton className="h-3 sm:h-4 w-full" />
              <Skeleton className="h-3 sm:h-4 w-2/3" />
            </div>

            {/* Monto al final */}
            <div className="mt-auto pt-3 border-t">
              <Skeleton className="h-8 sm:h-10 lg:h-12 w-32 sm:w-40" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
