import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DebtCard } from '@/components/debts/debt-card'
import { LoadingCheckOverlay } from '@/components/ui/loading-check'
import { SkeletonDebtList } from '@/components/ui/skeleton-debt'
import { formatCurrency } from '@/lib/utils'
import { Landmark, CircleCheck, AlertCircle } from 'lucide-react'
import type { Debt, DebtPayment } from '@/lib/types'
import { DebtFormWrapperUnified } from '@/components/debts/debt-form-wrapper-unified'

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
    // Evitar múltiples refreshes simultáneos
    if (isRefreshing) return
    
    setIsRefreshing(true)
    await fetchDebtsWithPayments()
    setTimeout(() => setIsRefreshing(false), 300)
  }, [fetchDebtsWithPayments, isRefreshing])

  // Carga inicial - Solo una vez
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Solo al montar - fetchDebtsWithPayments está estable

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
        },
        async (payload: any) => {
          console.log('[Debts] Event detected:', payload.eventType, payload)
          
          // Evitar actualización si ya está refrescando
          if (isRefreshing) return
          
          // Verificar si el cambio pertenece al usuario actual
          const record = payload.new || payload.old
          if (record && record.user_id === userId) {
            setIsRefreshing(true)
            await fetchDebtsWithPayments()
            setTimeout(() => setIsRefreshing(false), 300)
          }
        }
      )
      .subscribe((status) => {
        console.log('[Debts] Subscription status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

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
        async (payload: any) => {
          console.log('[Debts] Payment event detected:', payload.eventType, payload)
          
          // Evitar actualización si ya está refrescando
          if (isRefreshing) return
          
          // Los pagos siempre activan actualización ya que están relacionados con deudas del usuario
          setIsRefreshing(true)
          await fetchDebtsWithPayments()
          setTimeout(() => setIsRefreshing(false), 300)
        }
      )
      .subscribe((status) => {
        console.log('[Debts] Payments subscription status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  if (loading) {
    return <LoadingCheckOverlay message="Cargando deudas..." />
  }

  const debts = debtsWithPayments.map((d) => d.debt)
  const totalDebt = debts.reduce((sum, debt) => sum + Number(debt.total_amount), 0)
  const totalPaid = debts.reduce((sum, debt) => sum + Number(debt.paid_amount), 0)
  const totalRemaining = totalDebt - totalPaid

  return (
    <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Deudas</h1>
          <p className="text-sm text-muted-foreground">Gestiona tus deudas y pagos parciales</p>
        </div>
        <div className="flex gap-2 self-end sm:self-auto">
          <DebtFormWrapperUnified userId={userId} onSuccess={handleRefresh} />
        </div>
      </div>

      {/* Stats — tiles Pop Azul */}
      <div className="grid grid-cols-3 gap-3">
        <div className="fade-up rounded-[22px] bg-card p-3 sm:p-4 shadow-card">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[hsl(var(--chart-2)/0.16)]">
            <AlertCircle className="h-5 w-5 text-[hsl(var(--chart-2))]" strokeWidth={2.4} />
          </div>
          <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Pendiente</p>
          <p className="truncate text-base sm:text-lg font-black text-foreground">{formatCurrency(totalRemaining)}</p>
        </div>

        <div className="fade-up rounded-[22px] bg-card p-3 sm:p-4 shadow-card" style={{ animationDelay: '80ms' }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[hsl(var(--chart-1)/0.14)]">
            <CircleCheck className="h-5 w-5 text-[hsl(var(--chart-1))]" strokeWidth={2.4} />
          </div>
          <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Pagado</p>
          <p className="truncate text-base sm:text-lg font-black text-foreground">{formatCurrency(totalPaid)}</p>
        </div>

        <div className="fade-up rounded-[22px] bg-card p-3 sm:p-4 shadow-card" style={{ animationDelay: '160ms' }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[hsl(var(--chart-4)/0.16)]">
            <Landmark className="h-5 w-5 text-[hsl(var(--chart-4))]" strokeWidth={2.4} />
          </div>
          <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Total</p>
          <p className="truncate text-base sm:text-lg font-black text-foreground">{formatCurrency(totalDebt)}</p>
        </div>
      </div>

      {/* Lista de Deudas */}
      {isRefreshing ? (
        <SkeletonDebtList count={debtsWithPayments.length || 3} />
      ) : debtsWithPayments.length > 0 ? (
        <div className="space-y-3 sm:space-y-4">
          {debtsWithPayments.map(({ debt, payments }) => (
            <DebtCard key={debt.id} debt={debt} payments={payments} onUpdate={handleRefresh} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-[24px] bg-card py-14 shadow-card">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
            <Landmark className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-extrabold">No tienes deudas registradas</p>
          <p className="mt-1 text-sm text-muted-foreground">Agrega una deuda para comenzar a hacer seguimiento</p>
        </div>
      )}
    </div>
  )
}
