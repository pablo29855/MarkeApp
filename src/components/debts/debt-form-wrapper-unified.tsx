"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { scrollbarClasses } from "@/lib/styles"
import { Plus } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
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

  const title = debt ? "Editar Deuda" : "Nueva Deuda"
  const description = debt 
    ? "Modifica los detalles de tu deuda" 
    : "Registra una nueva deuda para llevar un control de tus pagos pendientes"

  const defaultTrigger = (
    <Button className="text-xs sm:text-sm h-9 sm:h-10">
      <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
      <span className="hidden xs:inline">Agregar Deuda</span>
      <span className="xs:hidden">Nueva</span>
    </Button>
  )

  const form = (
    <DebtFormUnified 
      userId={userId} 
      debt={debt} 
      onSuccess={handleSuccess}
      onClose={handleClose}
    />
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{trigger || defaultTrigger}</DrawerTrigger>
        <DrawerContent className="rounded-t-[32px]">
          <div className={`no-ios-zoom max-h-[82vh] overflow-y-auto px-4 pb-8 ${scrollbarClasses}`}>
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
        className={`max-w-md w-[calc(100%-2rem)] sm:w-full max-h-[90vh] overflow-y-auto ${scrollbarClasses}`} 
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
