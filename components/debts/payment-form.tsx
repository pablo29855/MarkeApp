"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DollarSign } from "lucide-react"

interface PaymentFormProps {
  debtId: string
  remainingAmount: number
}

export function PaymentForm({ debtId, remainingAmount }: PaymentFormProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const [formData, setFormData] = useState({
    amount: "",
    payment_date: new Date().toISOString().split("T")[0],
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const paymentAmount = Number.parseFloat(formData.amount)

    if (paymentAmount > remainingAmount) {
      setError("El monto del pago no puede ser mayor al saldo pendiente")
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    try {
      // Insert payment record
      const { error: paymentError } = await supabase.from("debt_payments").insert({
        debt_id: debtId,
        amount: paymentAmount,
        payment_date: formData.payment_date,
        notes: formData.notes || null,
      })

      if (paymentError) throw paymentError

      // Get current paid amount
      const { data: debt } = await supabase.from("debts").select("paid_amount").eq("id", debtId).single()

      if (!debt) throw new Error("Deuda no encontrada")

      // Update debt paid amount
      const newPaidAmount = Number(debt.paid_amount) + paymentAmount
      const { error: updateError } = await supabase
        .from("debts")
        .update({ paid_amount: newPaidAmount })
        .eq("id", debtId)

      if (updateError) throw updateError

      setFormData({
        amount: "",
        payment_date: new Date().toISOString().split("T")[0],
        notes: "",
      })
      setOpen(false)
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Error al registrar el pago")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <DollarSign className="h-4 w-4 mr-2" />
          Registrar Pago
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pago</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Saldo Pendiente</p>
            <p className="text-2xl font-bold">${remainingAmount.toLocaleString()}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Monto del Pago</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              required
              disabled={isLoading}
              max={remainingAmount}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_date">Fecha de Pago</Label>
            <Input
              id="payment_date"
              type="date"
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Agrega notas sobre el pago..."
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
              {isLoading ? "Guardando..." : "Registrar Pago"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
