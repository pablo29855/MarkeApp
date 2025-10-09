import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DebtCard } from '@/components/debts/debt-card'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <PageHeader
          title="Deudas"
          description="Gestiona tus deudas y pagos parciales"
          action={<DebtFormWrapper userId={userId} onSuccess={handleRefresh} />}
        />

        {isRefreshing ? (
          <>
            <SkeletonDebtStats />
            <SkeletonDebtList count={debtsWithPayments.length || 3} />
          </>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm opacity-90 mb-2">Total de Deudas</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold">{formatCurrency(totalDebt)}</span>
                      </div>
                      <p className="text-sm opacity-90 mt-2">{debts.length} deudas</p>
                    </div>
                    <div className="ml-4">
                      <CreditCard className="h-12 w-12 opacity-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm opacity-90 mb-2">Total Pagado</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold">{formatCurrency(totalPaid)}</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <CircleCheck className="h-12 w-12 opacity-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm opacity-90 mb-2">Saldo Pendiente</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold">{formatCurrency(totalRemaining)}</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <AlertCircle className="h-12 w-12 opacity-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {debtsWithPayments.length > 0 ? (
              <div className="space-y-4">
                {debtsWithPayments.map(({ debt, payments }) => (
                  <DebtCard key={debt.id} debt={debt} payments={payments} onUpdate={handleRefresh} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-medium text-center">No tienes deudas registradas</p>
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    Agrega una deuda para comenzar a hacer seguimiento
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
