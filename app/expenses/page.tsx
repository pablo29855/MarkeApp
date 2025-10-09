import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ExpenseForm } from "@/components/expenses/expense-form"
import { ExpenseFilters } from "@/components/expenses/expense-filters"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import type { Expense, Category } from "@/lib/types"
import { ExpenseListWrapper } from "@/components/expenses/expense-list-wrapper"
import { ExportButton } from "@/components/expenses/export-button"

async function getExpenses(userId: string, searchParams: { category?: string; startDate?: string; endDate?: string }) {
  const supabase = await createClient()

  let query = supabase
    .from("expenses")
    .select("*, category:categories(*)")
    .eq("user_id", userId)
    .order("purchase_date", { ascending: false })

  if (searchParams.category) {
    query = query.eq("category_id", searchParams.category)
  }

  if (searchParams.startDate) {
    query = query.gte("purchase_date", searchParams.startDate)
  }

  if (searchParams.endDate) {
    query = query.lte("purchase_date", searchParams.endDate)
  }

  const { data } = await query

  return (data || []) as Expense[]
}

async function getCategories() {
  const supabase = await createClient()
  const { data } = await supabase.from("categories").select("*").order("name")
  return (data || []) as Category[]
}

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: { category?: string; startDate?: string; endDate?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const [expenses, categories] = await Promise.all([getExpenses(user.id, searchParams), getCategories()])

  const totalAmount = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <PageHeader
        title="Gastos"
        description="Gestiona y controla tus gastos"
        showBackButton
        backHref="/dashboard"
        action={
          <div className="flex gap-2">
            <ExportButton expenses={expenses} />
            <ExpenseForm categories={categories} userId={user.id} />
          </div>
        }
      />

      {/* Summary */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total de Gastos</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(totalAmount)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Cantidad de Gastos</p>
              <p className="text-3xl font-bold mt-1">{expenses.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <ExpenseFilters categories={categories} />

      {/* Expense List */}
      <ExpenseListWrapper expenses={expenses} categories={categories} />
    </div>
  )
}
