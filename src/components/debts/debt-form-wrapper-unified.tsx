"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { scrollbarClasses } from "@/lib/styles"
import { Plus } from "lucide-react"
import { DebtFormUnified } from "./debt-form-unified"
import type { Debt } from "@/lib/types"

interface DebtFormWrapperUnifiedProps {
  userId: string
  debt?: Debt
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
}

export function DebtFormWrapperUnified({ 
  userId, 
  debt, 
  trigger, 
  open: controlledOpen, 
  onOpenChange: controlledOnOpenChange,
  onSuccess 
}: DebtFormWrapperUnifiedProps) {
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!debt && !trigger && (
        <DialogTrigger asChild>
          <Button className="text-xs sm:text-sm h-9 sm:h-10">
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Agregar Deuda</span>
            <span className="xs:hidden">Nueva</span>
          </Button>
        </DialogTrigger>
      )}
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent 
        className={`max-w-md w-[calc(100%-2rem)] sm:w-full max-h-[90vh] overflow-y-auto ${scrollbarClasses}`} 
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="no-ios-zoom">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {debt ? "Editar Deuda" : "Nueva Deuda"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {debt 
                ? "Modifica los detalles de tu deuda" 
                : "Registra una nueva deuda para llevar un control de tus pagos pendientes"
              }
            </DialogDescription>
          </DialogHeader>
          <DebtFormUnified 
            userId={userId} 
            debt={debt} 
            onSuccess={handleSuccess}
            onClose={handleClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
