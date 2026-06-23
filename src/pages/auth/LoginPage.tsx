import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { z } from '@/lib/validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingCheckOverlay } from '@/components/ui/loading-check'
import { FormFieldErrorRHF } from '@/components/ui/form-field-error-rhf'
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'

const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string>('')
  const [captchaVerified, setCaptchaVerified] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showFieldError, setShowFieldError] = useState<string | null>(null)
  const [submitAttempt, setSubmitAttempt] = useState(0)
  const turnstileRef = useRef<TurnstileInstance>(null)
  const navigate = useNavigate()
  const supabase = createClient()

  // Referencias para los campos del formulario (contenedores)
  const emailFieldRef = useRef<HTMLDivElement>(null)
  const passwordFieldRef = useRef<HTMLDivElement>(null)

  // Verificar si el captcha está habilitado
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || import.meta.env.VITE_RECAPTCHA_SITE_KEY
  const isCaptchaEnabled = !!turnstileSiteKey

  // Detectar el tema del sistema
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark')
      setIsDarkMode(isDark)
    }

    // Verificar inicialmente
    checkDarkMode()

    // Observar cambios en la clase del HTML
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit',
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // Detectar el primer error y mostrarlo solo después de intentar enviar
  useEffect(() => {
    // Solo mostrar errores si el formulario ya fue enviado al menos una vez
    if (!form.formState.isSubmitted) {
      setShowFieldError(null)
      return
    }

    const errors = form.formState.errors
    if (errors.email) {
      setShowFieldError('email')
    } else if (errors.password) {
      setShowFieldError('password')
    } else {
      setShowFieldError(null)
    }
  }, [form.formState.errors, form.formState.isSubmitted, submitAttempt])

  const handleTurnstileSuccess = (token: string) => {
    console.log('✅ Turnstile verificado exitosamente')
    console.log('🔑 Token recibido (primeros 20 chars):', token.substring(0, 20) + '...')
    setCaptchaToken(token)
    setCaptchaVerified(true)
  }

  const handleTurnstileError = (error?: any) => {
    console.error('❌ Error en Turnstile:', error)
    setCaptchaToken('')
    setCaptchaVerified(false)
  }

  const resetCaptcha = () => {
    turnstileRef.current?.reset()
    setCaptchaToken('')
    setCaptchaVerified(false)
  }

  const onSubmit = async (data: LoginFormData) => {
    // Limpiar error de campo anterior
    setShowFieldError(null)
    
    // Validar CAPTCHA si está habilitado
    if (isCaptchaEnabled && !captchaVerified) {
      form.setError('root', {
        type: 'manual',
        message: 'Por favor completa la verificación de seguridad'
      })
      return
    }

    setIsLoading(true)

    try {
      console.log('🔐 Intentando login con CAPTCHA...')
      console.log('📧 Email:', data.email)
      console.log('🎫 CAPTCHA habilitado:', isCaptchaEnabled)
      console.log('✅ CAPTCHA verificado:', captchaVerified)
      console.log('🔑 Token presente:', !!captchaToken)
      
      // Según la documentación de Supabase, el captchaToken debe ir en options
      // https://supabase.com/docs/guides/auth/auth-captcha
      const { error, data: authData } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
        options: {
          captchaToken: captchaToken,
        },
      })
      
      if (error) {
        console.error('❌ Error de Supabase:', error)
        // Resetear captcha en caso de error
        resetCaptcha()

        // Mostrar error específico en el formulario
        if (error.message.toLowerCase().includes('invalid login') || 
            error.message.toLowerCase().includes('invalid credentials')) {
          form.setError('root', {
            type: 'manual',
            message: 'Correo o contraseña incorrectos'
          })
        } else if (error.message.toLowerCase().includes('email not confirmed')) {
          form.setError('root', {
            type: 'manual',
            message: 'Por favor verifica tu correo electrónico'
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
      
      console.log('✅ Login exitoso:', authData?.user?.email)
      navigate('/dashboard')
    } catch (error: unknown) {
      // Resetear captcha en caso de error
      resetCaptcha()
      
      form.setError('root', {
        type: 'manual',
        message: error instanceof Error ? error.message : 'Error al iniciar sesión'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Si el login está en proceso, mostrar overlay completo para evitar pantalla en blanco
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-4">
        <LoadingCheckOverlay message="Iniciando sesión..." />
      </div>
    )
  }

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
            MarkeApp
          </CardTitle>
          <CardDescription className="text-center text-base font-medium">
            Ingresa tus credenciales para acceder a tu cuenta
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

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground data-[error=true]:text-foreground">
                      Correo Electrónico <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <div ref={emailFieldRef} className="relative">
                        <FormFieldErrorRHF 
                          error={form.formState.errors.email}
                          fieldRef={emailFieldRef}
                          fieldName="email"
                          showFieldError={showFieldError}
                          submitAttempt={submitAttempt}
                        />
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/60 pointer-events-none z-10" />
                          <Input
                            type="text"
                            placeholder="tu@email.com"
                            autoComplete="email"
                            disabled={isLoading}
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
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-sm font-medium text-foreground data-[error=true]:text-foreground">
                        Contraseña <span className="text-red-500">*</span>
                      </FormLabel>
                      <Link
                        to="/auth/forgot-password"
                        className="text-[13px] font-extrabold text-[#3B6EF6] dark:text-[#4D7DFF] hover:text-[#2F5BE0] transition-colors"
                      >
                        ¿Olvidaste tu contraseña?
                      </Link>
                    </div>
                    <FormControl>
                      <div ref={passwordFieldRef} className="relative">
                        <FormFieldErrorRHF 
                          error={form.formState.errors.password}
                          fieldRef={passwordFieldRef}
                          fieldName="password"
                          showFieldError={showFieldError}
                          submitAttempt={submitAttempt}
                        />
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/60 pointer-events-none z-10" />
                          <Input
                            type="password"
                            autoComplete="current-password"
                            disabled={isLoading}
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
                disabled={isLoading || (isCaptchaEnabled && !captchaVerified)}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Iniciando sesión...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="h-5 w-5" />
                  Iniciar Sesión
                </span>
              )}
            </Button>
          </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              ¿No tienes una cuenta?{' '}
              <Link 
                to="/auth/register" 
                className="text-primary font-semibold hover:text-primary/80 transition-colors hover:underline"
              >
                Regístrate aquí
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
