import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { IncomesByType } from '@/lib/types'

interface IncomeChartProps {
  data: IncomesByType[]
  totalIncome: number
}

export function IncomeChart({ data, totalIncome }: IncomeChartProps) {
  const getIncomeTypeInfo = (type: string) => {
    switch (type) {
      case 'nomina':
        return { label: 'Nómina', icon: '💼', color: 'bg-blue-500' }
      case 'transferencia':
        return { label: 'Transferencias', icon: '🏦', color: 'bg-green-500' }
      case 'efectivo':
        return { label: 'Efectivo', icon: '💵', color: 'bg-yellow-500' }
      default:
        return { label: type, icon: '💰', color: 'bg-gray-500' }
    }
  }

  if (data.length === 0) {
    return (
      <Card className="col-span-full lg:col-span-1">
        <CardHeader>
          <CardTitle>Ingresos por Tipo</CardTitle>
          <CardDescription>Distribución de tus ingresos</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <div className="text-6xl mb-4">💰</div>
          <p className="text-muted-foreground text-center">
            No hay ingresos registrados
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-full lg:col-span-1">
      <CardHeader>
        <CardTitle>Ingresos por Tipo</CardTitle>
        <CardDescription>Total: {formatCurrency(totalIncome)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((item) => {
          const typeInfo = getIncomeTypeInfo(item.type)
          const percentage = totalIncome > 0 ? (item.total / totalIncome) * 100 : 0

          return (
            <div key={item.type} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{typeInfo.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{typeInfo.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <p className="text-sm font-bold">
                  {formatCurrency(item.total)}
                </p>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full transition-all ${typeInfo.color}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
