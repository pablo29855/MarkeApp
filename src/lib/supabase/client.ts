import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js"

// Instancia única compartida por toda la app.
// Un solo GoTrueClient (sesión consistente) y un solo websocket de Realtime:
// los canales se suscriben siempre sobre la conexión ya autenticada.
let client: SupabaseClient | undefined

export function createClient(): SupabaseClient {
  if (client) return client

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[Supabase] Environment variables missing:", {
      url: supabaseUrl ? "✓" : "✗",
      key: supabaseAnonKey ? "✓" : "✗",
    })
    throw new Error(
      "Missing Supabase environment variables. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY",
    )
  }

  client = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  })

  return client
}
