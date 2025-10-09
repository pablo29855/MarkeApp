import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ExpensesByCategory } from "@/lib/types"

interface CategoryTableProps {
  data: ExpensesByCategory[]
  title: string
}

export function CategoryTable({ data, title }: CategoryTableProps) {
  const total = data.reduce((sum, item) => sum + item.total, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="text-right">Porcentaje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.category}>
                  <TableCell className="font-medium">
                    {item.icon} {item.category}
                  </TableCell>
                  <TableCell className="text-right">${item.total.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{((item.total / total) * 100).toFixed(1)}%</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold bg-muted">
                <TableCell>Total</TableCell>
                <TableCell className="text-right">${total.toLocaleString()}</TableCell>
                <TableCell className="text-right">100%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        ) : (
          <div className="flex items-center justify-center py-8 text-muted-foreground">No hay datos para mostrar</div>
        )}
      </CardContent>
    </Card>
  )
}
