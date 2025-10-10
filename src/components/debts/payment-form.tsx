
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
import { DollarSign, Loader2 } from "lucide-react"

interface PaymentFormProps {
  debtId: string
  remainingAmount: number
  onUpdate?: () => void
}

export function PaymentForm({ debtId, remainingAmount, onUpdate }: PaymentFormProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { showSaved, showError: showErrorNotif, showWarning } = useNotification()

  // Función para formatear el monto con puntos de mil (formato colombiano)
  const formatAmount = (value: string) => {
    // Remover todo excepto números
    const cleanValue = value.replace(/\D/g, '')
    
    // Si está vacío, retornar vacío
    if (!cleanValue) return ''
    
    // Formatear con puntos de mil
    return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  const getNumericValue = (formattedValue: string) => {
    return formattedValue.replace(/\./g, '')
  }

  const [formData, setFormData] = useState({
    amount: "",
    payment_date: new Date().toISOString().split("T")[0],
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const paymentAmount = Number.parseInt(getNumericValue(formData.amount))

    if (paymentAmount > remainingAmount) {
      const errorMsg = "El monto del pago no puede ser mayor al saldo pendiente"
      setError(errorMsg)
      showWarning("Monto inválido", errorMsg)
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

      showSaved("Pago")
      
      setFormData({
        amount: "",
        payment_date: new Date().toISOString().split("T")[0],
        notes: "",
      })
      setOpen(false)
      
      // Trigger update callback to refresh parent component
      if (onUpdate) {
        onUpdate()
      }
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error al registrar el pago"
      setError(errorMessage)
      showErrorNotif("Error al guardar", errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={(e) => e.stopPropagation()} className="contents">
        <DialogTrigger asChild>
          <Button 
            size="sm" 
            className="text-xs sm:text-sm lg:text-base flex-1 xs:flex-none h-9 sm:h-10 lg:h-11"
            variant="default"
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 mr-1 sm:mr-2" />
            <span>Abonar</span>
          </Button>
        </DialogTrigger>
      </div>
      <DialogContent className="max-w-md w-[calc(100%-2rem)] sm:w-full">
        <div className="no-ios-zoom">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Abonar a Deuda</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Registra un pago para reducir el saldo pendiente de esta deuda
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="p-3 sm:p-4 bg-muted rounded-lg">
            <p className="text-xs sm:text-sm text-muted-foreground">Saldo Pendiente</p>
            <p className="text-xl sm:text-2xl font-bold">${remainingAmount.toLocaleString()}</p>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="amount" className="text-xs sm:text-sm">Monto a Abonar</Label>
            <Input
              id="amount"
              type="text"
              value={formData.amount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, amount: formatAmount(e.target.value) })}
              placeholder="0"
              required
              disabled={isLoading}
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="payment_date" className="text-xs sm:text-sm">Fecha del Abono</Label>
            <Input
              id="payment_date"
              type="date"
              value={formData.payment_date}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, payment_date: e.target.value })}
              required
              disabled={isLoading}
              className="text-sm dark:[color-scheme:dark]"
            />
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="notes" className="text-xs sm:text-sm">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Agrega notas sobre este abono..."
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
              {isLoading ? "Guardando..." : "Abonar"}
            </Button>
          </div>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
