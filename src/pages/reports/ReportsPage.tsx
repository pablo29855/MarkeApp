import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { createClient } from '@/lib/supabase/client'
import { ReportFilters } from '@/components/reports/report-filters'
import { CategoryPieChart } from '@/components/reports/category-pie-chart'
import { ComparisonBarChart } from '@/components/reports/comparison-bar-chart'
import { CategoryTable } from '@/components/reports/category-table'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
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

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return

        const currentDate = new Date()
        const month = searchParams.get('month') ? Number.parseInt(searchParams.get('month')!) : currentDate.getMonth() + 1
        const year = searchParams.get('year') ? Number.parseInt(searchParams.get('year')!) : currentDate.getFullYear()

        const data = await getExpensesByCategory(user.id, month, year)
        setExpensesByCategory(data)

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
        } else {
          setIsComparing(false)
          setCompareExpensesByCategory([])
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <PageHeader
        title="Reportes"
        description="Analiza tus gastos y compara períodos"
      />

      <ReportFilters />

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm opacity-90 mb-2">Total de Gastos</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{formatCurrency(totalExpenses)}</span>
                </div>
                <p className="text-sm opacity-90 mt-2">{periodLabel}</p>
              </div>
              <div className="ml-4">
                <BarChart3 className="h-12 w-12 opacity-20" />
              </div>
            </div>
          </CardContent>
        </Card>

        {isComparing && (
          <Card className="bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm opacity-90 mb-2">Total de Gastos</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">{formatCurrency(compareTotalExpenses)}</span>
                  </div>
                  <p className="text-sm opacity-90 mt-2">{comparePeriodLabel}</p>
                  <p className="text-sm mt-2">
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
                <div className="ml-4">
                  <BarChart3 className="h-12 w-12 opacity-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {isComparing ? (
        <div className="space-y-6">
          <ComparisonBarChart
            data1={expensesByCategory}
            data2={compareExpensesByCategory}
            label1={periodLabel}
            label2={comparePeriodLabel}
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <CategoryPieChart data={expensesByCategory} title={`Distribución - ${periodLabel}`} />
            <CategoryPieChart data={compareExpensesByCategory} title={`Distribución - ${comparePeriodLabel}`} />
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <CategoryPieChart data={expensesByCategory} title={`Distribución - ${periodLabel}`} />
          <CategoryTable data={expensesByCategory} title="Detalle por Categoría" />
        </div>
      )}
    </div>
  )
}
