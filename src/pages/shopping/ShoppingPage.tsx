import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ShoppingFormWrapper } from '@/components/shopping/shopping-form-wrapper'
import { ShoppingItemCard } from '@/components/shopping/shopping-item'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { LoadingCheckOverlay } from '@/components/ui/loading-check'
import { SkeletonGrid } from '@/components/ui/skeleton-card'
import type { ShoppingItem, Category } from '@/lib/types'
import { ShoppingCart, List } from 'lucide-react'

export default function ShoppingPage() {
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([])
  const [marketCategoryId, setMarketCategoryId] = useState<string>('')
  const [categories, setCategories] = useState<Category[]>([])
  const [userId, setUserId] = useState<string>('')

  const fetchShoppingList = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { data: shoppingData } = await supabase
        .from('shopping_list')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_purchased', false)
        .order('created_at', { ascending: false })

      setShoppingList((shoppingData || []) as ShoppingItem[])
    } catch (error) {
      console.error('[Shopping] Error fetching shopping list:', error)
    }
  }, [])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await fetchShoppingList()
    setTimeout(() => setIsRefreshing(false), 300)
  }, [fetchShoppingList])

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

  // Suscripción en tiempo real
  useEffect(() => {
    if (!userId) return

    const supabase = createClient()
    
    const channel = supabase
      .channel('shopping-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_list',
          filter: `user_id=eq.${userId}`
        },
        () => {
          // Usar handleRefresh para mostrar el skeleton durante la actualización
          handleRefresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, handleRefresh])

  if (loading) {
    return <LoadingCheckOverlay message="Cargando lista de mercado..." />
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <PageHeader
        title="Lista de Mercado"
        description="Organiza tus compras y conviértelas en gastos"
        action={<ShoppingFormWrapper userId={userId} categories={categories} onSuccess={handleRefresh} />}
      />

      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm opacity-90 mb-2">Lista de Mercado</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold">{shoppingList.length}</span>
                <span className="text-xl opacity-90">productos</span>
              </div>
            </div>
            <div className="ml-4">
              <List className="h-16 w-16 opacity-20" />
            </div>
          </div>
        </CardContent>
      </Card>

      {isRefreshing ? (
        <SkeletonGrid count={shoppingList.length || 3} />
      ) : shoppingList.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {shoppingList.map((item) => (
            <ShoppingItemCard key={item.id} item={item} marketCategoryId={marketCategoryId} onUpdate={handleRefresh} />
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
