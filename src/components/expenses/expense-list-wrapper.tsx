
import { useNavigate } from "react-router-dom"
import { ExpenseList } from "./expense-list"
import type { Expense, Category } from "@/lib/types"

interface ExpenseListWrapperProps {
  expenses: Expense[]
  categories: Category[]
  onUpdate?: () => void
}

export function ExpenseListWrapper({ expenses, categories, onUpdate }: ExpenseListWrapperProps) {
  const navigate = useNavigate()

  return <ExpenseList expenses={expenses} categories={categories} onUpdate={onUpdate || (() => navigate(0))} />
}
