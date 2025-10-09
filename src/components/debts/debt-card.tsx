
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useNotification } from "@/hooks/use-notification"
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
import { Trash2, Calendar, FileText, ChevronDown, ChevronUp, TrendingUp } from "lucide-react"
import { PaymentForm } from "./payment-form"
import type { Debt, DebtPayment } from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface DebtCardProps {
  debt: Debt
  payments: DebtPayment[]
  onUpdate?: () => void
}

export function DebtCard({ debt, payments, onUpdate }: DebtCardProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showPayments, setShowPayments] = useState(false)
  const { showDeleted, showError } = useNotification()

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

      showDeleted("Deuda")
      setDeleteId(null)
      onUpdate?.()
      
    } catch (error) {
      console.error("Error deleting debt:", error)
      showError(error instanceof Error ? error.message : "Error al eliminar la deuda")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Card className={cn(
        "transition-smooth hover-glow animate-fade-in group overflow-hidden relative",
        isPaid ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/10" : "hover:border-primary/50"
      )}>
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          isPaid ? "from-green-500/10 via-transparent to-transparent" : "from-primary/5 via-transparent to-transparent"
        )} />
        <CardHeader className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <CardTitle className="text-2xl group-hover:text-primary transition-colors">
                  {debt.name}
                </CardTitle>
                {isPaid ? (
                  <Badge className="bg-green-500 hover:bg-green-600 transition-colors shadow-md">
                    ✓ Pagada
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="shadow-md animate-pulse">
                    Pendiente
                  </Badge>
                )}
              </div>
              {debt.description && (
                <p className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="line-clamp-2">{debt.description}</span>
                </p>
              )}
              {debt.due_date && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>Vence: {format(new Date(debt.due_date), "PPP", { locale: es })}</span>
                </p>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              className="hover:bg-destructive/10 hover:text-destructive transition-smooth flex-shrink-0"
              onClick={() => setDeleteId(debt.id)}
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 relative z-10">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-background/50 border transition-smooth hover:shadow-md">
              <p className="text-xs text-muted-foreground mb-1">Total</p>
              <p className="text-xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
                ${Number(debt.total_amount).toLocaleString()}
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 transition-smooth hover:shadow-md">
              <p className="text-xs text-muted-foreground mb-1">Pagado</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                ${Number(debt.paid_amount).toLocaleString()}
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 transition-smooth hover:shadow-md">
              <p className="text-xs text-muted-foreground mb-1">Pendiente</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">
                ${remainingAmount.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="space-y-3 p-4 rounded-lg bg-background/50 border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Progreso de Pago
              </span>
              <span className="font-bold text-lg">{progressPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3 transition-all duration-500" />
          </div>

          <div className="flex gap-2">
            {!isPaid && <PaymentForm debtId={debt.id} remainingAmount={remainingAmount} onUpdate={onUpdate} />}
            {payments.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowPayments(!showPayments)} 
                className="flex-1 transition-smooth hover:bg-primary/10 hover:border-primary"
              >
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
            <div className="border-t pt-4 space-y-3 animate-fade-in">
              <p className="text-sm font-semibold flex items-center gap-2">
                <span className="h-2 w-2 bg-primary rounded-full" />
                Historial de Pagos
              </p>
              {payments.map((payment, index) => (
                <div 
                  key={payment.id} 
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border hover:shadow-md transition-smooth animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex-1">
                    <p className="font-bold text-lg text-green-600 dark:text-green-400">
                      ${Number(payment.amount).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(payment.payment_date), "PPP", { locale: es })}
                    </p>
                    {payment.notes && (
                      <p className="text-xs text-muted-foreground mt-2 flex items-start gap-1">
                        <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{payment.notes}</span>
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    ✓
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="animate-scale-in">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Esta acción no se puede deshacer. La deuda y todos sus pagos serán eliminados permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="transition-smooth">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-smooth"
            >
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Eliminando...
                </span>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
