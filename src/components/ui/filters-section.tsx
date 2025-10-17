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
import { Card, CardContent } from '@/components/ui/card'
import { Search, X, Filter } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface CategoryOption {
  id: string
  name: string
  icon?: string
}

interface TypeOption {
  value: string
  label: string
}

type FilterOption = CategoryOption | TypeOption

interface FiltersSectionProps {
  searchTerm: string
  setSearchTerm: (value: string) => void
  selectedFilter: string
  setSelectedFilter: (value: string) => void
  selectedMonth: string
  setSelectedMonth: (value: string) => void
  selectedYear: string
  setSelectedYear: (value: string) => void
  isFiltersOpen: boolean
  setIsFiltersOpen: (value: boolean) => void
  filterOptions: FilterOption[]
  filteredItemsLength: number
  allItemsLength: number
  totalAmount: number
  clearFilters: () => void
  searchPlaceholder: string
  filterLabel: string
  filterPlaceholder: string
  totalLabel: string
  totalColor: string
  months: { value: string; label: string }[]
  years: string[]
}

export function FiltersSection({
  searchTerm,
  setSearchTerm,
  selectedFilter,
  setSelectedFilter,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  isFiltersOpen,
  setIsFiltersOpen,
  filterOptions,
  filteredItemsLength,
  allItemsLength,
  totalAmount,
  clearFilters,
  searchPlaceholder,
  filterLabel,
  filterPlaceholder,
  totalLabel,
  totalColor,
  months,
  years,
}: FiltersSectionProps) {
  return (
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
        {(searchTerm || selectedFilter !== 'all') && (
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
          <CardContent className="pt-2 space-y-2">
            {/* Búsqueda */}
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {/* Filtro */}
              <div className="space-y-2">
                <Label htmlFor="filter">{filterLabel}</Label>
                <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                  <SelectTrigger id="filter">
                    <SelectValue placeholder={filterPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.map((option) => (
                      <SelectItem
                        key={'id' in option ? option.id : option.value}
                        value={'id' in option ? option.id : option.value}
                      >
                        {'icon' in option && option.icon ? `${option.icon} ` : ''}
                        {'name' in option ? option.name : option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mes */}
              <div className="space-y-2">
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
              <div className="space-y-2">
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
                Mostrando <span className="font-medium">{filteredItemsLength}</span> de{' '}
                <span className="font-medium">{allItemsLength}</span> {totalLabel} •{' '}
                Total: <span className={`font-bold ${totalColor}`}>{formatCurrency(totalAmount)}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}