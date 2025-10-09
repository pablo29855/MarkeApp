"use client"

import { useRouter } from "next/navigation"
import { ExpenseList } from "./expense-list"
import type { Expense, Category } from "@/lib/types"

export function ExpenseListWrapper({ expenses, categories }: { expenses: Expense[]; categories: Category[] }) {
  const router = useRouter()

  return <ExpenseList expenses={expenses} categories={categories} onUpdate={() => router.refresh()} />
}
