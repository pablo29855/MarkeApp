import { formatCurrency } from '@/lib/utils'
import { useCountUp } from '@/hooks/use-count-up'
import { cn } from '@/lib/utils'

interface BalanceCardProps {
  totalIncome: number
  totalExpenses: number
  totalDebts: number
  className?: string
  style?: React.CSSProperties
}

export function BalanceCard({ totalIncome, totalExpenses, totalDebts, className, style }: BalanceCardProps) {
  const balance = totalIncome - totalExpenses - totalDebts
  const spent = totalExpenses + totalDebts
  const animated = useCountUp(balance)

  const chip =
    balance > 0
      ? '🎉 ¡Vas genial este mes!'
      : balance === 0
        ? '✨ Sin movimientos aún'
        : '⚠️ Cuida tu balance'

  return (
    <div
      className={cn(
        'fade-up relative overflow-hidden rounded-[28px] bg-brand-grad p-5 sm:p-6 text-white shadow-hero',
        className,
      )}
      style={style}
    >
      {/* Círculos decorativos */}
      <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-[#FFC24B]/30 blur-[2px]" />
      <div className="pointer-events-none absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-[#FF7A59]/30" />

      <div className="relative">
        <p className="text-[13px] font-semibold text-white/80">Tu balance disponible</p>
        <p className="mt-1 text-[34px] sm:text-[39px] font-black leading-tight tracking-tight">
          {formatCurrency(animated)}
        </p>

        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold backdrop-blur-sm">
          {chip}
        </span>

        {/* Desglose ingresos / gastos */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/10 px-3 py-2.5 backdrop-blur-sm">
            <p className="text-[11px] font-semibold text-white/75">Ingresos</p>
            <p className="text-base font-black">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="rounded-2xl bg-white/10 px-3 py-2.5 backdrop-blur-sm">
            <p className="text-[11px] font-semibold text-white/75">Gastos + Deudas</p>
            <p className="text-base font-black">{formatCurrency(spent)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
