
import { ShoppingForm } from "./shopping-form"
import type { Category } from "@/lib/types"

interface ShoppingFormWrapperProps {
  userId: string
  categories: Category[]
  onSuccess?: () => void
}

export function ShoppingFormWrapper({ userId, categories, onSuccess }: ShoppingFormWrapperProps) {
  return <ShoppingForm userId={userId} categories={categories} onSuccess={onSuccess} />
}
