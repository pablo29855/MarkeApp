
import { DebtForm } from "./debt-form"

interface DebtFormWrapperProps {
  userId: string
  onSuccess?: () => void
}

export function DebtFormWrapper({ userId, onSuccess }: DebtFormWrapperProps) {
  return <DebtForm userId={userId} onSuccess={onSuccess} />
}
