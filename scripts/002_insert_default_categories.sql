-- Insert default expense categories
INSERT INTO categories (name, icon, color) VALUES
  ('Mercado', '🛒', '#10b981'),
  ('Arriendo', '🏠', '#3b82f6'),
  ('Transporte', '🚗', '#f59e0b'),
  ('Ocio', '🎮', '#8b5cf6'),
  ('Servicios', '💡', '#06b6d4'),
  ('Salud', '⚕️', '#ef4444'),
  ('Educación', '📚', '#6366f1'),
  ('Restaurantes', '🍽️', '#ec4899'),
  ('Ropa', '👕', '#14b8a6'),
  ('Otros', '📦', '#64748b')
ON CONFLICT (name) DO NOTHING;
