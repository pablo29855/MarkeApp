import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ExpenseFormWrapperUnified } from '@/components/expenses/expense-form-wrapper-unified'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingCheckOverlay } from '@/components/ui/loading-check'
import { SkeletonGrid } from '@/components/ui/skeleton-card'
import { formatCurrency, parseLocalDate } from '@/lib/utils'
import type { Expense, Category } from '@/lib/types'
import { ExpenseListWrapper } from '@/components/expenses/expense-list-wrapper'
import { ExportButton } from '@/components/expenses/export-button'
import { FiltersSection } from '@/components/ui/filters-section'
import { Receipt } from 'lucide-react'

export default function ExpensesPage() {
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [userId, setUserId] = useState<string>('')
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  const fetchExpenses = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from('expenses')
        .select('*, category:categories(*)')
        .eq('user_id', user.id)
        .order('purchase_date', { ascending: false })

      if (error) throw error

      setExpenses((data || []) as Expense[])
    } catch (error) {
      console.error('[Expenses] Error fetching expenses:', error)
    }
  }, [])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await fetchExpenses()
    setTimeout(() => setIsRefreshing(false), 300)
  }, [fetchExpenses])

  useEffect(() => {
    async function fetchInitialData() {
      try {
        setLoading(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return

        setUserId(user.id)

        const currentDate = new Date()
        setSelectedMonth((currentDate.getMonth() + 1).toString())
        setSelectedYear(currentDate.getFullYear().toString())

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

  useEffect(() => {
    applyFilters()
  }, [expenses, searchTerm, selectedCategory, selectedMonth, selectedYear])

  const applyFilters = () => {
    let filtered = [...expenses]

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(expense =>
        expense.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(expense => expense.category_id === selectedCategory)
    }

    // Filtro por mes y año
    if (selectedMonth && selectedYear) {
      filtered = filtered.filter(expense => {
        const expenseDate = parseLocalDate(expense.purchase_date)
        return (
          expenseDate.getMonth() + 1 === Number.parseInt(selectedMonth) &&
          expenseDate.getFullYear() === Number.parseInt(selectedYear)
        )
      })
    }

    setFilteredExpenses(filtered)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('all')
    const currentDate = new Date()
    setSelectedMonth((currentDate.getMonth() + 1).toString())
    setSelectedYear(currentDate.getFullYear().toString())
  }

  const getTotalExpense = () => {
    return filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
  }

  const months = [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ]

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString())

  const filterOptions = [
    { id: 'all', name: 'Todas las categorías', icon: '' },
    ...categories.map((category) => ({
      id: category.id,
      name: category.name,
      icon: category.icon,
    }))
  ]

  if (loading) {
    return <LoadingCheckOverlay message="Cargando gastos..." />
  }

  const totalAmount = getTotalExpense()

  return (
    <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Header fijo profesional - Sticky en mobile y desktop */}
      <div className="sticky top-16 lg:top-0 z-10 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 border-b border-border/50 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">Gastos</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Gestiona y controla tus gastos</p>
          </div>
          <div className="flex gap-2 self-end sm:self-auto">
            <ExportButton expenses={filteredExpenses} />
            <ExpenseFormWrapperUnified categories={categories} userId={userId} onSuccess={handleRefresh} />
          </div>
        </div>
      </div>

      {/* Card de Total - Compacto en móvil */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 shadow-lg overflow-hidden">
        <CardContent className="p-4 sm:p-5 lg:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-base lg:text-lg opacity-90 mb-1 sm:mb-2">Total de Gastos</p>
              <div className="flex items-baseline gap-1 sm:gap-2">
                <span className="text-3xl sm:text-4xl lg:text-6xl font-bold truncate">{formatCurrency(totalAmount)}</span>
              </div>
              <p className="text-xs sm:text-sm lg:text-base opacity-90 mt-1 sm:mt-2">{filteredExpenses.length} registro{filteredExpenses.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="ml-2 sm:ml-4 flex-shrink-0">
              <Receipt className="h-12 w-12 sm:h-14 sm:w-14 lg:h-20 lg:w-20 opacity-20" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <FiltersSection
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedFilter={selectedCategory}
        setSelectedFilter={setSelectedCategory}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        isFiltersOpen={isFiltersOpen}
        setIsFiltersOpen={setIsFiltersOpen}
        filterOptions={filterOptions}
        filteredItemsLength={filteredExpenses.length}
        allItemsLength={expenses.length}
        totalAmount={getTotalExpense()}
        clearFilters={clearFilters}
        searchPlaceholder="Buscar por nombre o notas..."
        filterLabel="Categoría"
        filterPlaceholder="Todas"
        totalLabel="gastos"
        totalColor="text-red-600"
        months={months}
        years={years}
      />
      
      {/* Lista de Gastos */}
      {isRefreshing ? (
        <SkeletonGrid count={filteredExpenses.length || 6} />
      ) : (
        <ExpenseListWrapper expenses={filteredExpenses} categories={categories} onUpdate={handleRefresh} />
      )}
    </div>
  )
}
