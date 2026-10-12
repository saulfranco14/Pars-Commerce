-- A business may intentionally offer only transfer, only cash on pickup, or
-- online payments. Keep this decision next to fulfillment configuration.
ALTER TABLE public.tenant_fulfillment_settings
  ADD COLUMN IF NOT EXISTS online_payment_enabled boolean NOT NULL DEFAULT true;

