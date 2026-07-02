import { ReactNode, useEffect, useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { GlobalAddExpense } from '@/components/layout/global-add-expense'
import { createClient } from '@/lib/supabase/client'
import { scrollbarClasses } from '@/lib/styles'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [userName, setUserName] = useState('Usuario')
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
    <div className="h-[100dvh] overflow-hidden bg-background">
      <Sidebar 
        userName={userName} 
        onCollapse={setIsCollapsed} 
        onMobileMenuChange={setMobileMenuOpen} 
        mobileMenuOpen={mobileMenuOpen}
      />
      <main className={`transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        {/* Contenedor con scroll optimizado */}
        <div data-main-scroll className={`h-[100dvh] overflow-y-auto overscroll-none scroll-smooth ${scrollbarClasses}`}>
          {/* Espaciado: deja sitio para el BottomNav (~72px + safe-area) en móvil */}
          <div 
            className="px-4 sm:px-5 md:px-6 lg:px-8 min-h-full lg:!pb-8 lg:!pt-6"
            style={{ 
              paddingTop: 'calc(1.5rem + env(safe-area-inset-top, 0px))',
              paddingBottom: 'calc(56px + env(safe-area-inset-bottom, 0px) + 24px)'
            }}
          >
            {children}
          </div>
        </div>
      </main>

      {/* Navegación inferior estilo app (solo móvil/tablet) + FAB.
          Se oculta mientras el menú off-canvas está abierto para no solaparse. */}
      {!mobileMenuOpen && <BottomNav onAdd={() => setAddOpen(true)} onMenuClick={() => setMobileMenuOpen(true)} />}

      {/* Bottom sheet / dialog global de "Agregar gasto" disparado por el FAB */}
      <GlobalAddExpense open={addOpen} onOpenChange={setAddOpen} />
    </div>
  )
}
