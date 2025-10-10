
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useNotification } from "@/hooks/use-notification"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, MapPin, ShoppingBag } from "lucide-react"
import type { ShoppingItem } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

interface ShoppingItemProps {
  item: ShoppingItem
  marketCategoryId: string
  onUpdate?: () => void
}

export function ShoppingItemCard({ item, marketCategoryId, onUpdate }: ShoppingItemProps) {
  const [showPriceDialog, setShowPriceDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [unitPrice, setUnitPrice] = useState("")
  const [quantity, setQuantity] = useState(item.quantity.toString())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationName, setLocationName] = useState<string>("")
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const { showSuccess, showError, showDeleted } = useNotification()

  // Función para formatear números con puntos de mil
  const formatNumber = (value: string) => {
    const cleanValue = value.replace(/\D/g, '')
    if (!cleanValue) return ''
    return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  const getNumericValue = (formattedValue: string) => {
    return formattedValue.replace(/\./g, '')
  }

  const handlePurchaseClick = () => {
    setQuantity(formatNumber(item.quantity.toString()))
    setShowPriceDialog(true)
  }

  const getLocation = () => {
    setIsGettingLocation(true)
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          setLocation({ lat, lng })

          // Obtener nombre de la ubicación usando reverse geocoding
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            )
            const data = await response.json()
            setLocationName(data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`)
          } catch {
            setLocationName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
          }
          setIsGettingLocation(false)
        },
        (error) => {
          console.error("Error getting location:", error)
          setError("No se pudo obtener la ubicación. Verifica los permisos.")
          setIsGettingLocation(false)
        },
      )
    } else {
      setError("Tu navegador no soporta geolocalización")
      setIsGettingLocation(false)
    }
  }

  const handleMarkAsPurchased = async () => {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const purchasedQuantity = Number.parseInt(getNumericValue(quantity))
    const priceValue = Number.parseInt(getNumericValue(unitPrice))
    const totalPrice = priceValue * purchasedQuantity

    try {
      // Update shopping item
      const { error: updateError } = await supabase
        .from("shopping_list")
        .update({
          is_purchased: true,
          unit_price: priceValue,
          total_price: totalPrice,
          purchased_at: new Date().toISOString(),
        })
        .eq("id", item.id)

      if (updateError) throw updateError

      // Create expense in Mercado category
      const { error: expenseError } = await supabase.from("expenses").insert({
        user_id: item.user_id,
        name: item.product_name,
        amount: totalPrice,
        category_id: marketCategoryId,
        purchase_date: new Date().toISOString().split("T")[0],
        location: locationName || null,
        notes: `Compra de mercado - ${purchasedQuantity} unidades${location ? ` - Ubicación: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : ""}`,
      })

      if (expenseError) throw expenseError

      // Delete from shopping list
      const { error: deleteError } = await supabase.from("shopping_list").delete().eq("id", item.id)

      if (deleteError) throw deleteError

      setShowPriceDialog(false)
      showSuccess("Producto comprado y agregado a gastos")
      onUpdate?.()
      
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Error al marcar como comprado")
      showError(error instanceof Error ? error.message : "Error al marcar como comprado")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("shopping_list").delete().eq("id", item.id)
      
      if (error) throw error
      
      showDeleted("Producto")
      setShowDeleteDialog(false)
      onUpdate?.()
    } catch (error: unknown) {
      showError(error instanceof Error ? error.message : "Error al eliminar el producto")
    }
  }

  const confirmDelete = () => {
    setShowDeleteDialog(true)
  }

  return (
    <>
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
        <div className="p-3 sm:p-4 lg:p-5 bg-card">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base sm:text-xl lg:text-2xl leading-tight mb-2 line-clamp-2">
                {item.product_name}
              </h3>
              <span className="inline-flex items-center px-2 py-1 sm:px-2.5 sm:py-1 bg-primary/10 text-primary rounded text-xs sm:text-sm font-semibold">
                Cantidad: {item.quantity.toLocaleString('es-CO')}
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={confirmDelete} 
              className="shrink-0 h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            </Button>
          </div>
          
          <Button 
            onClick={handlePurchaseClick}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm sm:text-base h-9 sm:h-10"
            size="sm"
          >
            <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Comprado
          </Button>
        </div>
      </Card>

      <Dialog open={showPriceDialog} onOpenChange={setShowPriceDialog}>
        <DialogContent className="w-[calc(100%-2rem)] sm:w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="no-ios-zoom">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Marcar como Comprado</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Ingresa el precio unitario para registrar esta compra
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Producto</Label>
              <p className="text-sm font-medium truncate">{item.product_name}</p>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="quantity" className="text-xs sm:text-sm">Cantidad Comprada</Label>
              <Input
                id="quantity"
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(formatNumber(e.target.value))}
                placeholder="0"
                required
                disabled={isLoading}
                className="text-sm sm:text-base h-9 sm:h-10"
              />
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Cantidad original en la lista: {item.quantity.toLocaleString('es-CO')}
              </p>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="unitPrice" className="text-xs sm:text-sm">Precio Unitario (COP)</Label>
              <Input
                id="unitPrice"
                type="text"
                value={unitPrice}
                onChange={(e) => setUnitPrice(formatNumber(e.target.value))}
                placeholder="0"
                required
                disabled={isLoading}
                autoFocus
                className="text-sm sm:text-base h-9 sm:h-10"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Ubicación del Supermercado</Label>
              {/* Input manual para ingresar/editar la ubicación */}
              <Input
                id="purchase_location"
                value={locationName}
                onChange={(e) => {
                  setLocationName(e.target.value)
                  // Si el usuario edita manualmente, limpiamos la lat/lng para no mostrar el mapa
                  setLocation(null)
                }}
                placeholder="Ej: Supermercado XYZ"
                disabled={isLoading}
                className="text-sm sm:text-base h-9 sm:h-10"
              />

              <div className="mt-2">
                {!location ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={getLocation}
                    disabled={isGettingLocation}
                    className="w-full bg-transparent text-sm sm:text-base h-9 sm:h-10"
                  >
                    <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                    {isGettingLocation ? "Obteniendo ubicación..." : "Obtener Ubicación Actual"}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Ubicación guardada:</p>
                      <p className="text-sm font-medium truncate">{locationName}</p>
                    </div>
                    {/* Mapa simple con OpenStreetMap */}
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                      <iframe
                        title="Mapa de ubicacion"
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.lng - 0.01},${location.lat - 0.01},${location.lng + 0.01},${location.lat + 0.01}&layer=mapnik&marker=${location.lat},${location.lng}`}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setLocation(null)
                        setLocationName("")
                      }}
                      className="w-full"
                    >
                      Cambiar ubicación
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {unitPrice && quantity && (
              <div className="p-3 sm:p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-xs sm:text-sm text-muted-foreground">Total a pagar</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {formatCurrency(Number.parseInt(getNumericValue(unitPrice)) * Number.parseInt(getNumericValue(quantity)))}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                  {quantity} × {formatCurrency(Number.parseInt(getNumericValue(unitPrice)))}
                </p>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPriceDialog(false)
                  setLocation(null)
                  setLocationName("")
                  setUnitPrice("")
                  setQuantity(formatNumber(item.quantity.toString()))
                }}
                className="flex-1 text-sm sm:text-base h-9 sm:h-10"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button onClick={handleMarkAsPurchased} className="flex-1 text-sm sm:text-base h-9 sm:h-10" disabled={isLoading || !unitPrice || !quantity}>
                {isLoading ? "Procesando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="w-[calc(100%-2rem)] sm:w-full">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Esta acción eliminará "{item.product_name}" de tu lista de mercado. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-sm sm:text-base h-9 sm:h-10">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm sm:text-base h-9 sm:h-10">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
