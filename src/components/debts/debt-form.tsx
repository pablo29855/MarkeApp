"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus } from "lucide-react"

interface DebtFormProps {
  userId: string
  onSuccess?: () => void
}

export function DebtForm({ userId, onSuccess }: DebtFormProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      console.log("[v0] Creating debt with data:", {
        user_id: userId,
        creditor_name: formData.creditor_name,
        total_amount: Number.parseFloat(formData.total_amount),
        paid_amount: 0,
        due_date: formData.due_date || null,
        description: formData.description || null,
      })

      const { data, error } = await supabase
        .from("debts")
        .insert({
          user_id: userId,
          creditor_name: formData.creditor_name,
          total_amount: Number.parseFloat(formData.total_amount),
          paid_amount: 0,
          due_date: formData.due_date || null,
          description: formData.description || null,
        })
        .select()

      console.log("[v0] Debt creation response:", { data, error })

      if (error) throw error

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
      setError(error instanceof Error ? error.message : "Error al crear la deuda")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Deuda
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva Deuda</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="creditor_name">Acreedor</Label>
            <Input
              id="creditor_name"
              value={formData.creditor_name}
              onChange={(e) => setFormData({ ...formData, creditor_name: e.target.value })}
              placeholder="Ej: Banco XYZ"
              required
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total_amount">Monto Total</Label>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                value={formData.total_amount}
                onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                placeholder="0.00"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Fecha de Vencimiento</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                disabled={isLoading}
                className="dark:[color-scheme:dark]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Agrega detalles sobre la deuda..."
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
              onClick={() => setOpen(false)}
              className="flex-1"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
