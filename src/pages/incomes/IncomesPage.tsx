import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { IncomeFormWrapper } from '@/components/incomes/income-form-wrapper'
import { IncomeList } from '@/components/incomes/income-list'
import { SkeletonIncome } from '@/components/ui/skeleton-income'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, X, TrendingUp, Filter } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Income } from '@/lib/types'

export default function IncomesPage() {
  const [loading, setLoading] = useState(true)
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

  const handleRefresh = useCallback(() => {
    // Refresh completamente silencioso en segundo plano
    fetchIncomes()
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
        const incomeDate = new Date(income.income_date)
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

  return (
    <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 lg:space-y-6" style={{ position: 'relative', isolation: 'isolate' }}>
      {/* Header - Más compacto en móvil */}
      <div className="sticky top-16 lg:top-0 z-20 bg-background pb-2 -mt-2 pt-2" style={{ transform: 'translateZ(0)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">Ingresos</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Gestiona y registra tus ingresos</p>
          </div>
          <div className="flex gap-2 self-end sm:self-auto">
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
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsFiltersOpen(!isFiltersOpen)} 
            className="text-sm sm:text-base"
          >
            <Filter className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Filtros
          </Button>
          {(searchTerm || selectedType !== 'all') && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters} 
              className="text-sm sm:text-base"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Limpiar
            </Button>
          )}
        </div>

        {isFiltersOpen && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              {/* Búsqueda */}
              <div>
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Buscar por descripción o notas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {/* Tipo */}
                <div>
                  <Label htmlFor="type">Tipo de Ingreso</Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="nomina">💼 Nómina</SelectItem>
                      <SelectItem value="transferencia">🏦 Transferencia</SelectItem>
                      <SelectItem value="efectivo">💵 Efectivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Mes */}
                <div>
                  <Label htmlFor="month">Mes</Label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger id="month">
                      <SelectValue placeholder="Seleccionar mes" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Año */}
                <div>
                  <Label htmlFor="year">Año</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger id="year">
                      <SelectValue placeholder="Seleccionar año" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  Mostrando <span className="font-medium">{filteredIncomes.length}</span> de{' '}
                  <span className="font-medium">{incomes.length}</span> ingresos •{' '}
                  Total: <span className="font-bold text-blue-600">{formatCurrency(getTotalIncome())}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Lista de Ingresos */}
      {loading ? (
        <SkeletonIncome />
      ) : (
        <IncomeList incomes={filteredIncomes} onUpdate={handleRefresh} />
      )}
    </div>
  )
}
