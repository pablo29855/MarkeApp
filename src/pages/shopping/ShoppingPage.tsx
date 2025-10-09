import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ShoppingFormWrapper } from '@/components/shopping/shopping-form-wrapper'
import { ShoppingItemCard } from '@/components/shopping/shopping-item'
import { Card, CardContent } from '@/components/ui/card'
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
    <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Header - Mejorado y protagonista */}
      <div className="sticky top-16 lg:top-0 z-20 bg-background pb-2 -mt-2 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">Lista de Mercado</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Organiza tus compras y conviértelas en gastos</p>
          </div>
          <div className="self-end sm:self-auto">
            <ShoppingFormWrapper userId={userId} categories={categories} onSuccess={handleRefresh} />
          </div>
        </div>
      </div>

      {/* Card de Total - Compacto en móvil */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 shadow-lg overflow-hidden">
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-xs lg:text-sm opacity-90 mb-1">Lista de Mercado</p>
              <div className="flex items-baseline gap-1 sm:gap-2">
                <span className="text-2xl sm:text-3xl lg:text-5xl font-bold">{shoppingList.length}</span>
                <span className="text-sm sm:text-base lg:text-xl opacity-90">producto{shoppingList.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <div className="ml-2 sm:ml-4 flex-shrink-0">
              <List className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 opacity-20" />
            </div>
          </div>
        </CardContent>
      </Card>

      {isRefreshing ? (
        <SkeletonGrid count={shoppingList.length || 3} />
      ) : shoppingList.length > 0 ? (
        <div className="grid gap-2 sm:gap-3 lg:gap-4 grid-cols-2 lg:grid-cols-3">
          {shoppingList.map((item) => (
            <ShoppingItemCard key={item.id} item={item} marketCategoryId={marketCategoryId} onUpdate={handleRefresh} />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted flex items-center justify-center mb-3 sm:mb-4">
              <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
            </div>
            <p className="text-base sm:text-lg font-medium text-center">Tu lista de mercado está vacía</p>
            <p className="text-xs sm:text-sm text-muted-foreground text-center mt-2">
              Agrega items para comenzar a organizar tus compras
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
