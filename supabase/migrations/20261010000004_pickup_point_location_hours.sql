-- A pickup point is a real operating location, not only a label.  Keep the
-- geocoder identity for later edits and allow each location to inherit the
-- business schedule or publish its own hours.
ALTER TABLE public.tenant_pickup_points
  ADD COLUMN IF NOT EXISTS mapbox_feature_id text,
  ADD COLUMN IF NOT EXISTS business_hours jsonb;

COMMENT ON COLUMN public.tenant_pickup_points.business_hours IS
  'NULL inherits tenants.settings.business_hours; otherwise stores a BusinessHours object for this location.';

CREATE INDEX IF NOT EXISTS tenant_pickup_points_active_tenant_idx
  ON public.tenant_pickup_points (tenant_id, is_active, is_primary);
