"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useNotification } from "@/hooks/use-notification"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FormFieldError } from "@/components/ui/form-field-error"
import { CategoryChipGrid, FormStickyFooter } from "@/components/ui/form-chips"
import { getValidationMessage } from "@/lib/validation-messages"
import { Loader2, Minus, Plus } from "lucide-react"
import type { Category, ShoppingItem } from "@/lib/types"

interface ShoppingFormProps {
  userId: string
  categories: Category[]
  onSuccess?: () => void
  item?: ShoppingItem
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ShoppingForm({ userId, categories, onSuccess, item }: ShoppingFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { showCreated, showError, showSuccess } = useNotification()

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
      onSuccess?.()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : `Error al ${item ? "actualizar" : "agregar"} el item`
      setError(errorMessage)
      showError("Error al guardar", errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const quantityNumber = Number.parseInt(getNumericValue(formData.quantity)) || 0

  const setQuantity = (next: number) => {
    setFormData({ ...formData, quantity: formatNumber(String(Math.max(1, next))) })
    if (fieldErrors.quantity) {
      setFieldErrors({ ...fieldErrors, quantity: '' })
      setShowFieldError(null)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
      {/* Nombre del producto */}
      <div className="space-y-1.5">
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
            className="text-sm sm:text-base h-10 sm:h-11 rounded-[14px]"
          />
        </div>
      </div>

      {/* Cantidad: stepper − / + */}
      <div className="space-y-1.5">
        <Label htmlFor="quantity" className="text-xs sm:text-sm">Cantidad *</Label>
        <div ref={quantityRef} className="relative">
          <FormFieldError
            error={fieldErrors.quantity}
            show={showFieldError === 'quantity'}
            fieldRef={quantityRef}
            submitAttempt={submitAttempt}
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setQuantity(quantityNumber - 1)}
              disabled={isLoading || quantityNumber <= 1}
              aria-label="Disminuir cantidad"
              className="h-11 w-11 rounded-[14px] shrink-0"
            >
              <Minus className="h-4 w-4" />
            </Button>
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
              className="text-center text-base font-bold h-11 rounded-[14px]"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setQuantity(quantityNumber + 1)}
              disabled={isLoading}
              aria-label="Aumentar cantidad"
              className="h-11 w-11 rounded-[14px] shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Categoría: grilla de chips (opcional) */}
      {categories && categories.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs sm:text-sm">Categoría</Label>
          <CategoryChipGrid
            categories={categories}
            value={formData.category_id}
            onChange={(id) =>
              setFormData({ ...formData, category_id: id === formData.category_id ? '' : id })
            }
            disabled={isLoading}
          />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
        </Alert>
      )}

      <FormStickyFooter>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onSuccess?.()}
            className="flex-1 h-12 rounded-[14px] text-sm sm:text-base"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" className="flex-[2] h-12 rounded-[14px] text-[15px] font-bold" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Guardando..." : (item ? "Guardar cambios" : "Agregar producto")}
          </Button>
        </div>
      </FormStickyFooter>
    </form>
  )
}
