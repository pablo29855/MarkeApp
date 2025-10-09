import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
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

  console.log("[Supabase] Creating client with URL:", supabaseUrl)

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
