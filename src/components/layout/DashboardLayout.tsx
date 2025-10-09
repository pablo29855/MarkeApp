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
        setUserName(user.email?.split('@')[0] || 'Usuario')
      }
    }
    getUser()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userName={userName} onCollapse={setIsCollapsed} />
      <main className={`transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
