"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useNotification } from "@/hooks/use-notification"
import { getTodayLocal } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DateInput } from "@/components/ui/date-input"
import { Loader2 } from "lucide-react"
import type { Debt } from "@/lib/types"

// Categorías de deudas predefinidas con emojis coloridos
const DEBT_CATEGORIES = [
  { value: 'credit_card', label: 'Tarjeta de Crédito', icon: '💳' },
  { value: 'bank_loan', label: 'Préstamo Bancario', icon: '🏦' },
  { value: 'mortgage', label: 'Hipoteca', icon: '🏠' },
  { value: 'car_loan', label: 'Préstamo Vehicular', icon: '🚗' },
  { value: 'student_loan', label: 'Préstamo Estudiantil', icon: '🎓' },
  { value: 'personal_loan', label: 'Préstamo Personal', icon: '👤' },
  { value: 'store_credit', label: 'Crédito Comercial', icon: '🛒' },
  { value: 'phone_plan', label: 'Plan Telefónico', icon: '📱' },
  { value: 'medical', label: 'Médico/Salud', icon: '⚕️' },
  { value: 'business', label: 'Empresarial', icon: '💼' },
  { value: 'utilities', label: 'Servicios Públicos', icon: '💡' },
  { value: 'rent', label: 'Arriendo/Alquiler', icon: '🏢' },
  { value: 'other', label: 'Otro', icon: '📋' },
]

interface DebtFormUnifiedProps {
  userId: string
  debt?: Debt
  onSuccess?: () => void
  onClose?: () => void
}

export function DebtFormUnified({ userId, debt, onSuccess, onClose }: DebtFormUnifiedProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { showCreated, showSuccess, showError } = useNotification()

  // Función para formatear el monto con puntos de mil (formato colombiano)
  const formatAmount = (value: string) => {
    const cleanValue = value.replace(/\D/g, '')
    if (!cleanValue) return ''
    return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  const getNumericValue = (formattedValue: string) => {
    return formattedValue.replace(/\./g, '')
  }

  const [formData, setFormData] = useState({
    creditor_name: "",
    total_amount: "",
    due_date: getTodayLocal(),
    category: "",
    notes: "",
  })

  // Cargar datos cuando se está editando
  useEffect(() => {
    if (debt) {
      setFormData({
        creditor_name: debt.name || debt.creditor || "",
        total_amount: formatAmount(debt.total_amount.toString()),
        due_date: debt.debt_date || getTodayLocal(),
        category: debt.category || "",
        notes: debt.notes || debt.description || "",
      })
    } else {
      // Reset al crear una nueva deuda
      setFormData({
        creditor_name: "",
        total_amount: "",
        due_date: getTodayLocal(),
        category: "",
        notes: "",
      })
    }
  }, [debt])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const currentDate = getTodayLocal()
      
      const debtData: any = {
        name: formData.creditor_name,
        creditor: formData.creditor_name,
        total_amount: Number.parseInt(getNumericValue(formData.total_amount)),
        debt_date: formData.due_date || currentDate,
        due_date: formData.due_date || currentDate,
        status: 'active', // Estado inicial
      }

      // Solo agregar campos opcionales si tienen contenido
      if (formData.category && formData.category.trim()) {
        debtData.category = formData.category
      }
      
      if (formData.notes && formData.notes.trim()) {
        debtData.notes = formData.notes
      }

      if (debt?.id) {
        // Update
        const { error } = await supabase
          .from("debts")
          .update(debtData)
          .eq("id", debt.id)

        if (error) throw error

        showSuccess("Deuda actualizada")
      } else {
        // Insert
        const { error } = await supabase
          .from("debts")
          .insert({
            ...debtData,
            user_id: userId,
            paid_amount: 0,
          })

        if (error) throw error

        showCreated("Deuda")
      }
      
      setFormData({
        creditor_name: "",
        total_amount: "",
        due_date: getTodayLocal(),
        category: "",
        notes: "",
      })
      onSuccess?.()
      onClose?.()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : `Error al ${debt ? "actualizar" : "crear"} la deuda`
      setError(errorMessage)
      showError("Error al guardar", errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 mt-6">
      <div className="space-y-1.5 sm:space-y-2">
        <Label htmlFor="creditor_name" className="text-xs sm:text-sm">Acreedor *</Label>
        <Input
          id="creditor_name"
          value={formData.creditor_name}
          onChange={(e) => setFormData({ ...formData, creditor_name: e.target.value })}
          placeholder="Ej: Banco XYZ"
          required
          disabled={isLoading}
          className="text-sm sm:text-base h-9 sm:h-10"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-1.5 sm:space-y-2">
          <Label htmlFor="total_amount" className="text-xs sm:text-sm">Monto Total *</Label>
          <Input
            id="total_amount"
            type="text"
            inputMode="numeric"
            value={formData.total_amount}
            onChange={(e) => setFormData({ ...formData, total_amount: formatAmount(e.target.value) })}
            placeholder="0"
            required
            disabled={isLoading}
            className="text-sm sm:text-base h-9 sm:h-10"
          />
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          <Label htmlFor="due_date" className="text-xs sm:text-sm">Fecha de Vencimiento *</Label>
          <DateInput
            id="due_date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            disabled={isLoading}
            required
            className="text-sm sm:text-base"
          />
        </div>
      </div>

      <div className="space-y-1.5 sm:space-y-2">
        <Label htmlFor="category" className="text-xs sm:text-sm">Categoría</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value })}
          disabled={isLoading}
        >
          <SelectTrigger id="category" className="h-9 sm:h-10 text-sm sm:text-base">
            <SelectValue placeholder="Selecciona una categoría" />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={8} align="start">
            {DEBT_CATEGORIES.map((category) => (
              <SelectItem key={category.value} value={category.value} className="cursor-pointer text-sm sm:text-base">
                <span className="flex items-center gap-2">
                  <span>{category.icon}</span>
                  <span>{category.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5 sm:space-y-2">
        <Label htmlFor="notes" className="text-xs sm:text-sm">Notas</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Agrega detalles sobre la deuda..."
          rows={3}
          disabled={isLoading}
          className="text-sm sm:text-base resize-none"
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
          onClick={onClose}
          className="flex-1 text-sm sm:text-base h-9 sm:h-10"
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" className="flex-1 text-sm sm:text-base h-9 sm:h-10" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />}
          {isLoading ? "Guardando..." : (debt ? "Actualizar" : "Guardar")}
        </Button>
      </div>
    </form>
  )
}
