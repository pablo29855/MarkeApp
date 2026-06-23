import { NavLink, useLocation } from 'react-router-dom'
import { LayoutGrid, CreditCard, BarChart3, User, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProfileDialog } from '@/components/profile/profile-dialog'

interface BottomNavProps {
  userName?: string
  /** Abre el bottom sheet de "Agregar gasto" */
  onAdd?: () => void
}

const items = [
  { name: 'Inicio', href: '/dashboard', icon: LayoutGrid },
  { name: 'Gastos', href: '/expenses', icon: CreditCard },
  { name: 'Reportes', href: '/reports', icon: BarChart3 },
] as const

/**
 * Barra de navegación inferior estilo app nativa (solo móvil/tablet).
 * 5 slots: Inicio · Gastos · FAB(+) · Reportes · Perfil.
 * Respeta safe-area-inset-bottom. Se oculta en escritorio (lg:hidden).
 */
export function BottomNav({ userName = '', onAdd }: BottomNavProps) {
  const { pathname } = useLocation()

  const slot = (active: boolean) =>
    cn(
      'flex flex-1 flex-col items-center justify-center gap-1 pt-2 text-[10px] font-bold transition-colors',
      active ? 'text-primary' : 'text-[#aab1c2]',
    )

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-[90] border-t border-border bg-[rgba(255,255,255,0.94)] dark:bg-[rgba(12,14,22,0.86)] backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex h-[72px] max-w-md items-stretch justify-between px-3">
        {/* Inicio */}
        <NavLink to={items[0].href} className={slot(pathname === items[0].href)}>
          <LayoutGrid className="h-[22px] w-[22px]" strokeWidth={2.4} />
          <span>{items[0].name}</span>
        </NavLink>

        {/* Gastos */}
        <NavLink to={items[1].href} className={slot(pathname.startsWith('/expenses'))}>
          <CreditCard className="h-[22px] w-[22px]" strokeWidth={2.4} />
          <span>{items[1].name}</span>
        </NavLink>

        {/* FAB central */}
        <div className="flex flex-1 items-start justify-center">
          <button
            type="button"
            onClick={onAdd}
            aria-label="Agregar gasto"
            className="-mt-[30px] flex h-[60px] w-[60px] items-center justify-center rounded-[22px] bg-brand-grad-soft text-white shadow-button-pop animate-pulse-fab transition-transform active:scale-95"
          >
            <Plus className="h-[30px] w-[30px]" strokeWidth={3} />
          </button>
        </div>

        {/* Reportes */}
        <NavLink to={items[2].href} className={slot(pathname.startsWith('/reports'))}>
          <BarChart3 className="h-[22px] w-[22px]" strokeWidth={2.4} />
          <span>{items[2].name}</span>
        </NavLink>

        {/* Perfil */}
        <ProfileDialog userName={userName}>
          <button type="button" className={slot(false)}>
            <User className="h-[22px] w-[22px]" strokeWidth={2.4} />
            <span>Perfil</span>
          </button>
        </ProfileDialog>
      </div>
    </nav>
  )
}
