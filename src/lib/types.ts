export interface Category {
  id: string
  name: string
  color: string
  icon: string
  created_at: string
}

export interface Expense {
  id: string
  user_id: string
  name: string
  amount: number
  category_id: string
  purchase_date: string
  location: string | null
  notes: string | null
  created_at: string
  category?: Category
}

export interface ExpensesByCategory {
  category: string
  total: number
  color?: string
  icon?: string
}

export interface ShoppingItem {
  id: string
  user_id: string
  product_name: string
  quantity: number
  category: string | null
  is_purchased: boolean
  unit_price: number | null
  total_price: number | null
  purchased_at: string | null
  created_at: string
}

export interface Debt {
  id: string
  user_id: string
  name: string
  creditor: string
  total_amount: number
  paid_amount: number
  debt_date: string
  due_date?: string | null
  description?: string | null
  created_at: string
}

export interface DebtPayment {
  id: string
  debt_id: string
  amount: number
  payment_date: string
  notes: string | null
  created_at: string
}
