import { useState } from 'react'
import { IncomeForm } from './income-form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface IncomeFormWrapperProps {
  onSuccess?: () => void
}

export function IncomeFormWrapper({ onSuccess }: IncomeFormWrapperProps) {
  const [open, setOpen] = useState(false)

  const handleSuccess = () => {
    setOpen(false)
    onSuccess?.()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-auto">
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Agregar Ingreso</span>
          <span className="sm:hidden">Nuevo</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-2rem)] sm:w-full max-w-md max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="no-ios-zoom">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Nuevo Ingreso</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Completa el formulario para registrar un nuevo ingreso
            </DialogDescription>
          </DialogHeader>
          <IncomeForm onSuccess={handleSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
