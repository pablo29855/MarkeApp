import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DebtCard } from '@/components/debts/debt-card'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingCheckOverlay } from '@/components/ui/loading-check'
import { SkeletonDebtList, SkeletonDebtStats } from '@/components/ui/skeleton-debt'
import { formatCurrency } from '@/lib/utils'
import { CreditCard, CircleCheck, AlertCircle } from 'lucide-react'
import type { Debt, DebtPayment } from '@/lib/types'
import { DebtFormWrapper } from '@/components/debts/debt-form-wrapper'

export default function DebtsPage() {
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [debtsWithPayments, setDebtsWithPayments] = useState<{ debt: Debt; payments: DebtPayment[] }[]>([])
  const [userId, setUserId] = useState<string>('')

  const fetchDebtsWithPayments = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { data: debts } = await supabase
        .from('debts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      const debtsData = (debts || []) as Debt[]

      const debtsWithPaymentsData = await Promise.all(
        debtsData.map(async (debt) => {
          const { data: payments } = await supabase
            .from('debt_payments')
            .select('*')
            .eq('debt_id', debt.id)
            .order('payment_date', { ascending: false })

          return {
            debt,
            payments: (payments || []) as DebtPayment[],
          }
        })
      )

      setDebtsWithPayments(debtsWithPaymentsData)
    } catch (error) {
      console.error('[Debts] Error fetching data:', error)
    }
  }, [])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await fetchDebtsWithPayments()
    setTimeout(() => setIsRefreshing(false), 300)
  }, [fetchDebtsWithPayments])

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return

        setUserId(user.id)
        await fetchDebtsWithPayments()
      } catch (error) {
        console.error('[Debts] Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [fetchDebtsWithPayments])

  // Suscripción en tiempo real para debts
  useEffect(() => {
    if (!userId) return

    const supabase = createClient()
    
    const channel = supabase
      .channel('debts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'debts',
          filter: `user_id=eq.${userId}`
        },
        () => {
          handleRefresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, handleRefresh])

  // Suscripción en tiempo real para debt_payments
  useEffect(() => {
    if (!userId) return

    const supabase = createClient()
    
    const channel = supabase
      .channel('debt-payments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'debt_payments',
        },
        () => {
          handleRefresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, handleRefresh])

  if (loading) {
    return <LoadingCheckOverlay message="Cargando deudas..." />
  }

  const debts = debtsWithPayments.map((d) => d.debt)
  const totalDebt = debts.reduce((sum, debt) => sum + Number(debt.total_amount), 0)
  const totalPaid = debts.reduce((sum, debt) => sum + Number(debt.paid_amount), 0)
  const totalRemaining = totalDebt - totalPaid

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="sticky top-16 lg:top-0 z-20 bg-background pb-2 -mt-2 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">Deudas</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Gestiona tus deudas y pagos parciales</p>
          </div>
          <div className="flex gap-2 self-end sm:self-auto">
            <DebtFormWrapper userId={userId} onSuccess={handleRefresh} />
          </div>
        </div>
      </div>

      {isRefreshing ? (
        <>
          <SkeletonDebtStats />
          <SkeletonDebtList count={debtsWithPayments.length || 3} />
        </>
      ) : (
        <>
          {/* Stats Cards - Ultra Compactas en Móvil */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
              {/* Total de Deudas */}
              <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 shadow-lg overflow-hidden">
                <CardContent className="p-2 sm:p-3 lg:p-4">
                  <div className="flex flex-col sm:flex-row items-center sm:gap-2 lg:gap-3">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-white/20 flex items-center justify-center mb-1 sm:mb-0">
                      <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                    </div>
                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <p className="text-[9px] sm:text-[10px] lg:text-xs opacity-90 uppercase tracking-wide mb-0.5">Total</p>
                      <p className="text-sm sm:text-base lg:text-xl font-bold truncate">{formatCurrency(totalDebt)}</p>
                      <p className="text-[8px] sm:text-[10px] opacity-75 truncate">{debts.length} deuda{debts.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Pagado */}
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg overflow-hidden">
                <CardContent className="p-2 sm:p-3 lg:p-4">
                  <div className="flex flex-col sm:flex-row items-center sm:gap-2 lg:gap-3">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-white/20 flex items-center justify-center mb-1 sm:mb-0">
                      <CircleCheck className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                    </div>
                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <p className="text-[9px] sm:text-[10px] lg:text-xs opacity-90 uppercase tracking-wide mb-0.5">Pagado</p>
                      <p className="text-sm sm:text-base lg:text-xl font-bold truncate">{formatCurrency(totalPaid)}</p>
                      <p className="text-[8px] sm:text-[10px] opacity-75">Acumulado</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Saldo Pendiente */}
              <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-lg overflow-hidden">
                <CardContent className="p-2 sm:p-3 lg:p-4">
                  <div className="flex flex-col sm:flex-row items-center sm:gap-2 lg:gap-3">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-white/20 flex items-center justify-center mb-1 sm:mb-0">
                      <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                    </div>
                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <p className="text-[9px] sm:text-[10px] lg:text-xs opacity-90 uppercase tracking-wide mb-0.5">Pendiente</p>
                      <p className="text-sm sm:text-base lg:text-xl font-bold truncate">{formatCurrency(totalRemaining)}</p>
                      <p className="text-[8px] sm:text-[10px] opacity-75">Por pagar</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {debtsWithPayments.length > 0 ? (
              <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                {debtsWithPayments.map(({ debt, payments }) => (
                  <DebtCard key={debt.id} debt={debt} payments={payments} onUpdate={handleRefresh} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 lg:py-16 px-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted flex items-center justify-center mb-3 sm:mb-4">
                    <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm sm:text-base lg:text-lg font-medium text-center">No tienes deudas registradas</p>
                  <p className="text-xs sm:text-sm text-muted-foreground text-center mt-2">
                    Agrega una deuda para comenzar a hacer seguimiento
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
    </div>
  )
}
