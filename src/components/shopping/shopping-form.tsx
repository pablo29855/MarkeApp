"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useNotification } from "@/hooks/use-notification"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Loader2, MapPin } from "lucide-react"
import type { Category, ShoppingItem } from "@/lib/types"

interface ShoppingFormProps {
  userId: string
  categories: Category[]
  onSuccess?: () => void
  item?: ShoppingItem
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ShoppingForm({ userId, categories, onSuccess, item, open, onOpenChange }: ShoppingFormProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { showCreated, showError, showSuccess } = useNotification()

  const isOpen = open !== undefined ? open : internalOpen
  const setIsOpen = onOpenChange || setInternalOpen

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)

  const [formData, setFormData] = useState({
    product_name: "",
    quantity: "1",
    category_id: "",
    location: "",
  })

  useEffect(() => {
    if (item) {
      setFormData({
        product_name: item.product_name,
        quantity: item.quantity.toString(),
        category_id: item.category || "",
        location: "",
      })
    }
  }, [item])

  // Geocode en tiempo real cuando el usuario escribe en el input de ubicación
  // Debounce básico: 500ms y cache en localStorage
  useEffect(() => {
    const query = formData.location?.trim()
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
  }, [formData.location])

  // Función para formatear números con puntos de mil
  const formatNumber = (value: string) => {
    const cleanValue = value.replace(/\D/g, '')
    if (!cleanValue) return ''
    return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  const getNumericValue = (formattedValue: string) => {
    return formattedValue.replace(/\./g, '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      if (item) {
        // Update
        const { error } = await supabase.from("shopping_list").update({
          product_name: formData.product_name,
          quantity: Number.parseInt(getNumericValue(formData.quantity)),
          category: formData.category_id || null,
        }).eq("id", item.id)

        if (error) throw error

        showSuccess("Producto actualizado")
      } else {
        // Insert
        const { error } = await supabase.from("shopping_list").insert({
          user_id: userId,
          product_name: formData.product_name,
          quantity: Number.parseInt(getNumericValue(formData.quantity)),
          category: formData.category_id || null,
          is_purchased: false,
          unit_price: null,
          total_price: null,
        })

        if (error) throw error

        showCreated("Producto")
      }
      
      setFormData({
        product_name: "",
        quantity: "1",
        category_id: "",
        location: "",
      })
      setIsOpen(false)
      onSuccess?.()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : `Error al ${item ? "actualizar" : "agregar"} el item`
      setError(errorMessage)
      showError("Error al guardar", errorMessage)
    } finally {
      setIsLoading(false)
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

          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            )
            const data = await response.json()
            const name = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
            setFormData((prev) => ({ ...prev, location: name }))
          } catch {
            const fallback = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
            setFormData((prev) => ({ ...prev, location: fallback }))
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!item && (
        <DialogTrigger asChild>
          <Button className="text-sm sm:text-base h-9 sm:h-10">
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Agregar Item
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="w-[calc(100%-2rem)] sm:w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="no-ios-zoom">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{item ? "Editar Item" : "Nuevo Item"}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {item ? "Edita el producto de tu lista de compras" : "Agrega un producto a tu lista de compras"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="product_name" className="text-xs sm:text-sm">Nombre del Producto</Label>
            <Input
              id="product_name"
              value={formData.product_name}
              onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
              placeholder="Ej: Leche"
              required
              disabled={isLoading}
              className="text-sm sm:text-base h-9 sm:h-10"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="quantity" className="text-xs sm:text-sm">Cantidad</Label>
              <Input
                id="quantity"
                type="text"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: formatNumber(e.target.value) })}
                placeholder="1"
                required
                disabled={isLoading}
                className="text-sm sm:text-base h-9 sm:h-10"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="category_id" className="text-xs sm:text-sm">Categoría</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                disabled={isLoading}
              >
                <SelectTrigger id="category_id" className="text-sm sm:text-base h-9 sm:h-10">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {categories && categories.length > 0 ? (
                    categories.map((category) => (
                      <SelectItem key={category.id} value={category.id} className="text-sm sm:text-base">
                        {category.icon} {category.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled className="text-sm sm:text-base">
                      No hay categorías disponibles
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="location" className="text-xs sm:text-sm">Ubicación (opcional)</Label>
            <div className="relative">
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ej: Supermercado XYZ"
                disabled={isLoading}
                className="text-sm sm:text-base h-9 sm:h-10 pr-10"
              />
              {isGeocoding && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>

          {!location ? (
            <Button
              type="button"
              variant="outline"
              onClick={getLocation}
              disabled={isGettingLocation}
              className="w-full mt-2 text-sm sm:text-base h-9 sm:h-10"
            >
              <MapPin className="h-4 w-4 mr-2" />
              {isGettingLocation ? "Obteniendo ubicación..." : "Obtener Ubicación Actual"}
            </Button>
          ) : (
            <div className="space-y-2 mt-2">
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
                  setFormData((prev) => ({ ...prev, location: "" }))
                }}
                className="w-full"
              >
                Cambiar ubicación
              </Button>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 sm:gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1 text-sm sm:text-base h-9 sm:h-10"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 text-sm sm:text-base h-9 sm:h-10" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />}
              {isLoading ? "Guardando..." : (item ? "Actualizar" : "Agregar")}
            </Button>
          </div>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
