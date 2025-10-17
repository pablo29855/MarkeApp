import { ReactNode, useEffect, useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { createClient } from '@/lib/supabase/client'
import { scrollbarClasses } from '@/lib/styles'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [userName, setUserName] = useState('Usuario')
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isPWA, setIsPWA] = useState(false)

  useEffect(() => {
    async function getUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Try to get profile first
        // Use Supabase Auth metadata for display name
        setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario')
      }
    }
    getUser()
  }, [])

  useEffect(() => {
    // Detectar si está en modo PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true
    setIsPWA(isStandalone)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userName={userName} onCollapse={setIsCollapsed} />
      <main className={`transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        {/* Contenedor con scroll optimizado */}
        <div className={`h-[100vh] overflow-y-auto overscroll-behavior-y-contain scroll-smooth ${scrollbarClasses}`}>
          {/* Espaciado limpio y profesional - Más espacio inferior en móvil para mejor efecto de cards */}
          <div className={`pt-16 lg:pt-6 px-4 sm:px-5 md:px-6 lg:px-8 min-h-full ${isPWA ? 'pb-8 sm:pb-6 lg:pb-4' : 'pb-32 sm:pb-24 lg:pb-8'}`}>
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
