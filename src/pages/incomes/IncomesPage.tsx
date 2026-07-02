import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { IncomeFormWrapper } from '@/components/incomes/income-form-wrapper'
import { ExportIncomesButton } from '@/components/incomes/export-incomes-button'
import { IncomeList } from '@/components/incomes/income-list'
import { SkeletonGrid } from '@/components/ui/skeleton-card'
import { LoadingCheckOverlay } from '@/components/ui/loading-check'
import { FiltersSection } from '@/components/ui/filters-section'
import { formatCurrency, parseLocalDate } from '@/lib/utils'
import { Briefcase, Landmark, Banknote } from 'lucide-react'
import { useCountUp } from '@/hooks/use-count-up'
import { useRealtimeRefresh } from '@/hooks/use-realtime-refresh'
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

  // Refresco automático: realtime + evento global data-changed + volver de background
  useRealtimeRefresh('incomes-changes', ['incomes'], userId || undefined, handleRefresh)

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
    { value: 'nomina', label: 'Nómina', icon: <Briefcase className="h-4 w-4" /> },
    { value: 'transferencia', label: 'Transferencia', icon: <Landmark className="h-4 w-4" /> },
    { value: 'efectivo', label: 'Efectivo', icon: <Banknote className="h-4 w-4" /> },
  ]

  const totalIncome = getTotalIncome()
  const animatedTotal = useCountUp(totalIncome)

  if (loading) {
    return <LoadingCheckOverlay message="Cargando ingresos..." />
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6 pb-20">
      {/* Header Gastos Style */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <h1 className="text-[26px] font-black tracking-tight text-foreground">Ingresos</h1>
            <p className="text-[15px] font-extrabold text-muted-foreground">Tus entradas del mes</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <ExportIncomesButton incomes={filteredIncomes} />
          <div className="hidden lg:block">
            <IncomeFormWrapper onSuccess={handleRefresh} />
          </div>
        </div>
      </div>

      {/* Card de Total — Pop Azul Exacto */}
      <div className="fade-up relative overflow-hidden rounded-[26px] bg-[#3a61ff] p-5 sm:p-6 text-white shadow-hero">
        <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[#5b7fff] opacity-60" />
        <div className="relative flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-[15px] font-extrabold text-white/80">
              Total de ingresos · {months.find(m => m.value === selectedMonth)?.label?.toLowerCase() || 'este mes'}
            </p>
            <span className="block truncate text-[34px] font-black leading-tight mb-1">{formatCurrency(animatedTotal)}</span>
            <p className="text-[15px] font-extrabold text-white/80">
              {filteredIncomes.length} registro{filteredIncomes.length !== 1 ? 's' : ''}
            </p>
          </div>
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
        <>
          <IncomeList incomes={filteredIncomes} onUpdate={handleRefresh} />
          
          {/* Ingresos por tipo */}
          {filteredIncomes.length > 0 && (
            <div className="rounded-[24px] bg-card p-5 shadow-sm mt-4">
              <h3 className="text-[15px] font-black text-foreground mb-4">Ingresos por tipo</h3>
              <div className="space-y-4">
                {Object.entries(
                  filteredIncomes.reduce((acc, income) => {
                    const type = income.income_type
                    acc[type] = (acc[type] || 0) + Number(income.amount)
                    return acc
                  }, {} as Record<string, number>)
                ).map(([type, amount]) => {
                  const percentage = Math.round((amount / totalIncome) * 100)
                  const filterOption = filterOptions.find(opt => opt.value === type)
                  
                  return (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 font-bold text-foreground">
                          <div className="text-muted-foreground">
                            {filterOption?.icon}
                          </div>
                          <span>{filterOption?.label || type}</span>
                        </div>
                        <span className="font-bold text-foreground">{percentage}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div 
                          className="h-full rounded-full bg-primary" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
