"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, Calendar, BarChart3, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const months = [
  { value: "1", label: "Enero" },
  { value: "2", label: "Febrero" },
  { value: "3", label: "Marzo" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Mayo" },
  { value: "6", label: "Junio" },
  { value: "7", label: "Julio" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
]

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

export function ReportFilters() {
  const navigate = useNavigate()
  const currentMonth = new Date().getMonth() + 1
  const [month, setMonth] = useState(currentMonth.toString())
  const [year, setYear] = useState(currentYear.toString())
  const [compareMonth, setCompareMonth] = useState("")
  const [compareYear, setCompareYear] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const applyFilters = () => {
    const params = new URLSearchParams()
    params.set("month", month)
    params.set("year", year)
    if (compareMonth && compareYear) {
      params.set("compareMonth", compareMonth)
      params.set("compareYear", compareYear)
    }
    navigate(`/reports?${params.toString()}`)
    setIsOpen(false) // Cerrar los filtros después de aplicar
  }

  const clearComparison = () => {
    setCompareMonth("")
    setCompareYear("")
  }

  const selectedMonthLabel = months.find(m => m.value === month)?.label
  const selectedCompareMonthLabel = compareMonth ? months.find(m => m.value === compareMonth)?.label : null

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-lg bg-gradient-to-br from-card to-card/80 shadow-sm overflow-hidden">
      <CollapsibleTrigger className="w-full group">
        <div className="flex items-center justify-between p-3 sm:p-4 hover:bg-muted/50 transition-all duration-200">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <BarChart3 className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-primary" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-semibold truncate">Filtros de Reporte</h3>
              {!isOpen && (
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                  {selectedMonthLabel} {year}
                  {selectedCompareMonthLabel && ` vs ${selectedCompareMonthLabel} ${compareYear}`}
                </p>
              )}
            </div>
          </div>
          <ChevronDown 
            className={`h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-3 sm:p-4 pt-0 space-y-3 sm:space-y-4 border-t bg-muted/20">
          {/* Período Principal */}
          <div className="space-y-2 sm:space-y-3 pt-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              <Label className="text-xs sm:text-sm font-semibold">Período Principal</Label>
            </div>
            <div className="grid gap-2 sm:gap-3 grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[10px] sm:text-xs text-muted-foreground">Mes</Label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] sm:text-xs text-muted-foreground">Año</Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Comparación */}
          <div className="space-y-2 sm:space-y-3 pt-3 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                <Label className="text-xs sm:text-sm font-semibold">Comparar con</Label>
                <Badge variant="secondary" className="text-[9px] sm:text-[10px] px-1.5 py-0">
                  Opcional
                </Badge>
              </div>
              {(compareMonth || compareYear) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearComparison}
                  className="h-6 px-2 text-[10px] sm:text-xs hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpiar
                </Button>
              )}
            </div>
            <div className="grid gap-2 sm:gap-3 grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[10px] sm:text-xs text-muted-foreground">Mes</Label>
                <Select value={compareMonth} onValueChange={setCompareMonth}>
                  <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm bg-background">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] sm:text-xs text-muted-foreground">Año</Label>
                <Select value={compareYear} onValueChange={setCompareYear}>
                  <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm bg-background">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Button 
            onClick={applyFilters} 
            className="w-full h-9 sm:h-10 text-xs sm:text-sm font-semibold shadow-sm"
          >
            <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
            Generar Reporte
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
