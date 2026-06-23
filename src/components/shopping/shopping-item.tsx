
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useNotification } from "@/hooks/use-notification"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { scrollbarClasses } from "@/lib/styles"
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
import { Trash2, MapPin, Loader2, Check } from "lucide-react"
import type { ShoppingItem, Category } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"

interface ShoppingItemProps {
  item: ShoppingItem
  marketCategoryId: string
  onUpdate?: () => void
  categories: Category[]
  userId: string
}

export function ShoppingItemCard({ item, marketCategoryId, onUpdate, categories }: ShoppingItemProps) {
  const isMobile = useIsMobile()
  const [showPriceDialog, setShowPriceDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const [unitPrice, setUnitPrice] = useState("")
  const [quantity, setQuantity] = useState(item.quantity.toString())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationName, setLocationName] = useState<string>("")
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const { showSuccess, showError, showDeleted } = useNotification()

  // Obtener ubicación automáticamente cuando se abre el diálogo de compra
  useEffect(() => {
    if (showPriceDialog && !location && !isGettingLocation) {
      getLocation()
    }
  }, [showPriceDialog])

  // Geocode en tiempo real cuando el usuario escribe en el input de ubicación
  // Debounce básico: 500ms y cache en localStorage
  useEffect(() => {
    const query = locationName?.trim()
    if (!query) {
      setLocation(null)
      return
    }

    let aborted = false
    const timer = setTimeout(async () => {
      setIsGeocoding(true)
      try {
        const cacheKey = `geocode_cache:${query.toLowerCase()}`
        try {
          const cached = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : null
          if (cached) {
            const parsed = JSON.parse(cached)
            if (!aborted) {
              setLocation(parsed)
              setIsGeocoding(false)
              return
            }
          }
        } catch {}

        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        )
        const data = await res.json()
        if (aborted) return
        if (data && data.length > 0) {
          const first = data[0]
          const coords = { lat: parseFloat(first.lat), lng: parseFloat(first.lon) }
          setLocation(coords)
          try {
            localStorage.setItem(cacheKey, JSON.stringify(coords))
          } catch {}
        }
      } catch (err) {
        console.error("Error geocoding query:", err)
      } finally {
        if (!aborted) setIsGeocoding(false)
      }
    }, 500)

    return () => {
      aborted = true
      clearTimeout(timer)
      setIsGeocoding(false)
    }
  }, [locationName])

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
    setError(null) // Limpiar errores previos
    setShowPriceDialog(true)
    // La ubicación se obtiene automáticamente por el useEffect
  }

  const getLocation = () => {
    setIsGettingLocation(true)
    setError(null) // Limpiar error antes de intentar
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
          // No mostrar error si el usuario rechazó los permisos (es opcional)
          // Solo loguear en consola
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
  const { formatDateLocal, parseLocalDate } = await import("@/lib/utils")
  const now = new Date()
  // Obtener string 'YYYY-MM-DD' local para parseLocalDate
  const nowStr = now.toISOString().split('T')[0]
  const normalizedDate = formatDateLocal(parseLocalDate(nowStr))
      const { error: updateError } = await supabase
        .from("shopping_list")
        .update({
          is_purchased: true,
          unit_price: priceValue,
          total_price: totalPrice,
          purchased_at: normalizedDate,
        })
        .eq("id", item.id)

      if (updateError) throw updateError

      // Create expense in Mercado category
      const { error: expenseError } = await supabase.from("expenses").insert({
        user_id: item.user_id,
        name: item.product_name,
        amount: totalPrice,
        category_id: marketCategoryId,
        purchase_date: normalizedDate,
        location: locationName || null,
        notes: `Compra de mercado - ${purchasedQuantity} unidades${location ? ` - Ubicación: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : ""}`,
      })

      if (expenseError) throw expenseError

      // Removed delete from shopping list to keep it as purchased

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

  const getCategoryInfo = () => {
    if (!item.category) return null
    const category = categories.find(c => c.id === item.category)
    return category
  }

  const categoryInfo = getCategoryInfo()

  if (item.is_purchased) {
    return (
      <>
        <div className="flex items-center gap-[14px] rounded-[22px] bg-card p-[18px] shadow-[0_6px_16px_rgba(30,40,80,.07)]">
          {/* Checkbox (28px) */}
          <div className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-[8px] bg-primary text-white">
            <Check className="h-[18px] w-[18px] stroke-[3]" />
          </div>
          
          {/* Content */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[17px] font-extrabold text-[#aab1c2] line-through decoration-2">
              {item.product_name} {item.quantity > 1 ? `x${item.quantity}` : ''}
            </p>
            <p className="truncate text-[13px] font-extrabold text-[#aab1c2]">
              {categoryInfo?.name || 'Categoría'}
            </p>
          </div>
          
          {/* Acciones */}
          <div className="flex shrink-0 items-center">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#aab1c2] hover:text-destructive" onClick={confirmDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="w-[calc(100%-2rem)] sm:w-full">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base sm:text-lg">¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription className="text-xs sm:text-sm">
                Esta acción eliminará "{item.product_name}" de tu lista de compras. Esta acción no se puede deshacer.
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

  return (
    <>
      <div className="flex items-center gap-[14px] rounded-[22px] bg-card p-[18px] shadow-[0_6px_16px_rgba(30,40,80,.07)] transition-transform active:scale-[.99]">
        {/* Checkbox (28px) */}
        <button 
          onClick={handlePurchaseClick} 
          className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-[8px] border-[2px] border-[#d3dae8] bg-transparent hover:border-primary transition-colors focus:outline-none"
          aria-label="Marcar como comprado"
        />
        
        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-black text-foreground cursor-pointer">
            {item.product_name} {item.quantity > 1 ? `x${item.quantity}` : ''}
          </p>
          <p className="truncate text-[13px] font-extrabold text-[#aab1c2]">
            {categoryInfo?.name || 'Categoría'}
          </p>
        </div>
        
        {/* Chip "→ Gasto" */}
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={handlePurchaseClick} 
          className="h-[34px] shrink-0 rounded-full bg-[#eef1f7] px-[14px] text-[13px] font-black text-primary hover:bg-primary/10"
        >
          → Gasto
        </Button>

        {/* Acciones */}
        <div className="flex shrink-0 items-center ml-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#aab1c2] hover:text-destructive" onClick={confirmDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isMobile ? (
        <Drawer open={showPriceDialog} onOpenChange={(open) => {
          setShowPriceDialog(open)
          if (!open) {
            setError(null)
            setUnitPrice("")
            setLocation(null)
            setLocationName("")
          }
        }}>
          <DrawerContent className="rounded-t-[32px]">
            <div className={`no-ios-zoom max-h-[82vh] overflow-y-auto px-4 pb-8 ${scrollbarClasses}`}>
              <DrawerHeader className="px-0">
                <DrawerTitle className="text-xl font-black">Comprado</DrawerTitle>
                <DrawerDescription className="text-sm">
                  Ingresa el precio unitario para registrar esta compra
                </DrawerDescription>
              </DrawerHeader>
              
              <div className="space-y-3 sm:space-y-4 pt-2">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm">Producto</Label>
                  <p className="text-sm font-medium truncate">{item.product_name}</p>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="quantity" className="text-xs sm:text-sm">Cantidad Comprada</Label>
                  <Input
                    id="quantity"
                    type="text"
                    inputMode="numeric"
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
                    inputMode="numeric"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(formatNumber(e.target.value))}
                    placeholder="0"
                    required
                    disabled={isLoading}
                    className="text-sm sm:text-base h-9 sm:h-10"
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm">Ubicación del Supermercado</Label>
                  <div className="relative">
                    <Input
                      id="purchase_location"
                      value={locationName}
                      onChange={(e) => {
                        setLocationName(e.target.value)
                      }}
                      placeholder="Ej: Supermercado XYZ, Calle 123"
                      disabled={isLoading}
                      className="text-sm sm:text-base h-9 sm:h-10 pr-10"
                    />
                    {isGeocoding && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>

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
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={showPriceDialog} onOpenChange={(open) => {
          setShowPriceDialog(open)
          if (!open) {
            setError(null)
            setUnitPrice("")
            setLocation(null)
            setLocationName("")
          }
        }}>
          <DialogContent className={`w-[calc(100%-2rem)] sm:w-full max-w-md max-h-[90vh] overflow-y-auto ${scrollbarClasses}`} onOpenAutoFocus={(e) => e.preventDefault()}>
            <div className="no-ios-zoom">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">Comprado</DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  Ingresa el precio unitario para registrar esta compra
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 sm:space-y-4 pt-2">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm">Producto</Label>
                  <p className="text-sm font-medium truncate">{item.product_name}</p>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="quantity" className="text-xs sm:text-sm">Cantidad Comprada</Label>
                  <Input
                    id="quantity"
                    type="text"
                    inputMode="numeric"
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
                    inputMode="numeric"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(formatNumber(e.target.value))}
                    placeholder="0"
                    required
                    disabled={isLoading}
                    className="text-sm sm:text-base h-9 sm:h-10"
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm">Ubicación del Supermercado</Label>
                  <div className="relative">
                    <Input
                      id="purchase_location"
                      value={locationName}
                      onChange={(e) => {
                        setLocationName(e.target.value)
                      }}
                      placeholder="Ej: Supermercado XYZ, Calle 123"
                      disabled={isLoading}
                      className="text-sm sm:text-base h-9 sm:h-10 pr-10"
                    />
                    {isGeocoding && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>

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
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="w-[calc(100%-2rem)] sm:w-full">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Esta acción eliminará "{item.product_name}" de tu lista de compras. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-sm sm:text-base h-9 sm:h-10 dark:shadow-[0_4px_12px_rgba(0,0,0,0.6)] dark:border dark:border-slate-700">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm sm:text-base h-9 sm:h-10">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </>
  )
}
