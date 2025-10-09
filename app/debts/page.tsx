import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DebtCard } from "@/components/debts/debt-card"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { formatCurrency } from "@/lib/utils"
import { CreditCard } from "lucide-react"
import type { Debt, DebtPayment } from "@/lib/types"
import { DebtFormWrapper } from "@/components/debts/debt-form-wrapper"

async function getDebts(userId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from("debts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  return (data || []) as Debt[]
}

async function getPaymentsForDebt(debtId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from("debt_payments")
    .select("*")
    .eq("debt_id", debtId)
    .order("payment_date", { ascending: false })

  return (data || []) as DebtPayment[]
}

export default async function DebtsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const debts = await getDebts(user.id)

  // Get payments for all debts
  const debtsWithPayments = await Promise.all(
    debts.map(async (debt) => ({
      debt,
      payments: await getPaymentsForDebt(debt.id),
    })),
  )

  const totalDebt = debts.reduce((sum, debt) => sum + Number(debt.total_amount), 0)
  const totalPaid = debts.reduce((sum, debt) => sum + Number(debt.paid_amount), 0)
  const totalRemaining = totalDebt - totalPaid

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Deudas"
          description="Gestiona tus deudas y pagos parciales"
          showBackButton
          backHref="/dashboard"
          action={<DebtFormWrapper userId={user.id} />}
        />

        {/* Summary */}
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

        {/* Debts List */}
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
