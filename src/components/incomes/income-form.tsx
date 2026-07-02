import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FormFieldError } from '@/components/ui/form-field-error'
import {
  BigAmountInput,
  ChoiceChip,
  DateChipPicker,
  OptionalSection,
  FormStickyFooter,
} from '@/components/ui/form-chips'
import { getValidationMessage } from '@/lib/validation-messages'
import { createClient } from '@/lib/supabase/client'
import { useNotification } from '@/hooks/use-notification'
import { getTodayLocal, formatDateLocal, parseLocalDate } from '@/lib/utils'
import { Loader2, Briefcase, Landmark, Banknote } from 'lucide-react'
import type { Income } from '@/lib/types'

interface IncomeFormProps {
  onSuccess?: () => void
  income?: Income
  onClose?: () => void
}

export function IncomeForm({ onSuccess, income, onClose }: IncomeFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { showCreated, showUpdated, showError } = useNotification()

  // Referencias para los campos del formulario (contenedores con relative)
  const descriptionRef = useRef<HTMLDivElement>(null)
  const amountRef = useRef<HTMLDivElement>(null)
  const incomeTypeRef = useRef<HTMLDivElement>(null)
  const incomeDateRef = useRef<HTMLDivElement>(null)

  // Estados para errores de validación
  const [fieldErrors, setFieldErrors] = useState({
    description: '',
    amount: '',
    income_type: '',
    income_date: '',
  })
  const [showFieldError, setShowFieldError] = useState<string | null>(null)
  const [submitAttempt, setSubmitAttempt] = useState(0)

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
    description: income?.description || '',
    amount: income?.amount ? formatAmount(income.amount.toString()) : '',
    income_type: income?.income_type || '',
    income_date: income?.income_date || getTodayLocal(),
    notes: income?.notes || '',
  })

  // Actualizar formData cuando cambie el income (al editar)
  useEffect(() => {
    if (income) {
      setFormData({
        description: income.description || '',
        amount: formatAmount(income.amount.toString()),
        income_type: income.income_type || '',
        income_date: income.income_date || getTodayLocal(),
        notes: income.notes || '',
      })
    }
  }, [income])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Incrementar contador de intentos de envío
    setSubmitAttempt(prev => prev + 1)

    // Limpiar errores previos
    setFieldErrors({
      description: '',
      amount: '',
      income_type: '',
      income_date: '',
    })
    setShowFieldError(null)
    setError(null)

    // Validaciones personalizadas
    const errors = {
      description: '',
      amount: '',
      income_type: '',
      income_date: '',
    }

    if (!formData.description.trim()) {
      errors.description = getValidationMessage('description')
    }

    if (!formData.amount.trim()) {
      errors.amount = getValidationMessage('amount')
    }

    if (!formData.income_type) {
      errors.income_type = getValidationMessage('income_type')
    }

    if (!formData.income_date) {
      errors.income_date = getValidationMessage('income_date')
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

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('Debes iniciar sesión')
        return
      }

      const incomeData = {
        user_id: user.id,
        description: formData.description,
        amount: Number.parseInt(getNumericValue(formData.amount)),
        income_type: formData.income_type,
        // Normalizar fecha para evitar shifts de zona horaria en la DB
        income_date: formatDateLocal(parseLocalDate(formData.income_date)),
        notes: formData.notes || null,
      }

      let result

      if (income?.id) {
        // Actualizar
        result = await supabase
          .from('incomes')
          .update(incomeData)
          .eq('id', income.id)
      } else {
        // Crear
        result = await supabase
          .from('incomes')
          .insert([incomeData])
      }

      if (result.error) throw result.error

      if (income?.id) {
        showUpdated('Ingreso')
      } else {
        showCreated('Ingreso')
      }

      onSuccess?.()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar el ingreso'
      setError(errorMessage)
      showError('Error al guardar', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const incomeTypeOptions = [
    { value: 'nomina', label: 'Nómina', icon: <Briefcase className="h-4 w-4 text-primary" /> },
    { value: 'transferencia', label: 'Transferencia Bancaria', icon: <Landmark className="h-4 w-4 text-primary" /> },
    { value: 'efectivo', label: 'Efectivo', icon: <Banknote className="h-4 w-4 text-primary" /> },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      {/* Monto protagonista */}
      <div ref={amountRef} className="relative">
        <FormFieldError
          error={fieldErrors.amount}
          show={showFieldError === 'amount'}
          fieldRef={amountRef}
          submitAttempt={submitAttempt}
        />
        <BigAmountInput
          id="amount"
          value={formData.amount}
          onChange={(value) => {
            setFormData({ ...formData, amount: formatAmount(value) })
            if (fieldErrors.amount) {
              setFieldErrors({ ...fieldErrors, amount: '' })
              setShowFieldError(null)
            }
          }}
          disabled={isLoading}
        />
      </div>

      {/* Descripción */}
      <div className="space-y-1.5">
        <Label htmlFor="description" className="text-xs sm:text-sm">Descripción *</Label>
        <div ref={descriptionRef} className="relative">
          <FormFieldError
            error={fieldErrors.description}
            show={showFieldError === 'description'}
            fieldRef={descriptionRef}
            submitAttempt={submitAttempt}
          />
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => {
              setFormData({ ...formData, description: e.target.value })
              if (fieldErrors.description) {
                setFieldErrors({ ...fieldErrors, description: '' })
                setShowFieldError(null)
              }
            }}
            placeholder="Ej: Pago de salario, Cliente XYZ..."
            disabled={isLoading}
            className="text-sm sm:text-base h-10 sm:h-11 rounded-[14px]"
            autoFocus={showFieldError === 'description'}
          />
        </div>
      </div>

      {/* Tipo de ingreso: 3 chips, un tap */}
      <div className="space-y-1.5">
        <Label className="text-xs sm:text-sm">Tipo de Ingreso *</Label>
        <div ref={incomeTypeRef} className="relative">
          <FormFieldError
            error={fieldErrors.income_type}
            show={showFieldError === 'income_type'}
            fieldRef={incomeTypeRef}
            submitAttempt={submitAttempt}
          />
          <div className="flex flex-wrap gap-2">
            {incomeTypeOptions.map((option) => (
              <ChoiceChip
                key={option.value}
                selected={formData.income_type === option.value}
                onClick={() => {
                  setFormData({ ...formData, income_type: option.value as 'nomina' | 'transferencia' | 'efectivo' })
                  if (fieldErrors.income_type) {
                    setFieldErrors({ ...fieldErrors, income_type: '' })
                    setShowFieldError(null)
                  }
                }}
                disabled={isLoading}
              >
                {option.icon}
                {option.label}
              </ChoiceChip>
            ))}
          </div>
        </div>
      </div>

      {/* Fecha: chips Hoy / Ayer / Otra */}
      <div className="space-y-1.5">
        <Label className="text-xs sm:text-sm">Fecha *</Label>
        <div ref={incomeDateRef} className="relative">
          <FormFieldError
            error={fieldErrors.income_date}
            show={showFieldError === 'income_date'}
            fieldRef={incomeDateRef}
            submitAttempt={submitAttempt}
          />
          <DateChipPicker
            id="income_date"
            value={formData.income_date}
            onChange={(value) => {
              setFormData({ ...formData, income_date: value })
              if (fieldErrors.income_date) {
                setFieldErrors({ ...fieldErrors, income_date: '' })
                setShowFieldError(null)
              }
            }}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Opcionales colapsados */}
      <OptionalSection label="Notas" defaultOpen={!!income?.notes}>
        <div className="space-y-1.5">
          <Label htmlFor="notes" className="text-xs sm:text-sm">Notas</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Información adicional..."
            rows={3}
            disabled={isLoading}
            className="text-sm sm:text-base resize-none rounded-[14px]"
          />
        </div>
      </OptionalSection>

      {error && (
        <Alert variant="destructive" className="animate-in fade-in-50 slide-in-from-top-2 duration-300">
          <AlertDescription className="text-xs sm:text-sm font-medium">{error}</AlertDescription>
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
            {isLoading ? "Guardando..." : income ? "Guardar cambios" : "Guardar ingreso"}
          </Button>
        </div>
      </FormStickyFooter>
    </form>
  )
}
