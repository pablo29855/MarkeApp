import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ExpenseFormWrapperUnified } from '@/components/expenses/expense-form-wrapper-unified'
import { IncomeFormWrapper } from '@/components/incomes/income-form-wrapper'
import { ShoppingFormWrapper } from '@/components/shopping/shopping-form-wrapper'
import { DebtFormWrapperUnified } from '@/components/debts/debt-form-wrapper-unified'
import { useLocation } from 'react-router-dom'
import { notifyDataChanged } from '@/hooks/use-realtime-refresh'
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
  const location = useLocation()

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

  if (location.pathname === '/incomes') {
    return (
      <IncomeFormWrapper
        open={open}
        onOpenChange={onOpenChange}
        onSuccess={() => { notifyDataChanged('incomes'); onOpenChange(false) }}
        trigger={<span className="hidden" aria-hidden />}
      />
    )
  }

  if (location.pathname === '/shopping') {
    return (
      <ShoppingFormWrapper
        categories={categories}
        userId={userId}
        open={open}
        onOpenChange={onOpenChange}
        onSuccess={() => { notifyDataChanged('shopping_list'); onOpenChange(false) }}
        trigger={<span className="hidden" aria-hidden />}
      />
    )
  }

  if (location.pathname === '/debts') {
    return (
      <DebtFormWrapperUnified
        userId={userId}
        open={open}
        onOpenChange={onOpenChange}
        onSuccess={() => { notifyDataChanged('debts'); onOpenChange(false) }}
        trigger={<span className="hidden" aria-hidden />}
      />
    )
  }

  return (
    <ExpenseFormWrapperUnified
      categories={categories}
      userId={userId}
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={() => { notifyDataChanged('expenses'); onOpenChange(false) }}
      trigger={<span className="hidden" aria-hidden />}
    />
  )
}
