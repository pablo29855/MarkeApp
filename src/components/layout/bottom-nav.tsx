import { NavLink, useLocation } from 'react-router-dom'
import { CreditCard, TrendingUp, ShoppingCart, Menu as MenuIcon, Plus, WalletCards, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomNavProps {
  /** Abre el bottom sheet de "Agregar gasto" */
  onAdd?: () => void
  /** Abre el menú lateral */
  onMenuClick?: () => void
}

const items = [
  { name: 'Inicio', href: '/dashboard', icon: LayoutGrid },
  { name: 'Ingresos', href: '/incomes', icon: TrendingUp },
  { name: 'Gastos', href: '/expenses', icon: CreditCard },
  { name: 'Compras', href: '/shopping', icon: ShoppingCart },
  { name: 'Deudas', href: '/debts', icon: WalletCards },
] as const

/**
 * Barra de navegación inferior estilo app nativa (solo móvil/tablet).
 * Rediseñada sin header superior para un aire diferente.
 */
export function BottomNav({ onAdd, onMenuClick }: BottomNavProps) {
  const { pathname } = useLocation()

  const slot = (active: boolean) =>
    cn(
      'flex flex-col items-center justify-center gap-1 pt-2 text-[10px] font-bold transition-colors w-full h-full',
      active ? 'text-primary' : 'text-[#aab1c2]',
    )

  return (
    <>
      {/* Floating Action Button (+) - Centrado y elevado por encima del navbar */}
      <div 
        className="lg:hidden fixed left-1/2 -translate-x-1/2 z-[100] pointer-events-auto"
        style={{ bottom: '52px' }}
      >
        <button
          type="button"
          onClick={onAdd}
          aria-label="Agregar"
          className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-brand-grad-soft text-white transition-transform active:scale-95"
        >
          <Plus className="h-[24px] w-[24px]" strokeWidth={3} />
        </button>
      </div>

      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-[90] border-t border-border bg-[rgba(255,255,255,0.94)] dark:bg-[rgba(12,14,22,0.86)] backdrop-blur-xl"
        style={{ 
          WebkitMaskImage: 'radial-gradient(circle at 50% -4px, transparent 28px, black 29px)',
          maskImage: 'radial-gradient(circle at 50% -4px, transparent 28px, black 29px)'
        }}
      >
        <div className="mx-auto grid grid-cols-6 h-[72px] max-w-md items-stretch justify-items-center px-1">
          {/* Inicio */}
          <NavLink to={items[0].href} className={slot(pathname === items[0].href)}>
            <LayoutGrid className="h-[22px] w-[22px]" strokeWidth={2.4} />
            <span className="truncate w-full text-center">{items[0].name}</span>
          </NavLink>

          {/* Ingresos */}
          <NavLink to={items[1].href} className={slot(pathname.startsWith('/incomes'))}>
            <TrendingUp className="h-[22px] w-[22px]" strokeWidth={2.4} />
            <span className="truncate w-full text-center">{items[1].name}</span>
          </NavLink>

          {/* Gastos */}
          <NavLink to={items[2].href} className={slot(pathname.startsWith('/expenses'))}>
            <CreditCard className="h-[22px] w-[22px]" strokeWidth={2.4} />
            <span className="truncate w-full text-center">{items[2].name}</span>
          </NavLink>

          {/* Compras */}
          <NavLink to={items[3].href} className={slot(pathname.startsWith('/shopping'))}>
            <ShoppingCart className="h-[22px] w-[22px]" strokeWidth={2.4} />
            <span className="truncate w-full text-center">{items[3].name}</span>
          </NavLink>

          {/* Deudas */}
          <NavLink to={items[4].href} className={slot(pathname.startsWith('/debts'))}>
            <WalletCards className="h-[22px] w-[22px]" strokeWidth={2.4} />
            <span className="truncate w-full text-center">{items[4].name}</span>
          </NavLink>

          {/* Menú */}
          <button type="button" onClick={onMenuClick} className={slot(false)}>
            <MenuIcon className="h-[22px] w-[22px]" strokeWidth={2.4} />
            <span className="truncate w-full text-center">Menú</span>
          </button>
        </div>
      </nav>
    </>
  )
}
