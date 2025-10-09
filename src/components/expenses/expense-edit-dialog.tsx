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
import { Loader2 } from "lucide-react"
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
      <DialogContent className="w-[calc(100%-2rem)] sm:w-full max-w-md max-h-[90vh] overflow-y-auto">
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
            <Input
              id="edit_purchase_date"
              type="date"
              value={formData.purchase_date}
              onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
              required
              disabled={isLoading}
              className="dark:[color-scheme:dark] text-sm sm:text-base h-9 sm:h-10"
            />
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="edit_location" className="text-xs sm:text-sm">Ubicación (opcional)</Label>
            <Input
              id="edit_location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Ej: Supermercado XYZ"
              disabled={isLoading}
              className="text-sm sm:text-base h-9 sm:h-10"
            />
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
      </DialogContent>
    </Dialog>
  )
}
