import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { createClient } from '@/lib/supabase/client'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { LoadingCheckOverlay } from '@/components/ui/loading-check'

// Pages
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import ExpensesPage from '@/pages/expenses/ExpensesPage'
import IncomesPage from '@/pages/incomes/IncomesPage'
import DebtsPage from '@/pages/debts/DebtsPage'
import ShoppingPage from '@/pages/shopping/ShoppingPage'
import ReportsPage from '@/pages/reports/ReportsPage'

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
    <ThemeProvider defaultTheme="system" storageKey="markeapp-theme">
      <Toaster />
      <Sonner />
      <Routes>
        {/* Public routes */}
        <Route path="/auth/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" />} />
        <Route path="/auth/register" element={!user ? <RegisterPage /> : <Navigate to="/dashboard" />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

        {/* Protected routes with layout */}
        <Route
          path="/dashboard"
          element={
            user ? (
              <DashboardLayout>
                <DashboardPage />
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
                <ExpensesPage />
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
                <IncomesPage />
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
                <DebtsPage />
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
                <ShoppingPage />
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
                <ReportsPage />
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
