import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ShoppingFormWrapper } from '@/components/shopping/shopping-form-wrapper'
import { ShoppingItemCard } from '@/components/shopping/shopping-item'
import { LoadingCheckOverlay } from '@/components/ui/loading-check'
import { SkeletonShoppingGrid } from '@/components/ui/skeleton-card'
import type { ShoppingItem, Category } from '@/lib/types'
import { ShoppingCart, Plus } from 'lucide-react'

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
        .order('is_purchased', { ascending: true })
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
            .order('is_purchased', { ascending: true })
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

  const totalItems = shoppingList.length
  const purchasedItems = shoppingList.filter(item => item.is_purchased).length
  const progressPercentage = totalItems > 0 ? Math.round((purchasedItems / totalItems) * 100) : 0

  return (
    <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 py-2">
        <div className="flex-1">
          <h1 className="text-[26px] font-black tracking-tight text-foreground">Lista de compras</h1>
          <p className="text-[15px] font-extrabold text-[#8b93a7]">{purchasedItems} de {totalItems} comprados</p>
        </div>
      </div>

      {/* Progress Card */}
      {totalItems > 0 && (
        <div className="rounded-[24px] bg-card p-5 sm:p-6 shadow-[0_6px_16px_rgba(30,40,80,.07)] fade-up">
          <div className="flex justify-between items-end mb-3">
            <span className="text-[17px] font-extrabold text-foreground">Progreso</span>
            <span className="text-[15px] font-black text-primary">{progressPercentage}%</span>
          </div>
          <div className="h-[10px] w-full rounded-full bg-secondary overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-transform duration-1000 ease-out origin-left" 
              style={{ transform: `scaleX(${progressPercentage / 100})` }}
            />
          </div>
        </div>
      )}

      {isRefreshing ? (
        <SkeletonShoppingGrid count={shoppingList.length || 3} />
      ) : shoppingList.length > 0 ? (
        <div className="space-y-3">
          {shoppingList.map((item) => (
            <ShoppingItemCard key={item.id} item={item} marketCategoryId={marketCategoryId} onUpdate={handleRefresh} categories={categories} userId={userId} />
          ))}
          <ShoppingFormWrapper 
            userId={userId} 
            categories={categories} 
            onSuccess={handleRefresh} 
            trigger={
              <div className="flex h-[72px] w-full cursor-pointer items-center justify-center rounded-[20px] border-[2px] border-dashed border-[#d3dae8] bg-transparent text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-primary active:scale-[.99]">
                <Plus className="mr-3 h-5 w-5 text-primary" />
                <span className="text-[15px] font-extrabold">Añadir producto...</span>
              </div>
            }
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-[24px] bg-card py-14 shadow-card">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
            <ShoppingCart className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-extrabold">Tu lista de compras está vacía</p>
          <p className="mt-1 text-sm text-muted-foreground">Agrega items para comenzar a organizar tus compras</p>
          <div className="mt-6">
            <ShoppingFormWrapper userId={userId} categories={categories} onSuccess={handleRefresh} />
          </div>
        </div>
      )}
    </div>
  )
}
