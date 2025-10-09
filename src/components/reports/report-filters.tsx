"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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

  const applyFilters = () => {
    const params = new URLSearchParams()
    params.set("month", month)
    params.set("year", year)
    if (compareMonth && compareYear) {
      params.set("compareMonth", compareMonth)
      params.set("compareYear", compareYear)
    }
    navigate(`/reports?${params.toString()}`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros de Reporte</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Mes Principal</Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger>
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

          <div className="space-y-2">
            <Label>Año Principal</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger>
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

        <div className="border-t pt-4">
          <Label className="text-sm text-muted-foreground mb-2 block">Comparar con (opcional)</Label>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Mes a Comparar</Label>
              <Select value={compareMonth} onValueChange={setCompareMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar mes" />
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

            <div className="space-y-2">
              <Label>Año a Comparar</Label>
              <Select value={compareYear} onValueChange={setCompareYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar año" />
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

        <Button onClick={applyFilters} className="w-full">
          Generar Reporte
        </Button>
      </CardContent>
    </Card>
  )
}
