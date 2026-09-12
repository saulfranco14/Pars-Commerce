-- De qué pantalla salió un pedido de autoservicio.
--
-- No sirve `created_by`: apunta a `profiles` y en una pantalla no hay nadie con
-- sesión. Sin esta columna, un pedido hecho en el kiosco es indistinguible de
-- uno del mostrador, y quien atiende necesita saberlo (nadie lo tomó, nadie lo
-- va a asignar).

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS device_id uuid
    REFERENCES public.tenant_devices(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.orders.device_id IS
  'Pantalla de autoservicio que levantó el pedido. NULL si lo tomó una persona.';

CREATE INDEX IF NOT EXISTS idx_orders_device
  ON public.orders (device_id, created_at DESC)
  WHERE device_id IS NOT NULL;
