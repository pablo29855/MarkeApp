import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DebtCard } from '@/components/debts/debt-card'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { formatCurrency } from '@/lib/utils'
import { CreditCard } from 'lucide-react'
import type { Debt, DebtPayment } from '@/lib/types'
import { DebtFormWrapper } from '@/components/debts/debt-form-wrapper'

export default function DebtsPage() {
  const [loading, setLoading] = useState(true)
  const [debtsWithPayments, setDebtsWithPayments] = useState<{ debt: Debt; payments: DebtPayment[] }[]>([])
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return

        setUserId(user.id)

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
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Cargando...</div>
      </div>
    )
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
          showBackButton
          backHref="/dashboard"
          action={<DebtFormWrapper userId={userId} />}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 shadow-lg">
            <CardContent className="p-6">
              <p className="text-sm opacity-90">Total de Deudas</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(totalDebt)}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <p className="text-sm opacity-90">Total Pagado</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(totalPaid)}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <p className="text-sm opacity-90">Saldo Pendiente</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(totalRemaining)}</p>
            </CardContent>
          </Card>
        </div>

        {debtsWithPayments.length > 0 ? (
          <div className="space-y-4">
            {debtsWithPayments.map(({ debt, payments }) => (
              <DebtCard key={debt.id} debt={debt} payments={payments} />
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
      </div>
    </div>
  )
}
