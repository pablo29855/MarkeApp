import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatCurrency, parseLocalDate } from '@/lib/utils'
import { Pencil, Trash2, FileText } from 'lucide-react'
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

  const getIncomeTypeInfo = (type: string) => {
    switch (type) {
      case 'nomina':
        return { label: 'Nómina', icon: '💼', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' }
      case 'transferencia':
        return { label: 'Transferencia', icon: '🏦', color: 'bg-green-500/10 text-green-700 dark:text-green-400' }
      case 'efectivo':
        return { label: 'Efectivo', icon: '💵', color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' }
      default:
        return { label: type, icon: '💰', color: 'bg-gray-500/10 text-gray-700 dark:text-gray-400' }
    }
  }

  if (incomes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground text-center text-base sm:text-lg">No se encontraron ingresos</p>
          <p className="text-sm sm:text-base text-muted-foreground text-center mt-2">Agrega tu primer ingreso para comenzar</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        {incomes.map((income) => {
          const typeInfo = getIncomeTypeInfo(income.income_type)
          
          return (
            <Card key={income.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 h-full">
              <CardContent className="p-3 sm:p-4 lg:p-5 h-full flex flex-col">
                {/* Header con título, tipo y botones */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base sm:text-lg lg:text-xl leading-tight line-clamp-2 mb-2">
                      {income.description}
                    </h3>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs sm:text-sm inline-flex items-center ${typeInfo.color}`}
                    >
                      <span className="hidden sm:inline mr-1">{typeInfo.icon}</span>
                      <span className="truncate">{typeInfo.label}</span>
                    </Badge>
                  </div>
                  
                  {/* Botones de acción en el header */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteId(income.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-primary hover:bg-primary/10"
                      onClick={() => setEditingIncome(income)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Información adicional */}
                <div className="space-y-1 text-xs sm:text-sm text-muted-foreground mb-3 flex-1">
                  <p className="truncate">
                    {format(parseLocalDate(income.income_date), "PPP", {
                      locale: es,
                    })}
                  </p>
                  {income.notes && (
                    <p className="flex items-center gap-1 truncate">
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{income.notes}</span>
                    </p>
                  )}
                </div>

                {/* Monto al final del card */}
                <div className="mt-auto pt-3 border-t">
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600 dark:text-blue-400 break-all">
                    {formatCurrency(Number(income.amount))}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Dialog para editar */}
      <Dialog open={!!editingIncome} onOpenChange={() => setEditingIncome(null)}>
        <DialogContent className="w-[calc(100%-2rem)] sm:w-full max-w-md max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
          <div className="no-ios-zoom">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Editar Ingreso</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Modifica los detalles del ingreso
              </DialogDescription>
            </DialogHeader>
            {editingIncome && (
              <IncomeForm
                income={editingIncome}
                onSuccess={() => {
                  setEditingIncome(null)
                  onUpdate()
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

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
