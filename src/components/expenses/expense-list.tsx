"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { Trash2, MapPin, FileText, Pencil } from "lucide-react"
import type { Expense, Category } from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { formatCurrency, parseLocalDate } from "@/lib/utils"
import { useNotification } from '@/hooks/use-notification'
import { ExpenseEditDialog } from "./expense-edit-dialog"

interface ExpenseListProps {
  expenses: Expense[]
  categories: Category[]
  onUpdate?: () => void
}

export function ExpenseList({ expenses, categories, onUpdate }: ExpenseListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editExpense, setEditExpense] = useState<Expense | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { showDeleted, showError } = useNotification()

  const handleDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("expenses").delete().eq("id", deleteId)

      if (error) throw error

        showDeleted('Gasto')
      setDeleteId(null)
      onUpdate?.()
    } catch (error) {
      console.error("Error deleting expense:", error)
        showError('Error al eliminar gasto')
    } finally {
      setIsDeleting(false)
    }
  }

  if (expenses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground text-center text-base sm:text-lg">No se encontraron gastos</p>
          <p className="text-sm sm:text-base text-muted-foreground text-center mt-2">Agrega tu primer gasto para comenzar</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        {expenses.map((expense) => (
          <Card key={expense.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 h-full">
            <CardContent className="p-3 sm:p-4 lg:p-5 h-full flex flex-col">
              {/* Header con título, categoría y botones */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base sm:text-lg lg:text-xl leading-tight line-clamp-2 mb-2">
                    {expense.name}
                  </h3>
                  {expense.category && (
                    <Badge 
                      variant="secondary" 
                      className="text-xs sm:text-sm inline-flex items-center"
                      style={{ backgroundColor: expense.category.color + "20" }}
                    >
                      <span className="hidden sm:inline mr-1">{expense.category.icon}</span>
                      <span className="truncate">{expense.category.name}</span>
                    </Badge>
                  )}
                </div>
                
                {/* Botones de acción en el header */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteId(expense.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-primary hover:bg-primary/10"
                    onClick={() => setEditExpense(expense)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Información adicional */}
              <div className="space-y-1 text-xs sm:text-sm text-muted-foreground mb-3 flex-1">
                <p className="truncate">
                  {format(parseLocalDate(expense.purchase_date), "PPP", {
                    locale: es,
                  })}
                </p>
                {expense.location && (
                  <p className="flex items-center gap-1 truncate">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{expense.location}</span>
                  </p>
                )}
                {expense.notes && (
                  <p className="flex items-center gap-1 truncate">
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{expense.notes}</span>
                  </p>
                )}
              </div>

              {/* Monto al final del card */}
              <div className="mt-auto pt-3 border-t">
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold break-all">
                  {formatCurrency(Number(expense.amount))}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editExpense && (
        <ExpenseEditDialog
          expense={editExpense}
          categories={categories}
          open={!!editExpense}
          onOpenChange={(open) => !open && setEditExpense(null)}
          onSuccess={() => {
            setEditExpense(null)
            onUpdate?.()
          }}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El gasto será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="dark:shadow-[0_4px_12px_rgba(0,0,0,0.6)] dark:border dark:border-slate-700">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground">
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
