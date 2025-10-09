
import { useNavigate } from "react-router-dom"
import { DebtForm } from "./debt-form"

export function DebtFormWrapper({ userId }: { userId: string }) {
  const navigate = useNavigate()

  return <DebtForm userId={userId} onSuccess={() => navigate(0)} />
}
