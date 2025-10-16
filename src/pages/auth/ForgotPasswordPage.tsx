import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { z } from '@/lib/validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Mail, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'

const forgotPasswordSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string>('')
  const [captchaVerified, setCaptchaVerified] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const turnstileRef = useRef<TurnstileInstance>(null)
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

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
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

  const onSubmit = async (data: ForgotPasswordFormData) => {
    // Validar CAPTCHA si está habilitado
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
      console.log('🔐 Enviando correo de recuperación con CAPTCHA...')
      console.log('📧 Email:', data.email)
      console.log('🎫 CAPTCHA habilitado:', isCaptchaEnabled)
      console.log('✅ CAPTCHA verificado:', captchaVerified)
      console.log('🔑 Token presente:', !!captchaToken)

      // Supabase enviará el correo solo si el email existe
      // No hay forma de verificar si existe sin exponer información sensible
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
        captchaToken: captchaToken,
      })

      if (error) {
        console.error('❌ Error de Supabase:', error)
        // Resetear captcha en caso de error
        resetCaptcha()

        if (error.message.toLowerCase().includes('captcha')) {
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

      console.log('✅ Si el correo existe, se enviará el enlace de recuperación')
      // Por seguridad, siempre mostramos el mensaje de éxito
      // incluso si el correo no existe (para no exponer información de usuarios)
      // Supabase solo envía el correo si el usuario realmente existe en auth.users
      setSuccess(true)
    } catch (error: unknown) {
      // Resetear captcha en caso de error
      resetCaptcha()
      
      form.setError('root', {
        type: 'manual',
        message: error instanceof Error ? error.message : 'Error al enviar el correo de recuperación'
      })
    } finally {
      setIsLoading(false)
    }
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
            <KeyRound className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Recuperar Contraseña
          </CardTitle>
          <CardDescription className="text-center text-base">
            Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña
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

              {success && (
                <Alert className="bg-green-50 dark:bg-green-950/20 text-green-900 dark:text-green-400 border-green-200 dark:border-green-900 animate-fade-in">
                  <CheckCircle2 className="h-5 w-5" />
                  <AlertDescription className="ml-2">
                    Si el correo está registrado, recibirás un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada.
                  </AlertDescription>
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
                          disabled={isLoading || success}
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
                disabled={isLoading || success || (isCaptchaEnabled && !captchaVerified)}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Enviando...
                  </span>
                ) : success ? (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Correo enviado
                  </span>
                ) : (
                  'Enviar Enlace de Recuperación'
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6">
            <Link
              to="/auth/login"
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio de sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
