import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { z } from '@/lib/validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UserPlus, Mail, Lock, CheckCircle2, AlertCircle } from 'lucide-react'

const registerSchema = z.object({
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

export default function RegisterPage() {
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const supabase = createClient()

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    setSuccess(false)

    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (error) {
        // Mostrar error específico en el formulario
        if (error.message.toLowerCase().includes('already registered') || 
            error.message.toLowerCase().includes('already exists')) {
          form.setError('email', {
            type: 'manual',
            message: 'Este correo ya está registrado'
          })
        } else if (error.message.toLowerCase().includes('password')) {
          form.setError('password', {
            type: 'manual',
            message: error.message
          })
        } else if (error.message.toLowerCase().includes('captcha')) {
          form.setError('root', {
            type: 'manual',
            message: 'Error de verificación. Por favor, ve a Supabase → Authentication → Providers → Email y desactiva el Captcha Protection.'
          })
        } else {
          form.setError('root', {
            type: 'manual',
            message: error.message
          })
        }
        return
      }

      setSuccess(true)
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
    } catch (error: unknown) {
      form.setError('root', {
        type: 'manual',
        message: error instanceof Error ? error.message : 'Error al registrar usuario'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <Card className="w-full max-w-md animate-fade-in-up shadow-2xl border-primary/20 relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        
        <CardHeader className="space-y-3 pb-6 relative z-10">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center shadow-lg mb-2 transition-transform hover:scale-110">
            <UserPlus className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Únete a MarketApp
          </CardTitle>
          <CardDescription className="text-center text-base">
            Ingresa tus datos para crear una nueva cuenta
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
                    ¡Cuenta creada exitosamente! Redirigiendo...
                  </AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Correo Electrónico</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                        <Input
                          type="email"
                          placeholder="tu@email.com"
                          autoComplete="email"
                          disabled={isLoading || success}
                          className="pl-10 h-11 transition-smooth focus:ring-2 focus:ring-primary/20"
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
                    <FormLabel className="text-sm font-medium">Contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                        <Input
                          type="password"
                          placeholder="Mínimo 6 caracteres"
                          autoComplete="new-password"
                          disabled={isLoading || success}
                          className="pl-10 h-11 transition-smooth focus:ring-2 focus:ring-primary/20"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs">
                      Debe contener mayúscula, minúscula y número
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Confirmar Contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                        <Input
                          type="password"
                          placeholder="Repite tu contraseña"
                          autoComplete="new-password"
                          disabled={isLoading || success}
                          className="pl-10 h-11 transition-smooth focus:ring-2 focus:ring-primary/20"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-11 text-base font-semibold transition-smooth hover:shadow-lg hover:scale-[1.02]" 
                disabled={isLoading || success}
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
                    <UserPlus className="h-5 w-5" />
                    Crear Cuenta
                </span>
              )}
            </Button>
          </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              ¿Ya tienes una cuenta?{' '}
              <Link 
                to="/auth/login" 
                className="text-primary font-semibold hover:text-primary/80 transition-colors hover:underline"
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
