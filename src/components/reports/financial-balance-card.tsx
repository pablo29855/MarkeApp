import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Wallet, DollarSign, CreditCard, ArrowRight } from 'lucide-react'

interface FinancialBalanceCardProps {
  totalIncome: number
  totalExpenses: number
  totalDebts: number
  periodLabel: string
  // Datos de comparación (opcional)
  compareData?: {
    totalIncome: number
    totalExpenses: number
    totalDebts: number
    periodLabel: string
  }
}

export function FinancialBalanceCard({ 
  totalIncome, 
  totalExpenses, 
  totalDebts, 
  periodLabel,
  compareData 
}: FinancialBalanceCardProps) {
  const balance = totalIncome - totalExpenses - totalDebts
  const spent = totalExpenses + totalDebts
  const spentPercentage = totalIncome > 0 ? (spent / totalIncome) * 100 : 0
  const savingsPercentage = totalIncome > 0 ? (balance / totalIncome) * 100 : 0

  // Cálculos de comparación
  const compareBalance = compareData ? compareData.totalIncome - compareData.totalExpenses - compareData.totalDebts : 0
  
  const incomeDiff = compareData ? totalIncome - compareData.totalIncome : 0
  const expensesDiff = compareData ? totalExpenses - compareData.totalExpenses : 0
  const debtsDiff = compareData ? totalDebts - compareData.totalDebts : 0
  const balanceDiff = compareData ? balance - compareBalance : 0

  const getBalanceStatus = () => {
    if (balance > totalIncome * 0.3) return { 
      text: 'Excelente', 
      color: 'text-green-600 dark:text-green-400',
      icon: TrendingUp 
    }
    if (balance > 0) return { 
      text: 'Bueno', 
      color: 'text-blue-600 dark:text-blue-400',
      icon: TrendingUp 
    }
    return { 
      text: 'Atención', 
      color: 'text-red-600 dark:text-red-400',
      icon: TrendingDown 
    }
  }

  const getDifferenceColor = (diff: number, isIncome = false) => {
    if (diff === 0) return 'text-gray-600 dark:text-gray-400'
    // Para ingresos, más es mejor. Para gastos/deudas, menos es mejor
    if (isIncome) {
      return diff > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
    }
    return diff > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
  }

  const status = getBalanceStatus()
  const StatusIcon = status.icon

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Balance Financiero
            </CardTitle>
            <CardDescription>{periodLabel}</CardDescription>
          </div>
          <div className={`flex items-center gap-2 ${status.color}`}>
            <StatusIcon className="h-5 w-5" />
            <span className="font-semibold">{status.text}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Balance Principal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">Ingresos</p>
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(totalIncome)}
              </p>
              <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">
                100% de la base
              </p>
            </CardContent>
          </Card>

          <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">Egresos</p>
                <CreditCard className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(spent)}
              </p>
              <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">
                {spentPercentage.toFixed(1)}% del ingreso
              </p>
            </CardContent>
          </Card>

          <Card className={`${
            balance > 0 
              ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' 
              : 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'
          }`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className={`text-sm font-medium ${
                  balance > 0 
                    ? 'text-blue-700 dark:text-blue-400' 
                    : 'text-orange-700 dark:text-orange-400'
                }`}>
                  Balance
                </p>
                <Wallet className={`h-5 w-5 ${
                  balance > 0 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-orange-600 dark:text-orange-400'
                }`} />
              </div>
              <p className={`text-2xl font-bold ${
                balance > 0 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-orange-600 dark:text-orange-400'
              }`}>
                {formatCurrency(balance)}
              </p>
              <p className={`text-xs mt-1 ${
                balance > 0 
                  ? 'text-blue-600/70 dark:text-blue-400/70' 
                  : 'text-orange-600/70 dark:text-orange-400/70'
              }`}>
                {balance > 0 ? `${savingsPercentage.toFixed(1)}% ahorro` : 'Déficit'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Barra de Progreso Detallada */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Distribución de Ingresos</span>
            <span className="font-medium">
              {totalIncome > 0 ? formatCurrency(totalIncome) : 'Sin ingresos'}
            </span>
          </div>
          
          <div className="relative h-8 w-full overflow-hidden rounded-lg bg-muted">
            {totalIncome > 0 && (
              <>
                {/* Gastos */}
                <div 
                  className="absolute left-0 top-0 h-full bg-orange-500 flex items-center justify-center text-xs font-medium text-white transition-all"
                  style={{ width: `${(totalExpenses / totalIncome) * 100}%` }}
                >
                  {totalExpenses > 0 && ((totalExpenses / totalIncome) * 100) > 10 && (
                    <span className="truncate px-2">Gastos</span>
                  )}
                </div>
                {/* Deudas */}
                <div 
                  className="absolute top-0 h-full bg-purple-500 flex items-center justify-center text-xs font-medium text-white transition-all"
                  style={{ 
                    left: `${(totalExpenses / totalIncome) * 100}%`,
                    width: `${(totalDebts / totalIncome) * 100}%` 
                  }}
                >
                  {totalDebts > 0 && ((totalDebts / totalIncome) * 100) > 10 && (
                    <span className="truncate px-2">Deudas</span>
                  )}
                </div>
                {/* Balance */}
                {balance > 0 && (
                  <div 
                    className="absolute top-0 h-full bg-blue-500 flex items-center justify-center text-xs font-medium text-white transition-all"
                    style={{ 
                      left: `${((totalExpenses + totalDebts) / totalIncome) * 100}%`,
                      width: `${(balance / totalIncome) * 100}%` 
                    }}
                  >
                    {((balance / totalIncome) * 100) > 10 && (
                      <span className="truncate px-2">Disponible</span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Leyenda */}
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-orange-500" />
              <span>Gastos: {formatCurrency(totalExpenses)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-purple-500" />
              <span>Deudas: {formatCurrency(totalDebts)}</span>
            </div>
            {balance > 0 && (
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span>Disponible: {formatCurrency(balance)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Métricas Adicionales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Solo Gastos</p>
            <p className="text-lg font-semibold">{formatCurrency(totalExpenses)}</p>
            <p className="text-xs text-muted-foreground">
              {totalIncome > 0 ? `${((totalExpenses / totalIncome) * 100).toFixed(1)}%` : '0%'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Solo Deudas</p>
            <p className="text-lg font-semibold">{formatCurrency(totalDebts)}</p>
            <p className="text-xs text-muted-foreground">
              {totalIncome > 0 ? `${((totalDebts / totalIncome) * 100).toFixed(1)}%` : '0%'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tasa de Ahorro</p>
            <p className="text-lg font-semibold">
              {savingsPercentage.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">
              {savingsPercentage > 20 ? '🎉 Excelente' : savingsPercentage > 0 ? '👍 Bien' : '⚠️ Bajo'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Eficiencia</p>
            <p className="text-lg font-semibold">
              {totalIncome > 0 ? ((1 - (spent / totalIncome)) * 100).toFixed(1) : '0'}%
            </p>
            <p className="text-xs text-muted-foreground">
              De gestión
            </p>
          </div>
        </div>

        {/* Comparación (si existe) */}
        {compareData && (
          <div className="mt-6 pt-6 border-t space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <ArrowRight className="h-4 w-4" />
                Comparación con {compareData.periodLabel}
              </h4>
            </div>

            {/* Comparación de métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-muted/30">
                <CardContent className="pt-4 pb-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Ingresos</p>
                      <DollarSign className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold">{formatCurrency(compareData.totalIncome)}</p>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <p className="text-sm font-semibold">{formatCurrency(totalIncome)}</p>
                    </div>
                    <p className={`text-xs font-medium ${getDifferenceColor(incomeDiff, true)}`}>
                      {incomeDiff > 0 ? '+' : ''}{formatCurrency(incomeDiff)} ({((incomeDiff / (compareData.totalIncome || 1)) * 100).toFixed(1)}%)
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/30">
                <CardContent className="pt-4 pb-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Gastos</p>
                      <CreditCard className="h-4 w-4 text-orange-500" />
                    </div>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold">{formatCurrency(compareData.totalExpenses)}</p>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <p className="text-sm font-semibold">{formatCurrency(totalExpenses)}</p>
                    </div>
                    <p className={`text-xs font-medium ${getDifferenceColor(expensesDiff, false)}`}>
                      {expensesDiff > 0 ? '+' : ''}{formatCurrency(expensesDiff)} ({((expensesDiff / (compareData.totalExpenses || 1)) * 100).toFixed(1)}%)
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/30">
                <CardContent className="pt-4 pb-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Balance</p>
                      <Wallet className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold">{formatCurrency(compareBalance)}</p>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <p className="text-sm font-semibold">{formatCurrency(balance)}</p>
                    </div>
                    <p className={`text-xs font-medium ${getDifferenceColor(balanceDiff, true)}`}>
                      {balanceDiff > 0 ? '+' : ''}{formatCurrency(balanceDiff)}
                      {compareBalance !== 0 && ` (${((balanceDiff / compareBalance) * 100).toFixed(1)}%)`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Análisis de la comparación */}
            <div className="bg-muted/20 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">💡 Análisis Comparativo</p>
              <ul className="text-xs space-y-1.5 text-muted-foreground">
                {incomeDiff !== 0 && (
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>
                      Tus ingresos {incomeDiff > 0 ? 'aumentaron' : 'disminuyeron'} en{' '}
                      <span className={`font-medium ${getDifferenceColor(incomeDiff, true)}`}>
                        {formatCurrency(Math.abs(incomeDiff))}
                      </span>
                      {' '}respecto al período anterior.
                    </span>
                  </li>
                )}
                {expensesDiff !== 0 && (
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>
                      Tus gastos {expensesDiff > 0 ? 'aumentaron' : 'disminuyeron'} en{' '}
                      <span className={`font-medium ${getDifferenceColor(expensesDiff, false)}`}>
                        {formatCurrency(Math.abs(expensesDiff))}
                      </span>
                      {expensesDiff > 0 ? ', considera revisar tus hábitos de consumo.' : ', ¡excelente control de gastos!'}
                    </span>
                  </li>
                )}
                {debtsDiff !== 0 && (
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>
                      Tus deudas {debtsDiff > 0 ? 'aumentaron' : 'disminuyeron'} en{' '}
                      <span className={`font-medium ${getDifferenceColor(debtsDiff, false)}`}>
                        {formatCurrency(Math.abs(debtsDiff))}
                      </span>
                      {debtsDiff < 0 && ', ¡sigue así pagando tus deudas!'}
                    </span>
                  </li>
                )}
                {balanceDiff > 0 && (
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>
                      Tu balance disponible mejoró en{' '}
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(balanceDiff)}
                      </span>
                      , ¡vas por buen camino! 🎉
                    </span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
