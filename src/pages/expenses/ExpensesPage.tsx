import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { createClient } from '@/lib/supabase/client'
import { ExpenseForm } from '@/components/expenses/expense-form'
import { ExpenseFilters } from '@/components/expenses/expense-filters'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { Expense, Category } from '@/lib/types'
import { ExpenseListWrapper } from '@/components/expenses/expense-list-wrapper'
import { ExportButton } from '@/components/expenses/export-button'

export default function ExpensesPage() {
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return

        setUserId(user.id)

        let query = supabase
          .from('expenses')
          .select('*, category:categories(*)')
          .eq('user_id', user.id)
          .order('purchase_date', { ascending: false })

        const category = searchParams.get('category')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        if (category) {
          query = query.eq('category_id', category)
        }
        if (startDate) {
          query = query.gte('purchase_date', startDate)
        }
        if (endDate) {
          query = query.lte('purchase_date', endDate)
        }

        const [{ data: expensesData }, { data: categoriesData }] = await Promise.all([
          query,
          supabase.from('categories').select('*').order('name'),
        ])

        setExpenses((expensesData || []) as Expense[])
        setCategories((categoriesData || []) as Category[])
      } catch (error) {
        console.error('[Expenses] Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [searchParams])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Cargando...</div>
      </div>
    )
  }

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
            <ExpenseForm categories={categories} userId={userId} />
          </div>
        }
      />

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

      <ExpenseFilters categories={categories} />
      <ExpenseListWrapper expenses={expenses} categories={categories} />
    </div>
  )
}
