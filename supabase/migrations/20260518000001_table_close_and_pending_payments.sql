-- =============================================================================
-- Table close reason + pending-validation payment support
-- =============================================================================

-- Reason recorded when an order is closed/cancelled manually from the admin.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cancel_reason text;

-- Optional: who closed it manually (membership id) for audit.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS closed_by_membership_id uuid REFERENCES public.tenant_memberships(id);

-- Note: payment_status in order_split_groups is plain text and already accepts
-- "pending" and "paid"; we also use "pending_validation" without DDL changes.
-- Same for orders.status: we add "pending_validation" as a logical state for
-- the order when all groups are pending validation.
