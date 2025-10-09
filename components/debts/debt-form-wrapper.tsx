"use client"

import { useRouter } from "next/navigation"
import { DebtForm } from "./debt-form"

export function DebtFormWrapper({ userId }: { userId: string }) {
  const router = useRouter()

  return <DebtForm userId={userId} onSuccess={() => router.refresh()} />
}
