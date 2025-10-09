
import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useNotification } from "@/hooks/use-notification"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Loader2 } from "lucide-react"
import type { Category } from "@/lib/types"

interface ExpenseFormProps {
  categories: Category[]
  userId: string
  onSuccess?: () => void
}

export function ExpenseForm({ categories, userId, onSuccess }: ExpenseFormProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { showCreated, showError } = useNotification()

  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    category_id: "",
    purchase_date: new Date().toISOString().split("T")[0],
    location: "",
    notes: "",
  })

  const resetForm = () => {
    setFormData({
      name: "",
      amount: "",
      category_id: "",
      purchase_date: new Date().toISOString().split("T")[0],
      location: "",
      notes: "",
    })
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validación manual de categoría
    if (!formData.category_id) {
      setError("Por favor selecciona una categoría")
      return
    }
    
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const { error } = await supabase.from("expenses").insert({
        user_id: userId,
        name: formData.name,
        amount: Number.parseFloat(formData.amount),
        category_id: formData.category_id,
        purchase_date: formData.purchase_date,
        location: formData.location || null,
        notes: formData.notes || null,
      })

      if (error) throw error

      showCreated("Gasto")
      
      // Reset del formulario
      resetForm()
      
      // Cerrar el dialog INMEDIATAMENTE
      setOpen(false)
      
      // Llamar callback después de cerrar
      setTimeout(() => {
        onSuccess?.()
      }, 50)
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error al crear el gasto"
      setError(errorMessage)
      showError("Error al guardar", errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-auto">
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Agregar Gasto</span>
          <span className="sm:hidden">Nuevo</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-2rem)] sm:w-full max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Nuevo Gasto</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Completa el formulario para registrar un nuevo gasto
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="name" className="text-xs sm:text-sm">Nombre del Gasto</Label>
            <Input
              id="name"
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
              <Label htmlFor="amount" className="text-xs sm:text-sm">Monto</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
                disabled={isLoading}
                className="text-sm sm:text-base h-9 sm:h-10"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="purchase_date" className="text-xs sm:text-sm">Fecha</Label>
              <Input
                id="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                required
                disabled={isLoading}
                className="text-sm sm:text-base h-9 sm:h-10"
              />
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="category" className="text-xs sm:text-sm">Categoría *</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              disabled={isLoading}
            >
              <SelectTrigger className="h-9 sm:h-10 text-sm sm:text-base">
                <SelectValue placeholder="Selecciona una categoría" />
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

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="location" className="text-xs sm:text-sm">Ubicación (opcional)</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Ej: Supermercado XYZ"
              disabled={isLoading}
              className="text-sm sm:text-base h-9 sm:h-10"
            />
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
            <Alert variant="destructive">
              <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 pt-2">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-9 sm:h-10 text-sm sm:text-base"
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </DialogClose>
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
