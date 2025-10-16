import { useState, useEffect } from "react"
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
import { Trash2, Calendar, FileText, ChevronDown, ChevronUp, Pencil, AlertTriangle, Clock } from "lucide-react"
import { PaymentForm } from "./payment-form"
import { DebtFormWrapperUnified } from "./debt-form-wrapper-unified"
import type { Debt, DebtPayment } from "@/lib/types"
import { format, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"
import { cn, parseLocalDate } from "@/lib/utils"

// Categorías de deudas con emojis (debe coincidir con debt-form-unified)
const DEBT_CATEGORIES = {
  'credit_card': { label: 'Tarjeta de Crédito', icon: '💳' },
  'bank_loan': { label: 'Préstamo Bancario', icon: '🏦' },
  'mortgage': { label: 'Hipoteca', icon: '🏠' },
  'car_loan': { label: 'Préstamo Vehicular', icon: '🚗' },
  'student_loan': { label: 'Préstamo Estudiantil', icon: '🎓' },
  'personal_loan': { label: 'Préstamo Personal', icon: '👤' },
  'store_credit': { label: 'Crédito Comercial', icon: '🛒' },
  'phone_plan': { label: 'Plan Telefónico', icon: '📱' },
  'medical': { label: 'Médico/Salud', icon: '⚕️' },
  'business': { label: 'Empresarial', icon: '💼' },
  'utilities': { label: 'Servicios Públicos', icon: '💡' },
  'rent': { label: 'Arriendo/Alquiler', icon: '🏢' },
  'other': { label: 'Otro', icon: '📋' },
} as const

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
  const [showEditDialog, setShowEditDialog] = useState(false)
  const { showDeleted, showError } = useNotification()

  const remainingAmount = Number(debt.total_amount) - Number(debt.paid_amount)
  const progressPercentage = (Number(debt.paid_amount) / Number(debt.total_amount)) * 100
  const isPaid = remainingAmount <= 0

  // Cálculo de días restantes hasta la fecha de vencimiento
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dueDate = debt.debt_date ? parseLocalDate(debt.debt_date) : null
  const daysRemaining = dueDate ? differenceInDays(dueDate, today) : null
  
  // Determinar el estado de urgencia
  const getUrgencyStatus = () => {
    if (isPaid) return 'paid'
    if (!daysRemaining && daysRemaining !== 0) return 'normal'
    
    if (daysRemaining < 0) return 'overdue' // Vencida
    if (daysRemaining === 0) return 'today' // Vence hoy
    if (daysRemaining <= 3) return 'critical' // Crítico (1-3 días)
    if (daysRemaining <= 7) return 'urgent' // Urgente (4-7 días)
    if (daysRemaining <= 15) return 'warning' // Advertencia (8-15 días)
    return 'normal' // Normal (>15 días)
  }

  const urgencyStatus = getUrgencyStatus()

  // Actualizar automáticamente el status en la base de datos cuando esté vencida
  useEffect(() => {
    const updateDebtStatus = async () => {
      if (isPaid) return
      
      const currentStatus = debt.status
      let newStatus: string | null = null

      if (urgencyStatus === 'overdue' && currentStatus !== 'overdue') {
        newStatus = 'overdue'
      } else if (urgencyStatus === 'today' && currentStatus !== 'due_today') {
        newStatus = 'due_today'
      } else if (urgencyStatus === 'critical' && currentStatus !== 'critical') {
        newStatus = 'critical'
      } else if (urgencyStatus === 'urgent' && currentStatus !== 'urgent') {
        newStatus = 'urgent'
      } else if (urgencyStatus === 'warning' && currentStatus !== 'warning') {
        newStatus = 'warning'
      } else if (urgencyStatus === 'normal' && currentStatus !== 'active') {
        newStatus = 'active'
      }

      if (newStatus && newStatus !== currentStatus) {
        const supabase = createClient()
        const { error } = await supabase
          .from('debts')
          .update({ status: newStatus })
          .eq('id', debt.id)

        if (error) {
          console.error('Error updating debt status:', error)
        }
      }
    }

    updateDebtStatus()
  }, [urgencyStatus, debt.id, debt.status, isPaid])

  // Configuración visual según urgencia - Colores sutiles
  const urgencyConfig = {
    overdue: {
      borderColor: 'border-red-200 dark:border-red-900/50',
      bgColor: 'bg-background',
      badgeColor: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
      gradientColor: 'from-primary/5',
      icon: AlertTriangle,
      iconColor: 'text-red-600 dark:text-red-400',
      message: 'Deuda Vencida',
      alertBg: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50',
    },
    today: {
      borderColor: 'border-orange-200 dark:border-orange-900/50',
      bgColor: 'bg-background',
      badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400',
      gradientColor: 'from-primary/5',
      icon: AlertTriangle,
      iconColor: 'text-orange-600 dark:text-orange-400',
      message: 'Vence Hoy',
      alertBg: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/50',
    },
    critical: {
      borderColor: 'border-red-100 dark:border-red-900/30',
      bgColor: 'bg-background',
      badgeColor: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
      gradientColor: 'from-primary/5',
      icon: Clock,
      iconColor: 'text-red-600 dark:text-red-400',
      message: `Vence en ${daysRemaining} ${daysRemaining === 1 ? 'día' : 'días'}`,
      alertBg: 'bg-red-50/50 dark:bg-red-950/10 border-red-100 dark:border-red-900/30',
    },
    urgent: {
      borderColor: 'border-orange-100 dark:border-orange-900/30',
      bgColor: 'bg-background',
      badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400',
      gradientColor: 'from-primary/5',
      icon: Clock,
      iconColor: 'text-orange-600 dark:text-orange-400',
      message: `Vence en ${daysRemaining} días`,
      alertBg: 'bg-orange-50/50 dark:bg-orange-950/10 border-orange-100 dark:border-orange-900/30',
    },
    warning: {
      borderColor: 'border-yellow-100 dark:border-yellow-900/30',
      bgColor: 'bg-background',
      badgeColor: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-500',
      gradientColor: 'from-primary/5',
      icon: Calendar,
      iconColor: 'text-yellow-600 dark:text-yellow-500',
      message: `Vence en ${daysRemaining} días`,
      alertBg: 'bg-yellow-50/50 dark:bg-yellow-950/10 border-yellow-100 dark:border-yellow-900/30',
    },
    paid: {
      borderColor: 'border-green-500/50',
      bgColor: 'bg-green-50/50 dark:bg-green-950/10',
      badgeColor: 'bg-green-500 hover:bg-green-600',
      gradientColor: 'from-green-500/10',
      icon: null,
      iconColor: '',
      message: '',
      alertBg: '',
    },
    normal: {
      borderColor: 'hover:border-primary/50',
      bgColor: '',
      badgeColor: '',
      gradientColor: 'from-primary/5',
      icon: null,
      iconColor: '',
      message: '',
      alertBg: '',
    },
  }

  const config = urgencyConfig[urgencyStatus]
  const UrgencyIcon = config.icon

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
        config.borderColor,
        config.bgColor
      )}>
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          config.gradientColor,
          "via-transparent to-transparent"
        )} />
        
        {/* Vista Compacta en Móvil / Completa en Desktop */}
        <div className="relative z-10">
          {/* Header Compacto */}
          <div 
            className="p-4 sm:p-5 lg:p-6 cursor-pointer"
            onClick={(e) => {
              const target = e.target as HTMLElement
              // No expandir si se clickeó un botón, input u otro elemento interactivo
              if (!target.closest('button') && !target.closest('a') && !target.closest('input')) {
                setIsExpanded(!isExpanded)
              }
            }}
          >
            <div className="flex items-start justify-between gap-3">
              {/* Info Principal */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h3 className="font-bold text-lg sm:text-lg lg:text-xl group-hover:text-primary transition-colors truncate">
                    {debt.name}
                  </h3>
                  {isPaid ? (
                    <Badge className="bg-green-500 hover:bg-green-600 text-sm sm:text-sm px-2 py-0.5">
                      ✓ Pagada
                    </Badge>
                  ) : urgencyStatus === 'overdue' ? (
                    <Badge className="bg-red-500 text-white text-sm sm:text-sm px-2 py-0.5">
                      Vencida
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-500 text-white text-sm sm:text-sm px-2 py-0.5">
                      Pendiente
                    </Badge>
                  )}
                </div>

                {/* Alerta de Vencimiento - Siempre Visible si hay urgencia */}
                {!isPaid && urgencyStatus !== 'normal' && config.message && UrgencyIcon && (
                  <div className={cn(
                    "flex items-center gap-2 mb-3 p-2.5 rounded-lg border",
                    config.alertBg
                  )}>
                    <UrgencyIcon className={cn("h-4 w-4 flex-shrink-0", config.iconColor)} />
                    <div className="flex-1 min-w-0">
                      <p className={cn("font-medium text-sm", config.iconColor)}>
                        {config.message}
                      </p>
                      {debt.debt_date && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {urgencyStatus === 'overdue' 
                            ? `Venció: ${format(parseLocalDate(debt.debt_date), "PP", { locale: es })}`
                            : format(parseLocalDate(debt.debt_date), "PP", { locale: es })
                          }
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Progreso y Monto - Siempre Visible */}
                <div className="space-y-2 mt-3">
                  <div className="flex items-center justify-between text-sm sm:text-sm">
                    <span className="text-muted-foreground">
                      ${Number(debt.paid_amount).toLocaleString()} / ${Number(debt.total_amount).toLocaleString()}
                    </span>
                    <span className="font-bold text-base sm:text-base">{progressPercentage.toFixed(0)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2 sm:h-2.5" />
                  
                  {/* Pendiente destacado */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-base sm:text-base text-muted-foreground">Pendiente:</span>
                    <span className="font-bold text-lg sm:text-xl text-red-600 dark:text-red-400">
                      ${remainingAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Indicador Expandir - Siempre visible */}
              <Button 
                variant="ghost" 
                size="icon"
                className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsExpanded(!isExpanded)
                }}
              >
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Detalles Expandidos - Móvil y Desktop */}
          {isExpanded && (
            <div 
              className="border-t px-4 py-4 sm:p-5 lg:p-6 lg:pt-4 space-y-4 animate-fade-in"
              onClick={(e) => {
                // Prevenir que clicks dentro de los detalles cierren el card
                e.stopPropagation()
              }}
            >
              {/* Descripción, Categoría y Fecha */}
              {(debt.notes || debt.description || debt.category || debt.debt_date) && (
                <div className="space-y-2 text-base sm:text-base">
                  {debt.category && DEBT_CATEGORIES[debt.category as keyof typeof DEBT_CATEGORIES] && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-lg">
                        {DEBT_CATEGORIES[debt.category as keyof typeof DEBT_CATEGORIES].icon}
                      </span>
                      <span className="font-medium">
                        {DEBT_CATEGORIES[debt.category as keyof typeof DEBT_CATEGORIES].label}
                      </span>
                    </div>
                  )}
                  {(debt.notes || debt.description) && (
                    <p className="text-muted-foreground flex items-start gap-2">
                      <FileText className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{debt.notes || debt.description}</span>
                    </p>
                  )}
                  {debt.debt_date && (
                    <p className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>Vence: {format(parseLocalDate(debt.debt_date), "PP", { locale: es })}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Grid de Montos Detallado - Móvil y Desktop */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="text-center p-3 sm:p-4 rounded-lg bg-background/50 border">
                  <p className="text-sm sm:text-sm text-muted-foreground mb-1 sm:mb-2">Total</p>
                  <p className="text-lg sm:text-lg lg:text-xl font-bold truncate">
                    ${Number(debt.total_amount).toLocaleString()}
                  </p>
                </div>
                <div className="text-center p-3 sm:p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                  <p className="text-sm sm:text-sm text-muted-foreground mb-1 sm:mb-2">Pagado</p>
                  <p className="text-lg sm:text-lg lg:text-xl font-bold text-green-600 dark:text-green-400 truncate">
                    ${Number(debt.paid_amount).toLocaleString()}
                  </p>
                </div>
                <div className="text-center p-3 sm:p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                  <p className="text-sm sm:text-sm text-muted-foreground mb-1 sm:mb-2">Pendiente</p>
                  <p className="text-lg sm:text-lg lg:text-xl font-bold text-red-600 dark:text-red-400 truncate">
                    ${remainingAmount.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Botones de Acción - Todos los tamaños */}
              <div className="flex gap-2">
                {!isPaid && <PaymentForm debtId={debt.id} remainingAmount={remainingAmount} onUpdate={onUpdate} />}
                {payments.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowPayments(!showPayments)
                    }}
                    className="flex-1 text-sm sm:text-base lg:text-lg h-9 sm:h-10 lg:h-11"
                  >
                    {showPayments ? (
                      <>
                        <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 mr-2" />
                        Ocultar
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 mr-2" />
                        Pagos ({payments.length})
                      </>
                    )}
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="hover:bg-destructive/10 hover:text-destructive h-9 w-9 sm:h-10 sm:w-10 lg:h-11 lg:w-11"
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteId(debt.id)
                  }}
                >
                  <Trash2 className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="hover:bg-primary/10 hover:text-primary h-9 w-9 sm:h-10 sm:w-10 lg:h-11 lg:w-11"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowEditDialog(true)
                  }}
                >
                  <Pencil className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                </Button>
              </div>

              {/* Historial de Pagos */}
              {showPayments && payments.length > 0 && (
                <div className="border-t pt-4 space-y-2 animate-fade-in">
                  <p className="text-base sm:text-base font-semibold flex items-center gap-2">
                    <span className="h-2 w-2 bg-primary rounded-full" />
                    Historial de Pagos
                  </p>
                  {payments.map((payment, index) => (
                    <div 
                      key={payment.id} 
                      className="flex items-start justify-between p-3 sm:p-4 bg-muted/50 rounded-lg border text-base sm:text-base"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-lg sm:text-lg text-green-600 dark:text-green-400">
                          ${Number(payment.amount).toLocaleString()}
                        </p>
                        <p className="text-sm sm:text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(parseLocalDate(payment.payment_date), "PP", { locale: es })}
                        </p>
                        {payment.notes && (
                          <p className="text-sm sm:text-sm text-muted-foreground mt-1.5 line-clamp-2">
                            {payment.notes}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className="ml-2 text-sm sm:text-sm px-2 py-1">✓</Badge>
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
            <AlertDialogTitle className="text-xl sm:text-xl">¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription className="text-base sm:text-base">
              Esta acción no se puede deshacer. La deuda y todos sus pagos serán eliminados permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="text-base sm:text-base h-9 sm:h-10 dark:shadow-[0_4px_12px_rgba(0,0,0,0.6)] dark:border dark:border-slate-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-base sm:text-base h-9 sm:h-10"
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

      <DebtFormWrapperUnified
        userId={debt.user_id}
        debt={debt}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={() => {
          setShowEditDialog(false)
          onUpdate?.()
        }}
      />
    </>
  )
}
