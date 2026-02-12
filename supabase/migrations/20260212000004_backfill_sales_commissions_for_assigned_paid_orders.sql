-- Backfill: crea sales_commissions para órdenes paid que ya tienen assigned_to
-- pero nunca generaron comisión (ej: se pagaron sin asignar y luego se asignaron)

INSERT INTO public.sales_commissions (
  tenant_id,
  order_id,
  user_id,
  total_items_sold,
  products_count,
  services_count,
  total_revenue,
  total_cost,
  gross_profit,
  commission_amount,
  commission_config
)
SELECT
  o.tenant_id,
  o.id AS order_id,
  o.assigned_to AS user_id,
  COALESCE(stats.total_items, 0)::integer,
  COALESCE(stats.products_count, 0)::integer,
  COALESCE(stats.services_count, 0)::integer,
  COALESCE(o.total, 0),
  COALESCE(stats.total_cost, 0),
  COALESCE(o.total, 0) - COALESCE(stats.total_cost, 0),
  COALESCE(stats.commission_amount, 0),
  jsonb_build_object(
    'products', jsonb_build_object('qty', COALESCE(stats.products_count, 0), 'amount', 0),
    'services', jsonb_build_object('qty', COALESCE(stats.services_count, 0), 'amount', 0)
  )
FROM public.orders o
LEFT JOIN LATERAL (
  SELECT
    COALESCE(SUM(oi.quantity), 0) AS total_items,
    COUNT(CASE WHEN p.type = 'product' THEN 1 END)::integer AS products_count,
    COUNT(CASE WHEN p.type = 'service' THEN 1 END)::integer AS services_count,
    COALESCE(SUM(p.cost_price * oi.quantity), 0) AS total_cost,
    COALESCE(SUM(COALESCE(p.commission_amount, 0) * oi.quantity), 0) AS commission_amount
  FROM public.order_items oi
  JOIN public.products p ON p.id = oi.product_id
  WHERE oi.order_id = o.id
) stats ON true
WHERE o.status = 'paid'
  AND o.assigned_to IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.sales_commissions sc
    WHERE sc.order_id = o.id AND sc.voided_at IS NULL
  )
ON CONFLICT (order_id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  total_items_sold = EXCLUDED.total_items_sold,
  products_count = EXCLUDED.products_count,
  services_count = EXCLUDED.services_count,
  total_revenue = EXCLUDED.total_revenue,
  total_cost = EXCLUDED.total_cost,
  gross_profit = EXCLUDED.gross_profit,
  commission_amount = EXCLUDED.commission_amount,
  commission_config = EXCLUDED.commission_config,
  updated_at = now();
