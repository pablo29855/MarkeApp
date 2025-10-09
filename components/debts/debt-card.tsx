"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Trash2, Calendar, FileText, ChevronDown, ChevronUp } from "lucide-react"
import { PaymentForm } from "./payment-form"
import type { Debt, DebtPayment } from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface DebtCardProps {
  debt: Debt
  payments: DebtPayment[]
}

export function DebtCard({ debt, payments }: DebtCardProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showPayments, setShowPayments] = useState(false)
  const router = useRouter()

  const remainingAmount = Number(debt.total_amount) - Number(debt.paid_amount)
  const progressPercentage = (Number(debt.paid_amount) / Number(debt.total_amount)) * 100
  const isPaid = remainingAmount <= 0

  const handleDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    const supabase = createClient()

    try {
      // Delete all payments first
      await supabase.from("debt_payments").delete().eq("debt_id", deleteId)

      // Delete debt
      const { error } = await supabase.from("debts").delete().eq("id", deleteId)

      if (error) throw error

      setDeleteId(null)
      router.refresh()
    } catch (error) {
      console.error("Error deleting debt:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle>{debt.creditor_name}</CardTitle>
                {isPaid ? (
                  <Badge className="bg-green-500">Pagada</Badge>
                ) : (
                  <Badge variant="destructive">Pendiente</Badge>
                )}
              </div>
              {debt.description && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {debt.description}
                </p>
              )}
              {debt.due_date && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3" />
                  Vence: {format(new Date(debt.due_date), "PPP", { locale: es })}
                </p>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={() => setDeleteId(debt.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold">${Number(debt.total_amount).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pagado</p>
              <p className="text-lg font-bold text-green-600">${Number(debt.paid_amount).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pendiente</p>
              <p className="text-lg font-bold text-red-600">${remainingAmount.toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progreso</span>
              <span className="font-medium">{progressPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          <div className="flex gap-2">
            {!isPaid && <PaymentForm debtId={debt.id} remainingAmount={remainingAmount} />}
            {payments.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setShowPayments(!showPayments)} className="flex-1">
                {showPayments ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Ocultar Pagos
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Ver Pagos ({payments.length})
                  </>
                )}
              </Button>
            )}
          </div>

          {showPayments && payments.length > 0 && (
            <div className="border-t pt-4 space-y-2">
              <p className="text-sm font-medium">Historial de Pagos</p>
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">${Number(payment.amount).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(payment.payment_date), "PPP", { locale: es })}
                    </p>
                    {payment.notes && <p className="text-xs text-muted-foreground mt-1">{payment.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La deuda y todos sus pagos serán eliminados permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
