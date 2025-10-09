import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ExpensesByCategory } from "@/lib/types"
import { TableSkeleton } from "@/components/ui/skeleton-loader"
import { Badge } from "@/components/ui/badge"
import { TrendingUp } from "lucide-react"

interface CategoryTableProps {
  data: ExpensesByCategory[]
  title: string
  isLoading?: boolean
}

export function CategoryTable({ data, title, isLoading }: CategoryTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <TableSkeleton rows={5} />
        </CardContent>
      </Card>
    )
  }

  const total = data.reduce((sum, item) => sum + item.total, 0)

  return (
    <Card className="animate-fade-in-up hover-glow transition-smooth overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <CardHeader className="relative z-10 p-3 sm:p-4 lg:p-6 pb-2 sm:pb-3">
        <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base lg:text-lg">
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent truncate">
            {title}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10 p-3 sm:p-4 lg:p-6 pt-2 sm:pt-3">
        {data.length > 0 ? (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-bold text-[10px] sm:text-xs lg:text-sm">Categoría</TableHead>
                  <TableHead className="text-right font-bold text-[10px] sm:text-xs lg:text-sm">Monto</TableHead>
                  <TableHead className="text-right font-bold text-[10px] sm:text-xs lg:text-sm">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, index) => (
                  <TableRow 
                    key={item.category}
                    className="transition-smooth hover:bg-muted/30 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <TableCell className="font-medium p-2 sm:p-4">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="text-sm sm:text-lg lg:text-xl">{item.icon}</span>
                        <span className="text-xs sm:text-sm lg:text-base truncate">{item.category}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right p-2 sm:p-4">
                      <span className="font-bold text-sm sm:text-base lg:text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                        ${item.total.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right p-2 sm:p-4">
                      <Badge variant="secondary" className="font-semibold text-[9px] sm:text-xs">
                        {((item.total / total) * 100).toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/15 hover:to-primary/10 border-t-2 border-primary/20">
                  <TableCell className="text-sm sm:text-base lg:text-lg p-2 sm:p-4">Total</TableCell>
                  <TableCell className="text-right text-base sm:text-lg lg:text-xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent p-2 sm:p-4">
                    ${total.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right p-2 sm:p-4">
                    <Badge className="bg-primary text-primary-foreground font-bold text-[9px] sm:text-xs">
                      100%
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-muted-foreground gap-2 sm:gap-3">
            <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-muted flex items-center justify-center">
              <span className="text-2xl sm:text-3xl">📋</span>
            </div>
            <p className="text-xs sm:text-sm">No hay datos para mostrar</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
