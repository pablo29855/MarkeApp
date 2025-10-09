"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useNotification } from "@/hooks/use-notification"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Loader2 } from "lucide-react"

interface DebtFormProps {
  userId: string
  onSuccess?: () => void
}

export function DebtForm({ userId, onSuccess }: DebtFormProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { showCreated, showError } = useNotification()

  const [formData, setFormData] = useState({
    creditor_name: "",
    total_amount: "",
    due_date: "",
    description: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const currentDate = new Date().toISOString().split('T')[0]
      
      console.log("[v0] Creating debt with data:", {
        user_id: userId,
        name: formData.creditor_name,
        creditor: formData.creditor_name,
        total_amount: Number.parseFloat(formData.total_amount),
        paid_amount: 0,
        debt_date: formData.due_date || currentDate,
      })

      const { data, error } = await supabase
        .from("debts")
        .insert({
          user_id: userId,
          name: formData.creditor_name,
          creditor: formData.creditor_name,
          total_amount: Number.parseFloat(formData.total_amount),
          paid_amount: 0,
          debt_date: formData.due_date || currentDate,
        })
        .select()

      console.log("[v0] Debt creation response:", { data, error })

      if (error) throw error

      showCreated("Deuda")
      
      setFormData({
        creditor_name: "",
        total_amount: "",
        due_date: "",
        description: "",
      })
      setOpen(false)
      onSuccess?.()
    } catch (error: unknown) {
      console.error("[v0] Error creating debt:", error)
      const errorMessage = error instanceof Error ? error.message : "Error al crear la deuda"
      setError(errorMessage)
      showError("Error al guardar", errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="text-xs sm:text-sm">
          <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="hidden xs:inline">Agregar Deuda</span>
          <span className="xs:hidden">Nueva</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md w-[calc(100%-2rem)] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Nueva Deuda</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Registra una nueva deuda para llevar un control de tus pagos pendientes
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="creditor_name" className="text-xs sm:text-sm">Acreedor</Label>
            <Input
              id="creditor_name"
              value={formData.creditor_name}
              onChange={(e) => setFormData({ ...formData, creditor_name: e.target.value })}
              placeholder="Ej: Banco XYZ"
              required
              disabled={isLoading}
              className="text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="total_amount" className="text-xs sm:text-sm">Monto Total</Label>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                value={formData.total_amount}
                onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                placeholder="0.00"
                required
                disabled={isLoading}
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="due_date" className="text-xs sm:text-sm">Fecha de Vencimiento</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                disabled={isLoading}
                className="dark:[color-scheme:dark] text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="description" className="text-xs sm:text-sm">Descripción (opcional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Agrega detalles sobre la deuda..."
              rows={3}
              disabled={isLoading}
              className="text-sm resize-none"
            />
          </div>

          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 text-xs sm:text-sm"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 text-xs sm:text-sm" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />}
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
