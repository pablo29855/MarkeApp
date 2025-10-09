"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { exportExpensesToCSV } from "@/lib/export-utils"
import type { Expense } from "@/lib/types"

interface ExportButtonProps {
  expenses: Expense[]
}

export function ExportButton({ expenses }: ExportButtonProps) {
  const handleExport = () => {
    if (expenses.length === 0) {
      return
    }
    exportExpensesToCSV(expenses)
  }

  return (
    <Button onClick={handleExport} variant="outline" disabled={expenses.length === 0}>
      <Download className="h-4 w-4 mr-2" />
      Exportar CSV
    </Button>
  )
}
