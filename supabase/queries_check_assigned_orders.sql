-- 0. Ver en qué tenant(s) está el usuario 463f58e5-e0f6-4a12-8dad-57a6bd87fdd8
SELECT t.id AS tenant_id, t.name AS tenant_name
FROM public.tenant_memberships tm
JOIN public.tenants t ON t.id = tm.tenant_id
WHERE tm.user_id = '463f58e5-e0f6-4a12-8dad-57a6bd87fdd8';

-- 1. Resumen: órdenes paid SIN comisión - cuántas asignadas vs sin asignar
SELECT
  CASE WHEN o.assigned_to IS NOT NULL THEN 'asignadas' ELSE 'sin_asignar' END AS estado,
  COUNT(*) AS cantidad
FROM public.orders o
WHERE o.status = 'paid'
  AND NOT EXISTS (
    SELECT 1 FROM public.sales_commissions sc
    WHERE sc.order_id = o.id AND sc.voided_at IS NULL
  )
GROUP BY CASE WHEN o.assigned_to IS NOT NULL THEN 'asignadas' ELSE 'sin_asignar' END;

-- 2. Lista detallada: órdenes paid SIN comisión (para asignar o ejecutar backfill)
SELECT
  o.id AS order_id,
  o.tenant_id,
  o.total,
  o.created_at,
  o.assigned_to,
  CASE WHEN o.assigned_to IS NOT NULL THEN 'lista_para_backfill' ELSE 'requiere_asignar' END AS accion
FROM public.orders o
WHERE o.status = 'paid'
  AND NOT EXISTS (
    SELECT 1 FROM public.sales_commissions sc
    WHERE sc.order_id = o.id AND sc.voided_at IS NULL
  )
ORDER BY o.assigned_to NULLS FIRST, o.created_at DESC;

-- 3. Solo las SIN asignar (habrá que asignarlas manualmente o con UPDATE)
SELECT
  o.id AS order_id,
  o.tenant_id,
  o.total,
  o.created_at
FROM public.orders o
WHERE o.status = 'paid'
  AND o.assigned_to IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.sales_commissions sc
    WHERE sc.order_id = o.id AND sc.voided_at IS NULL
  )
ORDER BY o.created_at DESC;

-- 3b. Solo las SIN asignar del tenant del usuario 463f58e5...
SELECT
  o.id AS order_id,
  o.tenant_id,
  t.name AS tenant_name,
  o.total,
  o.created_at
FROM public.orders o
JOIN public.tenant_memberships tm ON tm.tenant_id = o.tenant_id
JOIN public.tenants t ON t.id = o.tenant_id
WHERE tm.user_id = '463f58e5-e0f6-4a12-8dad-57a6bd87fdd8'
  AND o.status = 'paid'
  AND o.assigned_to IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.sales_commissions sc
    WHERE sc.order_id = o.id AND sc.voided_at IS NULL
  )
ORDER BY o.created_at DESC;

-- 4. Asignar las sin asignar al usuario 463f58e5-e0f6-4a12-8dad-57a6bd87fdd8
-- Solo órdenes del tenant donde este usuario es miembro (por seguridad)
-- (Descomenta y ejecuta después de revisar la query 3)
/*
UPDATE public.orders o
SET assigned_to = '463f58e5-e0f6-4a12-8dad-57a6bd87fdd8',
    updated_at = now()
FROM public.tenant_memberships tm
WHERE o.tenant_id = tm.tenant_id
  AND tm.user_id = '463f58e5-e0f6-4a12-8dad-57a6bd87fdd8'
  AND o.status = 'paid'
  AND o.assigned_to IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.sales_commissions sc
    WHERE sc.order_id = o.id AND sc.voided_at IS NULL
  );
*/
