import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Supabase environment variables missing:", {
      url: supabaseUrl ? "✓" : "✗",
      key: supabaseAnonKey ? "✓" : "✗",
    })
    throw new Error(
      "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
    )
  }

  console.log("[v0] Creating Supabase client with URL:", supabaseUrl)

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
