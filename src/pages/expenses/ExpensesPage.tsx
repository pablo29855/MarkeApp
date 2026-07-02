import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ExpenseFormWrapperUnified } from '@/components/expenses/expense-form-wrapper-unified'
import { LoadingCheckOverlay } from '@/components/ui/loading-check'
import { SkeletonGrid } from '@/components/ui/skeleton-card'
import { formatCurrency, parseLocalDate } from '@/lib/utils'
import type { Expense, Category } from '@/lib/types'
import { ExpenseListWrapper } from '@/components/expenses/expense-list-wrapper'
import { ExportButton } from '@/components/expenses/export-button'
import { FiltersSection } from '@/components/ui/filters-section'
import { useCountUp } from '@/hooks/use-count-up'
import { useRealtimeRefresh } from '@/hooks/use-realtime-refresh'
import { CategoryGlyph } from '@/lib/category-visuals'

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

  // Refresco automático: realtime + evento global data-changed + volver de background
  useRealtimeRefresh('expenses-changes', ['expenses'], userId || undefined, handleRefresh)

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
      icon: <CategoryGlyph name={category.name} className="h-4 w-4 text-primary" />,
    }))
  ]

  const totalAmount = getTotalExpense()
  const animatedTotal = useCountUp(totalAmount)

  if (loading) {
    return <LoadingCheckOverlay message="Cargando gastos..." />
  }
  return (
    <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6 pb-20">
      {/* Header Gastos Style */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-[26px] font-black tracking-tight text-foreground">Gastos</h1>
          <p className="text-[15px] font-extrabold text-muted-foreground">Gestiona y controla</p>
        </div>
        <div className="flex gap-2 items-center">
          <ExportButton expenses={filteredExpenses} />
          <div className="hidden lg:block">
            <ExpenseFormWrapperUnified categories={categories} userId={userId} onSuccess={handleRefresh} />
          </div>
        </div>
      </div>

      {/* Card de Total — Pop Azul Exacto */}
      <div className="fade-up relative overflow-hidden rounded-[26px] bg-[#3a61ff] p-5 sm:p-6 text-white shadow-hero">
        <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[#5b7fff] opacity-60" />
        <div className="relative flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-[15px] font-extrabold text-white/80">
              Total de gastos · {months.find(m => m.value === selectedMonth)?.label?.toLowerCase() || 'este mes'}
            </p>
            <span className="block truncate text-[34px] font-black leading-tight mb-1">{formatCurrency(animatedTotal)}</span>
            <p className="text-[15px] font-extrabold text-white/80">
              {filteredExpenses.length} registro{filteredExpenses.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

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
