-- =============================================================================
-- Grants explícitos a los roles de Supabase sobre el esquema public.
--
-- POR QUÉ: RLS y los privilegios de tabla (GRANT) son capas independientes en
-- Postgres. Varias tablas del dominio (order_split_groups, etc.) definen
-- POLICIES RLS para service_role/authenticated/anon PERO nunca hicieron el
-- GRANT correspondiente. En el Supabase remoto funciona porque el proyecto
-- gestionado aplica estos grants por defecto (ALTER DEFAULT PRIVILEGES al
-- provisionar). En una DB creada desde cero con `supabase start` esos default
-- privileges no se heredaron para estas tablas → `permission denied` (42501)
-- al acceder vía la API REST (PostgREST corre como estos roles).
--
-- Esta migración replica el comportamiento por defecto de Supabase de forma
-- EXPLÍCITA e IDEMPOTENTE, así que:
--   - En local: habilita el acceso que las policies RLS ya esperaban.
--   - En prod: es no-op efectivo (los grants ya existen); no cambia nada.
--
-- El acceso REAL a los datos sigue estando gobernado por las POLICIES RLS ya
-- existentes — este GRANT solo abre la puerta a nivel de privilegio de tabla;
-- RLS decide qué filas ve cada quién. `anon`/`authenticated` quedan sujetos a
-- sus policies; `service_role` las salta como está diseñado.
-- =============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public
  TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public
  TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public
  TO anon, authenticated, service_role;

-- Que las tablas/sequences/functions FUTURAS también hereden el grant, igual
-- que hace Supabase por defecto.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
