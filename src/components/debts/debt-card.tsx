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
import { Trash2, Calendar, FileText, ChevronDown, ChevronUp, Pencil, AlertTriangle, Clock, CreditCard, Landmark, Home, Car, GraduationCap, User, ShoppingCart, Smartphone, Stethoscope, Briefcase, Lightbulb, Building2, Receipt } from "lucide-react"
import { PaymentForm } from "./payment-form"
import { DebtFormWrapperUnified } from "./debt-form-wrapper-unified"
import type { Debt, DebtPayment } from "@/lib/types"
import { format, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"
import { cn, parseLocalDate } from "@/lib/utils"

// Categorías de deudas con iconos (debe coincidir con debt-form-unified)
const DEBT_CATEGORIES = {
  'credit_card': { label: 'Tarjeta de Crédito', icon: CreditCard },
  'bank_loan': { label: 'Préstamo Bancario', icon: Landmark },
  'mortgage': { label: 'Hipoteca', icon: Home },
  'car_loan': { label: 'Préstamo Vehicular', icon: Car },
  'student_loan': { label: 'Préstamo Estudiantil', icon: GraduationCap },
  'personal_loan': { label: 'Préstamo Personal', icon: User },
  'store_credit': { label: 'Crédito Comercial', icon: ShoppingCart },
  'phone_plan': { label: 'Plan Telefónico', icon: Smartphone },
  'medical': { label: 'Médico/Salud', icon: Stethoscope },
  'business': { label: 'Empresarial', icon: Briefcase },
  'utilities': { label: 'Servicios Públicos', icon: Lightbulb },
  'rent': { label: 'Arriendo/Alquiler', icon: Building2 },
  'other': { label: 'Otro', icon: FileText },
} as const

interface DebtCardProps {
  debt: Debt
  payments: DebtPayment[]
  onUpdate?: () => void
  isActive?: boolean
}

export function DebtCard({ debt, payments, onUpdate, isActive = false }: DebtCardProps) {
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
      <Card className="transition-smooth animate-fade-in group overflow-hidden relative rounded-[24px] shadow-[0_6px_16px_rgba(30,40,80,.07)] bg-white border-none">
        <div className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          config.gradientColor,
          "via-transparent to-transparent"
        )} />
        
        <div className="relative z-10">
          {/* Vista Compacta en Móvil / Completa en Desktop */}
          {/* Header Compacto (Pop Azul Style) */}
          <div 
            className="p-5 cursor-pointer"
            onClick={(e) => {
              const target = e.target as HTMLElement
              if (!target.closest('button') && !target.closest('a') && !target.closest('input')) {
                setIsExpanded(!isExpanded)
              }
            }}
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-[#eef1f7] shrink-0 text-primary">
                  {(() => {
                    const CategoryIcon = debt.category && DEBT_CATEGORIES[debt.category as keyof typeof DEBT_CATEGORIES]?.icon
                      ? DEBT_CATEGORIES[debt.category as keyof typeof DEBT_CATEGORIES].icon
                      : Receipt
                    return <CategoryIcon className="h-6 w-6" strokeWidth={2} />
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[17px] text-[#1e2230] truncate">{debt.name}</h3>
                  {debt.debt_date && (
                    <p className="text-[13px] font-semibold text-[#8b93a7]">Vence {format(parseLocalDate(debt.debt_date), "d MMM", { locale: es })}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-[#8b93a7] hover:text-primary hover:bg-primary/10" onClick={(e) => { e.stopPropagation(); setShowEditDialog(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-[#8b93a7] hover:text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); setDeleteId(debt.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-[#8b93a7]" onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}>
                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </Button>
                </div>
              </div>

              {/* Progress and Payment Button */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[13px] font-bold text-[#8b93a7]">
                    ${Number(debt.paid_amount).toLocaleString()} de ${Number(debt.total_amount).toLocaleString()}
                  </span>
                  <span className="text-[13px] font-black text-[#3B6EF6]">
                    {progressPercentage.toFixed(0)}%
                  </span>
                </div>
                
                <div className="h-2 w-full rounded-full bg-[#eef1f7] overflow-hidden mb-4">
                  <div 
                    className={cn("h-full rounded-full transition-transform duration-1000 ease-out origin-left", isActive ? "bg-[#3B6EF6]" : "bg-[#FF7A59]")} 
                    style={{ transform: `scaleX(${progressPercentage / 100})` }}
                  />
                </div>

                {!isPaid && <PaymentForm debtId={debt.id} remainingAmount={remainingAmount} onUpdate={onUpdate} isActive={isActive} />}
              </div>
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
                      <span className="flex items-center justify-center h-5 w-5 text-primary">
                        {(() => {
                          const IconComponent = DEBT_CATEGORIES[debt.category as keyof typeof DEBT_CATEGORIES].icon
                          return <IconComponent className="h-4 w-4" strokeWidth={2} />
                        })()}
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
              {payments.length > 0 && (
                <div className="flex gap-2">
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
                        Ver Pagos ({payments.length})
                      </>
                    )}
                  </Button>
                </div>
              )}

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
        trigger={<span className="hidden" aria-hidden />}
      />
    </>
  )
}
