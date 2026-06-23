import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ExpenseFormWrapperUnified } from '@/components/expenses/expense-form-wrapper-unified'
import type { Category } from '@/lib/types'

interface GlobalAddExpenseProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Flujo global de "Agregar gasto" disparado por el FAB del BottomNav.
 * Carga userId + categorías una vez y reutiliza el formulario de gasto.
 */
export function GlobalAddExpense({ open, onOpenChange }: GlobalAddExpenseProps) {
  const [userId, setUserId] = useState('')
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    let mounted = true
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !mounted) return
      setUserId(user.id)
      const { data } = await supabase.from('categories').select('*').order('name')
      if (mounted) setCategories((data || []) as Category[])
    }
    load()
    return () => { mounted = false }
  }, [])

  // No renderizar el Dialog hasta tener datos para evitar formularios vacíos
  if (!userId) return null

  return (
    <ExpenseFormWrapperUnified
      categories={categories}
      userId={userId}
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={() => onOpenChange(false)}
      trigger={<span className="hidden" aria-hidden />}
    />
  )
}
