import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { IncomeFormWrapper } from '@/components/incomes/income-form-wrapper'
import { ExportIncomesButton } from '@/components/incomes/export-incomes-button'
import { IncomeList } from '@/components/incomes/income-list'
import { SkeletonGrid } from '@/components/ui/skeleton-card'
import { LoadingCheckOverlay } from '@/components/ui/loading-check'
import { Card, CardContent } from '@/components/ui/card'
import { FiltersSection } from '@/components/ui/filters-section'
import { formatCurrency, parseLocalDate } from '@/lib/utils'
import { TrendingUp } from 'lucide-react'
import type { Income } from '@/lib/types'

export default function IncomesPage() {
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [incomes, setIncomes] = useState<Income[]>([])
  const [filteredIncomes, setFilteredIncomes] = useState<Income[]>([])
  const [userId, setUserId] = useState<string>('')
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  const fetchIncomes = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from('incomes')
        .select('*')
        .eq('user_id', user.id)
        .order('income_date', { ascending: false })

      if (error) throw error

      setIncomes((data || []) as Income[])
    } catch (error) {
      console.error('[Incomes] Error fetching incomes:', error)
    }
  }, [])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await fetchIncomes()
    setTimeout(() => setIsRefreshing(false), 300)
  }, [fetchIncomes])

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

        // Cargar ingresos
        await fetchIncomes()
      } catch (error) {
        console.error('[Incomes] Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()
  }, [fetchIncomes])

  // Suscripción en tiempo real para actualizar automáticamente
  useEffect(() => {
    if (!userId) return

    const supabase = createClient()
    
    const channel = supabase
      .channel('incomes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incomes',
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
  }, [incomes, searchTerm, selectedType, selectedMonth, selectedYear])

  const applyFilters = () => {
    let filtered = [...incomes]

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(income =>
        income.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        income.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por tipo
    if (selectedType !== 'all') {
      filtered = filtered.filter(income => income.income_type === selectedType)
    }

    // Filtro por mes y año
    if (selectedMonth && selectedYear) {
      filtered = filtered.filter(income => {
        const incomeDate = parseLocalDate(income.income_date)
        return (
          incomeDate.getMonth() + 1 === Number.parseInt(selectedMonth) &&
          incomeDate.getFullYear() === Number.parseInt(selectedYear)
        )
      })
    }

    setFilteredIncomes(filtered)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedType('all')
    const currentDate = new Date()
    setSelectedMonth((currentDate.getMonth() + 1).toString())
    setSelectedYear(currentDate.getFullYear().toString())
  }

  const getTotalIncome = () => {
    return filteredIncomes.reduce((sum, income) => sum + Number(income.amount), 0)
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
    { value: 'all', label: 'Todos los tipos' },
    { value: 'nomina', label: '💼 Nómina' },
    { value: 'transferencia', label: '🏦 Transferencia' },
    { value: 'efectivo', label: '💵 Efectivo' },
  ]

  if (loading) {
    return <LoadingCheckOverlay message="Cargando ingresos..." />
  }

  return (
    <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Header fijo profesional - Sticky en mobile y desktop */}
      <div className="sticky top-16 lg:top-0 z-10 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 border-b border-border/50 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">Ingresos</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">Gestiona y registra tus ingresos</p>
          </div>
          <div className="flex gap-2 self-end sm:self-auto">
            <ExportIncomesButton incomes={filteredIncomes} />
            <IncomeFormWrapper onSuccess={handleRefresh} />
          </div>
        </div>
      </div>

      {/* Card de Total - Compacto en móvil */}
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg overflow-hidden">
        <CardContent className="p-4 sm:p-5 lg:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-base lg:text-lg opacity-90 mb-1 sm:mb-2">Total de Ingresos</p>
              <div className="flex items-baseline gap-1 sm:gap-2">
                <span className="text-3xl sm:text-4xl lg:text-6xl font-bold truncate">{formatCurrency(getTotalIncome())}</span>
              </div>
              <p className="text-xs sm:text-sm lg:text-base opacity-90 mt-1 sm:mt-2">{filteredIncomes.length} registro{filteredIncomes.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="ml-2 sm:ml-4 flex-shrink-0">
              <TrendingUp className="h-10 w-10 sm:h-16 sm:w-16 lg:h-20 lg:w-20 opacity-20" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <FiltersSection
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedFilter={selectedType}
        setSelectedFilter={setSelectedType}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        isFiltersOpen={isFiltersOpen}
        setIsFiltersOpen={setIsFiltersOpen}
        filterOptions={filterOptions}
        filteredItemsLength={filteredIncomes.length}
        allItemsLength={incomes.length}
        totalAmount={getTotalIncome()}
        clearFilters={clearFilters}
        searchPlaceholder="Buscar por descripción o notas..."
        filterLabel="Tipo de Ingreso"
        filterPlaceholder="Todos los tipos"
        totalLabel="ingresos"
        totalColor="text-blue-600"
        months={months}
        years={years}
      />

      {/* Lista de Ingresos */}
      {isRefreshing ? (
        <SkeletonGrid count={filteredIncomes.length || 6} />
      ) : (
        <IncomeList incomes={filteredIncomes} onUpdate={handleRefresh} />
      )}
    </div>
  )
}
