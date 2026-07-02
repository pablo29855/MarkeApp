import { useState } from 'react'
import { ShoppingForm } from './shopping-form'
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
import type { Category, ShoppingItem } from '@/lib/types'

interface ShoppingFormWrapperProps {
  userId: string
  categories: Category[]
  onSuccess?: () => void
  item?: ShoppingItem
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ShoppingFormWrapper({
  userId,
  categories,
  onSuccess,
  item,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: ShoppingFormWrapperProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isMobile = useIsMobile()

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = controlledOnOpenChange || setInternalOpen

  const handleSuccess = () => {
    setOpen(false)
    onSuccess?.()
  }

  const title = item ? 'Editar Producto' : 'Nuevo Producto'
  const description = item
    ? 'Edita el producto de tu lista de compras'
    : 'Agrega un producto a tu lista de compras'

  const defaultTrigger = (
    <Button className="w-auto">
      <Plus className="h-4 w-4 sm:mr-2" />
      <span className="hidden sm:inline">Agregar Producto</span>
      <span className="sm:hidden">Nuevo</span>
    </Button>
  )

  // Inyectamos las props al ShoppingForm original. 
  // NOTA: ShoppingForm original tiene su propio Dialog, así que debemos asegurarnos
  // de que actúe solo como el contenido, o podemos usar el ShoppingForm modificado si es necesario.
  // Pero espera, el ShoppingForm ya tiene Dialog interno. Mejor lo cambiamos para que no lo tenga,
  // O podemos modificar ShoppingForm también para quitarle el Dialog interno.
  // Por ahora asumo que actualizaremos ShoppingForm para remover el Dialog wrapper, igual que hicimos con los demás.
  const form = <ShoppingForm userId={userId} categories={categories} onSuccess={handleSuccess} item={item} />

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
        className={`w-[calc(100%-2rem)] sm:w-full max-w-md max-h-[90vh] overflow-y-auto px-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-secondary hover:scrollbar-thumb-secondary/80`}
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
