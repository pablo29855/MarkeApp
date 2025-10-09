
import { useNavigate } from "react-router-dom"
import { ExpenseList } from "./expense-list"
import type { Expense, Category } from "@/lib/types"

export function ExpenseListWrapper({ expenses, categories }: { expenses: Expense[]; categories: Category[] }) {
  const navigate = useNavigate()

  return <ExpenseList expenses={expenses} categories={categories} onUpdate={() => navigate(0)} />
}
