import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { IncomeFormWrapper } from '@/components/incomes/income-form-wrapper'
import { ExportIncomesButton } from '@/components/incomes/export-incomes-button'
import { IncomeList } from '@/components/incomes/income-list'
import { SkeletonGrid } from '@/components/ui/skeleton-card'
import { LoadingCheckOverlay } from '@/components/ui/loading-check'
import { FiltersSection } from '@/components/ui/filters-section'
import { formatCurrency, parseLocalDate } from '@/lib/utils'
import { TrendingUp } from 'lucide-react'
import { useCountUp } from '@/hooks/use-count-up'
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

  const totalIncome = getTotalIncome()
  const animatedTotal = useCountUp(totalIncome)

  if (loading) {
    return <LoadingCheckOverlay message="Cargando ingresos..." />
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Ingresos</h1>
          <p className="text-sm text-muted-foreground">Gestiona y registra tus ingresos</p>
        </div>
        <div className="flex gap-2 self-end sm:self-auto">
          <ExportIncomesButton incomes={filteredIncomes} />
          <IncomeFormWrapper onSuccess={handleRefresh} />
        </div>
      </div>

      {/* Card de Total — degradado Pop Azul */}
      <div className="fade-up relative overflow-hidden rounded-[26px] bg-brand-grad p-5 sm:p-6 text-white shadow-hero">
        <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[#6C7BFF]/30" />
        <div className="relative flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-sm font-semibold text-white/80">Total de ingresos</p>
            <span className="block truncate text-[34px] font-black leading-tight">{formatCurrency(animatedTotal)}</span>
            <p className="mt-1 text-xs font-semibold text-white/80">
              {filteredIncomes.length} registro{filteredIncomes.length !== 1 ? 's' : ''}
            </p>
          </div>
          <TrendingUp className="ml-3 h-16 w-16 shrink-0 opacity-20" />
        </div>
      </div>

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
