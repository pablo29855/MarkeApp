"use client"

import { useRouter } from "next/navigation"
import { ShoppingForm } from "./shopping-form"
import type { Category } from "@/lib/types"

export function ShoppingFormWrapper({ userId, categories }: { userId: string; categories: Category[] }) {
  const router = useRouter()

  return <ShoppingForm userId={userId} categories={categories} onSuccess={() => router.refresh()} />
}
