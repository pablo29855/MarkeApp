import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { createClient } from '@/lib/supabase/client'
import { ReportFilters } from '@/components/reports/report-filters'
import { IncomeFilters } from '@/components/incomes/income-filters'
import { CategoryPieChart } from '@/components/reports/category-pie-chart'
import { ComparisonBarChart } from '@/components/reports/comparison-bar-chart'
import { CategoryTable } from '@/components/reports/category-table'
import { IncomeTable } from '@/components/reports/income-table'
import { FinancialBalanceCard } from '@/components/reports/financial-balance-card'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingCheckOverlay } from '@/components/ui/loading-check'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { formatCurrency } from '@/lib/utils'
import { BarChart3 } from 'lucide-react'
import type { ExpensesByCategory, IncomesByType } from '@/lib/types'

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
  const [compareIncomesByType, setCompareIncomesByType] = useState<IncomesByType[]>([])
  const [incomesByType, setIncomesByType] = useState<IncomesByType[]>([])
  
  // Obtener el tipo de reporte: 'expenses', 'incomes' o null (mostrar todo)
  const reportType = searchParams.get('type')

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

        // Obtener ingresos del período y agruparlos por tipo
        const { data: allIncomes } = await supabase
          .from('incomes')
          .select('amount, income_type')
          .eq('user_id', user.id)
          .gte('income_date', startDate.toISOString().split('T')[0])
          .lte('income_date', endDate.toISOString().split('T')[0])

        const income = allIncomes?.reduce((sum, inc) => sum + Number(inc.amount), 0) || 0
        setTotalIncome(income)

        // Agrupar ingresos por tipo
        const incomeTypeMap = new Map<string, number>()
        allIncomes?.forEach(inc => {
          const current = incomeTypeMap.get(inc.income_type) || 0
          incomeTypeMap.set(inc.income_type, current + Number(inc.amount))
        })

        const incomesByTypeData: IncomesByType[] = Array.from(incomeTypeMap.entries()).map(([type, total]) => ({
          type: type === 'nomina' ? 'Nómina' : type === 'transferencia' ? 'Transferencia' : 'Efectivo',
          total,
          color: type === 'nomina' ? '#3b82f6' : type === 'transferencia' ? '#10b981' : '#f59e0b',
          icon: type === 'nomina' ? '💼' : type === 'transferencia' ? '🏦' : '💵'
        }))
        setIncomesByType(incomesByTypeData)

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

          // Obtener ingresos por tipo del período de comparación
          const { data: compareAllIncomes } = await supabase
            .from('incomes')
            .select('amount, income_type')
            .eq('user_id', user.id)
            .gte('income_date', compareStartDate.toISOString().split('T')[0])
            .lte('income_date', compareEndDate.toISOString().split('T')[0])

          const compareIncomeTypeMap = new Map<string, number>()
          compareAllIncomes?.forEach(inc => {
            const current = compareIncomeTypeMap.get(inc.income_type) || 0
            compareIncomeTypeMap.set(inc.income_type, current + Number(inc.amount))
          })

          const compareIncomesByTypeData: IncomesByType[] = Array.from(compareIncomeTypeMap.entries()).map(([type, total]) => ({
            type: type === 'nomina' ? 'Nómina' : type === 'transferencia' ? 'Transferencia' : 'Efectivo',
            total,
            color: type === 'nomina' ? '#3b82f6' : type === 'transferencia' ? '#10b981' : '#f59e0b',
            icon: type === 'nomina' ? '💼' : type === 'transferencia' ? '🏦' : '💵'
          }))
          setCompareIncomesByType(compareIncomesByTypeData)

          // Las deudas son las mismas para ambos períodos (son acumulativas)
          setCompareTotalDebts(debtsTotal)
        } else {
          setIsComparing(false)
          setCompareExpensesByCategory([])
          setCompareTotalIncome(0)
          setCompareTotalDebts(0)
          setCompareIncomesByType([])
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
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
      <div className="flex flex-col gap-3 sm:gap-4 lg:gap-6">
      {/* Header */}
      <div className="sticky top-16 lg:top-0 z-20 bg-background pb-3 sm:pb-4 lg:pb-6 pt-3 sm:pt-4 lg:pt-6">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-1 sm:mb-2">
          Reportes
        </h1>
        <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
          Analiza tus gastos y compara períodos
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-2 sm:gap-3 lg:gap-4 grid-cols-2 lg:grid-cols-2">
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

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs lg:text-sm opacity-90 mb-1 sm:mb-2">Total de Ingresos</p>
                <div className="flex items-baseline gap-1 sm:gap-2">
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-bold truncate">{formatCurrency(totalIncome)}</span>
                </div>
                <p className="text-[10px] sm:text-xs lg:text-sm opacity-90 mt-1 sm:mt-2 truncate">{periodLabel}</p>
              </div>
              <div className="ml-2 sm:ml-4 shrink-0">
                <BarChart3 className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 opacity-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 lg:gap-6">
        <div className="flex-1">
          <ReportFilters />
        </div>
        <div className="flex-1">
          <IncomeFilters />
        </div>
      </div>

      {isComparing ? (
        <div className="flex flex-col gap-3 sm:gap-4 lg:gap-6">
          {/* Gráficas de torta de gastos */}
          {(!reportType || reportType === 'expenses') && (
            <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-2 lg:grid-cols-2">
              <CategoryPieChart data={expensesByCategory} title={`Gastos - ${periodLabel}`} />
              <CategoryPieChart data={compareExpensesByCategory} title={`Gastos - ${comparePeriodLabel}`} />
            </div>
          )}
          
          {/* Gráficas de torta de ingresos */}
          {(!reportType || reportType === 'incomes') && (
            <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-2 lg:grid-cols-2">
              <CategoryPieChart data={incomesByType.map(item => ({ category: item.type, total: item.total, color: item.color, icon: item.icon }))} title={`Ingresos - ${periodLabel}`} />
              <CategoryPieChart data={compareIncomesByType.map(item => ({ category: item.type, total: item.total, color: item.color, icon: item.icon }))} title={`Ingresos - ${comparePeriodLabel}`} />
            </div>
          )}
          
          {/* Detalles de Gastos con gráfico y tablas */}
          {(!reportType || reportType === 'expenses') && (
            <Accordion type="single" collapsible defaultValue="expenses" className="w-full">
              <AccordionItem value="expenses" className="border rounded-lg bg-card shadow-sm">
                <AccordionTrigger className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 hover:no-underline">
                  <div className="flex items-center gap-2 text-left">
                    <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    <span className="text-sm sm:text-base font-semibold">Comparación y Detalle de Gastos</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4">
                  <div className="flex flex-col gap-4 sm:gap-6">
                    {/* Gráfico de comparación */}
                    <div className="w-full">
                      <ComparisonBarChart
                        data1={expensesByCategory}
                        data2={compareExpensesByCategory}
                        label1={`${periodLabel} - Gastos`}
                        label2={`${comparePeriodLabel} - Gastos`}
                      />
                    </div>
                    
                    {/* Tablas de detalle lado a lado */}
                    <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 lg:grid-cols-2">
                      <CategoryTable data={expensesByCategory} title={`${periodLabel}`} />
                      <CategoryTable data={compareExpensesByCategory} title={`${comparePeriodLabel}`} />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {/* Detalles de Ingresos con gráfico y tablas */}
          {(!reportType || reportType === 'incomes') && (
            <Accordion type="single" collapsible defaultValue="incomes" className="w-full">
              <AccordionItem value="incomes" className="border rounded-lg bg-card shadow-sm">
                <AccordionTrigger className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 hover:no-underline">
                  <div className="flex items-center gap-2 text-left">
                    <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    <span className="text-sm sm:text-base font-semibold">Comparación y Detalle de Ingresos</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4">
                  <div className="flex flex-col gap-4 sm:gap-6">
                    {/* Gráfico de comparación */}
                    <div className="w-full">
                      <ComparisonBarChart
                        data1={incomesByType.map(item => ({ category: item.type, total: item.total, color: item.color, icon: item.icon }))}
                        data2={compareIncomesByType.map(item => ({ category: item.type, total: item.total, color: item.color, icon: item.icon }))}
                        label1={`${periodLabel} - Ingresos`}
                        label2={`${comparePeriodLabel} - Ingresos`}
                      />
                    </div>
                    
                    {/* Tablas de detalle lado a lado */}
                    <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 lg:grid-cols-2">
                      <IncomeTable data={incomesByType} title={`${periodLabel}`} />
                      <IncomeTable data={compareIncomesByType} title={`${comparePeriodLabel}`} />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:gap-4 lg:gap-6">
          {/* Gráficas de torta */}
          <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-2 lg:grid-cols-2">
            {(!reportType || reportType === 'expenses') && (
              <CategoryPieChart data={expensesByCategory} title={`Gastos - ${periodLabel}`} />
            )}
            {(!reportType || reportType === 'incomes') && (
              <CategoryPieChart data={incomesByType.map(item => ({ category: item.type, total: item.total, color: item.color, icon: item.icon }))} title={`Ingresos - ${periodLabel}`} />
            )}
          </div>
          
          {/* Detalles en acordeones */}
          <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 lg:grid-cols-2">
            {(!reportType || reportType === 'expenses') && (
              <Accordion type="single" collapsible defaultValue="expenses" className="w-full">
                <AccordionItem value="expenses" className="border rounded-lg bg-card shadow-sm">
                  <AccordionTrigger className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 hover:no-underline">
                    <div className="flex items-center gap-2 text-left">
                      <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      <span className="text-sm sm:text-base font-semibold">Detalle de Gastos por Categoría</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4">
                    <CategoryTable data={expensesByCategory} title="" />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            {(!reportType || reportType === 'incomes') && (
              <Accordion type="single" collapsible defaultValue="incomes" className="w-full">
                <AccordionItem value="incomes" className="border rounded-lg bg-card shadow-sm">
                  <AccordionTrigger className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 hover:no-underline">
                    <div className="flex items-center gap-2 text-left">
                      <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      <span className="text-sm sm:text-base font-semibold">Detalle de Ingresos por Tipo</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4">
                    <IncomeTable data={incomesByType} title="" />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </div>
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
    </div>
  )
}
