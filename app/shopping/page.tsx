import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ShoppingFormWrapper } from "@/components/shopping/shopping-form-wrapper"
import { ShoppingItemCard } from "@/components/shopping/shopping-item"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import type { ShoppingItem, Category } from "@/lib/types"
import { ShoppingCart } from "lucide-react"

async function getShoppingList(userId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from("shopping_list")
    .select("*")
    .eq("user_id", userId)
    .eq("is_purchased", false)
    .order("created_at", { ascending: false })

  return (data || []) as ShoppingItem[]
}

async function getMarketCategoryId() {
  const supabase = await createClient()
  const { data } = await supabase.from("categories").select("id").eq("name", "Mercado").single()
  return data?.id || ""
}

async function getCategories() {
  const supabase = await createClient()
  const { data } = await supabase.from("categories").select("*").order("name")
  return (data || []) as Category[]
}

export default async function ShoppingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const [shoppingList, marketCategoryId, categories] = await Promise.all([
    getShoppingList(user.id),
    getMarketCategoryId(),
    getCategories(),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <PageHeader
        title="Lista de Mercado"
        description="Organiza tus compras y conviértelas en gastos"
        showBackButton
        backHref="/dashboard"
        action={<ShoppingFormWrapper userId={user.id} categories={categories} />}
      />

      {/* Summary */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Items Pendientes</p>
              <p className="text-3xl font-bold mt-1">{shoppingList.length}</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Total de Items</p>
              <p className="text-3xl font-bold mt-1">
                {shoppingList.reduce((sum, item) => sum + item.quantity, 0).toFixed(1)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shopping List */}
      {shoppingList.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {shoppingList.map((item) => (
            <ShoppingItemCard key={item.id} item={item} marketCategoryId={marketCategoryId} />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <ShoppingCart className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-center">Tu lista de mercado está vacía</p>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Agrega items para comenzar a organizar tus compras
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
