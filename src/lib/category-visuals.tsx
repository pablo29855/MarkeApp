import type { CSSProperties } from 'react'
import {
  Home,
  ShoppingCart,
  Car,
  Lightbulb,
  Utensils,
  Briefcase,
  HeartPulse,
  Gamepad2,
  GraduationCap,
  Shirt,
  Plane,
  Gift,
  Wallet,
  Landmark,
  Banknote,
  PiggyBank,
  Dumbbell,
  Wifi,
  Smartphone,
  Tv,
  Sparkles,
  Receipt,
  PawPrint,
  Baby,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

/**
 * Paleta Pop Azul para categorías/gráficos (coincide con --chart-* de index.css).
 * Se usa para colorear barras, íconos y celdas de gráficos.
 */
export const CHART_COLORS = [
  'hsl(var(--chart-1))', // azul
  'hsl(var(--chart-2))', // coral
  'hsl(var(--chart-3))', // amarillo
  'hsl(var(--chart-4))', // violeta-azul
  'hsl(var(--chart-5))', // azul claro
] as const

/** Color de paleta por índice (cicla). */
export function chartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length]
}

/** Fondo tinte suave a partir de un color hsl(...) de la paleta. */
export function tintColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length].replace(')', ' / 0.14)')
}

// Mapa nombre de categoría (normalizado) → ícono lucide
const ICON_MAP: Record<string, LucideIcon> = {
  arriendo: Home,
  alquiler: Home,
  hogar: Home,
  casa: Home,
  mercado: ShoppingCart,
  supermercado: ShoppingCart,
  compras: ShoppingCart,
  transporte: Car,
  gasolina: Car,
  servicios: Lightbulb,
  'servicios publicos': Lightbulb,
  restaurante: Utensils,
  comida: Utensils,
  alimentacion: Utensils,
  nomina: Briefcase,
  salario: Briefcase,
  trabajo: Briefcase,
  salud: HeartPulse,
  medico: HeartPulse,
  entretenimiento: Gamepad2,
  ocio: Gamepad2,
  educacion: GraduationCap,
  ropa: Shirt,
  viajes: Plane,
  regalos: Gift,
  // Tipos de ingreso
  transferencia: Landmark,
  banco: Landmark,
  efectivo: Banknote,
  ahorro: PiggyBank,
  ahorros: PiggyBank,
  // Categorías adicionales frecuentes
  gimnasio: Dumbbell,
  deporte: Dumbbell,
  internet: Wifi,
  telefono: Smartphone,
  celular: Smartphone,
  streaming: Tv,
  suscripciones: Tv,
  belleza: Sparkles,
  impuestos: Receipt,
  mascotas: PawPrint,
  bebes: Baby,
  mantenimiento: Wrench,
}

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

/** Devuelve el ícono lucide para una categoría (fallback: Wallet). */
export function categoryIcon(name?: string | null): LucideIcon {
  if (!name) return Wallet
  return ICON_MAP[normalize(name)] || Wallet
}

/** Ícono lucide de categoría listo para renderizar (reemplaza los emojis de la DB). */
export function CategoryGlyph({
  name,
  className = 'h-4 w-4',
  style,
}: {
  name?: string | null
  className?: string
  style?: CSSProperties
}) {
  const Icon = categoryIcon(name)
  return <Icon className={className} style={style} aria-hidden />
}
