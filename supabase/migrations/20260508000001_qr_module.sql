-- =============================================================================
-- QR module: QR codes, table devices, split bill, and activity log
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.tenant_payment_methods (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('bank_transfer', 'cash')),
  label text,
  bank_name text,
  account_holder text,
  clabe text,
  account_number text,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tenant_payment_methods_bank_required CHECK (
    (kind = 'cash')
    OR
    (kind = 'bank_transfer' AND bank_name IS NOT NULL AND account_holder IS NOT NULL AND clabe IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_tenant_payment_methods_tenant
  ON public.tenant_payment_methods (tenant_id, is_active, display_order);

ALTER TABLE public.tenant_payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant_payment_methods: tenant members" ON public.tenant_payment_methods;
CREATE POLICY "Tenant_payment_methods: tenant members" ON public.tenant_payment_methods
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.tenant_memberships m
      WHERE m.tenant_id = tenant_payment_methods.tenant_id
        AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.tenant_memberships m
      WHERE m.tenant_id = tenant_payment_methods.tenant_id
        AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Tenant_payment_methods: service role full access" ON public.tenant_payment_methods;
CREATE POLICY "Tenant_payment_methods: service role full access" ON public.tenant_payment_methods
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TABLE IF NOT EXISTS public.qr_codes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  kind text NOT NULL CHECK (kind IN ('payment', 'table')),
  label text NOT NULL,
  table_capacity integer,
  current_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  preset_amount decimal(12, 2),
  preset_concept text,
  allow_amount_override boolean NOT NULL DEFAULT true,
  print_template text,
  metadata jsonb,
  is_active boolean NOT NULL DEFAULT true,
  archived_at timestamptz,
  created_by uuid REFERENCES public.tenant_memberships(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT qr_codes_kind_fields CHECK (
    (kind = 'table' AND table_capacity IS NULL AND preset_amount IS NULL)
    OR (kind = 'table' AND table_capacity IS NOT NULL AND preset_amount IS NULL)
    OR (kind = 'payment' AND table_capacity IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_qr_codes_tenant_kind
  ON public.qr_codes (tenant_id, kind, is_active, archived_at);
CREATE INDEX IF NOT EXISTS idx_qr_codes_tenant_order
  ON public.qr_codes (tenant_id, current_order_id);

ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Qr_codes: tenant members" ON public.qr_codes;
CREATE POLICY "Qr_codes: tenant members" ON public.qr_codes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.tenant_memberships m
      WHERE m.tenant_id = qr_codes.tenant_id
        AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.tenant_memberships m
      WHERE m.tenant_id = qr_codes.tenant_id
        AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Qr_codes: service role full access" ON public.qr_codes;
CREATE POLICY "Qr_codes: service role full access" ON public.qr_codes
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_type text CHECK (order_type IN ('dine_in', 'takeaway', 'qr_payment')),
  ADD COLUMN IF NOT EXISTS qr_code_id uuid REFERENCES public.qr_codes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS table_label text,
  ADD COLUMN IF NOT EXISTS diner_count integer CHECK (diner_count >= 0);

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS added_by_device_id uuid,
  ADD COLUMN IF NOT EXISTS added_by_member_id uuid REFERENCES public.tenant_memberships(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS kitchen_status text NOT NULL DEFAULT 'pending' CHECK (
    kitchen_status IN ('pending', 'in_kitchen', 'ready', 'delivered', 'cancelled')
  ),
  ADD COLUMN IF NOT EXISTS is_shared boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.order_devices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  device_fingerprint text NOT NULL,
  display_name text,
  color_hex text,
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, device_fingerprint)
);

ALTER TABLE public.order_items
  DROP CONSTRAINT IF EXISTS order_items_added_by_device_fkey;
ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_added_by_device_fkey
  FOREIGN KEY (added_by_device_id) REFERENCES public.order_devices(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_order_devices_order
  ON public.order_devices (order_id, joined_at);
CREATE INDEX IF NOT EXISTS idx_order_devices_fingerprint
  ON public.order_devices (device_fingerprint);

ALTER TABLE public.order_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Order_devices: tenant members" ON public.order_devices;
CREATE POLICY "Order_devices: tenant members" ON public.order_devices
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.orders o
      JOIN public.tenant_memberships m ON m.tenant_id = o.tenant_id
      WHERE o.id = order_devices.order_id
        AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.orders o
      JOIN public.tenant_memberships m ON m.tenant_id = o.tenant_id
      WHERE o.id = order_devices.order_id
        AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Order_devices: service role full access" ON public.order_devices;
CREATE POLICY "Order_devices: service role full access" ON public.order_devices
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TABLE IF NOT EXISTS public.order_split_groups (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  device_id uuid REFERENCES public.order_devices(id) ON DELETE SET NULL,
  label text NOT NULL,
  subtotal decimal(12, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  total decimal(12, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  paid_total decimal(12, 2) NOT NULL DEFAULT 0 CHECK (paid_total >= 0),
  balance_due decimal(12, 2) NOT NULL DEFAULT 0 CHECK (balance_due >= 0),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_split_groups_order
  ON public.order_split_groups (order_id, payment_status, created_at);

ALTER TABLE public.order_split_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Order_split_groups: tenant members" ON public.order_split_groups;
CREATE POLICY "Order_split_groups: tenant members" ON public.order_split_groups
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.orders o
      JOIN public.tenant_memberships m ON m.tenant_id = o.tenant_id
      WHERE o.id = order_split_groups.order_id
        AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.orders o
      JOIN public.tenant_memberships m ON m.tenant_id = o.tenant_id
      WHERE o.id = order_split_groups.order_id
        AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Order_split_groups: service role full access" ON public.order_split_groups;
CREATE POLICY "Order_split_groups: service role full access" ON public.order_split_groups
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TABLE IF NOT EXISTS public.order_split_group_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  split_group_id uuid NOT NULL REFERENCES public.order_split_groups(id) ON DELETE CASCADE,
  order_item_id uuid NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (split_group_id, order_item_id)
);

CREATE INDEX IF NOT EXISTS idx_order_split_group_items_group
  ON public.order_split_group_items (split_group_id);

ALTER TABLE public.order_split_group_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Order_split_group_items: tenant members" ON public.order_split_group_items;
CREATE POLICY "Order_split_group_items: tenant members" ON public.order_split_group_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.order_split_groups g
      JOIN public.orders o ON o.id = g.order_id
      JOIN public.tenant_memberships m ON m.tenant_id = o.tenant_id
      WHERE g.id = order_split_group_items.split_group_id
        AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.order_split_groups g
      JOIN public.orders o ON o.id = g.order_id
      JOIN public.tenant_memberships m ON m.tenant_id = o.tenant_id
      WHERE g.id = order_split_group_items.split_group_id
        AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Order_split_group_items: service role full access" ON public.order_split_group_items;
CREATE POLICY "Order_split_group_items: service role full access" ON public.order_split_group_items
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS split_group_id uuid REFERENCES public.order_split_groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_payments_split_group
  ON public.payments (split_group_id);

CREATE TABLE IF NOT EXISTS public.order_activity_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  actor_type text NOT NULL CHECK (actor_type IN ('device', 'member', 'system', 'webhook')),
  actor_id text,
  actor_label text,
  action text NOT NULL,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_activity_log_order_created
  ON public.order_activity_log (order_id, created_at DESC);

ALTER TABLE public.order_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Order_activity_log: tenant members" ON public.order_activity_log;
CREATE POLICY "Order_activity_log: tenant members" ON public.order_activity_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.orders o
      JOIN public.tenant_memberships m ON m.tenant_id = o.tenant_id
      WHERE o.id = order_activity_log.order_id
        AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Order_activity_log: service role full access" ON public.order_activity_log;
CREATE POLICY "Order_activity_log: service role full access" ON public.order_activity_log
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS trigger AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.order_activity_log (order_id, actor_type, actor_id, actor_label, action, payload)
    VALUES (
      NEW.id,
      'system',
      NULL,
      'sistema',
      'status.changed',
      jsonb_build_object('from', OLD.status, 'to', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_orders_log_status_change ON public.orders;
CREATE TRIGGER trg_orders_log_status_change
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.log_order_status_change();
