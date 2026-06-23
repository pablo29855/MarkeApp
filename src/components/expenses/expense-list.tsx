"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
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
import { Trash2, MapPin, Pencil, Receipt } from "lucide-react"
import type { Expense, Category } from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { formatCurrency, parseLocalDate } from "@/lib/utils"
import { useNotification } from '@/hooks/use-notification'
import { ExpenseFormWrapperUnified } from "./expense-form-wrapper-unified"
import { categoryIcon, chartColor, tintColor } from "@/lib/category-visuals"

interface ExpenseListProps {
  expenses: Expense[]
  categories: Category[]
  onUpdate?: () => void
}

export function ExpenseList({ expenses, categories, onUpdate }: ExpenseListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
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
      <div className="flex flex-col items-center justify-center rounded-[24px] bg-card py-14 shadow-card">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
          <Receipt className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-lg font-extrabold">No tienes gastos registrados</p>
        <p className="mt-1 text-sm text-muted-foreground">Agrega tu primer gasto para comenzar</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2.5">
        {expenses.map((expense, index) => {
          const Icon = categoryIcon(expense.category?.name)
          const color = chartColor(index)
          return (
            <div
              key={expense.id}
              className="fade-up flex items-center gap-3 rounded-[20px] bg-card p-3 shadow-card transition-transform active:scale-[.99]"
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                style={{ backgroundColor: tintColor(index) }}
              >
                <Icon className="h-5 w-5" style={{ color }} strokeWidth={2.6} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-foreground">{expense.name}</p>
                <p className="truncate text-[11.5px] text-muted-foreground">
                  {expense.category?.name ? `${expense.category.name} · ` : ""}
                  {expense.location ? (
                    <span className="inline-flex items-center gap-0.5">
                      <MapPin className="inline h-3 w-3" />
                      {expense.location} ·{" "}
                    </span>
                  ) : null}
                  {format(parseLocalDate(expense.purchase_date), "d MMM", { locale: es })}
                </p>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className="text-sm font-black text-coral">
                  −{formatCurrency(Number(expense.amount))}
                </span>
                <div className="flex items-center">
                  <ExpenseFormWrapperUnified
                    expense={expense}
                    categories={categories}
                    userId={expense.user_id}
                    onSuccess={onUpdate}
                    trigger={
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteId(expense.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

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
