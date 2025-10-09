import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useNotification } from "@/hooks/use-notification"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
  const [isExpanded, setIsExpanded] = useState(false)
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
        "transition-smooth animate-fade-in group overflow-hidden relative",
        isPaid ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/10" : "hover:border-primary/50"
      )}>
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          isPaid ? "from-green-500/10 via-transparent to-transparent" : "from-primary/5 via-transparent to-transparent"
        )} />
        
        {/* Vista Compacta en Móvil / Completa en Desktop */}
        <div className="relative z-10">
          {/* Header Compacto */}
          <div 
            className="p-3 sm:p-4 lg:p-6 cursor-pointer lg:cursor-default"
            onClick={(e) => {
              // Solo expandir/colapsar en móvil y si no es un elemento interactivo
              if (window.innerWidth < 1024) {
                const target = e.target as HTMLElement
                // No expandir si se clickeó un botón, input u otro elemento interactivo
                if (!target.closest('button') && !target.closest('a') && !target.closest('input')) {
                  setIsExpanded(!isExpanded)
                }
              }
            }}
          >
            <div className="flex items-start justify-between gap-2">
              {/* Info Principal */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-bold text-sm sm:text-base lg:text-lg group-hover:text-primary transition-colors truncate">
                    {debt.name}
                  </h3>
                  {isPaid ? (
                    <Badge className="bg-green-500 hover:bg-green-600 text-[10px] sm:text-xs px-1.5 py-0.5">
                      ✓ Pagada
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[10px] sm:text-xs px-1.5 py-0.5">
                      Pendiente
                    </Badge>
                  )}
                </div>
                
                {/* Progreso y Monto - Siempre Visible */}
                <div className="space-y-1.5 mt-2">
                  <div className="flex items-center justify-between text-[10px] sm:text-xs">
                    <span className="text-muted-foreground">
                      ${Number(debt.paid_amount).toLocaleString()} / ${Number(debt.total_amount).toLocaleString()}
                    </span>
                    <span className="font-bold text-xs sm:text-sm">{progressPercentage.toFixed(0)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-1.5 sm:h-2" />
                  
                  {/* Pendiente destacado */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] sm:text-xs text-muted-foreground">Pendiente:</span>
                    <span className="font-bold text-sm sm:text-base text-red-600 dark:text-red-400">
                      ${remainingAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Acciones Desktop */}
              <div className="hidden lg:flex items-center gap-2">
                {!isPaid && <PaymentForm debtId={debt.id} remainingAmount={remainingAmount} onUpdate={onUpdate} />}
                {payments.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowPayments(!showPayments)
                    }}
                    className="transition-smooth hover:bg-primary/10"
                  >
                    {showPayments ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Ocultar
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Pagos ({payments.length})
                      </>
                    )}
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="hover:bg-destructive/10 hover:text-destructive transition-smooth"
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteId(debt.id)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Indicador Expandir en Móvil */}
              <Button 
                variant="ghost" 
                size="icon"
                className="lg:hidden flex-shrink-0 h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsExpanded(!isExpanded)
                }}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Detalles Expandidos - Móvil o Siempre en Desktop */}
          {(isExpanded || typeof window !== 'undefined' && window.innerWidth >= 1024) && (
            <div 
              className="border-t px-3 py-3 sm:p-4 lg:p-6 lg:pt-0 space-y-3 animate-fade-in"
              onClick={(e) => {
                // Prevenir que clicks dentro de los detalles cierren el card
                e.stopPropagation()
              }}
            >
              {/* Descripción y Fecha */}
              {(debt.description || debt.due_date) && (
                <div className="space-y-1.5 text-xs sm:text-sm">
                  {debt.description && (
                    <p className="text-muted-foreground flex items-start gap-1.5">
                      <FileText className="h-3 w-3 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{debt.description}</span>
                    </p>
                  )}
                  {debt.due_date && (
                    <p className="text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 flex-shrink-0" />
                      <span>Vence: {format(new Date(debt.due_date), "PP", { locale: es })}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Grid de Montos Detallado - Solo Desktop */}
              <div className="hidden lg:grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-lg bg-background/50 border">
                  <p className="text-xs text-muted-foreground mb-1">Total</p>
                  <p className="text-lg font-bold truncate">
                    ${Number(debt.total_amount).toLocaleString()}
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                  <p className="text-xs text-muted-foreground mb-1">Pagado</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400 truncate">
                    ${Number(debt.paid_amount).toLocaleString()}
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                  <p className="text-xs text-muted-foreground mb-1">Pendiente</p>
                  <p className="text-lg font-bold text-red-600 dark:text-red-400 truncate">
                    ${remainingAmount.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Botones de Acción - Móvil */}
              <div className="flex gap-2 lg:hidden">
                {!isPaid && <PaymentForm debtId={debt.id} remainingAmount={remainingAmount} onUpdate={onUpdate} />}
                {payments.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowPayments(!showPayments)
                    }}
                    className="flex-1 text-xs"
                  >
                    {showPayments ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        Ocultar
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        Pagos ({payments.length})
                      </>
                    )}
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="hover:bg-destructive/10 hover:text-destructive h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteId(debt.id)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Historial de Pagos */}
              {showPayments && payments.length > 0 && (
                <div className="border-t pt-3 space-y-2 animate-fade-in">
                  <p className="text-xs font-semibold flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 bg-primary rounded-full" />
                    Historial de Pagos
                  </p>
                  {payments.map((payment, index) => (
                    <div 
                      key={payment.id} 
                      className="flex items-start justify-between p-2.5 sm:p-3 bg-muted/50 rounded-lg border text-xs sm:text-sm"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm sm:text-base text-green-600 dark:text-green-400">
                          ${Number(payment.amount).toLocaleString()}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Calendar className="h-2.5 w-2.5" />
                          {format(new Date(payment.payment_date), "PP", { locale: es })}
                        </p>
                        {payment.notes && (
                          <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
                            {payment.notes}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className="ml-2 text-[10px] sm:text-xs px-1.5 py-0.5">✓</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="animate-scale-in w-[calc(100%-2rem)] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Esta acción no se puede deshacer. La deuda y todos sus pagos serán eliminados permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="text-xs sm:text-sm">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs sm:text-sm"
            >
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
