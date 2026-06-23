import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { z } from '@/lib/validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FormFieldErrorRHF } from '@/components/ui/form-field-error-rhf'
import { User, Mail, Lock, CheckCircle2, AlertCircle } from 'lucide-react'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'

const registerSchema = z.object({
  name: z.string().min(2, "El nombre es muy corto"),
  email: z.string().email("Correo electrónico inválido"),
  password: z.string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Debe contener mayúscula, minúscula y número"),
  confirmPassword: z.string().min(1, "La confirmación es obligatoria"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
})

type RegisterFormData = z.infer<typeof registerSchema>

function calculatePasswordStrength(password: string): number {
  if (!password) return 0
  let strength = 0
  if (password.length >= 6) strength += 1
  if (/(?=.*[a-z])/.test(password)) strength += 1
  if (/(?=.*[A-Z])/.test(password)) strength += 1
  if (/(?=.*\d)/.test(password)) strength += 1
  return strength
}

export default function RegisterPage() {
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string>('')
  const [captchaVerified, setCaptchaVerified] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showFieldError, setShowFieldError] = useState<string | null>(null)
  const [submitAttempt, setSubmitAttempt] = useState(0)
  const turnstileRef = useRef<TurnstileInstance>(null)
  const navigate = useNavigate()
  const supabase = createClient()

  const nameFieldRef = useRef<HTMLDivElement>(null)
  const emailFieldRef = useRef<HTMLDivElement>(null)
  const passwordFieldRef = useRef<HTMLDivElement>(null)
  const confirmPasswordFieldRef = useRef<HTMLDivElement>(null)

  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || import.meta.env.VITE_RECAPTCHA_SITE_KEY
  const isCaptchaEnabled = !!turnstileSiteKey

  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark')
      setIsDarkMode(isDark)
    }
    checkDarkMode()
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => observer.disconnect()
  }, [])

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onSubmit',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    if (!form.formState.isSubmitted) {
      setShowFieldError(null)
      return
    }
    const errors = form.formState.errors
    if (errors.name) {
      setShowFieldError('name')
    } else if (errors.email) {
      setShowFieldError('email')
    } else if (errors.password) {
      setShowFieldError('password')
    } else if (errors.confirmPassword) {
      setShowFieldError('confirmPassword')
    } else {
      setShowFieldError(null)
    }
  }, [form.formState.errors, form.formState.isSubmitted, submitAttempt])

  const handleTurnstileSuccess = (token: string) => {
    setCaptchaToken(token)
    setCaptchaVerified(true)
  }

  const handleTurnstileError = (_error?: any) => {
    setCaptchaToken('')
    setCaptchaVerified(false)
  }

  const resetCaptcha = () => {
    turnstileRef.current?.reset()
    setCaptchaToken('')
    setCaptchaVerified(false)
  }

  const onSubmit = async (data: RegisterFormData) => {
    setShowFieldError(null)
    
    if (isCaptchaEnabled && !captchaVerified) {
      form.setError('root', {
        type: 'manual',
        message: 'Por favor completa la verificación de seguridad'
      })
      return
    }

    setIsLoading(true)
    setSuccess(false)

    try {
      const { error, data: authData } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.name
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
          captchaToken: captchaToken,
        },
      })

      if (error) {
        resetCaptcha()
        if (error.message.toLowerCase().includes('already registered') || 
            error.message.toLowerCase().includes('already exists') ||
            error.message.toLowerCase().includes('user already registered')) {
          form.setError('email', {
            type: 'manual',
            message: 'Este correo electrónico ya está registrado'
          })
        } else if (error.message.toLowerCase().includes('password')) {
          form.setError('password', {
            type: 'manual',
            message: error.message
          })
        } else if (error.message.toLowerCase().includes('captcha')) {
          form.setError('root', {
            type: 'manual',
            message: 'Error de verificación del captcha. Por favor intenta nuevamente.'
          })
        } else {
          form.setError('root', {
            type: 'manual',
            message: error.message
          })
        }
        return
      }

      if (authData?.user && authData.user.identities && authData.user.identities.length === 0) {
        resetCaptcha()
        form.setError('email', {
          type: 'manual',
          message: 'Este correo electrónico ya está registrado'
        })
        return
      }

      setSuccess(true)
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
    } catch (error: unknown) {
      resetCaptcha()
      form.setError('root', {
        type: 'manual',
        message: error instanceof Error ? error.message : 'Error al registrar usuario'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const watchPassword = form.watch("password", "")
  const passwordStrength = calculatePasswordStrength(watchPassword)

  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden">
      {/* Background circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -right-10 w-80 h-80 bg-[#6C7BFF]/20 dark:bg-[#6C7BFF]/10 rounded-full blur-[80px]" />
        <div className="absolute top-1/3 -left-20 w-[400px] h-[400px] bg-[#FFC24B]/20 dark:bg-[#FFC24B]/10 rounded-full blur-[100px]" />
      </div>

      <Card className="w-full max-w-md animate-fade-in-up shadow-card border-border/50 relative z-10 overflow-hidden rounded-[24px] bg-card/80 backdrop-blur-md">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        
        <CardHeader className="space-y-3 pb-6 relative z-10">
          <div className="mx-auto w-[72px] h-[72px] bg-brand-grad-soft rounded-[24px] flex items-center justify-center shadow-hero mb-2 transition-transform hover:scale-110">
            <span className="text-3xl font-black text-white">M</span>
          </div>
          <CardTitle className="text-[26px] font-black text-center text-foreground">
            Crea tu cuenta
          </CardTitle>
          <CardDescription className="text-center text-base font-medium">
            Ingresa tus datos para registrarte
          </CardDescription>
        </CardHeader>
        
        <CardContent className="relative z-10">
          <Form {...form}>
            <form onSubmit={(e) => {
              e.preventDefault()
              setSubmitAttempt(prev => prev + 1)
              form.handleSubmit(onSubmit)(e)
            }} className="space-y-5" noValidate>
              {form.formState.errors.root && (
                <Alert variant="destructive" className="animate-fade-in">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-50 dark:bg-green-950/20 text-green-900 dark:text-green-400 border-green-200 dark:border-green-900 animate-fade-in">
                  <CheckCircle2 className="h-5 w-5" />
                  <AlertDescription className="ml-2">
                    ¡Cuenta creada exitosamente! Redirigiendo...
                  </AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground data-[error=true]:text-foreground">
                      Nombre <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative" ref={nameFieldRef}>
                        <FormFieldErrorRHF 
                          fieldRef={nameFieldRef} 
                          error={form.formState.errors.name} 
                          fieldName="name"
                          showFieldError={showFieldError}
                          submitAttempt={submitAttempt}
                        />
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/60 pointer-events-none z-10" />
                        <Input
                          type="text"
                          placeholder="Tu nombre"
                          autoComplete="name"
                          disabled={isLoading || success}
                          className="pl-10 h-[52px] rounded-[16px] border-[1.5px] border-border bg-white dark:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 transition-smooth text-foreground shadow-sm"
                          {...field}
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground data-[error=true]:text-foreground">
                      Correo Electrónico <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative" ref={emailFieldRef}>
                        <FormFieldErrorRHF 
                          fieldRef={emailFieldRef} 
                          error={form.formState.errors.email} 
                          fieldName="email"
                          showFieldError={showFieldError}
                          submitAttempt={submitAttempt}
                        />
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/60 pointer-events-none z-10" />
                        <Input
                          type="text"
                          placeholder="tu@email.com"
                          autoComplete="email"
                          disabled={isLoading || success}
                          className="pl-10 h-[52px] rounded-[16px] border-[1.5px] border-border bg-white dark:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 transition-smooth text-foreground shadow-sm"
                          {...field}
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground data-[error=true]:text-foreground">
                      Contraseña <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative" ref={passwordFieldRef}>
                        <FormFieldErrorRHF 
                          fieldRef={passwordFieldRef} 
                          error={form.formState.errors.password} 
                          fieldName="password"
                          showFieldError={showFieldError}
                          submitAttempt={submitAttempt}
                        />
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/60 pointer-events-none z-10" />
                        <Input
                          type="password"
                          placeholder="Mínimo 6 caracteres"
                          autoComplete="new-password"
                          disabled={isLoading || success}
                          className="pl-10 h-[52px] rounded-[16px] border-[1.5px] border-border bg-white dark:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 transition-smooth text-foreground shadow-sm"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <div className="mt-2 flex gap-1">
                      {[1, 2, 3, 4].map((level) => {
                        let bgColor = "bg-muted"
                        if (passwordStrength >= level) {
                          if (passwordStrength <= 2) bgColor = "bg-amber-400"
                          else bgColor = "bg-[#3B6EF6]"
                        }
                        return (
                          <div 
                            key={level} 
                            className={`h-1.5 flex-1 rounded-full transition-colors ${bgColor}`} 
                          />
                        )
                      })}
                    </div>
                    <FormDescription className="text-[11px] text-muted-foreground">
                      Usa al menos 6 caracteres, mayúsculas, minúsculas y números.
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground data-[error=true]:text-foreground">
                      Confirmar Contraseña <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative" ref={confirmPasswordFieldRef}>
                        <FormFieldErrorRHF 
                          fieldRef={confirmPasswordFieldRef} 
                          error={form.formState.errors.confirmPassword} 
                          fieldName="confirmPassword"
                          showFieldError={showFieldError}
                          submitAttempt={submitAttempt}
                        />
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/60 pointer-events-none z-10" />
                        <Input
                          type="password"
                          placeholder="Repite tu contraseña"
                          autoComplete="new-password"
                          disabled={isLoading || success}
                          className="pl-10 h-[52px] rounded-[16px] border-[1.5px] border-border bg-white dark:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 transition-smooth text-foreground shadow-sm"
                          {...field}
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              {isCaptchaEnabled && (
                <div className="flex justify-center w-full">
                  <Turnstile
                    ref={turnstileRef}
                    siteKey={turnstileSiteKey}
                    onSuccess={handleTurnstileSuccess}
                    onError={handleTurnstileError}
                    options={{
                      theme: isDarkMode ? 'dark' : 'light',
                      size: 'normal',
                    }}
                  />
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-[56px] rounded-[18px] bg-brand-grad text-white font-black text-base shadow-button-pop transition-transform hover:scale-[1.02] active:scale-[0.98]" 
                disabled={isLoading || success || (isCaptchaEnabled && !captchaVerified)}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Creando cuenta...
                  </span>
                ) : success ? (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Cuenta creada
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Crear Cuenta
                  </span>
              )}
            </Button>
          </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-[13px] text-muted-foreground font-medium">
              ¿Ya tienes una cuenta?{' '}
              <Link 
                to="/auth/login" 
                className="font-extrabold text-[#3B6EF6] dark:text-[#4D7DFF] hover:text-[#2F5BE0] transition-colors"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
