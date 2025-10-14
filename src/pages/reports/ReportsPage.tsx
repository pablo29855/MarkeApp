import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { createClient } from '@/lib/supabase/client'
import { ReportFilters } from '@/components/reports/report-filters'
import { CategoryPieChart } from '@/components/reports/category-pie-chart'
import { ComparisonBarChart } from '@/components/reports/comparison-bar-chart'
import { CategoryTable } from '@/components/reports/category-table'
import { FinancialBalanceCard } from '@/components/reports/financial-balance-card'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingCheckOverlay } from '@/components/ui/loading-check'
import { formatCurrency } from '@/lib/utils'
import { BarChart3 } from 'lucide-react'
import type { ExpensesByCategory } from '@/lib/types'

export default function ReportsPage() {
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [expensesByCategory, setExpensesByCategory] = useState<ExpensesByCategory[]>([])
  const [compareExpensesByCategory, setCompareExpensesByCategory] = useState<ExpensesByCategory[]>([])
  const [isComparing, setIsComparing] = useState(false)
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalDebts, setTotalDebts] = useState(0)
  const [compareTotalIncome, setCompareTotalIncome] = useState(0)
  const [compareTotalDebts, setCompareTotalDebts] = useState(0)

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return

        const currentDate = new Date()
        const month = searchParams.get('month') ? Number.parseInt(searchParams.get('month')!) : currentDate.getMonth() + 1
        const year = searchParams.get('year') ? Number.parseInt(searchParams.get('year')!) : currentDate.getFullYear()

        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 0)

        const data = await getExpensesByCategory(user.id, month, year)
        setExpensesByCategory(data)

        // Obtener ingresos del período
        const { data: incomes } = await supabase
          .from('incomes')
          .select('amount')
          .eq('user_id', user.id)
          .gte('income_date', startDate.toISOString().split('T')[0])
          .lte('income_date', endDate.toISOString().split('T')[0])

        const income = incomes?.reduce((sum, inc) => sum + Number(inc.amount), 0) || 0
        setTotalIncome(income)

        // Obtener deudas pendientes
        const { data: debts } = await supabase
          .from('debts')
          .select('total_amount, paid_amount')
          .eq('user_id', user.id)

        const debtsTotal = debts?.reduce((sum, debt) => sum + Number(debt.total_amount) - Number(debt.paid_amount), 0) || 0
        setTotalDebts(debtsTotal)

        const compareMonth = searchParams.get('compareMonth')
        const compareYear = searchParams.get('compareYear')

        if (compareMonth && compareYear) {
          setIsComparing(true)
          const compareData = await getExpensesByCategory(
            user.id,
            Number.parseInt(compareMonth),
            Number.parseInt(compareYear)
          )
          setCompareExpensesByCategory(compareData)

          // Obtener ingresos del período de comparación
          const compareStartDate = new Date(Number.parseInt(compareYear), Number.parseInt(compareMonth) - 1, 1)
          const compareEndDate = new Date(Number.parseInt(compareYear), Number.parseInt(compareMonth), 0)

          const { data: compareIncomes } = await supabase
            .from('incomes')
            .select('amount')
            .eq('user_id', user.id)
            .gte('income_date', compareStartDate.toISOString().split('T')[0])
            .lte('income_date', compareEndDate.toISOString().split('T')[0])

          const compareIncome = compareIncomes?.reduce((sum, inc) => sum + Number(inc.amount), 0) || 0
          setCompareTotalIncome(compareIncome)

          // Las deudas son las mismas para ambos períodos (son acumulativas)
          setCompareTotalDebts(debtsTotal)
        } else {
          setIsComparing(false)
          setCompareExpensesByCategory([])
          setCompareTotalIncome(0)
          setCompareTotalDebts(0)
        }
      } catch (error) {
        console.error('[Reports] Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [searchParams])

  async function getExpensesByCategory(
    userId: string,
    month: number,
    year: number
  ): Promise<ExpensesByCategory[]> {
    const supabase = createClient()

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount, category:categories(name, color, icon)')
      .eq('user_id', userId)
      .gte('purchase_date', startDate.toISOString().split('T')[0])
      .lte('purchase_date', endDate.toISOString().split('T')[0])

    const categoryMap = new Map<string, ExpensesByCategory>()
    expenses?.forEach((exp: any) => {
      const categoryName = exp.category?.name || 'Sin categoría'
      const existing = categoryMap.get(categoryName)
      if (existing) {
        existing.total += Number(exp.amount)
      } else {
        categoryMap.set(categoryName, {
          category: categoryName,
          total: Number(exp.amount),
          color: exp.category?.color,
          icon: exp.category?.icon,
        })
      }
    })

    return Array.from(categoryMap.values()).sort((a, b) => b.total - a.total)
  }

  if (loading) {
    return <LoadingCheckOverlay message="Cargando reportes..." />
  }

  const currentDate = new Date()
  const month = searchParams.get('month') ? Number.parseInt(searchParams.get('month')!) : currentDate.getMonth() + 1
  const year = searchParams.get('year') ? Number.parseInt(searchParams.get('year')!) : currentDate.getFullYear()

  const totalExpenses = expensesByCategory.reduce((sum, item) => sum + item.total, 0)
  const compareTotalExpenses = compareExpensesByCategory.reduce((sum, item) => sum + item.total, 0)

  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ]

  const periodLabel = `${monthNames[month - 1]} ${year}`
  const comparePeriodLabel =
    searchParams.get('compareMonth') && searchParams.get('compareYear')
      ? `${monthNames[Number.parseInt(searchParams.get('compareMonth')!) - 1]} ${searchParams.get('compareYear')}`
      : ''

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="sticky top-16 lg:top-0 z-20 bg-background pb-3 sm:pb-4 lg:pb-6 pt-3 sm:pt-4 lg:pt-6">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-1 sm:mb-2">
          Reportes
        </h1>
        <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
          Analiza tus gastos y compara períodos
        </p>
      </div>

      <div className="grid gap-2 sm:gap-3 lg:gap-4 grid-cols-1 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 shadow-lg">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs lg:text-sm opacity-90 mb-1 sm:mb-2">Total de Gastos</p>
                <div className="flex items-baseline gap-1 sm:gap-2">
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-bold truncate">{formatCurrency(totalExpenses)}</span>
                </div>
                <p className="text-[10px] sm:text-xs lg:text-sm opacity-90 mt-1 sm:mt-2 truncate">{periodLabel}</p>
              </div>
              <div className="ml-2 sm:ml-4 shrink-0">
                <BarChart3 className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 opacity-20" />
              </div>
            </div>
          </CardContent>
        </Card>

        {isComparing && (
          <Card className="bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground border-0 shadow-lg">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs lg:text-sm opacity-90 mb-1 sm:mb-2">Total de Gastos</p>
                  <div className="flex items-baseline gap-1 sm:gap-2">
                    <span className="text-2xl sm:text-3xl lg:text-4xl font-bold truncate">{formatCurrency(compareTotalExpenses)}</span>
                  </div>
                  <p className="text-[10px] sm:text-xs lg:text-sm opacity-90 mt-1 sm:mt-2 truncate">{comparePeriodLabel}</p>
                  <p className="text-[10px] sm:text-xs lg:text-sm mt-1 sm:mt-2">
                    Diferencia:{' '}
                    <span
                      className={
                        totalExpenses > compareTotalExpenses
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-green-600 dark:text-green-400'
                      }
                    >
                      {totalExpenses > compareTotalExpenses ? '+' : ''}
                      {formatCurrency(totalExpenses - compareTotalExpenses)}
                    </span>
                  </p>
                </div>
                <div className="ml-2 sm:ml-4 shrink-0">
                  <BarChart3 className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 opacity-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <ReportFilters />

      {isComparing ? (
        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
          <ComparisonBarChart
            data1={expensesByCategory}
            data2={compareExpensesByCategory}
            label1={periodLabel}
            label2={comparePeriodLabel}
          />
          <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 lg:grid-cols-2">
            <CategoryPieChart data={expensesByCategory} title={`Distribución - ${periodLabel}`} />
            <CategoryPieChart data={compareExpensesByCategory} title={`Distribución - ${comparePeriodLabel}`} />
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 lg:grid-cols-2">
          <CategoryPieChart data={expensesByCategory} title={`Distribución - ${periodLabel}`} />
          <CategoryTable data={expensesByCategory} title="Detalle por Categoría" />
        </div>
      )}

      {/* Balance Financiero - Al final */}
      <FinancialBalanceCard
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
        totalDebts={totalDebts}
        periodLabel={periodLabel}
        compareData={isComparing ? {
          totalIncome: compareTotalIncome,
          totalExpenses: compareTotalExpenses,
          totalDebts: compareTotalDebts,
          periodLabel: comparePeriodLabel,
        } : undefined}
      />
    </div>
  )
}
