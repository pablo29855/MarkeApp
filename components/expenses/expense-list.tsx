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
import { formatCurrency } from "@/lib/utils"
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

  const handleDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("expenses").delete().eq("id", deleteId)

      if (error) throw error

      setDeleteId(null)
      onUpdate?.()
    } catch (error) {
      console.error("Error deleting expense:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  if (expenses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground text-center">No se encontraron gastos</p>
          <p className="text-sm text-muted-foreground text-center mt-2">Agrega tu primer gasto para comenzar</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {expenses.map((expense) => (
          <Card key={expense.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{expense.name}</h3>
                    {expense.category && (
                      <Badge variant="secondary" style={{ backgroundColor: expense.category.color + "20" }}>
                        {expense.category.icon} {expense.category.name}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>
                      {format(new Date(expense.purchase_date), "PPP", {
                        locale: es,
                      })}
                    </p>
                    {expense.location && (
                      <p className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {expense.location}
                      </p>
                    )}
                    {expense.notes && (
                      <p className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {expense.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-2xl font-bold">{formatCurrency(Number(expense.amount))}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setEditExpense(expense)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(expense.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
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
