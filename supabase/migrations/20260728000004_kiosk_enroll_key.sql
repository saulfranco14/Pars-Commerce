-- Clave de la dirección del kiosco, en columna y no en `settings`.
--
-- Dos razones, ambas encontradas antes de que llegara a producción:
--
-- 1. El formulario de configuración escribe `settings` completo desde su copia
--    en memoria. Guardar cualquier pestaña habría borrado la clave y roto todas
--    las direcciones de kiosco del negocio.
-- 2. `/api/tenants` devuelve `settings` a cualquier miembro. La clave habría
--    viajado al navegador de un mesero, cuando administrar pantallas es
--    exclusivo del dueño.

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS kiosk_enroll_key text;

COMMENT ON COLUMN public.tenants.kiosk_enroll_key IS
  'Secreto de la URL del kiosco. Nunca se expone junto a settings; solo por el endpoint que exige devices.manage.';
