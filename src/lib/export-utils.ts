import type { Expense, Income } from "./types"
import { format } from "date-fns"
import { parseLocalDate } from "./utils"

export function exportExpensesToCSV(expenses: Expense[]) {
  if (!expenses || expenses.length === 0) {
    console.warn("No expenses to export")
    return
  }

  const exportDate = format(new Date(), "yyyy-MM-dd HH:mm:ss")
  const totalAmount = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0)

  // Sort expenses by date (most recent first)
  const sortedExpenses = [...expenses].sort((a, b) =>
    new Date(b.purchase_date || 0).getTime() - new Date(a.purchase_date || 0).getTime()
  )

  // Create CSV content with better structure
  const csvLines: string[] = []

  // Header section
  csvLines.push("REPORTE DE GASTOS")
  csvLines.push("")
  csvLines.push(`Fecha de Exportación:,${exportDate}`)
  csvLines.push(`Total de Registros:,${expenses.length}`)
  csvLines.push(`Monto Total:,$ ${totalAmount.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} COP`)
  csvLines.push("")
  csvLines.push("DETALLE DE GASTOS")
  csvLines.push("")

  // Column headers
  const headers = [
    "ID",
    "Fecha de Compra",
    "Nombre del Gasto",
    "Categoría",
    "Ícono Categoría",
    "Monto (COP)",
    "Ubicación",
    "Notas",
    "Fecha de Creación"
  ]
  csvLines.push(headers.join(","))

  // Data rows
  sortedExpenses.forEach((expense) => {
    const purchaseDate = expense.purchase_date
      ? format(parseLocalDate(expense.purchase_date), "dd/MM/yyyy")
      : ""

    const createdDate = expense.created_at
      ? format(new Date(expense.created_at), "dd/MM/yyyy HH:mm")
      : ""

    const row = [
      `"${expense.id || ""}"`,
      `"${purchaseDate}"`,
      `"${(expense.name || "").replace(/"/g, '""')}"`,
      `"${(expense.category?.name || "Sin categoría").replace(/"/g, '""')}"`,
      `"${expense.category?.icon || ""}"`,
      `"$ ${(Number(expense.amount || 0)).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}"`,
      `"${(expense.location || "").replace(/"/g, '""')}"`,
      `"${(expense.notes || "").replace(/"/g, '""')}"`,
      `"${createdDate}"`
    ]

    csvLines.push(row.join(","))
  })

  // Summary section
  csvLines.push("")
  csvLines.push("RESUMEN")
  csvLines.push(`Total Gastos:,$ ${totalAmount.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} COP`)
  csvLines.push(`Número de Registros:,${expenses.length}`)

  // Join all lines
  const csvContent = csvLines.join("\n")

  // Create and download file
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", `gastos_${format(new Date(), "yyyy-MM-dd_HH-mm")}.csv`)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

export function exportIncomesToCSV(incomes: Income[]) {
  if (!incomes || incomes.length === 0) {
    console.warn("No incomes to export")
    return
  }

  const exportDate = format(new Date(), "yyyy-MM-dd HH:mm:ss")
  const totalAmount = incomes.reduce((sum, income) => sum + Number(income.amount || 0), 0)

  // Sort incomes by date (most recent first)
  const sortedIncomes = [...incomes].sort((a, b) =>
    new Date(b.income_date || 0).getTime() - new Date(a.income_date || 0).getTime()
  )

  // Create CSV content with better structure
  const csvLines: string[] = []

  // Header section
  csvLines.push("REPORTE DE INGRESOS")
  csvLines.push("")
  csvLines.push(`Fecha de Exportación:,${exportDate}`)
  csvLines.push(`Total de Registros:,${incomes.length}`)
  csvLines.push(`Monto Total:,$ ${totalAmount.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} COP`)
  csvLines.push("")
  csvLines.push("DETALLE DE INGRESOS")
  csvLines.push("")

  // Column headers
  const headers = [
    "ID",
    "Fecha de Ingreso",
    "Descripción",
    "Tipo de Ingreso",
    "Ícono Tipo",
    "Monto (COP)",
    "Notas",
    "Fecha de Creación",
    "Última Actualización"
  ]
  csvLines.push(headers.join(","))

  // Data rows
  sortedIncomes.forEach((income) => {
    const incomeDate = income.income_date
      ? format(parseLocalDate(income.income_date), "dd/MM/yyyy")
      : ""

    const createdDate = income.created_at
      ? format(new Date(income.created_at), "dd/MM/yyyy HH:mm")
      : ""

    const updatedDate = income.updated_at
      ? format(new Date(income.updated_at), "dd/MM/yyyy HH:mm")
      : ""

    // Get type info with icon
    const getIncomeTypeInfo = (type: string) => {
      switch (type) {
        case 'nomina':
          return { label: 'Nómina', icon: '💼' }
        case 'transferencia':
          return { label: 'Transferencia', icon: '🏦' }
        case 'efectivo':
          return { label: 'Efectivo', icon: '💵' }
        default:
          return { label: type, icon: '💰' }
      }
    }

    const typeInfo = getIncomeTypeInfo(income.income_type)

    const row = [
      `"${income.id || ""}"`,
      `"${incomeDate}"`,
      `"${(income.description || "").replace(/"/g, '""')}"`,
      `"${typeInfo.label}"`,
      `"${typeInfo.icon}"`,
      `"$ ${(Number(income.amount || 0)).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}"`,
      `"${(income.notes || "").replace(/"/g, '""')}"`,
      `"${createdDate}"`,
      `"${updatedDate}"`
    ]

    csvLines.push(row.join(","))
  })

  // Summary section
  csvLines.push("")
  csvLines.push("RESUMEN")
  csvLines.push(`Total Ingresos:,$ ${totalAmount.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} COP`)
  csvLines.push(`Número de Registros:,${incomes.length}`)

  // Join all lines
  const csvContent = csvLines.join("\n")

  // Create and download file
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", `ingresos_${format(new Date(), "yyyy-MM-dd_HH-mm")}.csv`)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}
