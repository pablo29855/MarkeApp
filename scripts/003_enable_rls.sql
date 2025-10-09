-- Enable Row Level Security
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for expenses
CREATE POLICY "Users can view their own expenses"
  ON expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses"
  ON expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
  ON expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
  ON expenses FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for shopping_list
CREATE POLICY "Users can view their own shopping list"
  ON shopping_list FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shopping items"
  ON shopping_list FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shopping items"
  ON shopping_list FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shopping items"
  ON shopping_list FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for debts
CREATE POLICY "Users can view their own debts"
  ON debts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own debts"
  ON debts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own debts"
  ON debts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own debts"
  ON debts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for debt_payments
CREATE POLICY "Users can view payments for their debts"
  ON debt_payments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM debts
    WHERE debts.id = debt_payments.debt_id
    AND debts.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert payments for their debts"
  ON debt_payments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM debts
    WHERE debts.id = debt_payments.debt_id
    AND debts.user_id = auth.uid()
  ));

CREATE POLICY "Users can update payments for their debts"
  ON debt_payments FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM debts
    WHERE debts.id = debt_payments.debt_id
    AND debts.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete payments for their debts"
  ON debt_payments FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM debts
    WHERE debts.id = debt_payments.debt_id
    AND debts.user_id = auth.uid()
  ));

-- RLS Policies for budgets
CREATE POLICY "Users can view their own budgets"
  ON budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budgets"
  ON budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets"
  ON budgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets"
  ON budgets FOR DELETE
  USING (auth.uid() = user_id);

-- Categories are public (read-only for all authenticated users)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);
