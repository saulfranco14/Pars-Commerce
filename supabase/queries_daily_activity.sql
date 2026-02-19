-- Consultas de actividad día a día (hoy y últimos 7 días)
-- Ejecutar como superusuario o con permisos de lectura en las tablas

-- =============================================================================
-- 1. RESUMEN GENERAL (últimos 7 días + hoy, por día)
-- =============================================================================

WITH date_range AS (
  SELECT generate_series(
    (current_date - interval '7 days')::date,
    current_date,
    '1 day'::interval
  )::date AS day
)
SELECT
  dr.day AS fecha,
  COALESCE(u.cantidad, 0) AS usuarios_registrados,
  COALESCE(p.cantidad, 0) AS productos_creados,
  COALESCE(o.cantidad, 0) AS ordenes_creadas,
  COALESCE(o_pagadas.cantidad, 0) AS ventas,
  COALESCE(o_pagadas.ingreso_bruto, 0) AS ingreso_bruto,
  COALESCE(o_pagadas.costo, 0) AS costo,
  COALESCE(o_pagadas.ingreso_bruto, 0) - COALESCE(o_pagadas.costo, 0) AS ganancia_bruta
FROM date_range dr
LEFT JOIN (
  SELECT date(created_at) AS dia, COUNT(*) AS cantidad
  FROM public.profiles
  WHERE created_at >= current_date - interval '7 days'
  GROUP BY date(created_at)
) u ON u.dia = dr.day
LEFT JOIN (
  SELECT date(created_at) AS dia, COUNT(*) AS cantidad
  FROM public.products
  WHERE created_at >= current_date - interval '7 days'
  GROUP BY date(created_at)
) p ON p.dia = dr.day
LEFT JOIN (
  SELECT date(created_at) AS dia, COUNT(*) AS cantidad
  FROM public.orders
  WHERE created_at >= current_date - interval '7 days'
  GROUP BY date(created_at)
) o ON o.dia = dr.day
LEFT JOIN (
  SELECT
    date(o.paid_at) AS dia,
    COUNT(o.id) AS cantidad,
    COALESCE(SUM(o.total), 0) AS ingreso_bruto,
    COALESCE(SUM(
      (SELECT SUM(p.cost_price * oi.quantity)
       FROM public.order_items oi
       JOIN public.products p ON p.id = oi.product_id
       WHERE oi.order_id = o.id)
    ), 0) AS costo
  FROM public.orders o
  WHERE o.status = 'paid' AND o.paid_at >= current_date - interval '7 days'
  GROUP BY date(o.paid_at)
) o_pagadas ON o_pagadas.dia = dr.day
ORDER BY dr.day DESC;


-- =============================================================================
-- 2. DETALLE POR TENANT/CLIENTE (últimos 7 días + hoy)
-- =============================================================================

-- 2a. Usuarios (miembros nuevos por tenant)
SELECT
  t.name AS tenant,
  t.slug,
  date(tm.created_at) AS fecha,
  COUNT(*) AS miembros_nuevos,
  array_agg(p.display_name ORDER BY tm.created_at) AS nombres
FROM public.tenant_memberships tm
JOIN public.tenants t ON t.id = tm.tenant_id
JOIN public.profiles p ON p.id = tm.user_id
WHERE tm.created_at >= current_date - interval '7 days'
GROUP BY t.id, t.name, t.slug, date(tm.created_at)
ORDER BY fecha DESC, t.name;


-- 2b. Productos por tenant y día
SELECT
  t.name AS tenant,
  t.slug,
  date(p.created_at) AS fecha,
  COUNT(*) AS productos_creados,
  array_agg(p.name ORDER BY p.created_at) AS nombres_productos
FROM public.products p
JOIN public.tenants t ON t.id = p.tenant_id
WHERE p.created_at >= current_date - interval '7 days'
GROUP BY t.id, t.name, t.slug, date(p.created_at)
ORDER BY fecha DESC, t.name;


-- 2c. Órdenes por tenant y día (ventas = cantidad pagadas, ingreso_bruto, ganancia_bruta)
SELECT
  t.name AS tenant,
  t.slug,
  date(o.created_at) AS fecha,
  COUNT(*) AS ordenes_creadas,
  COUNT(*) FILTER (WHERE o.status = 'paid') AS ventas,
  COALESCE(SUM(o.total) FILTER (WHERE o.status = 'paid'), 0) AS ingreso_bruto,
  COALESCE(SUM(
    (SELECT SUM(p.cost_price * oi.quantity)
     FROM public.order_items oi
     JOIN public.products p ON p.id = oi.product_id
     WHERE oi.order_id = o.id)
  ) FILTER (WHERE o.status = 'paid'), 0) AS costo,
  COALESCE(SUM(o.total) FILTER (WHERE o.status = 'paid'), 0)
  - COALESCE(SUM(
    (SELECT SUM(p.cost_price * oi.quantity)
     FROM public.order_items oi
     JOIN public.products p ON p.id = oi.product_id
     WHERE oi.order_id = o.id)
  ) FILTER (WHERE o.status = 'paid'), 0) AS ganancia_bruta
FROM public.orders o
JOIN public.tenants t ON t.id = o.tenant_id
WHERE o.created_at >= current_date - interval '7 days'
GROUP BY t.id, t.name, t.slug, date(o.created_at)
ORDER BY fecha DESC, t.name;


