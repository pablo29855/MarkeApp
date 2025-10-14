import { useState, useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "@/lib/validation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Camera, Lock } from "lucide-react"
import Cropper from 'react-easy-crop'
import { Area } from 'react-easy-crop/types'
import { format } from "date-fns"
import { es } from "date-fns/locale"

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es requerida"),
  newPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string().min(1, "La confirmación es requerida"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
})

type PasswordFormData = z.infer<typeof passwordSchema>

interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  email: string | null
  avatar_url: string | null
  created_at: string | null
  last_sign_in_at: string | null
}

interface ProfileDialogProps {
  userName: string
  children: React.ReactNode
}

export function ProfileDialog({ userName, children }: ProfileDialogProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [isCropOpen, setIsCropOpen] = useState(false)
  const [rawFile, setRawFile] = useState<File | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const { toast } = useToast()
  const supabase = useMemo(() => createClient(), [])

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    mode: 'onChange', // Validar mientras el usuario escribe para feedback inmediato
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  const { register, handleSubmit, formState: { errors, isValid, isSubmitting }, reset } = passwordForm

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No disponible"
    try {
      return format(new Date(dateString), "PPP 'a las' p", { locale: es })
    } catch {
      return "Fecha inválida"
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchProfile()
    } else {
      // Reset password form when modal closes
      reset()
    }
  }, [isOpen, reset])

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Try to read from application's profiles table first
        // Use only Supabase Auth user metadata for profile fields
        setProfile({
          id: user.id,
          full_name: user.user_metadata?.full_name || null,
          phone: user.phone || user.user_metadata?.phone || null,
          email: user.email || null,
          avatar_url: user.user_metadata?.avatar_url || null,
          created_at: user.created_at || null,
          last_sign_in_at: user.last_sign_in_at || null
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast({
        title: "Error",
        description: "No se pudo cargar el perfil",
        variant: "destructive",
      })
    }
  }

  // Cache para evitar generar timestamps constantemente
  const avatarTimestampCache = useMemo(() => {
    const cache: { [key: string]: string } = {}
    return {
      get: (url: string) => {
        if (!cache[url]) {
          // Generar timestamp solo una vez por URL
          cache[url] = `${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`
        }
        return cache[url]
      },
      clear: () => {
        Object.keys(cache).forEach(key => delete cache[key])
      }
    }
  }, [])

  // Helper function para agregar timestamp a la URL del avatar (evita caché)
  const getAvatarUrlWithTimestamp = (url: string | null | undefined) => {
    if (!url) return undefined
    // Si la URL ya tiene un timestamp de preview (blob:), no modificarla
    if (url.startsWith('blob:')) return url
    // Si ya tiene un parámetro de versión, no agregar otro
    if (url.includes('?v=') || url.includes('&v=')) return url
    // Usar caché para evitar generar nuevos timestamps constantemente
    return avatarTimestampCache.get(url)
  }

  const updateProfile = async (updates: Partial<Profile>, skipClose = false) => {
    if (!profile || loading) return

    setLoading(true)
    try {
      const updateData: any = { data: {} }

      // Build metadata updates
      if (updates.full_name !== undefined && updates.full_name !== null) {
        updateData.data.full_name = updates.full_name
      }
      if (updates.avatar_url !== undefined && updates.avatar_url !== null) {
        // Limpiar cualquier timestamp que pueda tener la URL antes de guardar
        let cleanUrl = updates.avatar_url
        if (!cleanUrl.startsWith('blob:')) {
          // Remover parámetros de timestamp (t=...) de la URL
          cleanUrl = cleanUrl.split('?')[0]
        }
        updateData.data.avatar_url = cleanUrl
      }

      // Always save phone in metadata, regardless of auth field update
      if (updates.phone !== undefined && updates.phone !== null && updates.phone !== '') {
        updateData.data.phone = updates.phone
        console.log('Saving phone in metadata:', updates.phone)
      }

      // Try to update phone in auth field if it's different
      if (updates.phone !== undefined && updates.phone !== profile.phone && updates.phone !== null && updates.phone !== '') {
        updateData.phone = updates.phone
        console.log('Attempting to update phone in auth field:', updates.phone)
      }

      // If there are any updates, send them to Supabase Auth (metadata) first
      if (Object.keys(updateData.data).length > 0 || updateData.phone) {
        console.log('🔄 Actualizando usuario con:', updateData)
        const { error } = await supabase.auth.updateUser(updateData)

        if (error) {
          // If the error is related to phone verification, try without phone field
          if (updateData.phone && (error.message.includes('SMS') || error.message.includes('phone'))) {
            const withoutPhone = { data: updateData.data }
            const { error: retryError } = await supabase.auth.updateUser(withoutPhone)
            if (retryError) {
              throw retryError
            } else {
              toast({
                title: "Perfil actualizado parcialmente",
                description: "Nombre, avatar y teléfono guardados en metadatos. Configura SMS para verificación completa.",
                variant: "default",
              })
            }
          } else {
            throw error
          }
        } else {
          console.log('✅ Usuario actualizado exitosamente')
          // Solo mostrar toast de éxito si no es solo avatar
          if (!updates.avatar_url || Object.keys(updates).length > 1) {
            toast({
              title: "Éxito",
              description: "Perfil actualizado correctamente",
            })
          }
        }
      }

      // No upsert to 'profiles' table — we store profile data in Supabase Auth user_metadata only.

      // Update local state
      setProfile({ ...profile, ...updates })

      // Refresh profile data to get updated information from server
      await fetchProfile()

      // Close modal after successful update (unless skipClose is true, like when uploading avatar)
      if (!skipClose) {
        setIsOpen(false)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !profile) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Archivo inválido",
        description: "Por favor selecciona una imagen válida",
        variant: "destructive",
      })
      return
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Archivo muy grande",
        description: "La imagen no debe superar los 10MB",
        variant: "destructive",
      })
      return
    }

    // Resetear estados del cropper
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setCroppedAreaPixels(null)

    // Open crop UI with the selected file
    setRawFile(file)
    setIsCropOpen(true)
    
    // Resetear el input para permitir seleccionar el mismo archivo
    event.target.value = ''
  }

  // Manejar drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (!file || !profile) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Archivo inválido",
        description: "Por favor selecciona una imagen válida",
        variant: "destructive",
      })
      return
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Archivo muy grande",
        description: "La imagen no debe superar los 10MB",
        variant: "destructive",
      })
      return
    }

    // Resetear estados del cropper
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setCroppedAreaPixels(null)

    setRawFile(file)
    setIsCropOpen(true)
  }

  // When crop is confirmed, this function will be called with the cropped blob
  const handleCroppedUpload = async (blob: Blob, ext = 'jpg') => {
    if (!profile) {
      throw new Error('No hay perfil de usuario')
    }
    
    const bucketName = import.meta.env.VITE_AVATAR_BUCKET || 'MarketApp'
    
    try {
      // notify upload start so other UI (sidebar) can show spinner
      try { window.dispatchEvent(new CustomEvent('avatar-upload-start')) } catch (e) {}
      
      const fileExt = ext
      const fileName = `${profile.id}.${fileExt}`
      const filePath = fileName

      console.log('Subiendo archivo:', filePath, 'Tamaño:', blob.size, 'bytes')

      // Ensure there's a valid session / access token before upload
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      console.log('Sesión de Supabase antes de subir:', sessionData ? 'OK' : 'NO', sessionError)
      
      if (sessionError) {
        console.warn('Error al obtener sesión:', sessionError)
      }
      
      if (!sessionData?.session?.access_token) {
        setUploading(false)
        throw new Error('No se encontró una sesión activa. Por favor inicia sesión e intenta de nuevo.')
      }

      if (import.meta.env.VITE_USE_BACKEND_UPLOAD === 'true') {
        // Send file to backend endpoint which uses service_role key to upload
        console.log('Usando backend upload...')
        const formData = new FormData()
        formData.append('file', blob, `${profile.id}.${fileExt}`)

        // Pass user's access token so server can verify identity
        const session = await supabase.auth.getSession()
        const token = session.data?.session?.access_token

        const resp = await fetch('/upload-avatar', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        })

        if (!resp.ok) {
          const errText = await resp.text()
          throw new Error(errText || 'Error al subir al servidor')
        }

        const body = await resp.json()
        console.log('Avatar subido exitosamente via backend:', body.url)
        
        // Limpiar caché de timestamps cuando se sube nueva imagen
        avatarTimestampCache.clear()
        
        await updateProfile({ avatar_url: body.url }, true) // skipClose = true
        try { window.dispatchEvent(new CustomEvent('avatar-upload-end', { detail: { success: true, url: body.url } })) } catch (e) {}
        
        // Mostrar toast de éxito después de subir avatar
        toast({
          title: "¡Perfecto!",
          description: "Tu foto de perfil se actualizó correctamente",
        })
      } else {
        // Upload directly to Supabase Storage
        console.log('Subiendo directamente a Supabase Storage...')
        
        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, blob, { 
            upsert: true,
            contentType: 'image/jpeg',
            cacheControl: '3600'
          })

        if (uploadError) {
          console.error('Error al subir a storage:', uploadError)
          throw new Error(uploadError.message || 'Error al subir la imagen')
        }

        console.log('Archivo subido exitosamente a storage')

        // Obtener la URL pública (sin timestamp en la base de datos)
        const { data } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath)

        const publicUrl = data.publicUrl
        console.log('✅ URL pública generada:', publicUrl)

        // Limpiar caché de timestamps cuando se sube nueva imagen
        avatarTimestampCache.clear()

        // Guardar la URL sin timestamp en la base de datos
        console.log('💾 Guardando avatar en perfil...')
        await updateProfile({ avatar_url: publicUrl }, true) // skipClose = true
        
        console.log('📢 Enviando evento avatar-upload-end con URL:', publicUrl)
        try { window.dispatchEvent(new CustomEvent('avatar-upload-end', { detail: { success: true, url: publicUrl } })) } catch (e) {
          console.error('Error al enviar evento avatar-upload-end:', e)
        }
        
        // Mostrar toast de éxito después de subir avatar
        toast({
          title: "¡Perfecto!",
          description: "Tu foto de perfil se actualizó correctamente",
        })
      }
    } catch (error) {
      try { window.dispatchEvent(new CustomEvent('avatar-upload-end', { detail: { success: false } })) } catch (e) {}
      console.error('Error uploading avatar:', error)
      // If the bucket does not exist, inform the developer/user how to fix it.
      const message = (error as any)?.message || String(error)
      const lower = message.toLowerCase()
      const isBucketMissing = lower.includes('bucket not found') || lower.includes('could not find') || lower.includes('no such bucket')
  const isRlsViolation = lower.includes('row-level security') || lower.includes('violates row-level security') || lower.includes('policy')

      if (isRlsViolation) {
        // More actionable guidance for row-level security violations
        toast({
          title: "Permisos insuficientes",
          description: "Row-level security impide la subida. Revisa las policies de Storage en Supabase.",
          variant: "destructive",
        })

        // Log example SQL to create a policy allowing authenticated uploads to the bucket
        console.error('Suggested SQL to allow authenticated uploads to the MarketApp bucket:')
        console.error(`-- Allow authenticated users to insert objects into the MarketApp bucket\ncreate policy \"Allow authenticated uploads to MarketApp\" on storage.objects\nfor insert\nto authenticated\nusing ( bucket_id = '${bucketName}' )\nwith check ( bucket_id = '${bucketName}' AND owner = auth.uid() );`)
      } else {
        toast({
          title: "Error al subir imagen",
          description: isBucketMissing
            ? `No se encontró el bucket '${bucketName}' en Storage. Crea el bucket con ese nombre en Supabase Storage (o configura VITE_AVATAR_BUCKET).`
            : message || "No se pudo subir la imagen",
          variant: "destructive",
        })
      }
      
      setUploading(false)
      throw error // Re-throw para que confirmCrop pueda manejarlo
    } finally {
      setUploading(false)
    }
  }

  // Utility: create an image element from a File/Blob
  const createImage = (url: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.addEventListener('load', () => resolve(img))
      img.addEventListener('error', (e) => reject(e))
      img.setAttribute('crossOrigin', 'anonymous')
      img.src = url
    })

  // Utility: get cropped image blob from canvas
  // Algoritmo simple y directo que garantiza el recorte exacto
  async function getCroppedImg(file: File, pixelCrop: Area, rotation = 0) {
    const imageUrl = URL.createObjectURL(file)
    const image = await createImage(imageUrl)
    
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    const outputSize = 512 // Tamaño de salida fijo

    // Si NO hay rotación, hacer recorte directo (más preciso)
    if (rotation === 0) {
      canvas.width = outputSize
      canvas.height = outputSize

      // Recorte directo: toma exactamente el área seleccionada
      ctx.drawImage(
        image,
        pixelCrop.x,      // sx: origen X en la imagen fuente
        pixelCrop.y,      // sy: origen Y en la imagen fuente
        pixelCrop.width,  // sWidth: ancho a recortar
        pixelCrop.height, // sHeight: alto a recortar
        0,                // dx: destino X en el canvas
        0,                // dy: destino Y en el canvas
        outputSize,       // dWidth: ancho final
        outputSize        // dHeight: alto final
      )
    } else {
      // CON rotación: aplicar transformaciones
      const rad = (rotation * Math.PI) / 180
      
      // Calcular dimensiones necesarias para la rotación
      const sin = Math.abs(Math.sin(rad))
      const cos = Math.abs(Math.cos(rad))
      
      // Canvas temporal para la imagen rotada
      const rotatedWidth = image.width * cos + image.height * sin
      const rotatedHeight = image.width * sin + image.height * cos
      
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = rotatedWidth
      tempCanvas.height = rotatedHeight
      const tempCtx = tempCanvas.getContext('2d')!
      
      // Rotar la imagen completa primero
      tempCtx.translate(rotatedWidth / 2, rotatedHeight / 2)
      tempCtx.rotate(rad)
      tempCtx.drawImage(image, -image.width / 2, -image.height / 2)
      
      // Ahora recortar del canvas rotado
      canvas.width = outputSize
      canvas.height = outputSize
      
      ctx.drawImage(
        tempCanvas,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        outputSize,
        outputSize
      )
    }

    // Limpiar URL temporal
    URL.revokeObjectURL(imageUrl)

    // Convertir a blob con alta calidad
    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(blob)
        },
        'image/jpeg',
        0.95
      )
    })
  }

  // Handler when user confirms crop
  const confirmCrop = async () => {
    if (!rawFile || !croppedAreaPixels) {
      toast({ 
        title: 'Error', 
        description: 'No se pudo obtener el área de recorte', 
        variant: 'destructive' 
      })
      return
    }
    
    setUploading(true)
    
    try {
      // Generar la imagen recortada
      const blob = await getCroppedImg(rawFile, croppedAreaPixels, rotation)
      if (!blob) {
        toast({ title: 'Error', description: 'No se pudo procesar la imagen', variant: 'destructive' })
        setUploading(false)
        return
      }
      
      console.log('Blob generado:', blob.size, 'bytes')
      
      // Cerrar el modal de crop primero
      setIsCropOpen(false)
      
      // Create preview URL so viewer shows exact crop immediately and update UI
      const prevPreview = croppedPreviewUrl
      if (prevPreview) {
        try { URL.revokeObjectURL(prevPreview) } catch (e) {}
      }
      const previewUrl = URL.createObjectURL(blob)
      setCroppedPreviewUrl(previewUrl)

      // Update local profile state so the small avatar shows the preview immediately
      setProfile(prev => prev ? { ...prev, avatar_url: previewUrl } : prev)

      // Notify other components (sidebar) about preview via event
      try {
        window.dispatchEvent(new CustomEvent('avatar-preview', { detail: { url: previewUrl } }))
      } catch (e) {}

      // Subir la imagen recortada
      const ext = 'jpg' // Siempre usar jpg para consistencia
      console.log('Iniciando upload del blob...')
      await handleCroppedUpload(blob, ext)
      
      console.log('Upload completado exitosamente')
      
      // Limpiar archivo raw después de subir
      setRawFile(null)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setRotation(0)
      setCroppedAreaPixels(null)
    } catch (err) {
      console.error('Error cropping image:', err)
      setUploading(false)
      setIsCropOpen(false)
      toast({ 
        title: 'Error', 
        description: err instanceof Error ? err.message : 'No se pudo procesar la imagen. Intenta con otra imagen.', 
        variant: 'destructive' 
      })
    }
  }

  const cancelCrop = () => {
    setIsCropOpen(false)
    setRawFile(null)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setCroppedAreaPixels(null)
  }

  const changePassword = async (data: PasswordFormData) => {
    console.log('changePassword called with data:', data)
    console.log('Form errors:', errors)
    console.log('Form isValid:', isValid)

    try {
      // Update password and metadata
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
        data: {
          last_password_change: new Date().toISOString(),
          password_updated_at: new Date().toISOString()
        }
      })

      if (error) {
        console.error('Supabase error:', error)
        toast({
          title: "Error",
          description: error.message || "No se pudo cambiar la contraseña",
          variant: "destructive",
        })
        return
      }

      console.log('Password changed successfully')
      // Limpiar formulario
      reset()

      toast({
        title: "Éxito",
        description: "Contraseña cambiada correctamente",
      })
    } catch (error) {
      console.error('Exception in changePassword:', error)
      toast({
        title: "Error",
        description: "No se pudo cambiar la contraseña. Verifica tu conexión.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="no-ios-zoom">
          <DialogHeader>
            <DialogTitle>Perfil de Usuario</DialogTitle>
            <DialogDescription>
              Gestiona tu información personal y configuración de cuenta.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Información</TabsTrigger>
            <TabsTrigger value="account">Cuenta</TabsTrigger>
            <TabsTrigger value="password">Contraseña</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <div 
                className={`relative rounded-full transition-all duration-200 ${isDragging ? 'ring-4 ring-primary ring-offset-4' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="relative inline-block group">
                  <button
                    type="button"
                    onClick={(e) => {
                      // Prevent opening viewer when clicking the upload button (label/input)
                      const target = e.target as HTMLElement
                      const isUploadControl = target.closest('label')
                      if (!isUploadControl && !uploading) setIsViewerOpen(true)
                    }}
                    className="p-0 border-0 bg-transparent relative"
                    aria-label="Ver avatar"
                    disabled={uploading}
                  >
                    <Avatar className="w-24 h-24 border-4 border-muted transition-all duration-200 group-hover:border-primary">
                      <AvatarImage src={getAvatarUrlWithTimestamp(profile?.avatar_url)} />
                      <AvatarFallback className="text-3xl font-bold">
                        {userName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {!uploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 rounded-full transition-all duration-200">
                        <Camera className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </div>
                    )}
                    {uploading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-full">
                        <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs text-white mt-2 font-medium">Subiendo...</p>
                      </div>
                    )}
                  </button>

                  <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110">
                    <Camera className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className="text-xs text-muted-foreground">
                  Haz clic en la cámara o arrastra una imagen
                </p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG o GIF • Máx. 10MB
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                value={profile?.email || ""}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre completo</Label>
              <Input
                id="full_name"
                value={profile?.full_name || ""}
                onChange={(e) => setProfile(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                placeholder="Ingresa tu nombre completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                value={profile?.phone || ""}
                onChange={(e) => setProfile(prev => prev ? { ...prev, phone: e.target.value } : null)}
                placeholder="Ingresa tu número de teléfono"
              />
              <p className="text-xs text-muted-foreground">
                Se guardará en metadatos. Para verificación completa, configura SMS Provider.
              </p>
            </div>

            <Button
              onClick={() => updateProfile({ full_name: profile?.full_name || null, phone: profile?.phone || null, avatar_url: profile?.avatar_url || null })}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </TabsContent>

          {/* Cropper dialog */}
          <Dialog open={isCropOpen} onOpenChange={(open) => !open && cancelCrop()}>
            <DialogContent className="max-w-4xl w-[95vw] sm:w-full p-0 gap-0 overflow-hidden" onOpenAutoFocus={(e) => e.preventDefault()}>
              <div className="no-ios-zoom">
                <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 border-b bg-background">
                  <DialogTitle className="text-xl sm:text-2xl font-bold">Editar foto de perfil</DialogTitle>
                  <DialogDescription className="text-sm">Ajusta el zoom y la posición para que quede perfecto</DialogDescription>
                </DialogHeader>
                
                {/* Cropper Area */}
                <div className="relative bg-black/95 w-full" style={{ height: 'min(70vh, 500px)' }}>
                  {rawFile && (
                    <Cropper
                      image={URL.createObjectURL(rawFile)}
                      crop={crop}
                      zoom={zoom}
                      rotation={rotation}
                      aspect={1}
                      cropShape="round"
                      showGrid={false}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onRotationChange={setRotation}
                      onCropComplete={(_croppedArea: Area, croppedAreaPixels: Area) => {
                        setCroppedAreaPixels(croppedAreaPixels)
                      }}
                      style={{
                        containerStyle: {
                          backgroundColor: 'rgba(0, 0, 0, 0.95)',
                        },
                        mediaStyle: {
                          maxHeight: '100%',
                        },
                      }}
                    />
                  )}
                </div>

                {/* Controls */}
                <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 bg-background">
                  {/* Zoom Control */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Zoom</Label>
                      <span className="text-xs text-muted-foreground">{zoom.toFixed(1)}x</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                        <line x1="8" y1="11" x2="14" y2="11"/>
                      </svg>
                      <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.01}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                        <line x1="8" y1="11" x2="14" y2="11"/>
                        <line x1="11" y1="8" x2="11" y2="14"/>
                      </svg>
                    </div>
                  </div>

                  {/* Rotation Control */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Rotación</Label>
                      <span className="text-xs text-muted-foreground">{rotation}°</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                      </svg>
                      <input
                        type="range"
                        min={0}
                        max={360}
                        step={1}
                        value={rotation}
                        onChange={(e) => setRotation(Number(e.target.value))}
                        className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setRotation(0)}
                        className="text-xs"
                      >
                        Reset
                      </Button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button 
                      variant="outline" 
                      onClick={cancelCrop}
                      className="flex-1"
                      disabled={uploading}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={confirmCrop} 
                      disabled={!croppedAreaPixels || uploading}
                      className="flex-1 font-semibold"
                    >
                      {uploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Procesando...
                        </>
                      ) : (
                        'Aplicar'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Avatar viewer dialog */}
          <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
            <DialogContent className="max-w-2xl w-[95vw] sm:w-full p-0 gap-0 bg-black/95 backdrop-blur-xl border-none" onOpenAutoFocus={(e) => e.preventDefault()}>
              <div className="no-ios-zoom">
                <div className="relative flex items-center justify-center w-full py-8 sm:py-12">
                  {/* Close Button */}
                  <button
                    onClick={() => { 
                      setIsViewerOpen(false)
                      try { 
                        if (croppedPreviewUrl) { 
                          URL.revokeObjectURL(croppedPreviewUrl)
                          setCroppedPreviewUrl(null) 
                        } 
                      } catch(e){} 
                    }}
                    className="absolute right-4 top-4 z-10 text-white bg-black/60 hover:bg-black/80 rounded-full p-2 sm:p-3 transition-all duration-200 hover:scale-110"
                    aria-label="Cerrar vista previa"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Avatar Image */}
                  <div className="relative px-4 sm:px-8">
                    {croppedPreviewUrl || profile?.avatar_url ? (
                      <div className="relative">
                        <div className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full overflow-hidden bg-black/20 flex items-center justify-center border-4 border-white/10 shadow-2xl">
                          <img 
                            src={croppedPreviewUrl || getAvatarUrlWithTimestamp(profile?.avatar_url)!} 
                            alt="Avatar grande" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {/* User Name Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 text-center pb-4 sm:pb-6">
                          <div className="bg-black/60 backdrop-blur-sm rounded-full px-4 sm:px-6 py-2 inline-block">
                            <p className="text-white font-semibold text-sm sm:text-base">{profile?.full_name || userName}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full flex flex-col items-center justify-center bg-muted/20 border-4 border-white/10">
                        <Avatar className="w-32 h-32 sm:w-40 sm:h-40">
                          <AvatarFallback className="text-5xl sm:text-6xl font-bold bg-primary/20 text-white">
                            {userName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-white/60 mt-4 text-sm sm:text-base">Sin foto de perfil</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <TabsContent value="account" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Fecha de creación</Label>
                <Input
                  value={formatDate(profile?.created_at || null)}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label>Último inicio de sesión</Label>
                <Input
                  value={formatDate(profile?.last_sign_in_at || null)}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="password" className="space-y-4">
            <form onSubmit={handleSubmit(changePassword)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password">Contraseña actual</Label>
                <Input
                  id="current_password"
                  type="password"
                  {...register("currentPassword")}
                  placeholder="Ingresa tu contraseña actual"
                />
                {errors.currentPassword && (
                  <p className="text-sm text-red-600">{errors.currentPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_password">Nueva contraseña</Label>
                <Input
                  id="new_password"
                  type="password"
                  {...register("newPassword")}
                  placeholder="Ingresa nueva contraseña (mínimo 6 caracteres)"
                />
                
                {errors.newPassword && (
                  <p className="text-sm text-red-600">{errors.newPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirmar contraseña</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  {...register("confirmPassword")}
                  placeholder="Confirma nueva contraseña"
                />
                
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !isValid}
                className="w-full"
              >
                <Lock className="h-4 w-4 mr-2" />
                {isSubmitting ? "Cambiando..." : "Cambiar Contraseña"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}