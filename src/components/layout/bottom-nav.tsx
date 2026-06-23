import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, TrendingUp, Receipt, ShoppingCart, BarChart3, CreditCard, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomNavProps {
  /** Abre el bottom sheet de "Agregar gasto" */
  onAdd?: () => void
  /** Abre el menú lateral */
  onMenuClick?: () => void
}

const items = [
  { name: 'Inicio', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Ingresos', href: '/incomes', icon: TrendingUp },
  { name: 'Gastos', href: '/expenses', icon: Receipt },
  { name: 'Compras', href: '/shopping', icon: ShoppingCart },
  { name: 'Reportes', href: '/reports', icon: BarChart3 },
  { name: 'Deudas', href: '/debts', icon: CreditCard },
] as const

/**
 * Barra de navegación inferior estilo app nativa (solo móvil/tablet).
 * Rediseñada sin header superior para un aire diferente.
 */
export function BottomNav({ onAdd, onMenuClick }: BottomNavProps) {
  const { pathname } = useLocation()

  const slot = (active: boolean) =>
    cn(
      'flex flex-col items-center justify-center gap-1 pt-1.5 pb-0.5 text-[9px] sm:text-[10px] font-bold transition-colors w-full h-full',
      active ? 'text-primary' : 'text-[#aab1c2]',
    )

  return (
    <>
      {/* Floating Action Button (+) - Centrado y elevado por encima del navbar */}
      <div 
        className="lg:hidden fixed left-1/2 -translate-x-1/2 z-[100] pointer-events-auto"
        style={{ bottom: 'calc(44px + env(safe-area-inset-bottom))' }}
      >
        <button
          type="button"
          onClick={onAdd}
          aria-label="Agregar"
          className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-brand-grad-soft text-white transition-transform active:scale-95"
        >
          <Plus className="h-[22px] w-[22px]" strokeWidth={3} />
        </button>
      </div>

      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-[90] border-t border-border bg-[rgba(255,255,255,0.94)] dark:bg-[rgba(12,14,22,0.86)] backdrop-blur-xl"
        style={{ 
          WebkitMaskImage: 'radial-gradient(circle at 50% -2px, transparent 24px, black 25px)',
          maskImage: 'radial-gradient(circle at 50% -2px, transparent 24px, black 25px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom) * 0.5)'
        }}
      >
        <div className="mx-auto grid grid-cols-6 h-[56px] max-w-md items-stretch justify-items-center px-1">
          {items.map((item) => (
            <NavLink key={item.name} to={item.href} className={slot(pathname.startsWith(item.href))}>
              <item.icon className="h-[20px] w-[20px]" strokeWidth={2.4} />
              <span className="truncate w-full text-center">{item.name}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  )
}
