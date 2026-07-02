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
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { scrollbarClasses } from '@/lib/styles'
import type { Income } from '@/lib/types'

interface IncomeFormWrapperProps {
  onSuccess?: () => void
  income?: Income
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function IncomeFormWrapper({
  onSuccess,
  income,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: IncomeFormWrapperProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isMobile = useIsMobile()

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = controlledOnOpenChange || setInternalOpen

  const handleSuccess = () => {
    setOpen(false)
    onSuccess?.()
  }

  const handleClose = () => {
    setOpen(false)
  }

  const title = income ? 'Editar Ingreso' : 'Nuevo Ingreso'
  const description = income
    ? 'Modifica los detalles de tu ingreso registrado'
    : 'Completa el formulario para registrar un nuevo ingreso'

  const defaultTrigger = (
    <Button className="w-auto">
      <Plus className="h-4 w-4 sm:mr-2" />
      <span className="hidden sm:inline">Agregar Ingreso</span>
      <span className="sm:hidden">Nuevo</span>
    </Button>
  )

  const form = <IncomeForm onSuccess={handleSuccess} income={income} onClose={handleClose} />

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{trigger || defaultTrigger}</DrawerTrigger>
        <DrawerContent className="rounded-t-[32px]" onOpenAutoFocus={(e) => e.preventDefault()}>
          <div className={`no-ios-zoom max-h-[82vh] overflow-y-auto px-4 ${scrollbarClasses}`}>
            <DrawerHeader className="px-0">
              <DrawerTitle className="text-xl font-black">{title}</DrawerTitle>
              <DrawerDescription className="text-sm">{description}</DrawerDescription>
            </DrawerHeader>
            {form}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent
        className="w-[calc(100%-2rem)] sm:w-full max-w-md max-h-[90vh] overflow-y-auto px-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-secondary hover:scrollbar-thumb-secondary/80"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="no-ios-zoom">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{title}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">{description}</DialogDescription>
          </DialogHeader>
          {form}
        </div>
      </DialogContent>
    </Dialog>
  )
}
