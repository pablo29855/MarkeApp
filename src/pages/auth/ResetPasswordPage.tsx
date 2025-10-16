import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FormFieldError } from '@/components/ui/form-field-error'
import { getValidationMessage } from '@/lib/validation-messages'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({})
  const [showFieldError, setShowFieldError] = useState<string | null>(null)
  
  const passwordRef = useRef<HTMLInputElement>(null)
  const confirmPasswordRef = useRef<HTMLInputElement>(null)
  
  const navigate = useNavigate()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Limpiar errores previos
    setFieldErrors({})
    setShowFieldError(null)
    setError(null)
    setSuccess(false)

    // Validación de campos
    const errors: { [key: string]: string } = {}

    if (!password) {
      errors.password = getValidationMessage('password', 'required')
    } else if (password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres'
    }

    if (!confirmPassword) {
      errors.confirmPassword = getValidationMessage('confirmPassword', 'required')
    }

    if (password && confirmPassword && password !== confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden'
    }

    // Si hay errores, mostrarlos
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      const firstErrorField = Object.keys(errors)[0]
      setShowFieldError(firstErrorField)
      return
    }

    setIsLoading(true)

    const supabase = createClient()

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) throw error

      setSuccess(true)
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Error al restablecer la contraseña')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Nueva Contraseña</CardTitle>
          <CardDescription className="text-center">Ingresa tu nueva contraseña</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <FormFieldError
              fieldRef={passwordRef}
              error={fieldErrors.password}
              show={showFieldError === 'password'}
            />
            <FormFieldError
              fieldRef={confirmPasswordRef}
              error={fieldErrors.confirmPassword}
              show={showFieldError === 'confirmPassword'}
            />

            <div className="space-y-2">
              <Label htmlFor="password">
                Nueva Contraseña <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={passwordRef}
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  // Limpiar error solo al escribir
                  if (fieldErrors.password) {
                    setFieldErrors(prev => ({ ...prev, password: '' }))
                    if (showFieldError === 'password') {
                      setShowFieldError(null)
                    }
                  }
                }}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirmar Contraseña <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={confirmPasswordRef}
                id="confirmPassword"
                type="password"
                placeholder="Repite tu contraseña"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  // Limpiar error solo al escribir
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors(prev => ({ ...prev, confirmPassword: '' }))
                    if (showFieldError === 'confirmPassword') {
                      setShowFieldError(null)
                    }
                  }
                }}
                disabled={isLoading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 text-green-900 border-green-200">
                <AlertDescription>¡Contraseña actualizada! Redirigiendo...</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
