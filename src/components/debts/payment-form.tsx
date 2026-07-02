
import type React from "react"

import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useNotification } from "@/hooks/use-notification"
import { getTodayLocal, cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog"
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription 
} from "@/components/ui/drawer"
import { scrollbarClasses } from "@/lib/styles"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DateInput } from "@/components/ui/date-input"
import { FormFieldError } from "@/components/ui/form-field-error"
import { getValidationMessage } from "@/lib/validation-messages"
import { Loader2 } from "lucide-react"

interface PaymentFormProps {
  debtId: string
  remainingAmount: number
  onUpdate?: () => void
  isActive?: boolean
}

export function PaymentForm({ debtId, remainingAmount, onUpdate, isActive = false }: PaymentFormProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { showSaved, showError: showErrorNotif, showWarning } = useNotification()

  const amountRef = useRef<HTMLDivElement>(null)
  const paymentDateRef = useRef<HTMLDivElement>(null)

  const [fieldErrors, setFieldErrors] = useState({
    amount: '',
    payment_date: '',
  })
  const [showFieldError, setShowFieldError] = useState<string | null>(null)
  const [submitAttempt, setSubmitAttempt] = useState(0)

  const formatAmount = (value: string) => {
    const cleanValue = value.replace(/\D/g, '')
    if (!cleanValue) return ''
    return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  const getNumericValue = (formattedValue: string) => {
    return formattedValue.replace(/\./g, '')
  }

  const [formData, setFormData] = useState({
    amount: "",
    payment_date: getTodayLocal(),
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setSubmitAttempt(prev => prev + 1)

    setFieldErrors({
      amount: '',
      payment_date: '',
    })
    setShowFieldError(null)
    setError(null)

    const errors = {
      amount: '',
      payment_date: '',
    }

    if (!formData.amount.trim()) {
      errors.amount = getValidationMessage('amount')
    }

    if (!formData.payment_date) {
      errors.payment_date = getValidationMessage('payment_date')
    }

    const firstError = Object.entries(errors).find(([_, value]) => value !== '')
    if (firstError) {
      const [field] = firstError
      setFieldErrors(errors)
      setShowFieldError(field)
      return
    }

    setIsLoading(true)

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
      const { formatDateLocal, parseLocalDate } = await import("@/lib/utils")
      const { error: paymentError } = await supabase.from("debt_payments").insert({
        debt_id: debtId,
        amount: paymentAmount,
        payment_date: formData.payment_date ? formatDateLocal(parseLocalDate(formData.payment_date)) : null,
        notes: formData.notes || null,
      })

      if (paymentError) throw paymentError

      const { data: debt } = await supabase.from("debts").select("paid_amount").eq("id", debtId).single()

      if (!debt) throw new Error("Deuda no encontrada")

      const newPaidAmount = Number(debt.paid_amount) + paymentAmount
      const { error: updateError } = await supabase
        .from("debts")
        .update({ paid_amount: newPaidAmount })
        .eq("id", debtId)

      if (updateError) throw updateError

      showSaved("Pago")
      
      setFormData({
        amount: "",
        payment_date: getTodayLocal(),
        notes: "",
      })
      setOpen(false)
      
      onUpdate?.()
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error al registrar el pago"
      setError(errorMessage)
      showErrorNotif("Error al guardar", errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const isMobile = useIsMobile()

  const triggerButton = (
    <Button 
      className={cn(
        "w-full h-[46px] rounded-[14px] font-bold text-[15px]",
        isActive 
          ? "bg-[#3B6EF6] text-white hover:bg-[#3B6EF6]/90" 
          : "bg-secondary text-[#3B6EF6] hover:bg-secondary/80"
      )}
      onClick={(e) => {
        e.stopPropagation()
        setOpen(true)
      }}
    >
      + Abonar
    </Button>
  )

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      <div className="p-3 sm:p-4 bg-muted rounded-lg">
        <p className="text-xs sm:text-sm text-muted-foreground">Saldo Pendiente</p>
        <p className="text-xl sm:text-2xl font-bold">${remainingAmount.toLocaleString()}</p>
      </div>

      <div className="space-y-1.5 sm:space-y-2">
        <Label htmlFor="amount" className="text-xs sm:text-sm">Monto a Abonar *</Label>
        <div ref={amountRef} className="relative">
          <FormFieldError 
            error={fieldErrors.amount}
            show={showFieldError === 'amount'}
            fieldRef={amountRef}
            submitAttempt={submitAttempt}
          />
          <Input
            id="amount"
            type="text"
            inputMode="numeric"
            value={formData.amount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setFormData({ ...formData, amount: formatAmount(e.target.value) })
              if (fieldErrors.amount) {
                setFieldErrors({ ...fieldErrors, amount: '' })
                setShowFieldError(null)
              }
            }}
            placeholder="0"
            disabled={isLoading}
            className="text-sm"
          />
        </div>
      </div>

      <div className="space-y-1.5 sm:space-y-2">
        <Label htmlFor="payment_date" className="text-xs sm:text-sm">Fecha del Abono *</Label>
        <div ref={paymentDateRef} className="relative">
          <FormFieldError 
            error={fieldErrors.payment_date}
            show={showFieldError === 'payment_date'}
            fieldRef={paymentDateRef}
            submitAttempt={submitAttempt}
          />
          <DateInput
            id="payment_date"
            value={formData.payment_date}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setFormData({ ...formData, payment_date: e.target.value })
              if (fieldErrors.payment_date) {
                setFieldErrors({ ...fieldErrors, payment_date: '' })
                setShowFieldError(null)
              }
            }}
            disabled={isLoading}
            className="text-sm"
          />
        </div>
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
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        {triggerButton}
        <DrawerContent>
          <div className={`max-h-[90vh] overflow-y-auto px-4 pb-8 ${scrollbarClasses}`}>
            <DrawerHeader className="px-0">
              <DrawerTitle className="text-xl font-black">Abonar a Deuda</DrawerTitle>
              <DrawerDescription className="text-sm">Registra un pago para reducir el saldo pendiente de esta deuda</DrawerDescription>
            </DrawerHeader>
            {formContent}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {triggerButton}
      <DialogContent className={`max-w-md w-[calc(100%-2rem)] sm:w-full max-h-[90vh] overflow-y-auto ${scrollbarClasses}`} onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="no-ios-zoom">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Abonar a Deuda</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Registra un pago para reducir el saldo pendiente de esta deuda
            </DialogDescription>
          </DialogHeader>
          {formContent}
        </div>
      </DialogContent>
    </Dialog>
  )
}
