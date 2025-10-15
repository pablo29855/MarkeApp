import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { IncomesByType } from "@/lib/types"
import { TableSkeleton } from "@/components/ui/skeleton-loader"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, DollarSign } from "lucide-react"

interface IncomeTableProps {
  data: IncomesByType[]
  title: string
  isLoading?: boolean
}

export function IncomeTable({ data, title, isLoading }: IncomeTableProps) {
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
    <Card className="animate-fade-in-up hover-glow transition-smooth overflow-hidden group border-0 shadow-lg bg-gradient-to-br from-card via-card to-card/95">
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-emerald-500/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-lg" />
      <CardHeader className="relative z-10 p-4 sm:p-5 lg:p-6 pb-3 sm:pb-4 bg-gradient-to-r from-green-50/50 to-emerald-50/30 dark:from-green-950/20 dark:to-emerald-950/10 border-b border-green-100/50 dark:border-green-900/20">
        <CardTitle className="flex items-center justify-between text-sm sm:text-base lg:text-lg">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 shadow-sm">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div>
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-bold truncate block">
                {title || "Detalle de Ingresos por Tipo"}
              </span>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {data.length} {data.length === 1 ? 'tipo' : 'tipos'} • Total: ${total.toLocaleString()}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="border-green-200 text-green-700 dark:border-green-800 dark:text-green-300 font-semibold">
            Ingresos
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10 p-4 sm:p-5 lg:p-6 pt-3 sm:pt-4">
        {data.length > 0 ? (
          <div className="rounded-xl border border-green-100/50 dark:border-green-900/20 overflow-hidden shadow-sm bg-gradient-to-br from-white to-green-50/20 dark:from-gray-900 dark:to-green-950/10">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/30 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/60 dark:hover:to-emerald-900/40 border-b border-green-200/50 dark:border-green-800/30">
                  <TableHead className="font-bold text-xs sm:text-sm text-green-800 dark:text-green-200">Tipo de Ingreso</TableHead>
                  <TableHead className="text-right font-bold text-xs sm:text-sm text-green-800 dark:text-green-200">Monto</TableHead>
                  <TableHead className="text-right font-bold text-xs sm:text-sm text-green-800 dark:text-green-200">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, index) => {
                  const percentage = (item.total / total) * 100
                  return (
                    <TableRow 
                      key={item.type}
                      className="transition-all duration-300 hover:bg-gradient-to-r hover:from-green-50/50 hover:to-emerald-50/30 dark:hover:from-green-950/30 dark:hover:to-emerald-950/20 animate-fade-in border-b border-green-50/30 dark:border-green-900/20"
                      style={{ animationDelay: `${index * 75}ms` }}
                    >
                      <TableCell className="font-medium p-3 sm:p-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/30 shadow-sm">
                            <span className="text-sm sm:text-lg lg:text-xl">{item.icon}</span>
                          </div>
                          <div>
                            <span className="text-xs sm:text-sm lg:text-base font-semibold text-gray-900 dark:text-gray-100 truncate block">
                              {item.type}
                            </span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground">
                              #{index + 1} de {data.length}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right p-3 sm:p-4">
                        <span className="font-bold text-sm sm:text-base lg:text-lg bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          ${item.total.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right p-3 sm:p-4">
                        <Badge variant="secondary" className="font-semibold text-[9px] sm:text-xs bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 border-green-200 dark:border-green-800">
                          {percentage.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
                <TableRow className="font-bold bg-gradient-to-r from-green-500/10 to-emerald-500/5 hover:from-green-500/15 hover:to-emerald-500/10 border-t-2 border-green-500/30 dark:border-green-400/30 shadow-sm">
                  <TableCell className="text-sm sm:text-base lg:text-lg p-3 sm:p-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="font-bold text-green-800 dark:text-green-200">Total Ingresos</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-base sm:text-lg lg:text-xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent p-3 sm:p-4 font-bold">
                    ${total.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right p-3 sm:p-4">
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-[9px] sm:text-xs shadow-sm">
                      100%
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 sm:py-12 text-muted-foreground gap-3 sm:gap-4">
            <div className="relative">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/20 flex items-center justify-center shadow-lg">
                <span className="text-3xl sm:text-4xl">💰</span>
              </div>
              <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-xs text-white">+</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">No hay ingresos registrados</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Agrega algunos ingresos para ver el detalle por tipos</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}