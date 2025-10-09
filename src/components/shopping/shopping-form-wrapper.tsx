
import { useNavigate } from "react-router-dom"
import { ShoppingForm } from "./shopping-form"
import type { Category } from "@/lib/types"

export function ShoppingFormWrapper({ userId, categories }: { userId: string; categories: Category[] }) {
  const navigate = useNavigate()

  return <ShoppingForm userId={userId} categories={categories} onSuccess={() => navigate(0)} />
}
