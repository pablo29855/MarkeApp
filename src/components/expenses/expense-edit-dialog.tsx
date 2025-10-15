"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useNotification } from "@/hooks/use-notification"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DateInput } from "@/components/ui/date-input"
import { Loader2, MapPin } from "lucide-react"
import type { Expense, Category } from "@/lib/types"

interface ExpenseEditDialogProps {
  expense: Expense
  categories: Category[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ExpenseEditDialog({ expense, categories, open, onOpenChange, onSuccess }: ExpenseEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { showUpdated, showError } = useNotification()
  const [isGeocoding, setIsGeocoding] = useState(false)

  // Función para formatear el monto con puntos de mil (formato colombiano)
  const formatAmount = (value: string) => {
    // Remover todo excepto números
    const cleanValue = value.replace(/\D/g, '')
    
    // Si está vacío, retornar vacío
    if (!cleanValue) return ''
    
    // Formatear con puntos de mil
    return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  // Función para obtener el valor numérico limpio
  const getNumericValue = (formattedValue: string) => {
    return formattedValue.replace(/\./g, '')
  }

  const [formData, setFormData] = useState({
    name: expense.name,
    amount: formatAmount(expense.amount.toString()),
    category_id: expense.category_id || "",
    purchase_date: expense.purchase_date,
    location: expense.location || "",
    notes: expense.notes || "",
  })

  useEffect(() => {
    setFormData({
      name: expense.name,
      amount: formatAmount(expense.amount.toString()),
      category_id: expense.category_id || "",
      purchase_date: expense.purchase_date,
      location: expense.location || "",
      notes: expense.notes || "",
    })
  }, [expense])

  // Cuando el diálogo se abre, si existe una dirección guardada en `expense.location`
  // intentamos geocodificarla (forward geocoding) para obtener lat/lng y mostrar el mapa.
  useEffect(() => {
    if (!open) return
    const locStr = expense.location
    if (!locStr) {
      setLocation(null)
      return
    }

    let aborted = false
    ;(async () => {
      setIsGettingLocation(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locStr)}`,
        )
        const data = await res.json()
        if (aborted) return
        if (data && data.length > 0) {
          const first = data[0]
          setLocation({ lat: parseFloat(first.lat), lng: parseFloat(first.lon) })
        } else {
          // No se encontró geocodificación; dejamos solo el texto
          setLocation(null)
        }
      } catch (err) {
        console.error("Error geocoding saved location:", err)
        if (!aborted) {
          setLocation(null)
        }
      } finally {
        if (!aborted) setIsGettingLocation(false)
      }
    })()

    return () => {
      aborted = true
    }
  }, [open, expense.location])

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  // Geocode en tiempo real cuando el usuario escribe en el input de ubicación
  // Debounce básico: 500ms y cache en localStorage
  useEffect(() => {
    const query = formData.location?.trim()
    if (!query) {
      setLocation(null)
      return
    }

    let aborted = false
    const timer = setTimeout(async () => {
      setIsGeocoding(true)
      try {
        const cacheKey = `geocode_cache:${query.toLowerCase()}`
        try {
          const cached = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : null
          if (cached) {
            const parsed = JSON.parse(cached)
            if (!aborted) {
              setLocation(parsed)
              setIsGeocoding(false)
              return
            }
          }
        } catch {}

        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        )
        const data = await res.json()
        if (aborted) return
        if (data && data.length > 0) {
          const first = data[0]
          const coords = { lat: parseFloat(first.lat), lng: parseFloat(first.lon) }
          setLocation(coords)
          try {
            localStorage.setItem(cacheKey, JSON.stringify(coords))
          } catch {}
        }
      } catch (err) {
        console.error("Error geocoding query:", err)
      } finally {
        if (!aborted) setIsGeocoding(false)
      }
    }, 500)

    return () => {
      aborted = true
      clearTimeout(timer)
      setIsGeocoding(false)
    }
  }, [formData.location])

  const getLocation = () => {
    setIsGettingLocation(true)
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          setLocation({ lat, lng })

          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            )
            const data = await response.json()
              const name = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
              setFormData((prev) => ({ ...prev, location: name }))
          } catch {
            const fallback = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
            setFormData((prev) => ({ ...prev, location: fallback }))
          }
          setIsGettingLocation(false)
        },
        (error) => {
          console.error("Error getting location:", error)
          setError("No se pudo obtener la ubicación. Verifica los permisos.")
          setIsGettingLocation(false)
        },
      )
    } else {
      setError("Tu navegador no soporta geolocalización")
      setIsGettingLocation(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("expenses")
        .update({
          name: formData.name,
          amount: Number.parseInt(getNumericValue(formData.amount)),
          category_id: formData.category_id || null,
          purchase_date: formData.purchase_date,
          location: formData.location || null,
          notes: formData.notes || null,
        })
        .eq("id", expense.id)

      if (error) throw error

      showUpdated("Gasto")
      onSuccess?.()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error al actualizar el gasto"
      setError(errorMessage)
      showError("Error al actualizar", errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] sm:w-full max-w-md max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="no-ios-zoom">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Editar Gasto</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Modifica los detalles de tu gasto registrado
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="edit_name" className="text-xs sm:text-sm">Nombre del Gasto</Label>
            <Input
              id="edit_name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Compra de supermercado"
              required
              disabled={isLoading}
              className="text-sm sm:text-base h-9 sm:h-10"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="edit_amount" className="text-xs sm:text-sm">Monto</Label>
              <Input
                id="edit_amount"
                type="text"
                inputMode="numeric"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: formatAmount(e.target.value) })}
                placeholder="0"
                required
                disabled={isLoading}
                className="text-sm sm:text-base h-9 sm:h-10"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="edit_category_id" className="text-xs sm:text-sm">Categoría</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                disabled={isLoading}
              >
                <SelectTrigger id="edit_category_id" className="h-9 sm:h-10 text-sm sm:text-base">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id} className="text-sm sm:text-base">
                      {category.icon} {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="edit_purchase_date" className="text-xs sm:text-sm">Fecha de Compra</Label>
            <DateInput
              id="edit_purchase_date"
              value={formData.purchase_date}
              onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
              required
              disabled={isLoading}
              className="text-sm sm:text-base h-9 sm:h-10"
            />
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="edit_location" className="text-xs sm:text-sm">Ubicación (opcional)</Label>
            <div className="relative">
              <Input
                id="edit_location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ej: Supermercado XYZ"
                disabled={isLoading}
                className="text-sm sm:text-base h-9 sm:h-10 pr-10"
              />
              {isGeocoding && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {!location ? (
              <Button
                type="button"
                variant="outline"
                onClick={getLocation}
                disabled={isGettingLocation}
                className="w-full mt-2 text-sm sm:text-base h-9 sm:h-10"
              >
                <MapPin className="h-4 w-4 mr-2" />
                {isGettingLocation ? "Obteniendo ubicación..." : "Obtener Ubicación Actual"}
              </Button>
            ) : (
              <div className="space-y-2 mt-2">
                {/* Se elimina la visualización encima del mapa; ya existe el input de ubicación */}
                <div className="flex justify-center">
                  <div className="relative w-full rounded-lg overflow-hidden border h-48 sm:h-56 min-h-[12rem] max-h-[40vh] min-w-0 max-w-full box-border mx-auto max-w-[28rem] sm:max-w-[32rem]">
                    <iframe
                    title="Mapa de ubicacion"
                    className="w-full h-full block min-w-0 max-w-full box-border"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    frameBorder="0"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.lng - 0.005},${location.lat - 0.005},${location.lng + 0.005},${location.lat + 0.005}&layer=mapnik&marker=${location.lat},${location.lng}`}
                  />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setLocation(null)
                    setFormData((prev) => ({ ...prev, location: "" }))
                  }}
                  className="w-full"
                >
                  Cambiar ubicación
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="edit_notes" className="text-xs sm:text-sm">Notas (opcional)</Label>
            <Textarea
              id="edit_notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Agrega detalles adicionales..."
              rows={3}
              disabled={isLoading}
              className="text-sm sm:text-base resize-none"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-9 sm:h-10 text-sm sm:text-base"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 h-9 sm:h-10 text-sm sm:text-base" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />}
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
