import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Wallet, DollarSign, CreditCard, ArrowRight, ChevronDown } from 'lucide-react'
import { useState } from 'react'

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
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="col-span-full">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card via-card to-card/95 overflow-hidden">
        <CollapsibleTrigger className="w-full group">
          <CardHeader className="transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 shadow-sm">
                  <Wallet className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <CardTitle className="text-base sm:text-lg lg:text-xl truncate flex items-center gap-2">
                    Balance Financiero
                    <div className={`flex items-center gap-1.5 ${status.color} text-sm`}>
                      <StatusIcon className="h-4 w-4" />
                      <span className="font-semibold">{status.text}</span>
                    </div>
                  </CardTitle>
                  {!isOpen && (
                    <CardDescription className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm flex-wrap mt-1">
                      <span>{periodLabel}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className={`font-semibold ${balance > 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                        {formatCurrency(balance)}
                      </span>
                      {compareData && balanceDiff !== 0 && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span className={`font-semibold flex items-center gap-1 ${balanceDiff > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {balanceDiff > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {balanceDiff > 0 ? '+' : ''}{formatCurrency(balanceDiff)}
                          </span>
                        </>
                      )}
                    </CardDescription>
                  )}
                </div>
              </div>
              <ChevronDown 
                className={`h-5 w-5 text-muted-foreground transition-transform duration-200 shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4 sm:space-y-6 pt-0 px-4 sm:px-6 pb-4 sm:pb-6">
        {/* Balance Principal */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 border-green-200 dark:border-green-800 shadow-sm">
            <CardContent className="pt-3 sm:pt-4 md:pt-6 pb-3 sm:pb-4 md:pb-6 px-2 sm:px-4 md:px-6">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2 md:mb-3">
                <p className="text-[10px] sm:text-xs md:text-sm font-medium text-green-700 dark:text-green-400">Ingresos</p>
                <div className="p-1 sm:p-1.5 rounded-lg bg-green-500/20">
                  <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <p className="text-sm sm:text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(totalIncome)}
              </p>
              <p className="text-[9px] sm:text-[10px] md:text-xs text-green-600/70 dark:text-green-400/70 mt-0.5 sm:mt-1">
                100% base
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20 border-red-200 dark:border-red-800 shadow-sm">
            <CardContent className="pt-3 sm:pt-4 md:pt-6 pb-3 sm:pb-4 md:pb-6 px-2 sm:px-4 md:px-6">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2 md:mb-3">
                <p className="text-[10px] sm:text-xs md:text-sm font-medium text-red-700 dark:text-red-400">Egresos</p>
                <div className="p-1 sm:p-1.5 rounded-lg bg-red-500/20">
                  <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <p className="text-sm sm:text-xl md:text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(spent)}
              </p>
              <p className="text-[9px] sm:text-[10px] md:text-xs text-red-600/70 dark:text-red-400/70 mt-0.5 sm:mt-1">
                {spentPercentage.toFixed(1)}% ingreso
              </p>
            </CardContent>
          </Card>

          <Card className={`shadow-sm ${
            balance > 0 
              ? 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800' 
              : 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20 border-orange-200 dark:border-orange-800'
          }`}>
            <CardContent className="pt-3 sm:pt-4 md:pt-6 pb-3 sm:pb-4 md:pb-6 px-2 sm:px-4 md:px-6">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2 md:mb-3">
                <p className={`text-[10px] sm:text-xs md:text-sm font-medium ${
                  balance > 0 
                    ? 'text-blue-700 dark:text-blue-400' 
                    : 'text-orange-700 dark:text-orange-400'
                }`}>
                  Balance
                </p>
                <div className={`p-1 sm:p-1.5 rounded-lg ${
                  balance > 0 
                    ? 'bg-blue-500/20' 
                    : 'bg-orange-500/20'
                }`}>
                  <Wallet className={`h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 ${
                    balance > 0 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-orange-600 dark:text-orange-400'
                  }`} />
                </div>
              </div>
              <p className={`text-sm sm:text-xl md:text-2xl font-bold ${
                balance > 0 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-orange-600 dark:text-orange-400'
              }`}>
                {formatCurrency(balance)}
              </p>
              <p className={`text-[9px] sm:text-[10px] md:text-xs mt-0.5 sm:mt-1 ${
                balance > 0 
                  ? 'text-blue-600/70 dark:text-blue-400/70' 
                  : 'text-orange-600/70 dark:text-orange-400/70'
              }`}>
                {balance > 0 ? `${savingsPercentage.toFixed(1)}% ahorro` : 'Déficit'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Indicador de Tendencia Comparativa */}
        {compareData && (
          <Card className={`border-2 ${
            balanceDiff > 0 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 border-green-300 dark:border-green-700' 
              : balanceDiff < 0
              ? 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20 border-red-300 dark:border-red-700'
              : 'bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-950/30 dark:to-slate-950/20 border-gray-300 dark:border-gray-700'
          }`}>
            <CardContent className="pt-3 sm:pt-4 pb-3 sm:pb-4 px-3 sm:px-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`p-1.5 sm:p-2 md:p-3 rounded-xl ${
                    balanceDiff > 0 
                      ? 'bg-green-500 shadow-lg shadow-green-500/50' 
                      : balanceDiff < 0
                      ? 'bg-red-500 shadow-lg shadow-red-500/50'
                      : 'bg-gray-500 shadow-lg shadow-gray-500/50'
                  }`}>
                    {balanceDiff > 0 ? (
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                    ) : balanceDiff < 0 ? (
                      <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                    ) : (
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs md:text-sm font-medium text-muted-foreground">
                      Comparación vs {compareData.periodLabel}
                    </p>
                    <p className={`text-base sm:text-lg md:text-xl lg:text-2xl font-bold ${
                      balanceDiff > 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : balanceDiff < 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      <span className="hidden sm:inline">{balanceDiff > 0 ? '↑ Mejoraste' : balanceDiff < 0 ? '↓ Empeoraste' : '→ Sin cambios'}</span>
                      <span className="sm:hidden">{balanceDiff > 0 ? '↑' : balanceDiff < 0 ? '↓' : '→'}</span>
                      <span className="text-xs sm:text-sm md:text-base ml-1 sm:ml-2">
                        {balanceDiff > 0 ? '+' : ''}{formatCurrency(balanceDiff)}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto">
                  <p className="text-[9px] sm:text-xs text-muted-foreground">Balance anterior</p>
                  <p className="text-xs sm:text-sm md:text-base font-semibold">{formatCurrency(compareBalance)}</p>
                  <p className="text-[9px] sm:text-xs text-muted-foreground mt-0.5">→</p>
                  <p className="text-xs sm:text-sm md:text-base font-semibold">{formatCurrency(balance)}</p>
                </div>
              </div>
              
              {/* Resumen de cambios */}
              <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-2 sm:gap-3 text-[10px] sm:text-xs md:text-sm">
                <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 ${getDifferenceColor(incomeDiff, true)}`}>
                  <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium truncate">Ingresos</div>
                    <div className="font-bold truncate">{incomeDiff > 0 ? '+' : ''}{formatCurrency(incomeDiff)}</div>
                    {compareData.totalIncome > 0 && (
                      <div className="text-[9px] sm:text-[10px]">({((incomeDiff / compareData.totalIncome) * 100).toFixed(1)}%)</div>
                    )}
                  </div>
                </div>
                <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 ${getDifferenceColor(expensesDiff, false)}`}>
                  <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium truncate">Gastos</div>
                    <div className="font-bold truncate">{expensesDiff > 0 ? '+' : ''}{formatCurrency(expensesDiff)}</div>
                    {compareData.totalExpenses > 0 && (
                      <div className="text-[9px] sm:text-[10px]">({((expensesDiff / compareData.totalExpenses) * 100).toFixed(1)}%)</div>
                    )}
                  </div>
                </div>
                <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 ${getDifferenceColor(debtsDiff, false)}`}>
                  <Wallet className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium truncate">Deudas</div>
                    <div className="font-bold truncate">{debtsDiff > 0 ? '+' : ''}{formatCurrency(debtsDiff)}</div>
                    {compareData.totalDebts > 0 && (
                      <div className="text-[9px] sm:text-[10px]">({((debtsDiff / compareData.totalDebts) * 100).toFixed(1)}%)</div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
            <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
              <Card className="bg-muted/30">
                <CardContent className="pt-3 sm:pt-4 pb-2 sm:pb-3 px-2 sm:px-4 md:px-6">
                  <div className="space-y-1 sm:space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Ingresos</p>
                      <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-baseline sm:justify-between gap-0.5 sm:gap-2">
                      <p className="text-[10px] sm:text-sm font-semibold truncate">{formatCurrency(compareData.totalIncome)}</p>
                      <ArrowRight className="h-2 w-2 sm:h-3 sm:w-3 text-muted-foreground hidden sm:block" />
                      <p className="text-[10px] sm:text-sm font-semibold truncate">{formatCurrency(totalIncome)}</p>
                    </div>
                    <p className={`text-[9px] sm:text-xs font-medium truncate ${getDifferenceColor(incomeDiff, true)}`}>
                      {incomeDiff > 0 ? '+' : ''}{formatCurrency(incomeDiff)} <span className="hidden sm:inline">({((incomeDiff / (compareData.totalIncome || 1)) * 100).toFixed(1)}%)</span>
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/30">
                <CardContent className="pt-3 sm:pt-4 pb-2 sm:pb-3 px-2 sm:px-4 md:px-6">
                  <div className="space-y-1 sm:space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Gastos</p>
                      <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-baseline sm:justify-between gap-0.5 sm:gap-2">
                      <p className="text-[10px] sm:text-sm font-semibold truncate">{formatCurrency(compareData.totalExpenses)}</p>
                      <ArrowRight className="h-2 w-2 sm:h-3 sm:w-3 text-muted-foreground hidden sm:block" />
                      <p className="text-[10px] sm:text-sm font-semibold truncate">{formatCurrency(totalExpenses)}</p>
                    </div>
                    <p className={`text-[9px] sm:text-xs font-medium truncate ${getDifferenceColor(expensesDiff, false)}`}>
                      {expensesDiff > 0 ? '+' : ''}{formatCurrency(expensesDiff)} <span className="hidden sm:inline">({((expensesDiff / (compareData.totalExpenses || 1)) * 100).toFixed(1)}%)</span>
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/30">
                <CardContent className="pt-3 sm:pt-4 pb-2 sm:pb-3 px-2 sm:px-4 md:px-6">
                  <div className="space-y-1 sm:space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Balance</p>
                      <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-baseline sm:justify-between gap-0.5 sm:gap-2">
                      <p className="text-[10px] sm:text-sm font-semibold truncate">{formatCurrency(compareBalance)}</p>
                      <ArrowRight className="h-2 w-2 sm:h-3 sm:w-3 text-muted-foreground hidden sm:block" />
                      <p className="text-[10px] sm:text-sm font-semibold truncate">{formatCurrency(balance)}</p>
                    </div>
                    <p className={`text-[9px] sm:text-xs font-medium truncate ${getDifferenceColor(balanceDiff, true)}`}>
                      {balanceDiff > 0 ? '+' : ''}{formatCurrency(balanceDiff)}
                      <span className="hidden sm:inline">{compareBalance !== 0 && ` (${((balanceDiff / compareBalance) * 100).toFixed(1)}%)`}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Análisis de la comparación mejorado */}
            <div className={`rounded-lg p-4 border-2 ${
              balanceDiff > 0 
                ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                : balanceDiff < 0
                ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                : 'bg-gray-50/50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                {balanceDiff > 0 ? (
                  <>
                    <span className="text-2xl">🎉</span>
                    <p className="text-sm sm:text-base font-bold text-green-700 dark:text-green-300">
                      ¡Vas muy bien! Tu situación financiera mejoró
                    </p>
                  </>
                ) : balanceDiff < 0 ? (
                  <>
                    <span className="text-2xl">⚠️</span>
                    <p className="text-sm sm:text-base font-bold text-red-700 dark:text-red-300">
                      Atención: Tu situación financiera empeoró
                    </p>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">➡️</span>
                    <p className="text-sm sm:text-base font-bold text-gray-700 dark:text-gray-300">
                      Tu situación financiera se mantiene estable
                    </p>
                  </>
                )}
              </div>
              
              <ul className="text-xs sm:text-sm space-y-2 text-muted-foreground">
                {incomeDiff !== 0 && (
                  <li className="flex items-start gap-2">
                    <span className={`mt-0.5 text-base ${incomeDiff > 0 ? '📈' : '📉'}`}></span>
                    <span>
                      Ingresos {incomeDiff > 0 ? 'aumentaron' : 'disminuyeron'} en{' '}
                      <span className={`font-bold ${getDifferenceColor(incomeDiff, true)}`}>
                        {formatCurrency(Math.abs(incomeDiff))}
                      </span>
                      {incomeDiff > 0 ? ' ¡Sigue así!' : ' Busca nuevas fuentes de ingreso.'}
                    </span>
                  </li>
                )}
                {expensesDiff !== 0 && (
                  <li className="flex items-start gap-2">
                    <span className={`mt-0.5 text-base ${expensesDiff < 0 ? '✅' : '❌'}`}></span>
                    <span>
                      Gastos {expensesDiff > 0 ? 'aumentaron' : 'disminuyeron'} en{' '}
                      <span className={`font-bold ${getDifferenceColor(expensesDiff, false)}`}>
                        {formatCurrency(Math.abs(expensesDiff))}
                      </span>
                      {expensesDiff > 0 ? ' Revisa tus hábitos de consumo.' : ' ¡Excelente control!'}
                    </span>
                  </li>
                )}
                {debtsDiff !== 0 && (
                  <li className="flex items-start gap-2">
                    <span className={`mt-0.5 text-base ${debtsDiff < 0 ? '💪' : '⚡'}`}></span>
                    <span>
                      Deudas {debtsDiff > 0 ? 'aumentaron' : 'disminuyeron'} en{' '}
                      <span className={`font-bold ${getDifferenceColor(debtsDiff, false)}`}>
                        {formatCurrency(Math.abs(debtsDiff))}
                      </span>
                      {debtsDiff < 0 ? ' ¡Sigue pagando tus deudas!' : ' Evita nuevas deudas.'}
                    </span>
                  </li>
                )}
                {balanceDiff !== 0 && (
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-base">💰</span>
                    <span>
                      Balance disponible {balanceDiff > 0 ? 'mejoró' : 'empeoró'} en{' '}
                      <span className={`font-bold ${balanceDiff > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(Math.abs(balanceDiff))}
                      </span>
                      {balanceDiff > 0 ? ' ¡Vas por buen camino!' : ' Ajusta tu presupuesto.'}
                    </span>
                  </li>
                )}
              </ul>
              
              {/* Recomendación personalizada */}
              <div className={`mt-3 pt-3 border-t ${
                balanceDiff > 0 ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'
              }`}>
                <p className="text-xs sm:text-sm font-semibold mb-1">
                  {balanceDiff > 0 ? '✨ Recomendación:' : '💡 Sugerencias:'}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {balanceDiff > 0 
                    ? 'Considera ahorrar o invertir este excedente para hacer crecer tu patrimonio. Mantén este ritmo positivo.'
                    : balanceDiff < 0
                    ? 'Revisa tus gastos principales, establece un presupuesto más estricto y busca formas de aumentar tus ingresos.'
                    : 'Mantén el equilibrio actual. Busca oportunidades para optimizar gastos y aumentar ingresos gradualmente.'}
                </p>
              </div>
            </div>
          </div>
        )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
