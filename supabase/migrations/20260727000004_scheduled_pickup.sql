-- Pedidos agendados para recoger.
--
-- El cliente pide desde el sitio y pasa por su pedido a una hora que él elige
-- ("en 2 horas", "mañana a las 10"). NO es entrega a domicilio: no hay
-- dirección ni repartidor, solo una hora de recolección.
--
-- Y el negocio necesita poder decir "hoy ya no". Cerrar la recepción NO apaga
-- la tienda: el catálogo se sigue viendo (que es lo que hace que la gente
-- vuelva mañana), solo deja de aceptarse el cobro.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS scheduled_for timestamptz;

COMMENT ON COLUMN public.orders.scheduled_for IS
  'Cuándo pasa el cliente por su pedido. NULL = sin agendar (lo recoge cuando esté). No implica entrega a domicilio.';

-- La agenda se lista por hora de recolección y solo mira lo agendado; el
-- índice parcial deja fuera la enorme mayoría de pedidos, que no lo están.
CREATE INDEX IF NOT EXISTS idx_orders_scheduled
  ON public.orders (tenant_id, scheduled_for)
  WHERE scheduled_for IS NOT NULL;

-- Interruptor de recepción. Columna y no una clave en `settings` porque se
-- consulta en cada carga del sitio y es una puerta dura, no una preferencia.
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS accepting_orders boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.tenants.accepting_orders IS
  'false = el sitio muestra el catálogo pero no deja completar pedidos. Lo controla el permiso orders.schedule_config.';
