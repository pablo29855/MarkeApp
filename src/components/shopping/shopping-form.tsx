"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useNotification } from "@/hooks/use-notification"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Loader2 } from "lucide-react"
import type { Category } from "@/lib/types"

interface ShoppingFormProps {
  userId: string
  categories: Category[]
  onSuccess?: () => void
}

export function ShoppingForm({ userId, categories, onSuccess }: ShoppingFormProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { showCreated, showError } = useNotification()

  const [formData, setFormData] = useState({
    product_name: "",
    quantity: "1",
    category_id: "",
  })

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
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const { error } = await supabase.from("shopping_list").insert({
        user_id: userId,
        product_name: formData.product_name,
        quantity: Number.parseInt(getNumericValue(formData.quantity)),
        category: formData.category_id || null,
        is_purchased: false,
        unit_price: null,
        total_price: null,
      })

      if (error) throw error

      showCreated("Producto")
      
      setFormData({
        product_name: "",
        quantity: "1",
        category_id: "",
      })
      setOpen(false)
      onSuccess?.()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error al agregar el item"
      setError(errorMessage)
      showError("Error al guardar", errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="text-sm sm:text-base h-9 sm:h-10">
          <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
          Agregar Item
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-2rem)] sm:w-full max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Nuevo Item</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Agrega un producto a tu lista de mercado
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="product_name" className="text-xs sm:text-sm">Nombre del Producto</Label>
            <Input
              id="product_name"
              value={formData.product_name}
              onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
              placeholder="Ej: Leche"
              required
              disabled={isLoading}
              className="text-sm sm:text-base h-9 sm:h-10"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="quantity" className="text-xs sm:text-sm">Cantidad</Label>
              <Input
                id="quantity"
                type="text"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: formatNumber(e.target.value) })}
                placeholder="1"
                required
                disabled={isLoading}
                className="text-sm sm:text-base h-9 sm:h-10"
              />
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
                <SelectContent>
                  {categories && categories.length > 0 ? (
                    categories.map((category) => (
                      <SelectItem key={category.id} value={category.id} className="text-sm sm:text-base">
                        {category.icon} {category.name}
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
              onClick={() => setOpen(false)}
              className="flex-1 text-sm sm:text-base h-9 sm:h-10"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 text-sm sm:text-base h-9 sm:h-10" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />}
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
