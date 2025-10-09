import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ShoppingFormWrapper } from '@/components/shopping/shopping-form-wrapper'
import { ShoppingItemCard } from '@/components/shopping/shopping-item'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import type { ShoppingItem, Category } from '@/lib/types'
import { ShoppingCart } from 'lucide-react'

export default function ShoppingPage() {
  const [loading, setLoading] = useState(true)
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([])
  const [marketCategoryId, setMarketCategoryId] = useState<string>('')
  const [categories, setCategories] = useState<Category[]>([])
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return

        setUserId(user.id)

        const [{ data: shoppingData }, { data: marketCategory }, { data: categoriesData }] = await Promise.all([
          supabase
            .from('shopping_list')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_purchased', false)
            .order('created_at', { ascending: false }),
          supabase.from('categories').select('id').eq('name', 'Mercado').single(),
          supabase.from('categories').select('*').order('name'),
        ])

        setShoppingList((shoppingData || []) as ShoppingItem[])
        setMarketCategoryId(marketCategory?.id || '')
        setCategories((categoriesData || []) as Category[])
      } catch (error) {
        console.error('[Shopping] Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <PageHeader
        title="Lista de Mercado"
        description="Organiza tus compras y conviértelas en gastos"
        showBackButton
        backHref="/dashboard"
        action={<ShoppingFormWrapper userId={userId} categories={categories} />}
      />

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
