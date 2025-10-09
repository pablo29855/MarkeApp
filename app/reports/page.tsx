import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ReportFilters } from "@/components/reports/report-filters"
import { CategoryPieChart } from "@/components/reports/category-pie-chart"
import { ComparisonBarChart } from "@/components/reports/comparison-bar-chart"
import { CategoryTable } from "@/components/reports/category-table"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { formatCurrency } from "@/lib/utils"
import type { ExpensesByCategory } from "@/lib/types"

async function getExpensesByCategory(userId: string, month: number, year: number): Promise<ExpensesByCategory[]> {
  const supabase = await createClient()

  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)

  const { data: expenses } = await supabase
    .from("expenses")
    .select("amount, category:categories(name, color, icon)")
    .eq("user_id", userId)
    .gte("purchase_date", startDate.toISOString().split("T")[0])
    .lte("purchase_date", endDate.toISOString().split("T")[0])

  const categoryMap = new Map<string, ExpensesByCategory>()
  expenses?.forEach((exp: any) => {
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

  return Array.from(categoryMap.values()).sort((a, b) => b.total - a.total)
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string; compareMonth?: string; compareYear?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const currentDate = new Date()
  const month = searchParams.month ? Number.parseInt(searchParams.month) : currentDate.getMonth() + 1
  const year = searchParams.year ? Number.parseInt(searchParams.year) : currentDate.getFullYear()

  const expensesByCategory = await getExpensesByCategory(user.id, month, year)
  const totalExpenses = expensesByCategory.reduce((sum, item) => sum + item.total, 0)

  let compareExpensesByCategory: ExpensesByCategory[] = []
  let compareTotalExpenses = 0
  let isComparing = false

  if (searchParams.compareMonth && searchParams.compareYear) {
    isComparing = true
    const compareMonth = Number.parseInt(searchParams.compareMonth)
    const compareYear = Number.parseInt(searchParams.compareYear)
    compareExpensesByCategory = await getExpensesByCategory(user.id, compareMonth, compareYear)
    compareTotalExpenses = compareExpensesByCategory.reduce((sum, item) => sum + item.total, 0)
  }

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ]

  const periodLabel = `${monthNames[month - 1]} ${year}`
  const comparePeriodLabel =
    searchParams.compareMonth && searchParams.compareYear
      ? `${monthNames[Number.parseInt(searchParams.compareMonth) - 1]} ${searchParams.compareYear}`
      : ""

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <PageHeader
        title="Reportes"
        description="Analiza tus gastos y compara períodos"
        showBackButton
        backHref="/dashboard"
      />

      {/* Filters */}
      <ReportFilters />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 shadow-lg">
          <CardContent className="p-6">
            <p className="text-sm opacity-90">Total de Gastos</p>
            <p className="text-3xl font-bold mt-1">{formatCurrency(totalExpenses)}</p>
            <p className="text-sm opacity-90 mt-2">{periodLabel}</p>
          </CardContent>
        </Card>

        {isComparing && (
          <Card className="bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground border-0 shadow-lg">
            <CardContent className="p-6">
              <p className="text-sm opacity-90">Total de Gastos</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(compareTotalExpenses)}</p>
              <p className="text-sm opacity-90 mt-2">{comparePeriodLabel}</p>
              <p className="text-sm mt-2">
                Diferencia:{" "}
                <span
                  className={
                    totalExpenses > compareTotalExpenses
                      ? "text-red-600 dark:text-red-400"
                      : "text-green-600 dark:text-green-400"
                  }
                >
                  {totalExpenses > compareTotalExpenses ? "+" : ""}
                  {formatCurrency(totalExpenses - compareTotalExpenses)}
                </span>
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts */}
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
