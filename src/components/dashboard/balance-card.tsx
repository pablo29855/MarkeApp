import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'

interface BalanceCardProps {
  totalIncome: number
  totalExpenses: number
  totalDebts: number
}

export function BalanceCard({ totalIncome, totalExpenses, totalDebts }: BalanceCardProps) {
  const balance = totalIncome - totalExpenses - totalDebts
  const spent = totalExpenses + totalDebts
  const spentPercentage = totalIncome > 0 ? (spent / totalIncome) * 100 : 0
  const balancePercentage = totalIncome > 0 ? (balance / totalIncome) * 100 : 0

  const getBalanceColor = () => {
    if (balance > 0) return 'text-green-600 dark:text-green-400'
    if (balance < 0) return 'text-red-600 dark:text-red-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  const getProgressColor = () => {
    if (spentPercentage <= 50) return 'bg-green-500'
    if (spentPercentage <= 75) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Balance Financiero
            </CardTitle>
            <CardDescription>Resumen de tu situación financiera actual</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Balance Principal */}
        <div className="text-center space-y-2 p-4 rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">Balance Disponible</p>
          <p className={`text-4xl font-bold ${getBalanceColor()}`}>
            {formatCurrency(balance)}
          </p>
          <div className="flex items-center justify-center gap-2 text-sm">
            {balance > 0 ? (
              <>
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-green-600">Saldo positivo</span>
              </>
            ) : balance < 0 ? (
              <>
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-red-600">Saldo negativo</span>
              </>
            ) : (
              <span className="text-gray-600">Sin movimientos</span>
            )}
          </div>
        </div>

        {/* Desglose */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <p className="text-sm font-medium">Ingresos</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(totalIncome)}
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm font-medium">Gastos + Deudas</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(spent)}
              </p>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Gastado: {spentPercentage.toFixed(1)}%</span>
              <span>Disponible: {balancePercentage.toFixed(1)}%</span>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
              <div 
                className={`h-full transition-all ${getProgressColor()}`}
                style={{ width: `${Math.min(spentPercentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Detalles */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <p className="text-xs text-muted-foreground">Solo Gastos</p>
              <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Solo Deudas</p>
              <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                {formatCurrency(totalDebts)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
