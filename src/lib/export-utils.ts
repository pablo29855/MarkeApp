import type { Expense } from "./types"
import { format } from "date-fns"

export function exportExpensesToCSV(expenses: Expense[]) {
  // Define CSV headers
  const headers = ["Fecha", "Nombre", "Categoría", "Monto", "Ubicación", "Notas"]

  // Convert expenses to CSV rows
  const rows = expenses.map((expense) => {
    return [
      format(new Date(expense.purchase_date), "yyyy-MM-dd"),
      expense.name,
      expense.category?.name || "Sin categoría",
      expense.amount.toString(),
      expense.location || "",
      expense.notes || "",
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
}
