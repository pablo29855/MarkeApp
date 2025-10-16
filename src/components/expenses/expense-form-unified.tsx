"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useNotification } from "@/hooks/use-notification"
import { getTodayLocal } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DateInput } from "@/components/ui/date-input"
import { FormFieldError } from "@/components/ui/form-field-error"
import { getValidationMessage } from "@/lib/validation-messages"
import { Loader2, MapPin } from "lucide-react"
import type { Expense, Category } from "@/lib/types"

interface ExpenseFormProps {
  expense?: Expense
  categories: Category[]
  userId: string
  onSuccess?: () => void
  onClose?: () => void
}

export function ExpenseFormUnified({ expense, categories, userId, onSuccess, onClose }: ExpenseFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { showCreated, showUpdated, showError } = useNotification()
  const [isGeocoding, setIsGeocoding] = useState(false)

  // Referencias para los campos del formulario
  const nameRef = useRef<HTMLInputElement>(null)
  const amountRef = useRef<HTMLInputElement>(null)
  const categoryRef = useRef<HTMLDivElement>(null) // Contenedor del select
  const purchaseDateRef = useRef<HTMLInputElement>(null)

  // Estados para errores de validación
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    amount: '',
    category_id: '',
    purchase_date: '',
  })
  const [showFieldError, setShowFieldError] = useState<string | null>(null)
  const [submitAttempt, setSubmitAttempt] = useState(0)

  // Función para formatear el monto con puntos de mil (formato colombiano)
  const formatAmount = (value: string) => {
    const cleanValue = value.replace(/\D/g, '')
    if (!cleanValue) return ''
    return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  // Función para obtener el valor numérico limpio
  const getNumericValue = (formattedValue: string) => {
    return formattedValue.replace(/\./g, '')
  }

  const [formData, setFormData] = useState({
    name: expense?.name || "",
    amount: expense?.amount ? formatAmount(expense.amount.toString()) : "",
    category_id: expense?.category_id || "",
    purchase_date: expense?.purchase_date || getTodayLocal(),
    location: expense?.location || "",
    notes: expense?.notes || "",
  })

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  // Actualizar formData cuando cambie el expense (al editar)
  useEffect(() => {
    if (expense) {
      setFormData({
        name: expense.name,
        amount: formatAmount(expense.amount.toString()),
        category_id: expense.category_id || "",
        purchase_date: expense.purchase_date,
        location: expense.location || "",
        notes: expense.notes || "",
      })
    }
  }, [expense])

  // Geocode cuando el usuario escribe en el input de ubicación
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

  // Obtener ubicación automáticamente cuando se abre el diálogo (solo al crear)
  useEffect(() => {
    if (!expense && !location && !isGettingLocation) {
      getLocation()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Incrementar contador de intentos de envío
    setSubmitAttempt(prev => prev + 1)

    // Limpiar errores previos
    setFieldErrors({
      name: '',
      amount: '',
      category_id: '',
      purchase_date: '',
    })
    setShowFieldError(null)
    setError(null)

    // Validaciones personalizadas
    const errors = {
      name: '',
      amount: '',
      category_id: '',
      purchase_date: '',
    }

    if (!formData.name.trim()) {
      errors.name = getValidationMessage('name')
    }

    if (!formData.amount.trim()) {
      errors.amount = getValidationMessage('amount')
    }

    if (!formData.category_id) {
      errors.category_id = getValidationMessage('category_id')
    }

    if (!formData.purchase_date) {
      errors.purchase_date = getValidationMessage('purchase_date')
    }

    // Si hay errores, mostrar el primero
    const firstError = Object.entries(errors).find(([_, value]) => value !== '')
    if (firstError) {
      const [field] = firstError
      setFieldErrors(errors)
      setShowFieldError(field)
      return
    }
    
    setIsLoading(true)

    const supabase = createClient()

    try {
      const expenseData = {
        user_id: userId,
        name: formData.name,
        amount: Number.parseInt(getNumericValue(formData.amount)),
        category_id: formData.category_id,
        purchase_date: formData.purchase_date,
        location: formData.location || null,
        notes: formData.notes || null,
      }

      let result

      if (expense?.id) {
        // Actualizar
        result = await supabase
          .from("expenses")
          .update(expenseData)
          .eq("id", expense.id)
      } else {
        // Crear
        result = await supabase
          .from("expenses")
          .insert([expenseData])
      }

      if (result.error) throw result.error

      if (expense?.id) {
        showUpdated("Gasto")
      } else {
        showCreated("Gasto")
      }
      
      onSuccess?.()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error al guardar el gasto"
      setError(errorMessage)
      showError("Error al guardar", errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 mt-6">
      <div className="space-y-1.5 sm:space-y-2">
        <Label htmlFor="name" className="text-xs sm:text-sm">Nombre del Gasto *</Label>
        <div ref={nameRef} className="relative">
          <FormFieldError 
            error={fieldErrors.name}
            show={showFieldError === 'name'}
            fieldRef={nameRef}
            submitAttempt={submitAttempt}
          />
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value })
              if (fieldErrors.name) {
                setFieldErrors({ ...fieldErrors, name: '' })
                setShowFieldError(null)
              }
            }}
            placeholder="Ej: Compra de supermercado"
            disabled={isLoading}
            className="text-sm sm:text-base h-9 sm:h-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-1.5 sm:space-y-2">
          <Label htmlFor="amount" className="text-xs sm:text-sm">Monto *</Label>
          <div ref={amountRef} className="relative">
            <FormFieldError 
              error={fieldErrors.amount}
              show={showFieldError === 'amount'}
              fieldRef={amountRef}
              submitAttempt={submitAttempt}
            />
            <Input
              id="amount"
              type="text"
              inputMode="numeric"
              value={formData.amount}
              onChange={(e) => {
                setFormData({ ...formData, amount: formatAmount(e.target.value) })
                if (fieldErrors.amount) {
                  setFieldErrors({ ...fieldErrors, amount: '' })
                  setShowFieldError(null)
                }
              }}
              placeholder="0"
              disabled={isLoading}
              className="text-sm sm:text-base h-9 sm:h-10"
            />
          </div>
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          <Label htmlFor="purchase_date" className="text-xs sm:text-sm">Fecha *</Label>
          <div ref={purchaseDateRef} className="relative">
            <FormFieldError 
              error={fieldErrors.purchase_date}
              show={showFieldError === 'purchase_date'}
              fieldRef={purchaseDateRef}
              submitAttempt={submitAttempt}
            />
            <DateInput
              id="purchase_date"
              value={formData.purchase_date}
              onChange={(e) => {
                setFormData({ ...formData, purchase_date: e.target.value })
                if (fieldErrors.purchase_date) {
                  setFieldErrors({ ...fieldErrors, purchase_date: '' })
                  setShowFieldError(null)
                }
              }}
              disabled={isLoading}
              className="text-sm sm:text-base h-9 sm:h-10"
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5 sm:space-y-2">
        <Label htmlFor="category" className="text-xs sm:text-sm">Categoría *</Label>
        <div ref={categoryRef} className="relative">
          <FormFieldError 
            error={fieldErrors.category_id}
            show={showFieldError === 'category_id'}
            fieldRef={categoryRef}
            submitAttempt={submitAttempt}
          />
          <Select
            value={formData.category_id}
            onValueChange={(value) => {
              setFormData({ ...formData, category_id: value })
              if (fieldErrors.category_id) {
                setFieldErrors({ ...fieldErrors, category_id: '' })
                setShowFieldError(null)
              }
            }}
            disabled={isLoading}
          >
            <SelectTrigger id="category" className="h-9 sm:h-10 text-sm sm:text-base">
              <SelectValue placeholder="Selecciona una categoría" />
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={8} align="start">
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id} className="text-sm sm:text-base cursor-pointer">
                  <span className="flex items-center gap-2">
                    <span>{category.icon}</span>
                    <span>{category.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5 sm:space-y-2">
        <Label htmlFor="location" className="text-xs sm:text-sm">Ubicación (opcional)</Label>
        <div className="relative">
          <Input
            id="location"
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
        <Label htmlFor="notes" className="text-xs sm:text-sm">Notas (opcional)</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Agrega notas adicionales..."
          rows={3}
          disabled={isLoading}
          className="text-sm sm:text-base resize-none"
        />
      </div>

      {error && (
        <Alert variant="destructive" className="animate-in fade-in-50 slide-in-from-top-2 duration-300">
          <AlertDescription className="text-xs sm:text-sm font-medium">{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
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
  )
}
