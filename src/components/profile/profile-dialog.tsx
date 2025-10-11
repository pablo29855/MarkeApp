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
  const [croppedArea, setCroppedArea] = useState<Area | null>(null)
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string | null>(null)
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

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!profile || loading) return

    setLoading(true)
    try {
      const updateData: any = { data: {} }

      // Build metadata updates
      if (updates.full_name !== undefined && updates.full_name !== null) {
        updateData.data.full_name = updates.full_name
      }
      if (updates.avatar_url !== undefined && updates.avatar_url !== null) {
        updateData.data.avatar_url = updates.avatar_url
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
          toast({
            title: "Éxito",
            description: "Perfil actualizado correctamente",
          })
        }
      }

      // No upsert to 'profiles' table — we store profile data in Supabase Auth user_metadata only.

      // Update local state
      setProfile({ ...profile, ...updates })

      // Refresh profile data to get updated information from server
      await fetchProfile()

      // Close modal after successful update
      setIsOpen(false)
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

    // Open crop UI with the selected file
    setRawFile(file)
    setIsCropOpen(true)
    return
  }

  // When crop is confirmed, this function will be called with the cropped blob
  const handleCroppedUpload = async (blob: Blob, ext = 'jpg') => {
    if (!profile) return
    setIsCropOpen(false)
    setUploading(true)
    const bucketName = import.meta.env.VITE_AVATAR_BUCKET || 'MarketApp'
    try {
      // notify upload start so other UI (sidebar) can show spinner
      try { window.dispatchEvent(new CustomEvent('avatar-upload-start')) } catch (e) {}
      const fileExt = ext
      const fileName = `${profile.id}.${fileExt}`
      const filePath = fileName

      // Ensure there's a valid session / access token before upload
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        console.log('Supabase session before upload:', sessionData, sessionError)
        if (sessionError) console.warn('Session retrieval error:', sessionError)
        if (!sessionData?.session?.access_token) {
          toast({
            title: 'No autenticado',
            description: 'No se encontró una sesión activa. Por favor inicia sesión e intenta de nuevo.',
            variant: 'destructive',
          })
          setUploading(false)
          return
        }
      } catch (err) {
        console.warn('Error checking session before upload:', err)
      }

      if (import.meta.env.VITE_USE_BACKEND_UPLOAD === 'true') {
        // Send file to backend endpoint which uses service_role key to upload
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
          throw new Error(errText || 'Backend upload failed')
        }

        const body = await resp.json()
        await updateProfile({ avatar_url: body.url })
        try { window.dispatchEvent(new CustomEvent('avatar-upload-end', { detail: { success: true, url: body.url } })) } catch (e) {}
      } else {
        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, blob, { upsert: true })

        if (uploadError) throw uploadError

        const { data } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath)

        await updateProfile({ avatar_url: data.publicUrl })
        try { window.dispatchEvent(new CustomEvent('avatar-upload-end', { detail: { success: true, url: data.publicUrl } })) } catch (e) {}
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
          title: "Error",
          description: isBucketMissing
            ? `No se encontró el bucket '${bucketName}' en Storage. Crea el bucket con ese nombre en Supabase Storage (o configura VITE_AVATAR_BUCKET).`
            : "No se pudo subir la imagen",
          variant: "destructive",
        })
      }
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
  // This version creates a fixed-size square output (e.g. 512x512) from the
  // pixelCrop coordinates returned by react-easy-crop (which are relative to the image's natural size).
  async function getCroppedImg(file: File, pixelCrop: Area) {
    const imageUrl = URL.createObjectURL(file)
    const image = await createImage(imageUrl)

    const outputSize = 512 // fixed square size for consistent avatars
    const canvas = document.createElement('canvas')
    canvas.width = outputSize
    canvas.height = outputSize
    const ctx = canvas.getContext('2d')!

    // Draw the cropped area of the source image into the canvas, scaled to outputSize
    // pixelCrop.x/y/width/height are in pixels relative to the source image dimensions
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      outputSize,
      outputSize
    )

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob)
      }, 'image/jpeg', 0.92)
    })
  }

  // Handler when user confirms crop
  const confirmCrop = async () => {
    if (!rawFile || !croppedArea) return
    const blob = await getCroppedImg(rawFile, croppedArea)
    if (!blob) {
      toast({ title: 'Error', description: 'No se pudo procesar la imagen', variant: 'destructive' })
      return
    }
    // Create preview URL so viewer shows exact crop immediately and update UI
    const prevPreview = croppedPreviewUrl
    if (prevPreview) {
      try { URL.revokeObjectURL(prevPreview) } catch (e) {}
    }
    const previewUrl = URL.createObjectURL(blob)
    setCroppedPreviewUrl(previewUrl)

    // Update local profile state so the small avatar shows the preview immediately
    const previousAvatar = profile?.avatar_url || null
    setProfile(prev => prev ? { ...prev, avatar_url: previewUrl } : prev)

    // Notify other components (sidebar) about preview via event
    try {
      window.dispatchEvent(new CustomEvent('avatar-preview', { detail: { url: previewUrl } }))
    } catch (e) {}

    // Determine extension and upload; if upload fails, revert preview
    const ext = (rawFile.name.split('.').pop() || 'jpg').replace(/\?.*$/, '')
    try {
      await handleCroppedUpload(blob, ext)
    } catch (err) {
      // revert preview
      setProfile(prev => prev ? { ...prev, avatar_url: previousAvatar } : prev)
      try { window.dispatchEvent(new CustomEvent('avatar-preview', { detail: { url: previousAvatar } })) } catch (e) {}
      throw err
    }
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
      <DialogContent className="sm:max-w-[500px]">
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
              <div className="relative">
                  <div className="relative inline-block">
                    <button
                      type="button"
                      onClick={(e) => {
                        // Prevent opening viewer when clicking the upload button (label/input)
                        const target = e.target as HTMLElement
                        const isUploadControl = target.closest('label')
                        if (!isUploadControl) setIsViewerOpen(true)
                      }}
                      className="p-0 border-0 bg-transparent"
                      aria-label="Ver avatar"
                    >
                      <Avatar className="w-20 h-20">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback>
                          {userName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                    {uploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 cursor-pointer hover:bg-primary/90">
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
              {uploading && <p className="text-sm text-muted-foreground">Subiendo imagen...</p>}
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
          <Dialog open={isCropOpen} onOpenChange={setIsCropOpen}>
            <DialogContent className="max-w-3xl w-full">
              <DialogHeader>
                <DialogTitle>Recortar imagen</DialogTitle>
                <DialogDescription>Ajústala para que quede bien dentro del círculo</DialogDescription>
              </DialogHeader>
              <div className="h-[60vh] w-full relative bg-black/5 rounded-md overflow-hidden">
                {rawFile && (
                  <Cropper
                    image={URL.createObjectURL(rawFile)}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={(_croppedAreaPixels: Area) => setCroppedArea(_croppedAreaPixels)}
                  />
                )}
              </div>
              <div className="mt-4 flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full"
                />
                <Button onClick={() => { setIsCropOpen(false); setRawFile(null); }}>Cancelar</Button>
                <Button onClick={confirmCrop} disabled={!croppedArea}>Confirmar</Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Avatar viewer dialog */}
          <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
            <DialogContent className="w-full max-w-3xl p-6 bg-black/60 backdrop-blur-sm shadow-lg rounded-lg">
                <div className="relative flex items-center justify-center w-full h-full py-8">
                  <button
                    onClick={() => { setIsViewerOpen(false); try { if (croppedPreviewUrl) { URL.revokeObjectURL(croppedPreviewUrl); setCroppedPreviewUrl(null) } } catch(e){} }}
                    className="absolute right-4 top-4 text-white bg-black/40 rounded-full p-2 hover:bg-black/60"
                    aria-label="Cerrar vista previa"
                  >
                    ✕
                  </button>

                  {croppedPreviewUrl || profile?.avatar_url ? (
                    <div className="w-[360px] h-[360px] rounded-full overflow-hidden bg-black/5 flex items-center justify-center border border-white/20">
                      <img src={croppedPreviewUrl || profile?.avatar_url!} alt="Avatar grande" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-80 h-80 flex items-center justify-center bg-muted rounded-lg">
                      <span className="text-muted-foreground">No hay imagen</span>
                    </div>
                  )}
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
      </DialogContent>
    </Dialog>
  )
}