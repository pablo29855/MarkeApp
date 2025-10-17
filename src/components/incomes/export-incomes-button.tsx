"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { exportIncomesToCSV } from "@/lib/export-utils"
import { useNotification } from "@/hooks/use-notification"
import type { Income } from "@/lib/types"

interface ExportIncomesButtonProps {
  incomes: Income[]
}

export function ExportIncomesButton({ incomes }: ExportIncomesButtonProps) {
  const { showSuccess, showWarning } = useNotification()

  const handleExport = () => {
    if (incomes.length === 0) {
      showWarning("Sin datos", "No hay ingresos para exportar")
      return
    }

    try {
      exportIncomesToCSV(incomes)
      showSuccess("Exportado", `Se exportaron ${incomes.length} ingresos correctamente`)
    } catch (error) {
      console.error("Error exporting CSV:", error)
      showWarning("Error al exportar", "No se pudo generar el archivo CSV")
    }
  }

  return (
    <Button onClick={handleExport} variant="outline" disabled={incomes.length === 0}>
      <Download className="h-4 w-4 mr-2" />
      Exportar Excel
    </Button>
  )
}