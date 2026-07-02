import { useState, type ReactNode } from 'react'
import { ChevronDown, Plus, CalendarDays, MoreHorizontal } from 'lucide-react'
import { cn, getTodayLocal, formatDateLocal, parseLocalDate } from '@/lib/utils'
import { CategoryGlyph } from '@/lib/category-visuals'
import { DateInput } from '@/components/ui/date-input'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import type { Category } from '@/lib/types'

/**
 * Primitivas del rediseño de formularios móviles:
 * monto protagonista, categorías/fechas como chips de un tap
 * y campos opcionales colapsados.
 */

/** Campo de monto protagonista: display grande centrado con teclado numérico. */
export function BigAmountInput({
  id,
  value,
  onChange,
  disabled,
  label = 'Monto',
  autoFocus,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  label?: string
  autoFocus?: boolean
}) {
  return (
    <div className="text-center">
      <label htmlFor={id} className="text-xs font-bold text-muted-foreground">
        {label}
      </label>
      <div className="flex items-baseline justify-center gap-1">
        <span className={cn('text-2xl font-black', value ? 'text-foreground' : 'text-muted-foreground')}>$</span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          disabled={disabled}
          autoFocus={autoFocus}
          size={Math.max(value.length, 1)}
          className="big-amount-input bg-transparent text-center text-[38px] font-black leading-tight text-foreground placeholder:text-muted-foreground outline-none border-none focus:ring-0 min-w-[2ch] max-w-full"
          style={{ width: `${Math.max(value.length, 1)}ch` }}
        />
      </div>
      <div className="mx-auto h-[2px] w-24 rounded-full bg-primary/30" />
    </div>
  )
}

/** Chip pill genérico (fecha, tipo de ingreso, etc.). */
export function ChoiceChip({
  selected,
  onClick,
  disabled,
  children,
  className,
}: {
  selected: boolean
  onClick: () => void
  disabled?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-bold transition-colors disabled:opacity-50',
        selected
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border bg-transparent text-muted-foreground hover:bg-secondary/60',
        className,
      )}
    >
      {children}
    </button>
  )
}

/** Grilla de categorías como tiles con ícono: un tap en vez de dropdown. */
export function CategoryChipGrid({
  categories,
  value,
  onChange,
  disabled,
  maxVisible = 7,
}: {
  categories: Category[]
  value: string
  onChange: (id: string) => void
  disabled?: boolean
  maxVisible?: number
}) {
  const selectedIndex = categories.findIndex((c) => c.id === value)
  const [showAll, setShowAll] = useState(selectedIndex >= maxVisible)

  const needsToggle = categories.length > maxVisible
  const visible = showAll || !needsToggle ? categories : categories.slice(0, maxVisible)

  return (
    <div className="grid grid-cols-4 gap-2">
      {visible.map((category) => {
        const selected = category.id === value
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onChange(category.id)}
            disabled={disabled}
            aria-pressed={selected}
            className={cn(
              'flex flex-col items-center justify-center gap-1 rounded-[14px] border px-1 py-2.5 transition-colors disabled:opacity-50',
              selected
                ? 'border-primary bg-primary/10'
                : 'border-border bg-transparent hover:bg-secondary/60',
            )}
          >
            <CategoryGlyph
              name={category.name}
              className={cn('h-5 w-5', selected ? 'text-primary' : 'text-muted-foreground')}
            />
            <span
              className={cn(
                'w-full truncate text-center text-[11px] font-bold',
                selected ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {category.name}
            </span>
          </button>
        )
      })}
      {needsToggle && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          disabled={disabled}
          className="flex flex-col items-center justify-center gap-1 rounded-[14px] border border-dashed border-border px-1 py-2.5 text-muted-foreground transition-colors hover:bg-secondary/60 disabled:opacity-50"
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="w-full truncate text-center text-[11px] font-bold">
            {showAll ? 'Menos' : 'Más'}
          </span>
        </button>
      )}
    </div>
  )
}

