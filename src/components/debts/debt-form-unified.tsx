"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useNotification } from "@/hooks/use-notification"
import { getTodayLocal } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DateInput } from "@/components/ui/date-input"
import { FormFieldError } from "@/components/ui/form-field-error"
import { BigAmountInput, TileChipGrid, OptionalSection, FormStickyFooter } from "@/components/ui/form-chips"
import { getValidationMessage } from "@/lib/validation-messages"
import { Loader2, CreditCard, Landmark, Home, Car, GraduationCap, User, ShoppingCart, Smartphone, Stethoscope, Briefcase, Lightbulb, Building2, FileText } from "lucide-react"
import type { Debt } from "@/lib/types"

// Categorías de deudas predefinidas con iconos
const DEBT_CATEGORIES = [
  { value: 'credit_card', label: 'Tarjeta de Crédito', icon: CreditCard },
  { value: 'bank_loan', label: 'Préstamo Bancario', icon: Landmark },
  { value: 'mortgage', label: 'Hipoteca', icon: Home },
  { value: 'car_loan', label: 'Préstamo Vehicular', icon: Car },
  { value: 'student_loan', label: 'Préstamo Estudiantil', icon: GraduationCap },
  { value: 'personal_loan', label: 'Préstamo Personal', icon: User },
  { value: 'store_credit', label: 'Crédito Comercial', icon: ShoppingCart },
  { value: 'phone_plan', label: 'Plan Telefónico', icon: Smartphone },
  { value: 'medical', label: 'Médico/Salud', icon: Stethoscope },
  { value: 'business', label: 'Empresarial', icon: Briefcase },
  { value: 'utilities', label: 'Servicios Públicos', icon: Lightbulb },
  { value: 'rent', label: 'Arriendo/Alquiler', icon: Building2 },
  { value: 'other', label: 'Otro', icon: FileText },
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

  // Referencias para los campos del formulario (contenedores con relative)
  const creditorNameRef = useRef<HTMLDivElement>(null)
  const totalAmountRef = useRef<HTMLDivElement>(null)
  const dueDateRef = useRef<HTMLDivElement>(null)

  // Estados para errores de validación
  const [fieldErrors, setFieldErrors] = useState({
    creditor_name: '',
    total_amount: '',
    due_date: '',
  })
  const [showFieldError, setShowFieldError] = useState<string | null>(null)
  const [submitAttempt, setSubmitAttempt] = useState(0)

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

    // Incrementar contador de intentos de envío
    setSubmitAttempt(prev => prev + 1)

    // Limpiar errores previos
    setFieldErrors({
      creditor_name: '',
      total_amount: '',
      due_date: '',
    })
    setShowFieldError(null)
    setError(null)

    // Validaciones personalizadas
    const errors = {
      creditor_name: '',
      total_amount: '',
      due_date: '',
    }

    if (!formData.creditor_name.trim()) {
      errors.creditor_name = getValidationMessage('creditor_name')
    }

    if (!formData.total_amount.trim()) {
      errors.total_amount = getValidationMessage('amount')
    }

    if (!formData.due_date) {
      errors.due_date = getValidationMessage('due_date')
    }

    // Si hay errores, mostrar el primero
    const firstError = Object.entries(errors).find(([_, value]) => value !== '')
    if (firstError) {
      const [field] = firstError
      setFieldErrors(errors)
      setShowFieldError(field)
      return
    }

    setIsLoading(true)

    const supabase = createClient()

    try {
      const { formatDateLocal, parseLocalDate } = await import("@/lib/utils")
      const currentDate = getTodayLocal()
      const normalizedDueDate = formData.due_date ? formatDateLocal(parseLocalDate(formData.due_date)) : formatDateLocal(parseLocalDate(currentDate))
      const debtData: any = {
        name: formData.creditor_name,
        creditor: formData.creditor_name,
        total_amount: Number.parseInt(getNumericValue(formData.total_amount)),
        debt_date: normalizedDueDate,
        due_date: normalizedDueDate,
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
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      {/* Monto total protagonista */}
      <div ref={totalAmountRef} className="relative">
        <FormFieldError
          error={fieldErrors.total_amount}
          show={showFieldError === 'total_amount'}
          fieldRef={totalAmountRef}
          submitAttempt={submitAttempt}
        />
        <BigAmountInput
          id="total_amount"
          label="Monto total"
          value={formData.total_amount}
          onChange={(value) => {
            setFormData({ ...formData, total_amount: formatAmount(value) })
            if (fieldErrors.total_amount) {
              setFieldErrors({ ...fieldErrors, total_amount: '' })
              setShowFieldError(null)
            }
          }}
          disabled={isLoading}
        />
      </div>

      {/* Acreedor */}
      <div className="space-y-1.5">
        <Label htmlFor="creditor_name" className="text-xs sm:text-sm">Acreedor *</Label>
        <div ref={creditorNameRef} className="relative">
          <FormFieldError
            error={fieldErrors.creditor_name}
            show={showFieldError === 'creditor_name'}
            fieldRef={creditorNameRef}
            submitAttempt={submitAttempt}
          />
          <Input
            id="creditor_name"
            value={formData.creditor_name}
            onChange={(e) => {
              setFormData({ ...formData, creditor_name: e.target.value })
              if (fieldErrors.creditor_name) {
                setFieldErrors({ ...fieldErrors, creditor_name: '' })
                setShowFieldError(null)
              }
            }}
            placeholder="Ej: Banco XYZ"
            disabled={isLoading}
            className="text-sm sm:text-base h-10 sm:h-11 rounded-[14px]"
          />
        </div>
      </div>

      {/* Categoría: grilla de tiles */}
      <div className="space-y-1.5">
        <Label className="text-xs sm:text-sm">Categoría</Label>
        <TileChipGrid
          items={DEBT_CATEGORIES.map((c) => ({
            id: c.value,
            label: c.label,
            icon: <c.icon className="h-5 w-5" />,
          }))}
          value={formData.category}
          onChange={(id) =>
            setFormData({ ...formData, category: id === formData.category ? '' : id })
          }
          disabled={isLoading}
        />
      </div>

      {/* Fecha de vencimiento: calendario directo (es fecha futura, no aplican Hoy/Ayer) */}
      <div className="space-y-1.5">
        <Label htmlFor="due_date" className="text-xs sm:text-sm">Fecha de Vencimiento *</Label>
        <div ref={dueDateRef} className="relative">
          <FormFieldError
            error={fieldErrors.due_date}
            show={showFieldError === 'due_date'}
            fieldRef={dueDateRef}
            submitAttempt={submitAttempt}
          />
          <DateInput
            id="due_date"
            value={formData.due_date}
            onChange={(e) => {
              setFormData({ ...formData, due_date: e.target.value })
              if (fieldErrors.due_date) {
                setFieldErrors({ ...fieldErrors, due_date: '' })
                setShowFieldError(null)
              }
            }}
            disabled={isLoading}
            className="text-sm sm:text-base h-10 rounded-[14px]"
          />
        </div>
      </div>

      {/* Opcionales colapsados */}
      <OptionalSection label="Notas" defaultOpen={!!(debt && (debt.notes || debt.description))}>
        <div className="space-y-1.5">
          <Label htmlFor="notes" className="text-xs sm:text-sm">Notas</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Agrega detalles sobre la deuda..."
            rows={3}
            disabled={isLoading}
            className="text-sm sm:text-base resize-none rounded-[14px]"
          />
        </div>
      </OptionalSection>

      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
        </Alert>
      )}

      <FormStickyFooter>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 h-12 rounded-[14px] text-sm sm:text-base"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" className="flex-[2] h-12 rounded-[14px] text-[15px] font-bold" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Guardando..." : (debt ? "Guardar cambios" : "Guardar deuda")}
          </Button>
        </div>
      </FormStickyFooter>
    </form>
  )
}
