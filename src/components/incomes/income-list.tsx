import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { IncomeForm } from './income-form'
import { IncomeFormWrapper } from './income-form-wrapper'
import { formatCurrency, parseLocalDate } from '@/lib/utils'
import { Pencil, Trash2, TrendingUp, Briefcase, Landmark, Banknote, Wallet, type LucideIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useNotification } from '@/hooks/use-notification'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Income } from '@/lib/types'

interface IncomeListProps {
  incomes: Income[]
  onUpdate: () => void
}

export function IncomeList({ incomes, onUpdate }: IncomeListProps) {
  const [editingIncome, setEditingIncome] = useState<Income | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { showDeleted, showError } = useNotification()

  const handleDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('incomes')
        .delete()
        .eq('id', deleteId)

      if (error) throw error

      showDeleted('Ingreso')

      setDeleteId(null)
      onUpdate()
    } catch (error) {
      console.error('Error al eliminar ingreso:', error)
      showError('Error al eliminar ingreso')
    } finally {
      setIsDeleting(false)
    }
  }

  const getIncomeTypeInfo = (type: string): { label: string; Icon: LucideIcon } => {
    switch (type) {
      case 'nomina':
        return { label: 'Nómina', Icon: Briefcase }
      case 'transferencia':
        return { label: 'Transferencia', Icon: Landmark }
      case 'efectivo':
        return { label: 'Efectivo', Icon: Banknote }
      default:
        return { label: type, Icon: Wallet }
    }
  }

  if (incomes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[24px] bg-card py-14 shadow-card">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
          <TrendingUp className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-lg font-extrabold">No tienes ingresos registrados</p>
        <p className="mt-1 text-sm text-muted-foreground">Agrega tu primer ingreso para comenzar</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2.5">
        {incomes.map((income) => {
          const { label, Icon } = getIncomeTypeInfo(income.income_type)

          return (
            <div
              key={income.id}
              className="fade-up flex items-center gap-3 rounded-[20px] bg-card p-3 shadow-card transition-transform active:scale-[.99]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--chart-1)/0.14)]">
                <Icon className="h-5 w-5 text-[hsl(var(--chart-1))]" strokeWidth={2.6} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-foreground">{income.description}</p>
                <p className="truncate text-[11.5px] text-muted-foreground">
                  {label} · {format(parseLocalDate(income.income_date), "d MMM", { locale: es })}
                </p>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className="text-sm font-black text-primary">+{formatCurrency(Number(income.amount))}</span>
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                    onClick={() => setEditingIncome(income)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteId(income.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Form Wrapper unificado para editar */}
      <IncomeFormWrapper
        open={!!editingIncome}
        onOpenChange={(open) => {
          if (!open) setEditingIncome(null)
        }}
        income={editingIncome || undefined}
        onSuccess={() => {
          setEditingIncome(null)
          onUpdate()
        }}
        trigger={<span className="hidden" aria-hidden />}
      />

      {/* Dialog para eliminar */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El ingreso será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
