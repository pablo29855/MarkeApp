import { useEffect, useState, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { createClient } from '@/lib/supabase/client'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { LoadingCheckOverlay } from '@/components/ui/loading-check'

// Lazy load pages for better performance
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'))
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'))
const ExpensesPage = lazy(() => import('@/pages/expenses/ExpensesPage'))
const IncomesPage = lazy(() => import('@/pages/incomes/IncomesPage'))
const DebtsPage = lazy(() => import('@/pages/debts/DebtsPage'))
const ShoppingPage = lazy(() => import('@/pages/shopping/ShoppingPage'))
const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage'))

// Loading component for lazy loaded pages
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingCheckOverlay message="Cargando página..." />
  </div>
)

function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    
    // Check active sessions
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    // Mostrar overlay de carga mientras se verifica la sesión activa
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingCheckOverlay message="Verificando sesión..." />
      </div>
    )
  }

  return (
    <ThemeProvider defaultTheme="light" storageKey="markeapp-theme">
      <Toaster />
      <Sonner />
      <Routes>
        {/* Public routes */}
        <Route path="/auth/login" element={!user ? <Suspense fallback={<PageLoader />}><LoginPage /></Suspense> : <Navigate to="/dashboard" />} />
        <Route path="/auth/register" element={!user ? <Suspense fallback={<PageLoader />}><RegisterPage /></Suspense> : <Navigate to="/dashboard" />} />
        <Route path="/auth/forgot-password" element={<Suspense fallback={<PageLoader />}><ForgotPasswordPage /></Suspense>} />
        <Route path="/auth/reset-password" element={<Suspense fallback={<PageLoader />}><ResetPasswordPage /></Suspense>} />

        {/* Protected routes with layout */}
        <Route
          path="/dashboard"
          element={
            user ? (
              <DashboardLayout>
                <Suspense fallback={<PageLoader />}>
                  <DashboardPage />
                </Suspense>
              </DashboardLayout>
            ) : (
              <Navigate to="/auth/login" />
            )
          }
        />
        <Route
          path="/expenses"
          element={
            user ? (
              <DashboardLayout>
                <Suspense fallback={<PageLoader />}>
                  <ExpensesPage />
                </Suspense>
              </DashboardLayout>
            ) : (
              <Navigate to="/auth/login" />
            )
          }
        />
        <Route
          path="/incomes"
          element={
            user ? (
              <DashboardLayout>
                <Suspense fallback={<PageLoader />}>
                  <IncomesPage />
                </Suspense>
              </DashboardLayout>
            ) : (
              <Navigate to="/auth/login" />
            )
          }
        />
        <Route
          path="/debts"
          element={
            user ? (
              <DashboardLayout>
                <Suspense fallback={<PageLoader />}>
                  <DebtsPage />
                </Suspense>
              </DashboardLayout>
            ) : (
              <Navigate to="/auth/login" />
            )
          }
        />
        <Route
          path="/shopping"
          element={
            user ? (
              <DashboardLayout>
                <Suspense fallback={<PageLoader />}>
                  <ShoppingPage />
                </Suspense>
              </DashboardLayout>
            ) : (
              <Navigate to="/auth/login" />
            )
          }
        />
        <Route
          path="/reports"
          element={
            user ? (
              <DashboardLayout>
                <Suspense fallback={<PageLoader />}>
                  <ReportsPage />
                </Suspense>
              </DashboardLayout>
            ) : (
              <Navigate to="/auth/login" />
            )
          }
        />

        {/* Root redirect */}
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/auth/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </ThemeProvider>
  )
}

export default App
