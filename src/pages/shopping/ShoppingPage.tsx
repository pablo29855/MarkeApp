import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ShoppingFormWrapper } from '@/components/shopping/shopping-form-wrapper'
import { ShoppingItemCard } from '@/components/shopping/shopping-item'
import { LoadingCheckOverlay } from '@/components/ui/loading-check'
import { SkeletonShoppingGrid } from '@/components/ui/skeleton-card'
import type { ShoppingItem, Category } from '@/lib/types'
import { ShoppingCart } from 'lucide-react'

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
    return <LoadingCheckOverlay message="Cargando lista de compras..." />
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Lista de compras</h1>
          <p className="text-sm text-muted-foreground">Organiza tus compras y conviértelas en gastos</p>
        </div>
        <div className="self-end sm:self-auto">
          <ShoppingFormWrapper userId={userId} categories={categories} onSuccess={handleRefresh} />
        </div>
      </div>

      {/* Card de conteo — degradado Pop Azul */}
      <div className="fade-up relative overflow-hidden rounded-[26px] bg-brand-grad p-5 sm:p-6 text-white shadow-hero">
        <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[#FFC24B]/25" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="mb-1 text-sm font-semibold text-white/80">Productos pendientes</p>
            <div className="flex items-baseline gap-2">
              <span className="text-[34px] font-black leading-tight">{shoppingList.length}</span>
              <span className="text-sm font-semibold text-white/80">
                producto{shoppingList.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <ShoppingCart className="h-16 w-16 shrink-0 opacity-20" />
        </div>
      </div>

      {isRefreshing ? (
        <SkeletonShoppingGrid count={shoppingList.length || 3} />
      ) : shoppingList.length > 0 ? (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3">
          {shoppingList.map((item) => (
            <ShoppingItemCard key={item.id} item={item} marketCategoryId={marketCategoryId} onUpdate={handleRefresh} categories={categories} userId={userId} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-[24px] bg-card py-14 shadow-card">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
            <ShoppingCart className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-extrabold">Tu lista de compras está vacía</p>
          <p className="mt-1 text-sm text-muted-foreground">Agrega items para comenzar a organizar tus compras</p>
        </div>
      )}
    </div>
  )
}
