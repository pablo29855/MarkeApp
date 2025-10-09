import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { StatsCard } from "@/components/dashboard/stats-card"
import { ExpenseChart } from "@/components/dashboard/expense-chart"
import { RecentExpenses } from "@/components/dashboard/recent-expenses"
import { formatCurrency } from "@/lib/utils"
import { DollarSign, TrendingUp, ShoppingCart, CreditCard } from "lucide-react"
import type { Expense, ExpensesByCategory } from "@/lib/types"

async function getDashboardData(userId: string) {
  try {
    const supabase = await createClient()

    // Get total expenses for current month
    const currentDate = new Date()
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    const { data: expenses } = await supabase
      .from("expenses")
      .select("*, category:categories(*)")
      .eq("user_id", userId)
      .gte("purchase_date", firstDayOfMonth.toISOString().split("T")[0])
      .lte("purchase_date", lastDayOfMonth.toISOString().split("T")[0])

    // Get expenses by category
    const { data: expensesByCategory } = await supabase
      .from("expenses")
      .select("amount, category:categories(name, color, icon)")
      .eq("user_id", userId)
      .gte("purchase_date", firstDayOfMonth.toISOString().split("T")[0])
      .lte("purchase_date", lastDayOfMonth.toISOString().split("T")[0])

    // Get recent expenses
    const { data: recentExpenses } = await supabase
      .from("expenses")
      .select("*, category:categories(*)")
      .eq("user_id", userId)
      .order("purchase_date", { ascending: false })
      .limit(5)

    // Get shopping list count
    const { count: shoppingCount } = await supabase
      .from("shopping_list")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_purchased", false)

    // Get total debts
    const { data: debts } = await supabase.from("debts").select("total_amount, paid_amount").eq("user_id", userId)

    // Calculate totals
    const totalExpenses = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0

    // Group expenses by category
    const categoryMap = new Map<string, ExpensesByCategory>()
    expensesByCategory?.forEach((exp: any) => {
      const categoryName = exp.category?.name || "Sin categoría"
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

    return {
      totalExpenses,
      expensesByCategoryData,
      recentExpenses: (recentExpenses || []) as Expense[],
      shoppingCount: shoppingCount || 0,
      totalDebts,
    }
  } catch (error) {
    console.error("[v0] Dashboard: Error fetching data:", error)
    // Return empty data if there's an error
    return {
      totalExpenses: 0,
      expensesByCategoryData: [],
      recentExpenses: [],
      shoppingCount: 0,
      totalDebts: 0,
    }
  }
}

export default async function DashboardPage() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    console.log("[v0] Dashboard: User check:", { user: user?.id, error: error?.message })

    if (!user || error) {
      redirect("/auth/login")
    }

    const { totalExpenses, expensesByCategoryData, recentExpenses, shoppingCount, totalDebts } = await getDashboardData(
      user.id,
    )

    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-balance">Dashboard</h1>
          <p className="text-muted-foreground text-pretty">Resumen de tus finanzas personales</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Gastos del Mes"
            value={formatCurrency(totalExpenses)}
            icon={DollarSign}
            description="Total gastado este mes"
          />
          <StatsCard
            title="Categorías Activas"
            value={expensesByCategoryData.length.toString()}
            icon={TrendingUp}
            description="Categorías con gastos"
          />
          <StatsCard
            title="Lista de Mercado"
            value={shoppingCount.toString()}
            icon={ShoppingCart}
            description="Items pendientes"
          />
          <StatsCard
            title="Deudas Pendientes"
            value={formatCurrency(totalDebts)}
            icon={CreditCard}
            description="Total por pagar"
          />
        </div>

        {/* Charts and Recent Expenses */}
        <div className="grid gap-4 lg:grid-cols-3">
          <ExpenseChart data={expensesByCategoryData} />
          <RecentExpenses expenses={recentExpenses} />
        </div>
      </div>
    )
  } catch (error) {
    console.error("[v0] Dashboard: Unexpected error:", error)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error de Conexión</h1>
          <p className="mt-2 text-muted-foreground">
            No se pudo conectar con Supabase. Por favor verifica la configuración.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">Revisa los logs de la consola para más detalles.</p>
        </div>
      </div>
    )
  }
}
