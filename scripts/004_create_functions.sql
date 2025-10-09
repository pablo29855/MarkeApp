-- Function to update debt status based on paid amount
CREATE OR REPLACE FUNCTION update_debt_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.paid_amount >= NEW.total_amount THEN
    NEW.status := 'pagada';
  ELSIF NEW.paid_amount > 0 THEN
    NEW.status := 'en curso';
  ELSE
    NEW.status := 'pendiente';
  END IF;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update debt status
CREATE TRIGGER trigger_update_debt_status
  BEFORE UPDATE OF paid_amount ON debts
  FOR EACH ROW
  EXECUTE FUNCTION update_debt_status();

-- Function to update expense updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for expenses
CREATE TRIGGER trigger_update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
