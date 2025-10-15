import { Link, useLocation, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { scrollbarClasses } from "@/lib/styles"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import {
  LayoutDashboard,
  Receipt,
  ShoppingCart,
  BarChart3,
  CreditCard,
  TrendingUp,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  User,
} from "lucide-react"
import { useState, useEffect } from "react"
import { ProfileDialog } from "@/components/profile/profile-dialog"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Ingresos", href: "/incomes", icon: TrendingUp },
  { name: "Gastos", href: "/expenses", icon: Receipt },
  { name: "Lista de Compras", href: "/shopping", icon: ShoppingCart },
  { name: "Reportes", href: "/reports", icon: BarChart3 },
  { name: "Deudas", href: "/debts", icon: CreditCard },
]

interface SidebarProps {
  userName: string
  onCollapse?: (collapsed: boolean) => void
}

export function Sidebar({ userName, onCollapse }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const pathname = location.pathname
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarVersion, setAvatarVersion] = useState(Date.now())

  // Notificar al layout cuando cambia el estado de colapso
  useEffect(() => {
    onCollapse?.(isCollapsed)
  }, [isCollapsed, onCollapse])

  // Cerrar menú móvil cuando cambia el tamaño de pantalla a escritorio
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false)
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Cerrar menú móvil cuando cambia la ruta
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    const isDark = savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
    setIsDarkMode(isDark)
    if (isDark) {
      document.documentElement.classList.add("dark")
    }
  }, [])

  // Helper para limpiar la URL base (remover parámetros)
  const getCleanUrl = (url: string) => {
    if (url.startsWith('blob:')) return url
    return url.split('?')[0].split('#')[0]
  }

  // Helper para agregar versión cacheable a la URL del avatar
  const getAvatarDisplayUrl = (url: string | null) => {
    if (!url) return null
    // Si es un blob (preview), devolverlo tal cual
    if (url.startsWith('blob:')) return url
    // Limpiar la URL base primero
    const cleanUrl = getCleanUrl(url)
    // Agregar versión actual del estado (se actualiza cuando cambia el avatar)
    return `${cleanUrl}?v=${avatarVersion}`
  }

  // Load current user's avatar from Supabase Auth user_metadata
  useEffect(() => {
    let mounted = true
    const supabase = createClient()

    const load = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        const user = (data as any)?.user
        if (mounted && user) {
          const baseUrl = user.user_metadata?.avatar_url || null
          setAvatarUrl(baseUrl)
        }
      } catch (err) {
        console.warn('Failed to load user avatar:', err)
      }
    }

    load()

    // Subscribe to auth changes so the sidebar updates when the user updates their avatar
    const { data: { subscription } } = createClient().auth.onAuthStateChange((event, session) => {
      if (event === 'USER_UPDATED' || event === 'SIGNED_IN') {
        const user = session?.user
        const baseUrl = user?.user_metadata?.avatar_url || null
        console.log('🔄 Auth state changed:', event, 'Avatar URL:', baseUrl)
        setAvatarUrl(baseUrl)
        // Forzar nueva versión para actualizar el avatar
        setAvatarVersion(Date.now())
      }
    })

    // Listen for preview events from ProfileDialog to show local preview immediately
    const onPreview = (e: Event) => {
      const detail = (e as CustomEvent)?.detail
      if (detail && detail.url) {
        console.log('👁️ Avatar preview:', detail.url)
        setAvatarUrl(detail.url)
      }
    }
    window.addEventListener('avatar-preview', onPreview as EventListener)

    const onUploadStart = () => {
      console.log('⏳ Avatar upload started')
      setAvatarUploading(true)
    }
    
    const onUploadEnd = (e: Event) => {
      const detail = (e as CustomEvent)?.detail
      console.log('✅ Avatar upload ended:', detail?.url, 'Success:', detail?.success)
      setAvatarUploading(false)
      
      if (detail?.success && detail?.url) {
        // Limpiar la URL base
        const cleanUrl = getCleanUrl(detail.url)
        console.log('🔄 Updating avatar to:', cleanUrl)
        setAvatarUrl(cleanUrl)
        // Forzar nueva versión para actualizar el avatar
        setAvatarVersion(Date.now())
      }
    }
    window.addEventListener('avatar-upload-start', onUploadStart as EventListener)
    window.addEventListener('avatar-upload-end', onUploadEnd as EventListener)

    return () => {
      mounted = false
      // unsubscribe the realtime subscription
      try { subscription?.unsubscribe?.() } catch (e) {}
      window.removeEventListener('avatar-preview', onPreview as EventListener)
      window.removeEventListener('avatar-upload-start', onUploadStart as EventListener)
      window.removeEventListener('avatar-upload-end', onUploadEnd as EventListener)
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDarkMode
    setIsDarkMode(newTheme)
    if (newTheme) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    navigate("/auth/login")
  }

  return (
    <>
      {/* Mobile Header Bar - Fijo en la parte superior */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-sm border-b border-border z-50 flex items-center justify-between px-4 shadow-sm">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold text-sm shadow-md">
            M
          </div>
          <h1 className="font-bold text-base bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            MarketApp
          </h1>
        </button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-background shadow-md hover:shadow-lg transition-all"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Overlay para cerrar el menú en móvil */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-[2px] z-30 animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 bg-card border-r border-border shadow-2xl transition-transform duration-300 ease-out z-50 lg:z-40 lg:bg-card",
          isMobileMenuOpen 
            ? "translate-x-0" 
            : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "w-20" : "w-64",
        )}
      >
        <div className="flex flex-col h-full relative overflow-visible">
          {/* Gradient background - Solo en desktop */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none lg:block hidden" />
          
          {/* Logo and User Info */}
          <div className="px-4 py-4 border-b border-border relative z-10">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold text-xl shrink-0 shadow-lg transition-transform hover:scale-110">
                M
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <h1 className="font-bold text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    MarketApp
                  </h1>
                  <p className="text-xs text-muted-foreground">Control de Gastos</p>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <ProfileDialog userName={userName}>
                <div className="mt-3 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 transition-smooth hover:shadow-md cursor-pointer">
                  <div className="relative">
                    <div className="h-7 w-7 rounded-full overflow-hidden flex items-center justify-center shrink-0 bg-primary/20">
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={getAvatarDisplayUrl(avatarUrl)!} 
                          alt="avatar" 
                          className="h-full w-full object-cover" 
                          loading="lazy"
                        />
                      ) : (
                        <User className="h-3.5 w-3.5 text-primary" />
                      )}
                    </div>
                    {avatarUploading && (
                      <div className="absolute -right-1 -bottom-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-medium truncate">{userName}</span>
                </div>
              </ProfileDialog>
            )}
          </div>

          {/* Navigation */}
          <nav className={`flex-1 px-3 py-4 space-y-1.5 overflow-y-auto relative z-10 ${scrollbarClasses}`}>
            {navigation.map((item, index) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                    isActive
                      ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-sm",
                    isCollapsed && "justify-center px-2",
                    "animate-fade-in"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                  title={isCollapsed ? item.name : undefined}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                  <item.icon className={cn(
                    "h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-110",
                    isActive && "drop-shadow-sm"
                  )} />
                  {!isCollapsed && (
                    <span className="truncate relative z-10">{item.name}</span>
                  )}
                  {isActive && !isCollapsed && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-foreground animate-pulse" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Bottom actions */}
          <div className="p-3 border-t border-border space-y-1.5 relative z-10">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-full gap-2 transition-smooth hover:bg-primary/10 hover:border-primary/50",
                isCollapsed ? "justify-center px-0" : "justify-start"
              )}
              onClick={toggleTheme}
              title={isCollapsed ? (isDarkMode ? "Modo Claro" : "Modo Oscuro") : undefined}
            >
              {isDarkMode ? (
                <>
                  <Sun className="h-4 w-4 shrink-0 text-yellow-500" />
                  {!isCollapsed && <span className="text-xs">Modo Claro</span>}
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 shrink-0 text-blue-500" />
                  {!isCollapsed && <span className="text-xs">Modo Oscuro</span>}
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-full gap-2 transition-smooth hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive",
                isCollapsed ? "justify-center px-0" : "justify-start"
              )}
              onClick={handleLogout}
              title={isCollapsed ? "Cerrar Sesión" : undefined}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span className="text-xs">Cerrar Sesión</span>}
            </Button>
          </div>

          {/* Botón de colapsar/expandir */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex absolute -right-3.5 top-20 w-8 h-8 items-center justify-center rounded-full bg-primary text-primary-foreground border-4 border-background shadow-xl hover:scale-110 transition-all duration-200 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            style={{ zIndex: 100 }}
            aria-label={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5 flex-shrink-0" />
            ) : (
              <ChevronLeft className="h-5 w-5 flex-shrink-0" />
            )}
          </button>
        </div>
      </aside>
    </>
  )
}
