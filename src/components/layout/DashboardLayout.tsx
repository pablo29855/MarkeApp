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

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userName={userName} onCollapse={setIsCollapsed} />
      <main className={`transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        {/* Contenedor con scroll optimizado */}
        <div className={`h-[100vh] overflow-y-auto overscroll-behavior-y-contain scroll-smooth ${scrollbarClasses}`}>
          {/* Espaciado limpio y profesional - Reducido padding superior en desktop y más espacio inferior */}
          <div className="pt-20 lg:pt-6 px-4 sm:px-5 md:px-6 lg:px-8 pb-8 sm:pb-10 lg:pb-12 min-h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
