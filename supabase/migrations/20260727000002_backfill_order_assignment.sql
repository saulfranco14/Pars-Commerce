-- Relleno de `assigned_to` en pedidos que nacieron sin dueño.
--
-- Por qué hace falta: hasta la migración anterior cualquier miembro veía todos
-- los pedidos del negocio, así que que un pedido no estuviera asignado no se
-- notaba. Ahora un rol sin `orders.view_all` solo ve los suyos, y los pedidos
-- que levantó esa persona antes del cambio quedarían fuera de su propia lista.
--
-- Regla: si nadie lo tiene asignado pero sí quedó registrado quién lo levantó,
-- el dueño es quien lo levantó. Es la misma regla que aplica de aquí en
-- adelante `POST /api/orders`, así que el histórico y lo nuevo coinciden.
--
-- Lo que NO se toca, a propósito:
--   * pedidos con `assigned_to` ya puesto — no se reasigna a nadie;
--   * pedidos con `created_by IS NULL`, que son los de autoservicio
--     (`qr_table`, `qr_payment`, `public_store`): el cliente escaneó y nadie
--     lo atendió. Sin dueño es su estado correcto, no un dato faltante.
--
-- El `EXISTS` es la parte que importa: si quien levantó el pedido ya no
-- pertenece al negocio, asignárselo escondería el pedido de todo el mundo
-- salvo de quien tenga `orders.view_all`.

UPDATE public.orders o
SET assigned_to = o.created_by
WHERE o.assigned_to IS NULL
  AND o.created_by IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.tenant_memberships m
    WHERE m.user_id = o.created_by
      AND m.tenant_id = o.tenant_id
  );
