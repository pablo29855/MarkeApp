import { ReactNode, useEffect, useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { createClient } from '@/lib/supabase/client'

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
        {/* Espacio para el header móvil (16 = h-16) */}
        <div className="pt-16 lg:pt-0">
          <div className="p-3 sm:p-4 md:p-6 lg:p-8">{children}</div>
        </div>
      </main>
    </div>
  )
}
