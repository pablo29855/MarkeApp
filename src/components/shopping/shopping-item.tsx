
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

  const handlePurchaseClick = () => {
    setQuantity(item.quantity.toString()) // Resetear a la cantidad original
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
    const purchasedQuantity = Number.parseFloat(quantity)
    const totalPrice = Number.parseFloat(unitPrice) * purchasedQuantity

    try {
      // Update shopping item
      const { error: updateError } = await supabase
        .from("shopping_list")
        .update({
          is_purchased: true,
          unit_price: Number.parseFloat(unitPrice),
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
        <div className="p-4 bg-card">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-4xl leading-tight mb-2">
                {item.product_name}
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 bg-primary/10 text-primary rounded-md text-sm font-semibold">
                  Cantidad: {item.quantity}
                </span>
                {item.category && (
                  <span className="inline-flex items-center px-2.5 py-0.5 bg-muted text-muted-foreground rounded-md text-xs">
                    {item.category}
                  </span>
                )}
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={confirmDelete} 
              className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            onClick={handlePurchaseClick}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            size="sm"
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            Comprado
          </Button>
        </div>
      </Card>

      <Dialog open={showPriceDialog} onOpenChange={setShowPriceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Marcar como Comprado</DialogTitle>
            <DialogDescription>
              Ingresa el precio unitario para registrar esta compra
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Producto</Label>
              <p className="text-sm font-medium">{item.product_name}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad Comprada</Label>
              <Input
                id="quantity"
                type="number"
                step="1"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Cantidad original en la lista: {item.quantity}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitPrice">Precio Unitario (COP)</Label>
              <Input
                id="unitPrice"
                type="number"
                step="100"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="0"
                required
                disabled={isLoading}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>Ubicación del Supermercado</Label>
              {!location ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={getLocation}
                  disabled={isGettingLocation}
                  className="w-full bg-transparent"
                >
                  <MapPin className="h-4 w-4 mr-2" />
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
                      title="Mapa de ubicación"
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

            {unitPrice && quantity && (
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground">Total a pagar</p>
                <p className="text-2xl font-bold">{formatCurrency(Number.parseFloat(unitPrice) * Number.parseFloat(quantity))}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {quantity} × {formatCurrency(Number.parseFloat(unitPrice))}
                </p>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPriceDialog(false)
                  setLocation(null)
                  setLocationName("")
                  setUnitPrice("")
                  setQuantity(item.quantity.toString())
                }}
                className="flex-1"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button onClick={handleMarkAsPurchased} className="flex-1" disabled={isLoading || !unitPrice || !quantity}>
                {isLoading ? "Procesando..." : "Confirmar Compra"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará "{item.product_name}" de tu lista de mercado. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
