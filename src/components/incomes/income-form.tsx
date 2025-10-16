import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DateInput } from '@/components/ui/date-input'
import { FormFieldError } from '@/components/ui/form-field-error'
import { getValidationMessage } from '@/lib/validation-messages'
import { createClient } from '@/lib/supabase/client'
import { useNotification } from '@/hooks/use-notification'
import { getTodayLocal } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
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

  // Referencias para los campos del formulario
  const descriptionRef = useRef<HTMLInputElement>(null)
  const amountRef = useRef<HTMLInputElement>(null)
  const incomeTypeRef = useRef<HTMLDivElement>(null) // Contenedor del select
  const incomeDateRef = useRef<HTMLInputElement>(null)

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
        income_date: formData.income_date,
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
    { value: 'nomina', label: 'Nómina', icon: '💼' },
    { value: 'transferencia', label: 'Transferencia Bancaria', icon: '🏦' },
    { value: 'efectivo', label: 'Efectivo', icon: '💵' },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 mt-6">
      <div className="space-y-1.5 sm:space-y-2">
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
            className="text-sm sm:text-base h-9 sm:h-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-1.5 sm:space-y-2">
          <Label htmlFor="amount" className="text-xs sm:text-sm">Monto *</Label>
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
              onChange={(e) => {
                setFormData({ ...formData, amount: formatAmount(e.target.value) })
                if (fieldErrors.amount) {
                  setFieldErrors({ ...fieldErrors, amount: '' })
                  setShowFieldError(null)
                }
              }}
              placeholder="0"
              disabled={isLoading}
              className="text-sm sm:text-base h-9 sm:h-10"
            />
          </div>
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          <Label htmlFor="income_date" className="text-xs sm:text-sm">Fecha *</Label>
          <div ref={incomeDateRef} className="relative">
            <FormFieldError 
              error={fieldErrors.income_date}
              show={showFieldError === 'income_date'}
              fieldRef={incomeDateRef}
              submitAttempt={submitAttempt}
            />
            <DateInput
              id="income_date"
              value={formData.income_date}
              onChange={(e) => {
                setFormData({ ...formData, income_date: e.target.value })
                if (fieldErrors.income_date) {
                  setFieldErrors({ ...fieldErrors, income_date: '' })
                  setShowFieldError(null)
                }
              }}
              disabled={isLoading}
              className="text-sm sm:text-base h-9 sm:h-10"
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5 sm:space-y-2">
        <Label htmlFor="income_type" className="text-xs sm:text-sm">Tipo de Ingreso *</Label>
        <div ref={incomeTypeRef} className="relative">
          <FormFieldError 
            error={fieldErrors.income_type}
            show={showFieldError === 'income_type'}
            fieldRef={incomeTypeRef}
            submitAttempt={submitAttempt}
          />
          <Select
            value={formData.income_type}
            onValueChange={(value) => {
              setFormData({ ...formData, income_type: value as 'nomina' | 'transferencia' | 'efectivo' })
              if (fieldErrors.income_type) {
                setFieldErrors({ ...fieldErrors, income_type: '' })
                setShowFieldError(null)
              }
            }}
            disabled={isLoading}
          >
            <SelectTrigger id="income_type" className="h-9 sm:h-10 text-sm sm:text-base">
              <SelectValue placeholder="Selecciona un tipo" />
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={8} align="start">
              {incomeTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-sm sm:text-base cursor-pointer">
                  <span className="flex items-center gap-2">
                    <span>{option.icon}</span>
                    <span>{option.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5 sm:space-y-2">
        <Label htmlFor="notes" className="text-xs sm:text-sm">Notas (opcional)</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Información adicional..."
          rows={3}
          disabled={isLoading}
          className="text-sm sm:text-base resize-none"
        />
      </div>

      {error && (
        <Alert variant="destructive" className="animate-in fade-in-50 slide-in-from-top-2 duration-300">
          <AlertDescription className="text-xs sm:text-sm font-medium">{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="flex-1 h-9 sm:h-10 text-sm sm:text-base"
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" className="flex-1 h-9 sm:h-10 text-sm sm:text-base" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />}
          {isLoading ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </form>
  )
}