/** Grilla genérica de tiles con ícono arbitrario (categorías fijas, p. ej. deudas). */
export function TileChipGrid({
  items,
  value,
  onChange,
  disabled,
  maxVisible = 7,
}: {
  items: { id: string; label: string; icon: ReactNode }[]
  value: string
  onChange: (id: string) => void
  disabled?: boolean
  maxVisible?: number
}) {
  const selectedIndex = items.findIndex((i) => i.id === value)
  const [showAll, setShowAll] = useState(selectedIndex >= maxVisible)

  const needsToggle = items.length > maxVisible
  const visible = showAll || !needsToggle ? items : items.slice(0, maxVisible)

  return (
    <div className="grid grid-cols-4 gap-2">
      {visible.map((item) => {
        const selected = item.id === value
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            disabled={disabled}
            aria-pressed={selected}
            className={cn(
              'flex flex-col items-center justify-center gap-1 rounded-[14px] border px-1 py-2.5 transition-colors disabled:opacity-50',
              selected
                ? 'border-primary bg-primary/10'
                : 'border-border bg-transparent hover:bg-secondary/60',
            )}
          >
            <span className={cn(selected ? 'text-primary' : 'text-muted-foreground')}>{item.icon}</span>
            <span
              className={cn(
                'w-full truncate text-center text-[11px] font-bold',
                selected ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {item.label}
            </span>
          </button>
        )
      })}
      {needsToggle && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          disabled={disabled}
          className="flex flex-col items-center justify-center gap-1 rounded-[14px] border border-dashed border-border px-1 py-2.5 text-muted-foreground transition-colors hover:bg-secondary/60 disabled:opacity-50"
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="w-full truncate text-center text-[11px] font-bold">
            {showAll ? 'Menos' : 'Más'}
          </span>
        </button>
      )}
    </div>
  )
}

/** Selector de fecha con chips Hoy / Ayer / Otra (calendario solo si hace falta). */
export function DateChipPicker({
  id,
  value,
  onChange,
  disabled,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}) {
  const today = getTodayLocal()
  const yesterdayDate = parseLocalDate(today)
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterday = formatDateLocal(yesterdayDate)

  const isOther = value !== today && value !== yesterday
  const [showPicker, setShowPicker] = useState(isOther)

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <ChoiceChip
          selected={value === today && !showPicker}
          onClick={() => {
            setShowPicker(false)
            onChange(today)
          }}
          disabled={disabled}
        >
          Hoy
        </ChoiceChip>
        <ChoiceChip
          selected={value === yesterday && !showPicker}
          onClick={() => {
            setShowPicker(false)
            onChange(yesterday)
          }}
          disabled={disabled}
        >
          Ayer
        </ChoiceChip>
        <ChoiceChip
          selected={showPicker || isOther}
          onClick={() => setShowPicker(true)}
          disabled={disabled}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          Otra
        </ChoiceChip>
      </div>
      {(showPicker || isOther) && (
        <DateInput
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="h-10 text-sm"
        />
      )}
    </div>
  )
}

/** Sección de campos opcionales colapsada tras "+ Etiqueta". */
export function OptionalSection({
  label,
  defaultOpen = false,
  children,
}: {
  label: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between border-t border-border py-2.5 text-[13px] font-bold text-muted-foreground transition-colors hover:text-foreground"
        >
          <span className="inline-flex items-center gap-1.5">
            <Plus className={cn('h-4 w-4 transition-transform', open && 'rotate-45')} />
            {label}
          </span>
          <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 pb-1">{children}</CollapsibleContent>
    </Collapsible>
  )
}

/** Pie de formulario fijo al fondo del sheet/dialog, siempre visible sobre el teclado.
 *  Los márgenes negativos cancelan el padding del contenedor scrolleable (px-4 pb-8)
 *  para que el fondo cubra de borde a borde y el contenido no se vea detrás al scrollear. */
export function FormStickyFooter({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 -mb-8 mt-2 border-t border-border bg-background px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      {children}
    </div>
  )
}
