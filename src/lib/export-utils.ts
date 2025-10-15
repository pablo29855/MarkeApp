import type { Expense } from "./types"
import { format } from "date-fns"
import { parseLocalDate } from "./utils"

export function exportExpensesToCSV(expenses: Expense[]) {
  if (!expenses || expenses.length === 0) {
    console.warn("No expenses to export")
    return
  }

  // Define CSV headers
  const headers = ["Fecha", "Nombre", "Categoría", "Monto", "Ubicación", "Notas"]

  // Convert expenses to CSV rows
  const rows = expenses.map((expense) => {
    // Validar que expense tenga los datos necesarios
    const purchaseDate = expense.purchase_date 
      ? format(parseLocalDate(expense.purchase_date), "yyyy-MM-dd")
      : ""
    
    const categoryName = expense.category?.name || "Sin categoría"
    const amount = expense.amount?.toString() || "0"
    const location = expense.location || ""
    const notes = expense.notes || ""
    
    return [
      purchaseDate,
      expense.name || "",
      categoryName,
      amount,
      location,
      notes,
    ]
  })

  // Combine headers and rows
  const csvContent = [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => {
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          const cellStr = String(cell)
          if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
            return `"${cellStr.replace(/"/g, '""')}"`
          }
          return cellStr
        })
        .join(","),
    )
    .join("\n")

  // Create blob and download
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", `gastos_${format(new Date(), "yyyy-MM-dd")}.csv`)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  // Limpiar el URL objeto
  URL.revokeObjectURL(url)
}