-- =============================================================================
-- 3. SOLO HOY (resumen)
-- =============================================================================

SELECT
  'usuarios' AS metrica,
  COUNT(*) AS hoy
FROM public.profiles
WHERE date(created_at) = current_date
UNION ALL
SELECT
  'productos',
  COUNT(*)
FROM public.products
WHERE date(created_at) = current_date
UNION ALL
SELECT
  'ordenes',
  COUNT(*)
FROM public.orders
WHERE date(created_at) = current_date
UNION ALL
SELECT
  'ventas',
  COUNT(*)
FROM public.orders
WHERE status = 'paid' AND date(paid_at) = current_date
UNION ALL
SELECT
  'ingreso_bruto',
  COALESCE(SUM(total), 0)::bigint
FROM public.orders
WHERE status = 'paid' AND date(paid_at) = current_date
UNION ALL
SELECT
  'ganancia_bruta',
  (COALESCE(SUM(o.total), 0) - COALESCE((
    SELECT SUM(p.cost_price * oi.quantity)
    FROM public.orders o2
    JOIN public.order_items oi ON oi.order_id = o2.id
    JOIN public.products p ON p.id = oi.product_id
    WHERE o2.status = 'paid' AND date(o2.paid_at) = current_date
  ), 0))::bigint
FROM public.orders o
WHERE o.status = 'paid' AND date(o.paid_at) = current_date;


-- =============================================================================
-- 4. SOLO HOY POR TENANT
-- ventas = cantidad | ingreso_bruto = revenue | ganancia_bruta = revenue - costo
-- =============================================================================

SELECT
  t.name AS tenant,
  (SELECT COUNT(*) FROM public.tenant_memberships WHERE tenant_id = t.id AND date(created_at) = current_date) AS miembros_hoy,
  (SELECT COUNT(*) FROM public.products WHERE tenant_id = t.id AND date(created_at) = current_date) AS productos_hoy,
  (SELECT COUNT(*) FROM public.orders WHERE tenant_id = t.id AND date(created_at) = current_date) AS ordenes_hoy,
  COALESCE(v.ventas_hoy, 0) AS ventas_hoy,
  COALESCE(v.ingreso_bruto_hoy, 0) AS ingreso_bruto_hoy,
  COALESCE(v.costo_hoy, 0) AS costo_hoy,
  COALESCE(v.ingreso_bruto_hoy, 0) - COALESCE(v.costo_hoy, 0) AS ganancia_bruta_hoy
FROM public.tenants t
LEFT JOIN LATERAL (
  SELECT
    COUNT(o.id)::bigint AS ventas_hoy,
    COALESCE(SUM(o.total), 0) AS ingreso_bruto_hoy,
    (SELECT COALESCE(SUM(p.cost_price * oi.quantity), 0)
     FROM public.orders o2
     JOIN public.order_items oi ON oi.order_id = o2.id
     JOIN public.products p ON p.id = oi.product_id
     WHERE o2.tenant_id = t.id AND o2.status = 'paid' AND date(o2.paid_at) = current_date) AS costo_hoy
  FROM public.orders o
  WHERE o.tenant_id = t.id AND o.status = 'paid' AND date(o.paid_at) = current_date
) v ON true
ORDER BY t.name;


-- =============================================================================
-- 5. RESUMEN ÚLTIMOS 7 DÍAS POR TENANT (totales)
-- ventas = cantidad de transacciones | ingreso_bruto = revenue | ganancia_bruta = revenue - costo
-- =============================================================================

SELECT
  t.name AS tenant,
  (SELECT COUNT(*) FROM public.tenant_memberships WHERE tenant_id = t.id AND created_at >= current_date - interval '7 days') AS miembros_7d,
  (SELECT COUNT(*) FROM public.products WHERE tenant_id = t.id AND created_at >= current_date - interval '7 days') AS productos_7d,
  (SELECT COUNT(*) FROM public.orders WHERE tenant_id = t.id AND created_at >= current_date - interval '7 days') AS ordenes_7d,
  COALESCE(v.ventas_7d, 0) AS ventas_7d,
  COALESCE(v.ingreso_bruto_7d, 0) AS ingreso_bruto_7d,
  COALESCE(v.costo_7d, 0) AS costo_7d,
  COALESCE(v.ingreso_bruto_7d, 0) - COALESCE(v.costo_7d, 0) AS ganancia_bruta_7d
FROM public.tenants t
LEFT JOIN LATERAL (
  SELECT
    COUNT(o.id)::bigint AS ventas_7d,
    COALESCE(SUM(o.total), 0) AS ingreso_bruto_7d,
    (SELECT COALESCE(SUM(p.cost_price * oi.quantity), 0)
     FROM public.orders o2
     JOIN public.order_items oi ON oi.order_id = o2.id
     JOIN public.products p ON p.id = oi.product_id
     WHERE o2.tenant_id = t.id AND o2.status = 'paid' AND o2.paid_at >= current_date - interval '7 days') AS costo_7d
  FROM public.orders o
  WHERE o.tenant_id = t.id AND o.status = 'paid' AND o.paid_at >= current_date - interval '7 days'
) v ON true
ORDER BY t.name;
