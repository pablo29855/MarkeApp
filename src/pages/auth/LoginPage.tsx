import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { z } from '@/lib/validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingCheckOverlay } from '@/components/ui/loading-check'
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
  const turnstileRef = useRef<TurnstileInstance>(null)
  const navigate = useNavigate()
  const supabase = createClient()

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
    mode: 'onBlur',
    defaultValues: {
      email: '',
      password: '',
    },
  })

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <Card className="w-full max-w-md animate-fade-in-up shadow-2xl border-primary/20 relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        
        <CardHeader className="space-y-3 pb-6 relative z-10">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center shadow-lg mb-2 transition-transform hover:scale-110">
            <LogIn className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Bienvenido de nuevo
          </CardTitle>
          <CardDescription className="text-center text-base">
            Ingresa tus credenciales para acceder a tu cuenta
          </CardDescription>
        </CardHeader>
        
        <CardContent className="relative z-10">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                    <FormLabel className="text-sm font-medium text-foreground data-[error=true]:text-foreground">Correo Electrónico</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/60 pointer-events-none" />
                        <Input
                          type="email"
                          placeholder="tu@email.com"
                          autoComplete="email"
                          disabled={isLoading}
                          className="pl-10 h-11 transition-smooth bg-white dark:bg-white/5 border border-slate-200 dark:border-neutral-700 rounded-md shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder:text-slate-400 dark:placeholder:text-slate-500"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-sm font-medium text-foreground data-[error=true]:text-foreground">Contraseña</FormLabel>
                      <Link
                        to="/auth/forgot-password"
                        className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                      >
                        ¿Olvidaste tu contraseña?
                      </Link>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/60 pointer-events-none" />
                        <Input
                          type="password"
                          autoComplete="current-password"
                          disabled={isLoading}
                          className="pl-10 h-11 transition-smooth bg-white dark:bg-white/5 border border-slate-200 dark:border-neutral-700 rounded-md shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder:text-slate-400 dark:placeholder:text-slate-500"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
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
                className="w-full h-11 text-base font-semibold transition-smooth hover:shadow-lg hover:scale-[1.02]" 
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
