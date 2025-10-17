import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StatsCard } from '@/components/dashboard/stats-card'
import { ExpenseChart } from '@/components/dashboard/expense-chart'
import { RecentExpenses } from '@/components/dashboard/recent-expenses'
import { BalanceCard } from '@/components/dashboard/balance-card'
import { IncomeChart } from '@/components/dashboard/income-chart'
import { LoadingCheckOverlay } from '@/components/ui/loading-check'
import { formatCurrency, formatDateLocal } from '@/lib/utils'
import { DollarSign, TrendingUp, ShoppingCart, CreditCard } from 'lucide-react'
import type { Expense, ExpensesByCategory, IncomesByType } from '@/lib/types'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState({
    totalExpenses: 0,
    totalIncome: 0,
    expensesByCategoryData: [] as ExpensesByCategory[],
    incomesByTypeData: [] as IncomesByType[],
    recentExpenses: [] as Expense[],
    shoppingCount: 0,
    totalDebts: 0,
    balance: 0,
  })

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return

        const currentDate = new Date()
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

        const { data: expenses } = await supabase
          .from('expenses')
          .select('*, category:categories(*)')
          .eq('user_id', user.id)
          .gte('purchase_date', formatDateLocal(firstDayOfMonth))
          .lte('purchase_date', formatDateLocal(lastDayOfMonth))

        const { data: expensesByCategory } = await supabase
          .from('expenses')
          .select('amount, category:categories(name, color, icon)')
          .eq('user_id', user.id)
          .gte('purchase_date', formatDateLocal(firstDayOfMonth))
          .lte('purchase_date', formatDateLocal(lastDayOfMonth))

        const { data: recentExpenses } = await supabase
          .from('expenses')
          .select('*, category:categories(*)')
          .eq('user_id', user.id)
          .order('purchase_date', { ascending: false })
          .limit(5)

        const { count: shoppingCount } = await supabase
          .from('shopping_list')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_purchased', false)

        const { data: debts } = await supabase
          .from('debts')
          .select('total_amount, paid_amount')
          .eq('user_id', user.id)

        // Obtener ingresos del mes
        const { data: incomes } = await supabase
          .from('incomes')
          .select('*')
          .eq('user_id', user.id)
          .gte('income_date', formatDateLocal(firstDayOfMonth))
          .lte('income_date', formatDateLocal(lastDayOfMonth))

        const totalExpenses = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0
        const totalIncome = incomes?.reduce((sum, inc) => sum + Number(inc.amount), 0) || 0

        const categoryMap = new Map<string, ExpensesByCategory>()
        expensesByCategory?.forEach((exp: any) => {
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

        // Agrupar ingresos por tipo
        const incomeTypeMap = new Map<string, IncomesByType>()
        incomes?.forEach((inc: any) => {
          const existing = incomeTypeMap.get(inc.income_type)
          if (existing) {
            existing.total += Number(inc.amount)
          } else {
            incomeTypeMap.set(inc.income_type, {
              type: inc.income_type,
              total: Number(inc.amount),
            })
          }
        })

        const expensesByCategoryData = Array.from(categoryMap.values())
        const incomesByTypeData = Array.from(incomeTypeMap.values())
        const totalDebts = debts?.reduce((sum, debt) => sum + Number(debt.total_amount) - Number(debt.paid_amount), 0) || 0
        const balance = totalIncome - totalExpenses - totalDebts

        setDashboardData({
          totalExpenses,
          totalIncome,
          expensesByCategoryData,
          incomesByTypeData,
          recentExpenses: (recentExpenses || []) as Expense[],
          shoppingCount: shoppingCount || 0,
          totalDebts,
          balance,
        })
      } catch (error) {
        console.error('[Dashboard] Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return <LoadingCheckOverlay message="Cargando dashboard..." />
  }

  return (
    <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 lg:space-y-6 pb-4">
      {/* Header fijo profesional - Sticky en mobile y desktop */}
      <div className="sticky top-16 lg:top-0 z-10 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 border-b border-border/50 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-3 sm:py-4">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">Resumen de tus finanzas personales</p>
      </div>

      {/* Stats Cards Grid - Responsivo: 2 col en móvil, 4 en desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        <StatsCard
          title="Ingresos del Mes"
          value={formatCurrency(dashboardData.totalIncome)}
          icon={TrendingUp}
          description="Total de ingresos"
        />
        <StatsCard
          title="Gastos del Mes"
          value={formatCurrency(dashboardData.totalExpenses)}
          icon={DollarSign}
          description="Total gastado este mes"
        />
        <StatsCard
          title="Lista de Compras"
          value={dashboardData.shoppingCount.toString()}
          icon={ShoppingCart}
          description="Items pendientes"
        />
        <StatsCard
          title="Deudas Pendientes"
          value={formatCurrency(dashboardData.totalDebts)}
          icon={CreditCard}
          description="Total por pagar"
        />
      </div>

      {/* Charts Grid - Stack en móvil, lado a lado en desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <ExpenseChart data={dashboardData.expensesByCategoryData} />
        <RecentExpenses expenses={dashboardData.recentExpenses} />
      </div>

      {/* Balance Financiero - Al final */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <BalanceCard 
          totalIncome={dashboardData.totalIncome}
          totalExpenses={dashboardData.totalExpenses}
          totalDebts={dashboardData.totalDebts}
        />
        <IncomeChart 
          data={dashboardData.incomesByTypeData}
          totalIncome={dashboardData.totalIncome}
        />
      </div>
    </div>
  )
}
