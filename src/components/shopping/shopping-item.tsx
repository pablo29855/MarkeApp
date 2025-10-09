
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, MapPin } from "lucide-react"
import type { ShoppingItem } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

interface ShoppingItemProps {
  item: ShoppingItem
  marketCategoryId: string
}

export function ShoppingItemCard({ item, marketCategoryId }: ShoppingItemProps) {
  const [showPriceDialog, setShowPriceDialog] = useState(false)
  const [unitPrice, setUnitPrice] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationName, setLocationName] = useState<string>("")
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const navigate = useNavigate()

  const handleCheckboxChange = async (checked: boolean) => {
    if (checked) {
      setShowPriceDialog(true)
    }
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
    const totalPrice = Number.parseFloat(unitPrice) * item.quantity

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
        notes: `Compra de mercado - ${item.quantity} unidades${location ? ` - Ubicación: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : ""}`,
      })

      if (expenseError) throw expenseError

      // Delete from shopping list
      const { error: deleteError } = await supabase.from("shopping_list").delete().eq("id", item.id)

      if (deleteError) throw deleteError

      setShowPriceDialog(false)
      
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Error al marcar como comprado")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    const supabase = createClient()
    await supabase.from("shopping_list").delete().eq("id", item.id)
    
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Checkbox checked={false} onCheckedChange={handleCheckboxChange} className="mt-1" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-balance">{item.product_name}</p>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
                <span className="font-medium">Cantidad: {item.quantity}</span>
                {item.category && (
                  <>
                    <span>•</span>
                    <span className="truncate">{item.category}</span>
                  </>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleDelete} className="shrink-0">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showPriceDialog} onOpenChange={setShowPriceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Marcar como Comprado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Producto</Label>
              <p className="text-sm font-medium">{item.product_name}</p>
            </div>

            <div className="space-y-2">
              <Label>Cantidad</Label>
              <p className="text-sm font-medium">{item.quantity}</p>
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

            {unitPrice && (
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground">Total a pagar</p>
                <p className="text-2xl font-bold">{formatCurrency(Number.parseFloat(unitPrice) * item.quantity)}</p>
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
                }}
                className="flex-1"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button onClick={handleMarkAsPurchased} className="flex-1" disabled={isLoading || !unitPrice}>
                {isLoading ? "Procesando..." : "Confirmar Compra"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
