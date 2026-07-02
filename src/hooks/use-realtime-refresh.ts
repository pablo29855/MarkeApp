import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

const DATA_CHANGED_EVENT = 'data-changed'

/** Tabla a escuchar. Por defecto se filtra por user_id; para tablas sin esa columna
 *  (p. ej. debt_payments) usar { table, filterByUser: false }. */
export type RealtimeTable = string | { table: string; filterByUser?: boolean }

/**
 * Notifica una mutación local para que las páginas suscritas refresquen de inmediato,
 * sin depender de que el evento de Realtime llegue (o exista conexión).
 * Sin `table` refrescan todas las páginas suscritas.
 */
export function notifyDataChanged(table?: string) {
  window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT, { detail: { table } }))
}

/**
 * Refresco de datos con triple vía:
 * 1. Realtime (postgres_changes) sobre las tablas indicadas, con reintento si el canal cae.
 * 2. Evento global `data-changed` disparado tras mutaciones locales (p. ej. el FAB móvil).
 * 3. `visibilitychange`: al volver la app de background se refresca, porque el socket
 *    puede haber muerto mientras la pestaña estaba oculta.
 */
export function useRealtimeRefresh(
  channelName: string,
  tables: RealtimeTable[],
  userId: string | undefined,
  onChange: () => void,
) {
  // Ref para no resuscribir el canal cada vez que cambie la identidad del callback
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const specs = tables.map((t) =>
    typeof t === 'string' ? { table: t, filterByUser: true } : { filterByUser: true, ...t },
  )
  const tablesKey = specs.map((s) => `${s.table}:${s.filterByUser}`).join(',')
  const specsRef = useRef(specs)
  specsRef.current = specs

  useEffect(() => {
    if (!userId) return

    const supabase = createClient()
    let disposed = false
    let retryTimer: number | undefined
    let channel: RealtimeChannel | undefined

    const subscribe = () => {
      channel = supabase.channel(channelName)
      for (const { table, filterByUser } of specsRef.current) {
        channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
            ...(filterByUser ? { filter: `user_id=eq.${userId}` } : {}),
          },
          () => onChangeRef.current(),
        )
      }
      channel.subscribe((status) => {
        if (disposed) return
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.warn(`[Realtime] Canal "${channelName}" caído (${status}), reintentando en 3s`)
          if (channel) supabase.removeChannel(channel)
          retryTimer = window.setTimeout(() => {
            if (disposed) return
            subscribe()
            // Refrescar al reconectar: pudieron perderse eventos mientras el canal estuvo caído
            onChangeRef.current()
          }, 3000)
        }
      })
    }

    subscribe()

    const handleDataChanged = (e: Event) => {
      const table = (e as CustomEvent).detail?.table
      if (!table || specsRef.current.some((s) => s.table === table)) {
        onChangeRef.current()
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') onChangeRef.current()
    }

    window.addEventListener(DATA_CHANGED_EVENT, handleDataChanged)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      disposed = true
      if (retryTimer) window.clearTimeout(retryTimer)
      window.removeEventListener(DATA_CHANGED_EVENT, handleDataChanged)
      document.removeEventListener('visibilitychange', handleVisibility)
      if (channel) supabase.removeChannel(channel)
    }
  }, [channelName, tablesKey, userId])
}
