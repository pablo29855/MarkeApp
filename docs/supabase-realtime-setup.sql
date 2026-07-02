-- ============================================================
-- Configuración de Realtime para MarkeApp
-- Ejecutar en: Supabase Dashboard → SQL Editor → Run
-- Idempotente: se puede ejecutar varias veces sin error.
-- ============================================================

-- 1. Añadir las tablas a la publication de Realtime (solo las que falten).
--    Sin esto, Supabase no emite ningún evento postgres_changes.
do $$
declare t text;
begin
  foreach t in array array['expenses','incomes','debts','debt_payments','shopping_list'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- 2. REPLICA IDENTITY FULL: los eventos DELETE deben incluir todas las
--    columnas del registro borrado. Con el default (solo PK), el filtro
--    user_id=eq.<id> nunca coincide en DELETE y el borrado no notifica.
alter table public.expenses      replica identity full;
alter table public.incomes       replica identity full;
alter table public.debts         replica identity full;
alter table public.debt_payments replica identity full;
alter table public.shopping_list replica identity full;

-- 3. Verificación: ambas consultas deben listar las 5 tablas
--    y relreplident = 'f' (full).
select schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime';

select c.relname, c.relreplident
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('expenses','incomes','debts','debt_payments','shopping_list');
