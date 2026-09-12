-- =============================================================================
-- payment_ledger — vista unificada de cobros confirmados (S1 del settlement).
--
-- Unifica las tres tablas de cobro del repo (payments, loan_payments,
-- subscription_payments) en un shape común, para poder responder de una sola
-- consulta: "todos los cobros del negocio X en periodo Y por método Z, con su
-- fee de MP y neto". Es la fundación sobre la que se construyen la comisión de
-- plataforma (S2) y las liquidaciones (S3).
--
-- DECISIONES DE DISEÑO (tomadas con el usuario):
--  - Solo COBROS CONFIRMADOS. Los intentos (order_payment_attempts) NO son
--    filas del ledger; los reintentos se exponen aparte como métrica derivada
--    (ver vista payment_retry_counts abajo).
--  - El MÉTODO de pago fino (efectivo/transferencia/tarjeta/mercadopago) se
--    deriva de orders.payment_method (fuente confiable). La tabla payments solo
--    tiene provider (mercadopago|manual), que no distingue efectivo de
--    transferencia.
--  - `is_platform_custodied` = true solo cuando el dinero pasó por MP (es lo
--    que la plataforma custodia y debe liquidar). Efectivo/transferencia ya
--    son del negocio.
--  - Es una VISTA, no una tabla: los datos ya existen dispersos; unificarlos
--    en vista evita duplicar/desincronizar. Si a escala hace falta, se
--    promueve a tabla materializada — optimización posterior.
--
-- Columnas comunes:
--  source_table, source_id, tenant_id, order_id, amount_gross, fee_amount,
--  net_amount, provider, payment_method, is_platform_custodied, external_id,
--  status, kind, created_at.
-- =============================================================================

CREATE OR REPLACE VIEW public.payment_ledger AS
  -- 1. payments (checkout / QR mesa). tenant_id y método vienen de orders.
  SELECT
    'payments'::text                              AS source_table,
    p.id                                          AS source_id,
    o.tenant_id                                   AS tenant_id,
    p.order_id                                    AS order_id,
    p.amount                                      AS amount_gross,
    0::numeric                                    AS fee_amount,       -- payments no guarda fee; neto = bruto
    p.amount                                      AS net_amount,
    p.provider                                    AS provider,
    COALESCE(o.payment_method, 'efectivo')        AS payment_method,
    (p.provider = 'mercadopago')                  AS is_platform_custodied,
    p.external_id                                 AS external_id,
    p.status                                       AS status,
    p.payment_kind                                AS kind,
    p.created_at                                  AS created_at
  FROM public.payments p
  JOIN public.orders o ON o.id = p.order_id
  WHERE p.status IN ('approved', 'paid')

  UNION ALL

  -- 2. loan_payments (pagos de préstamos). tenant_id y método son propios.
  --    No tiene columna status → un loan_payment existe solo si se cobró.
  SELECT
    'loan_payments'::text                         AS source_table,
    lp.id                                         AS source_id,
    lp.tenant_id                                  AS tenant_id,
    NULL::uuid                                    AS order_id,
    lp.amount                                     AS amount_gross,
    COALESCE(lp.mp_fee_amount, 0)                 AS fee_amount,
    COALESCE(lp.mp_net_amount, lp.amount)         AS net_amount,
    CASE WHEN lp.payment_method = 'mercadopago'
         THEN 'mercadopago' ELSE 'manual' END     AS provider,
    lp.payment_method                             AS payment_method,
    (lp.payment_method = 'mercadopago')           AS is_platform_custodied,
    lp.mp_payment_id                              AS external_id,
    'approved'::text                              AS status,
    'loan'::text                                  AS kind,
    lp.created_at                                 AS created_at
  FROM public.loan_payments lp

  UNION ALL

  -- 3. subscription_payments (cobros recurrentes / cuotas). Siempre MP.
  SELECT
    'subscription_payments'::text                 AS source_table,
    sp.id                                         AS source_id,
    sp.tenant_id                                  AS tenant_id,
    sp.order_id                                   AS order_id,
    sp.amount                                     AS amount_gross,
    COALESCE(sp.service_fee, 0)                   AS fee_amount,
    COALESCE(sp.net_amount, sp.amount)            AS net_amount,
    'mercadopago'::text                           AS provider,
    'mercadopago'::text                           AS payment_method,
    true                                          AS is_platform_custodied,
    sp.mp_payment_id                              AS external_id,
    sp.status                                     AS status,
    'subscription'::text                          AS kind,
    sp.created_at                                 AS created_at
  FROM public.subscription_payments sp
  WHERE sp.status = 'paid';

COMMENT ON VIEW public.payment_ledger IS
  'S1 settlement: cobros confirmados unificados de payments/loan_payments/subscription_payments. is_platform_custodied=true = dinero MP a liquidar.';

-- =============================================================================
-- payment_retry_counts — reintentos por orden, como métrica DERIVADA (no filas
-- del ledger). Cada intento de pago es una fila en order_payment_attempts; el
-- reintento es "más de un intento para la misma orden". attempts_total cuenta
-- todos; retries = attempts_total - 1 (el primero no es reintento).
-- =============================================================================
CREATE OR REPLACE VIEW public.payment_retry_counts AS
  SELECT
    order_id,
    tenant_id,
    COUNT(*)                                       AS attempts_total,
    GREATEST(COUNT(*) - 1, 0)                      AS retries,
    COUNT(*) FILTER (WHERE status = 'approved')    AS approved_attempts,
    COUNT(*) FILTER (WHERE status = 'failed')      AS failed_attempts,
    MAX(created_at)                                AS last_attempt_at
  FROM public.order_payment_attempts
  GROUP BY order_id, tenant_id;

COMMENT ON VIEW public.payment_retry_counts IS
  'S1 settlement: reintentos por orden derivados de order_payment_attempts. retries = intentos - 1.';
