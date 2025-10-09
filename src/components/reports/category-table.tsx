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
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {title}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        {data.length > 0 ? (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-bold">Categoría</TableHead>
                  <TableHead className="text-right font-bold">Monto</TableHead>
                  <TableHead className="text-right font-bold">Porcentaje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, index) => (
                  <TableRow 
                    key={item.category}
                    className="transition-smooth hover:bg-muted/30 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{item.icon}</span>
                        <span>{item.category}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-bold text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                        ${item.total.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="font-semibold">
                        {((item.total / total) * 100).toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/15 hover:to-primary/10 border-t-2 border-primary/20">
                  <TableCell className="text-lg">Total</TableCell>
                  <TableCell className="text-right text-xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    ${total.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge className="bg-primary text-primary-foreground font-bold">
                      100%
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <span className="text-3xl">📋</span>
            </div>
            <p className="text-sm">No hay datos para mostrar</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
