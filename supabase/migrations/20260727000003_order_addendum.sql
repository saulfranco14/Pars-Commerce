-- Orden ligada ("lo que faltó"): un pedido hijo colgado de uno ya pagado.
--
-- El caso: el cliente pagó, la orden se cerró, y después se descubre que se
-- entregó un producto que nadie registró. Abrir una orden nueva en el mismo QR
-- no sirve: `qr_codes.current_order_id` volvería a apuntar ahí y la mesa
-- quedaría ocupada — y esa mesa puede tener ya a otro cliente sentado.
--
-- La solución sale del modelo que ya existe: la ocupación de una mesa NO es un
-- campo del pedido, es `qr_codes.current_order_id`. Entonces basta con que el
-- hijo no lo toque. Se apoya en dos cosas que ya estaban:
--
--   * `releaseTableQrIfPaid` solo libera el QR si `current_order_id` sigue
--     apuntando a ESE pedido, así que pagar el hijo no puede echar al cliente
--     que esté usando la mesa ahora;
--   * `/api/qr/resolve` resuelve el pedido activo leyendo
--     `current_order_id`, nunca buscando órdenes por `qr_code_id`. El hijo es
--     invisible para el cliente por construcción.
--
-- Crear uno requiere el permiso `orders.addendum`, que solo tiene el dueño.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS parent_order_id uuid
    REFERENCES public.orders(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.orders.parent_order_id IS
  'Pedido ya pagado al que este complementa. El hijo NUNCA toca qr_codes.current_order_id: la mesa no se re-ocupa.';

-- Un pedido no puede colgar de sí mismo.
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_parent_not_self;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_parent_not_self CHECK (parent_order_id IS DISTINCT FROM id);

-- Para listar los hijos de un pedido al abrirlo. Parcial porque la enorme
-- mayoría de los pedidos no son hijos de nadie.
CREATE INDEX IF NOT EXISTS idx_orders_parent
  ON public.orders (parent_order_id)
  WHERE parent_order_id IS NOT NULL;

-- Solo un nivel: un hijo no puede tener hijos. Sin esto, una cadena de
-- complementos haría que "¿cuánto se cobró en total por esta mesa?" dependiera
-- de recorrer un árbol de profundidad desconocida.
--
-- Va como trigger y no como CHECK porque la regla mira OTRA fila (la del
-- padre), y un CHECK solo ve la suya.
CREATE OR REPLACE FUNCTION public.enforce_single_level_addendum()
RETURNS trigger AS $$
BEGIN
  IF NEW.parent_order_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.orders p
    WHERE p.id = NEW.parent_order_id
      AND p.parent_order_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Un pedido complementario no puede colgar de otro complementario'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_single_level_addendum ON public.orders;
CREATE TRIGGER trg_single_level_addendum
  BEFORE INSERT OR UPDATE OF parent_order_id ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.enforce_single_level_addendum();
