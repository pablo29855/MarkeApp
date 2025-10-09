import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StatsCard } from '@/components/dashboard/stats-card'
import { ExpenseChart } from '@/components/dashboard/expense-chart'
import { RecentExpenses } from '@/components/dashboard/recent-expenses'
import { LoadingCheckOverlay } from '@/components/ui/loading-check'
import { formatCurrency } from '@/lib/utils'
import { DollarSign, TrendingUp, ShoppingCart, CreditCard } from 'lucide-react'
import type { Expense, ExpensesByCategory } from '@/lib/types'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState({
    totalExpenses: 0,
    expensesByCategoryData: [] as ExpensesByCategory[],
    recentExpenses: [] as Expense[],
    shoppingCount: 0,
    totalDebts: 0,
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
          .gte('purchase_date', firstDayOfMonth.toISOString().split('T')[0])
          .lte('purchase_date', lastDayOfMonth.toISOString().split('T')[0])

        const { data: expensesByCategory } = await supabase
          .from('expenses')
          .select('amount, category:categories(name, color, icon)')
          .eq('user_id', user.id)
          .gte('purchase_date', firstDayOfMonth.toISOString().split('T')[0])
          .lte('purchase_date', lastDayOfMonth.toISOString().split('T')[0])

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

        const totalExpenses = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0

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

        const expensesByCategoryData = Array.from(categoryMap.values())
        const totalDebts = debts?.reduce((sum, debt) => sum + Number(debt.total_amount) - Number(debt.paid_amount), 0) || 0

        setDashboardData({
          totalExpenses,
          expensesByCategoryData,
          recentExpenses: (recentExpenses || []) as Expense[],
          shoppingCount: shoppingCount || 0,
          totalDebts,
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-balance">Dashboard</h1>
        <p className="text-muted-foreground text-pretty">Resumen de tus finanzas personales</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Gastos del Mes"
          value={formatCurrency(dashboardData.totalExpenses)}
          icon={DollarSign}
          description="Total gastado este mes"
        />
        <StatsCard
          title="Categorías Activas"
          value={dashboardData.expensesByCategoryData.length.toString()}
          icon={TrendingUp}
          description="Categorías con gastos"
        />
        <StatsCard
          title="Lista de Mercado"
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

      <div className="grid gap-4 lg:grid-cols-3">
        <ExpenseChart data={dashboardData.expensesByCategoryData} />
        <RecentExpenses expenses={dashboardData.recentExpenses} />
      </div>
    </div>
  )
}
