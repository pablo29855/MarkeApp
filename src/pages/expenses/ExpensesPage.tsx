import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { createClient } from '@/lib/supabase/client'
import { ExpenseForm } from '@/components/expenses/expense-form'
import { ExpenseFilters } from '@/components/expenses/expense-filters'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingCheckOverlay } from '@/components/ui/loading-check'
import { formatCurrency } from '@/lib/utils'
import type { Expense, Category } from '@/lib/types'
import { ExpenseListWrapper } from '@/components/expenses/expense-list-wrapper'
import { ExportButton } from '@/components/expenses/export-button'
import { Receipt } from 'lucide-react'

export default function ExpensesPage() {
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [userId, setUserId] = useState<string>('')

  const fetchExpenses = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

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

      const { data: expensesData } = await query

      setExpenses((expensesData || []) as Expense[])
    } catch (error) {
      console.error('[Expenses] Error fetching expenses:', error)
    }
  }, [searchParams])

  const handleRefresh = useCallback(() => {
    // Refresh completamente silencioso en segundo plano
    fetchExpenses()
  }, [fetchExpenses])

  useEffect(() => {
    async function fetchInitialData() {
      try {
        setLoading(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return

        setUserId(user.id)

        const [{ data: categoriesData }] = await Promise.all([
          supabase.from('categories').select('*').order('name'),
        ])

        setCategories((categoriesData || []) as Category[])
        
        // Cargar gastos
        await fetchExpenses()
      } catch (error) {
        console.error('[Expenses] Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()
  }, [fetchExpenses])

  // Suscripción en tiempo real para actualizar automáticamente
  useEffect(() => {
    if (!userId) return

    const supabase = createClient()
    
    const channel = supabase
      .channel('expenses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `user_id=eq.${userId}`
        },
        () => {
          handleRefresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, handleRefresh])

  if (loading) {
    return <LoadingCheckOverlay message="Cargando gastos..." />
  }

  const totalAmount = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)

  return (
    <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Header - Más compacto en móvil */}
      <div className="sticky top-16 lg:top-0 z-20 bg-background pb-2 -mt-2 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">Gastos</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Gestiona y controla tus gastos</p>
          </div>
          <div className="flex gap-2 self-end sm:self-auto">
            <ExportButton expenses={expenses} />
            <ExpenseForm categories={categories} userId={userId} onSuccess={handleRefresh} />
          </div>
        </div>
      </div>

      {/* Card de Total - Compacto en móvil */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 shadow-lg overflow-hidden">
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-xs lg:text-sm opacity-90 mb-1">Total de Gastos</p>
              <div className="flex items-baseline gap-1 sm:gap-2">
                <span className="text-2xl sm:text-3xl lg:text-5xl font-bold truncate">{formatCurrency(totalAmount)}</span>
              </div>
              <p className="text-[10px] sm:text-xs lg:text-sm opacity-90 mt-1">{expenses.length} registro{expenses.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="ml-2 sm:ml-4 flex-shrink-0">
              <Receipt className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 opacity-20" />
            </div>
          </div>
        </CardContent>
      </Card>

      <ExpenseFilters categories={categories} />
      <ExpenseListWrapper expenses={expenses} categories={categories} onUpdate={handleRefresh} />
    </div>
  )
}
