import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StatsCard } from '@/components/dashboard/stats-card'
import { ExpenseChart } from '@/components/dashboard/expense-chart'
import { RecentExpenses } from '@/components/dashboard/recent-expenses'
import { BalanceCard } from '@/components/dashboard/balance-card'
import { LoadingCheckOverlay } from '@/components/ui/loading-check'
import { formatDateLocal } from '@/lib/utils'
import { TrendingUp, CreditCard, ShoppingCart, Landmark } from 'lucide-react'
import type { Expense, ExpensesByCategory, IncomesByType } from '@/lib/types'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
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

        setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario')

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

  const initials = (userName || 'U')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="mx-auto max-w-7xl space-y-4 lg:space-y-6">
      {/* Saludo + avatar */}
      <header className="flex items-center justify-between pt-1">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">¡Hola de nuevo! 👋</p>
          <h1 className="text-[21px] font-black tracking-tight text-foreground">{userName}</h1>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-grad text-sm font-black text-white shadow-button-pop">
          {initials}
        </div>
      </header>

      {/* Hero balance + tiles */}
      <div className="grid gap-4 lg:grid-cols-3">
        <BalanceCard
          className="lg:col-span-2"
          totalIncome={dashboardData.totalIncome}
          totalExpenses={dashboardData.totalExpenses}
          totalDebts={dashboardData.totalDebts}
        />
        <div className="grid grid-cols-2 gap-3 lg:col-span-1">
          <StatsCard
            title="Ingresos"
            numericValue={dashboardData.totalIncome}
            icon={TrendingUp}
            accent="blue"
            description="Este mes"
            style={{ animationDelay: '60ms' }}
          />
          <StatsCard
            title="Gastos"
            numericValue={dashboardData.totalExpenses}
            icon={CreditCard}
            accent="coral"
            description="Este mes"
            style={{ animationDelay: '120ms' }}
          />
          <StatsCard
            title="Compras"
            numericValue={dashboardData.shoppingCount}
            plain
            icon={ShoppingCart}
            accent="amber"
            description="Pendientes"
            style={{ animationDelay: '180ms' }}
          />
          <StatsCard
            title="Deudas"
            numericValue={dashboardData.totalDebts}
            icon={Landmark}
            accent="violet"
            description="Por pagar"
            style={{ animationDelay: '240ms' }}
          />
        </div>
      </div>

      {/* Categorías + movimientos */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ExpenseChart
          className="lg:col-span-2"
          data={dashboardData.expensesByCategoryData}
          style={{ animationDelay: '120ms' }}
        />
        <RecentExpenses
          expenses={dashboardData.recentExpenses}
          style={{ animationDelay: '180ms' }}
        />
      </div>
    </div>
  )
}
