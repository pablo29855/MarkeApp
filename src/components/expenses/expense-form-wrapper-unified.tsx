import { useState } from 'react'
import { ExpenseFormUnified } from './expense-form-unified'
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
import type { Expense, Category } from '@/lib/types'

interface ExpenseFormWrapperUnifiedProps {
  categories: Category[]
  userId: string
  onSuccess?: () => void
  expense?: Expense
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ExpenseFormWrapperUnified({ 
  categories, 
  userId, 
  onSuccess, 
  expense,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange
}: ExpenseFormWrapperUnifiedProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = controlledOnOpenChange || setInternalOpen

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
      <span className="hidden sm:inline">Agregar Gasto</span>
      <span className="sm:hidden">Nuevo</span>
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent 
        className="w-[calc(100%-2rem)] sm:w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-secondary hover:scrollbar-thumb-secondary/80" 
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="no-ios-zoom">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {expense ? 'Editar Gasto' : 'Nuevo Gasto'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {expense 
                ? 'Modifica los detalles de tu gasto registrado' 
                : 'Completa el formulario para registrar un nuevo gasto'
              }
            </DialogDescription>
          </DialogHeader>
          <ExpenseFormUnified 
            expense={expense}
            categories={categories}
            userId={userId}
            onSuccess={handleSuccess}
            onClose={handleClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
