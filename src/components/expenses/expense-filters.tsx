import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { DateInput } from "@/components/ui/date-input"
import { Filter, X } from "lucide-react"
import type { Category } from "@/lib/types"

interface ExpenseFiltersProps {
  categories: Category[]
}

export function ExpenseFilters({ categories }: ExpenseFiltersProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)

  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "all",
    startDate: searchParams.get("startDate") || "",
    endDate: searchParams.get("endDate") || "",
  })

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (filters.category !== "all") params.set("category", filters.category)
    if (filters.startDate) params.set("startDate", filters.startDate)
    if (filters.endDate) params.set("endDate", filters.endDate)

    navigate(`/expenses?${params.toString()}`)
  }

  const clearFilters = () => {
    setFilters({ category: "all", startDate: "", endDate: "" })
    navigate("/expenses")
  }

  const hasActiveFilters = filters.category !== "all" || filters.startDate || filters.endDate

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="text-sm sm:text-base">
          <Filter className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
          Filtros
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-sm sm:text-base">
            <X className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Limpiar filtros
          </Button>
        )}
      </div>

      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm sm:text-base">Categoría</Label>
                <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-sm sm:text-base">Todas las categorías</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id} className="text-sm sm:text-base">
                        {category.icon} {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-sm sm:text-base">Fecha Inicio</Label>
                <DateInput
                  id="startDate"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="text-sm sm:text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-sm sm:text-base">Fecha Fin</Label>
                <DateInput
                  id="endDate"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={applyFilters} className="flex-1 text-sm sm:text-base">
                Aplicar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
