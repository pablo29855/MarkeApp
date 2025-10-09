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

  const [formData, setFormData] = useState({
    name: expense.name,
    amount: expense.amount.toString(),
    category_id: expense.category_id || "",
    purchase_date: expense.purchase_date,
    location: expense.location || "",
    notes: expense.notes || "",
  })

  useEffect(() => {
    setFormData({
      name: expense.name,
      amount: expense.amount.toString(),
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
          amount: Number.parseFloat(formData.amount),
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Gasto</DialogTitle>
          <DialogDescription>
            Modifica los detalles de tu gasto registrado
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit_name">Nombre del Gasto</Label>
            <Input
              id="edit_name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Compra de supermercado"
              required
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_amount">Monto</Label>
              <Input
                id="edit_amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_category_id">Categoría</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                disabled={isLoading}
              >
                <SelectTrigger id="edit_category_id">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_purchase_date">Fecha de Compra</Label>
            <Input
              id="edit_purchase_date"
              type="date"
              value={formData.purchase_date}
              onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
              required
              disabled={isLoading}
              className="dark:[color-scheme:dark]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_location">Ubicación (opcional)</Label>
            <Input
              id="edit_location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Ej: Supermercado XYZ"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_notes">Notas (opcional)</Label>
            <Textarea
              id="edit_notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Agrega detalles adicionales..."
              rows={3}
              disabled={isLoading}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
