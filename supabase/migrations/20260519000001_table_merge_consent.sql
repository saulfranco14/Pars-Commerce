-- Table merge with consent.
--
-- Two additions:
--   1. order_devices.is_owner — marks the "responsible" device of a table
--      (the first customer to join). Only the owner (or staff) may approve a
--      merge, so tables can't be combined without consent.
--   2. order_merge_requests — a pending request from table A to merge into
--      table B, approved by B's owner (or staff) and auto-expiring after a
--      short window so unanswered requests don't linger.

/* ---------- 1. Responsible device flag ---------- */

ALTER TABLE public.order_devices
  ADD COLUMN IF NOT EXISTS is_owner boolean NOT NULL DEFAULT false;

-- Backfill: the earliest device on each order becomes its owner.
WITH first_device AS (
  SELECT DISTINCT ON (order_id) id
  FROM public.order_devices
  ORDER BY order_id, joined_at ASC, created_at ASC
)
UPDATE public.order_devices d
SET is_owner = true
FROM first_device f
WHERE d.id = f.id
  AND NOT EXISTS (
    SELECT 1 FROM public.order_devices o
    WHERE o.order_id = d.order_id AND o.is_owner = true
  );

/* ---------- 2. Merge requests ---------- */

CREATE TABLE IF NOT EXISTS public.order_merge_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  -- The order that REQUESTED the merge (it survives and holds the combined bill).
  requester_order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  -- The order asked to join (its owner must approve).
  target_order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  requested_by_device_id uuid REFERENCES public.order_devices(id) ON DELETE SET NULL,
  requester_label text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'declined', 'expired', 'cancelled')),
  resolved_by text, -- 'owner' | 'staff' | 'system'
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_merge_requests_target_pending
  ON public.order_merge_requests (target_order_id, status);
CREATE INDEX IF NOT EXISTS idx_merge_requests_requester_pending
  ON public.order_merge_requests (requester_order_id, status);

ALTER TABLE public.order_merge_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Merge_requests: tenant members" ON public.order_merge_requests;
CREATE POLICY "Merge_requests: tenant members" ON public.order_merge_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_memberships m
      WHERE m.tenant_id = order_merge_requests.tenant_id
        AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Merge_requests: service role full access" ON public.order_merge_requests;
CREATE POLICY "Merge_requests: service role full access" ON public.order_merge_requests
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
