import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DebtCard } from '@/components/debts/debt-card'
import { LoadingCheckOverlay } from '@/components/ui/loading-check'
import { SkeletonDebtList } from '@/components/ui/skeleton-debt'
import { formatCurrency } from '@/lib/utils'
import { Landmark } from 'lucide-react'
import type { Debt, DebtPayment } from '@/lib/types'
import { DebtFormWrapperUnified } from '@/components/debts/debt-form-wrapper-unified'
import { useRealtimeRefresh } from '@/hooks/use-realtime-refresh'

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

  // Refresco automático: realtime + evento global data-changed + volver de background.
  // debt_payments no tiene columna user_id → sin filtro server-side (RLS limita los eventos).
  useRealtimeRefresh(
    'debts-changes',
    ['debts', { table: 'debt_payments', filterByUser: false }],
    userId || undefined,
    handleRefresh,
  )

  if (loading) {
    return <LoadingCheckOverlay message="Cargando deudas..." />
  }

  const debts = debtsWithPayments.map((d) => d.debt)
  const totalDebt = debts.reduce((sum, debt) => sum + Number(debt.total_amount), 0)
  const totalPaid = debts.reduce((sum, debt) => sum + Number(debt.paid_amount), 0)
  const totalRemaining = totalDebt - totalPaid

  return (
    <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 py-2">
        <div className="flex-1">
          <h1 className="text-[26px] font-black tracking-tight text-foreground">Deudas</h1>
          <p className="text-[15px] font-extrabold text-muted-foreground">Seguimiento de pagos</p>
        </div>
        <div className="hidden lg:block">
          <DebtFormWrapperUnified userId={userId} onSuccess={handleRefresh} />
        </div>
      </div>

      {/* Stats — tiles Pop Azul */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="fade-up rounded-[24px] bg-card p-5 shadow-[0_6px_16px_rgba(30,40,80,.07)]">
          <p className="text-[13px] font-bold text-muted-foreground">Pendiente</p>
          <p className="mt-1 truncate text-[22px] font-black text-[#FF7A59]">$ {formatCurrency(totalRemaining).replace('$', '').trim()}</p>
        </div>

        <div className="fade-up rounded-[24px] bg-card p-5 shadow-[0_6px_16px_rgba(30,40,80,.07)]" style={{ animationDelay: '80ms' }}>
          <p className="text-[13px] font-bold text-muted-foreground">Pagado</p>
          <p className="mt-1 truncate text-[22px] font-black text-[#3B6EF6]">$ {formatCurrency(totalPaid).replace('$', '').trim()}</p>
        </div>
      </div>

      {/* Lista de Deudas */}
      {isRefreshing ? (
        <SkeletonDebtList count={debtsWithPayments.length || 3} />
      ) : debtsWithPayments.length > 0 ? (
        <div className="space-y-4">
          {debtsWithPayments.map(({ debt, payments }, index) => (
            <DebtCard key={debt.id} debt={debt} payments={payments} onUpdate={handleRefresh} isActive={index === 0} />
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
