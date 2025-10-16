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
import type { Income } from '@/lib/types'

interface IncomeFormWrapperProps {
  onSuccess?: () => void
  income?: Income
  trigger?: React.ReactNode
}

export function IncomeFormWrapper({ onSuccess, income, trigger }: IncomeFormWrapperProps) {
  const [open, setOpen] = useState(false)

  const handleSuccess = () => {
    setOpen(false)
    onSuccess?.()
  }

  const handleClose = () => {
    setOpen(false)
  }

  const defaultTrigger = (
    <Button className="w-auto">
      <Plus className="h-4 w-4 sm:mr-2" />
      <span className="hidden sm:inline">Agregar Ingreso</span>
      <span className="sm:hidden">Nuevo</span>
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-2rem)] sm:w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-secondary hover:scrollbar-thumb-secondary/80" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="no-ios-zoom">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {income ? 'Editar Ingreso' : 'Nuevo Ingreso'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {income 
                ? 'Modifica los detalles de tu ingreso registrado' 
                : 'Completa el formulario para registrar un nuevo ingreso'
              }
            </DialogDescription>
          </DialogHeader>
          <IncomeForm onSuccess={handleSuccess} income={income} onClose={handleClose} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
