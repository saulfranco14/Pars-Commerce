-- =============================================================================
-- platform_admins — super admins de la PLATAFORMA (por encima de los tenants).
--
-- Concepto ortogonal a tenant_memberships/tenant_roles: un platform_admin NO
-- pertenece a un negocio, está por encima de todos. Puede ver datos cross-tenant
-- (ledger global, liquidaciones de todos los negocios). Es el rol más sensible
-- del sistema — salta el aislamiento multi-tenant — por eso es una tabla
-- dedicada, explícita y auditable (no un número mágico ni una env var).
--
-- Seguridad:
--  - RLS: solo un platform_admin puede LEER la tabla (no se expone quién es
--    admin a usuarios normales). Nadie la escribe vía API — se gestiona por
--    migración/consola con service_role.
--  - Se referencia por user_id (FK a auth.users). El seed inicial se hace por
--    EMAIL (abajo), de forma condicional: solo marca al usuario si su cuenta
--    ya existe. Así no hay credenciales en código; el super admin crea su
--    cuenta por registro normal y esta migración lo eleva.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.platform_admins (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  note       text,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.platform_admins IS
  'Super admins de plataforma (cross-tenant). El rol más privilegiado; gestionar solo por migración/service_role.';

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- Solo un platform_admin puede ver la lista de platform_admins.
DROP POLICY IF EXISTS "platform_admins: self read" ON public.platform_admins;
CREATE POLICY "platform_admins: self read" ON public.platform_admins
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid()
    )
  );

-- service_role acceso total (para el helper server-only y la gestión).
DROP POLICY IF EXISTS "platform_admins: service role" ON public.platform_admins;
CREATE POLICY "platform_admins: service role" ON public.platform_admins
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =============================================================================
-- Seed condicional del super admin inicial por email. Solo inserta si la
-- cuenta ya existe (idempotente vía ON CONFLICT). Si el usuario aún no se ha
-- registrado, esto es no-op y hay que re-ejecutar el marcado tras el registro
-- (o correr el bloque manualmente). NO crea la cuenta ni maneja contraseñas.
-- =============================================================================
INSERT INTO public.platform_admins (user_id, note)
SELECT u.id, 'seed: super admin inicial'
FROM auth.users u
WHERE lower(u.email) = 'saul.franco1420@gmail.com'
ON CONFLICT (user_id) DO NOTHING;
