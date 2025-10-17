"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useNotification } from "@/hooks/use-notification"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { scrollbarClasses } from "@/lib/styles"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FormFieldError } from "@/components/ui/form-field-error"
import { getValidationMessage } from "@/lib/validation-messages"
import { Plus, Loader2 } from "lucide-react"
import type { Category, ShoppingItem } from "@/lib/types"

interface ShoppingFormProps {
  userId: string
  categories: Category[]
  onSuccess?: () => void
  item?: ShoppingItem
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ShoppingForm({ userId, categories, onSuccess, item, open, onOpenChange }: ShoppingFormProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { showCreated, showError, showSuccess } = useNotification()

  const isOpen = open !== undefined ? open : internalOpen
  const setIsOpen = onOpenChange || setInternalOpen

  // Referencias para los campos del formulario (contenedores con relative)
  const productNameRef = useRef<HTMLDivElement>(null)
  const quantityRef = useRef<HTMLDivElement>(null)

  // Estados para errores de validación
  const [fieldErrors, setFieldErrors] = useState({
    product_name: '',
    quantity: '',
  })
  const [showFieldError, setShowFieldError] = useState<string | null>(null)
  const [submitAttempt, setSubmitAttempt] = useState(0)

  const [formData, setFormData] = useState({
    product_name: "",
    quantity: "1",
    category_id: "",
    purchased_at: "",
  })

  useEffect(() => {
    if (item) {
      setFormData({
        product_name: item.product_name,
        quantity: item.quantity.toString(),
        category_id: item.category || "",
        purchased_at: item.purchased_at || "",
      })
    } else {
      setFormData({
        product_name: "",
        quantity: "1",
        category_id: "",
        purchased_at: "",
      })
    }
  }, [item])

  // Función para formatear números con puntos de mil
  const formatNumber = (value: string) => {
    const cleanValue = value.replace(/\D/g, '')
    if (!cleanValue) return ''
    return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  const getNumericValue = (formattedValue: string) => {
    return formattedValue.replace(/\./g, '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Incrementar contador de intentos de envío
    setSubmitAttempt(prev => prev + 1)

    // Limpiar errores previos
    setFieldErrors({
      product_name: '',
      quantity: '',
    })
    setShowFieldError(null)
    setError(null)

    // Validaciones personalizadas
    const errors = {
      product_name: '',
      quantity: '',
    }

    if (!formData.product_name.trim()) {
      errors.product_name = getValidationMessage('product_name')
    }

    if (!formData.quantity.trim()) {
      errors.quantity = 'Ingresa una cantidad'
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
      const { formatDateLocal, parseLocalDate } = await import("@/lib/utils")
      if (item) {
        // Update
        const { error } = await supabase.from("shopping_list").update({
          product_name: formData.product_name,
          quantity: Number.parseInt(getNumericValue(formData.quantity)),
          category: formData.category_id || null,
          purchased_at: formData.purchased_at ? formatDateLocal(parseLocalDate(formData.purchased_at)) : null,
        }).eq("id", item.id)

        if (error) throw error

        showSuccess("Producto actualizado")
      } else {
        // Insert
        const { error } = await supabase.from("shopping_list").insert({
          user_id: userId,
          product_name: formData.product_name,
          quantity: Number.parseInt(getNumericValue(formData.quantity)),
          category: formData.category_id || null,
          is_purchased: false,
          unit_price: null,
          total_price: null,
          purchased_at: formData.purchased_at ? formatDateLocal(parseLocalDate(formData.purchased_at)) : null,
        })

        if (error) throw error

        showCreated("Producto")
      }
      
      setFormData({
        product_name: "",
        quantity: "1",
        category_id: "",
        purchased_at: "",
      })
      setIsOpen(false)
      onSuccess?.()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : `Error al ${item ? "actualizar" : "agregar"} el item`
      setError(errorMessage)
      showError("Error al guardar", errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!item && (
        <DialogTrigger asChild>
          <Button className="text-sm sm:text-base h-9 sm:h-10">
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Agregar Item
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className={`w-[calc(100%-2rem)] sm:w-full max-w-md max-h-[90vh] overflow-y-auto ${scrollbarClasses}`} onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="no-ios-zoom">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{item ? "Editar Item" : "Nuevo Item"}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {item ? "Edita el producto de tu lista de compras" : "Agrega un producto a tu lista de compras"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 mt-6">
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="product_name" className="text-xs sm:text-sm">Nombre del Producto *</Label>
            <div ref={productNameRef} className="relative">
              <FormFieldError 
                error={fieldErrors.product_name}
                show={showFieldError === 'product_name'}
                fieldRef={productNameRef}
                submitAttempt={submitAttempt}
              />
              <Input
                id="product_name"
                value={formData.product_name}
                onChange={(e) => {
                  setFormData({ ...formData, product_name: e.target.value })
                  if (fieldErrors.product_name) {
                    setFieldErrors({ ...fieldErrors, product_name: '' })
                    setShowFieldError(null)
                  }
                }}
                placeholder="Ej: Leche"
                disabled={isLoading}
                className="text-sm sm:text-base h-9 sm:h-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="quantity" className="text-xs sm:text-sm">Cantidad *</Label>
              <div ref={quantityRef} className="relative">
                <FormFieldError 
                  error={fieldErrors.quantity}
                  show={showFieldError === 'quantity'}
                  fieldRef={quantityRef}
                  submitAttempt={submitAttempt}
                />
                <Input
                  id="quantity"
                  type="text"
                  inputMode="numeric"
                  value={formData.quantity}
                  onChange={(e) => {
                    setFormData({ ...formData, quantity: formatNumber(e.target.value) })
                    if (fieldErrors.quantity) {
                      setFieldErrors({ ...fieldErrors, quantity: '' })
                      setShowFieldError(null)
                    }
                  }}
                  placeholder="1"
                  disabled={isLoading}
                  className="text-sm sm:text-base h-9 sm:h-10"
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="category_id" className="text-xs sm:text-sm">Categoría</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                disabled={isLoading}
              >
                <SelectTrigger id="category_id" className="text-sm sm:text-base h-9 sm:h-10">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={8} align="start">
                  {categories && categories.length > 0 ? (
                    categories.map((category) => (
                      <SelectItem key={category.id} value={category.id} className="text-sm sm:text-base cursor-pointer">
                        <span className="flex items-center gap-2">
                          <span>{category.icon}</span>
                          <span>{category.name}</span>
                        </span>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled className="text-sm sm:text-base">
                      No hay categorías disponibles
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 sm:gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1 text-sm sm:text-base h-9 sm:h-10"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 text-sm sm:text-base h-9 sm:h-10" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />}
              {isLoading ? "Guardando..." : (item ? "Actualizar" : "Agregar")}
            </Button>
          </div>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
