"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { exportExpensesToCSV } from "@/lib/export-utils"
import { useNotification } from "@/hooks/use-notification"
import type { Expense } from "@/lib/types"

interface ExportButtonProps {
  expenses: Expense[]
}

export function ExportButton({ expenses }: ExportButtonProps) {
  const { showSuccess, showWarning } = useNotification()

  const handleExport = () => {
    if (expenses.length === 0) {
      showWarning("Sin datos", "No hay gastos para exportar")
      return
    }

    try {
      exportExpensesToCSV(expenses)
      showSuccess("Exportado", `Se exportaron ${expenses.length} gastos correctamente`)
    } catch (error) {
      console.error("Error exporting CSV:", error)
      showWarning("Error al exportar", "No se pudo generar el archivo CSV")
    }
  }

  return (
    <Button 
      onClick={handleExport} 
      variant="outline" 
      disabled={expenses.length === 0}
      className="h-[34px] rounded-full px-4 text-xs font-bold text-primary border-primary/20 bg-primary/5 hover:bg-primary/10"
    >
      <Download className="mr-1.5 h-3.5 w-3.5" />
      CSV
    </Button>
  )
}
