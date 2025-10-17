export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Convierte un objeto Date a string YYYY-MM-DD usando la zona horaria local (Colombia).
 * Evita problemas donde toISOString() convierte a UTC y puede cambiar el día.
 *
 * @param date - Objeto Date o undefined (usa fecha actual)
 * @returns String en formato YYYY-MM-DD en zona horaria local
 */
export function formatDateLocal(date?: Date): string {
  const d = date || new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Obtiene la fecha actual como string YYYY-MM-DD en zona horaria local.
 * Útil para valores por defecto en formularios de fechas.
 *
 * @returns String en formato YYYY-MM-DD (fecha local actual)
 */
export function getTodayLocal(): string {
  return formatDateLocal(new Date())
}

/**
 * Parsea un string de fecha YYYY-MM-DD como fecha local (no UTC).
 * Evita que new Date("2024-01-15") se interprete como medianoche UTC
 * y muestre un día anterior en zonas horarias negativas como Colombia (UTC-5).
 *
 * @param dateString - String en formato YYYY-MM-DD
 * @returns Objeto Date en zona horaria local
 */
export function parseLocalDate(dateString: string): Date {
  if (!dateString) return new Date()

  // Si viene un string con hora (ISO), interpretarlo salvando la fecha UTC
  // para evitar que zonas horarias negativas reduzcan el día.
  // Ej: '2024-10-01T00:00:00Z' -> queremos '2024-10-01' sin pasar a '2024-09-30'.
  if (dateString.includes('T')) {
    const d = new Date(dateString)
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  }

  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}