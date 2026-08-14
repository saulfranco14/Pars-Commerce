-- The demo portfolio now contains eleven real business examples. Escala keeps
-- one additional slot for the platform owner instead of bypassing plan limits.
UPDATE public.billing_plans
SET entitlements = jsonb_set(entitlements, '{portfolio_dashboard_limit}', '12'::jsonb),
    updated_at = now()
WHERE code = 'scale';
