-- =============================================================================
-- OFFER PLANS (Fase 2a): subscriptions sold from the storefront, billed per
-- period manually (transfer / cash / caja). Additive only:
--   * new tables: offer_plans, offer_plan_items, public_cart_plans,
--     subscription_periods, order_plan_charges
--   * subscriptions: nullable/defaulted columns + 'past_due' status
--   * order_items: line_kind (DEFAULT 'item') + subscription_id
-- Legacy subscriptions keep offer_plan_id NULL and their current flow.
-- No cron: ensure_due_periods() runs on demand and is idempotent.
-- =============================================================================

-- ── 1. Plan definitions ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.offer_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('subscription', 'membership')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  template_key text,
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 3 AND 80),
  slug text NOT NULL,
  description text,
  image_url text,
  price numeric(12,2) NOT NULL CHECK (price > 0),
  interval_unit text NOT NULL CHECK (interval_unit IN ('week', 'month')),
  interval_count integer NOT NULL DEFAULT 1 CHECK (interval_count BETWEEN 1 AND 12),
  max_periods integer CHECK (max_periods IS NULL OR max_periods >= 1),
  billing_methods text[] NOT NULL DEFAULT ARRAY['manual']::text[]
    CHECK (cardinality(billing_methods) >= 1 AND billing_methods <@ ARRAY['manual', 'mp_auto']::text[]),
  fulfillment_methods text[] NOT NULL DEFAULT ARRAY['pickup']::text[]
    CHECK (cardinality(fulfillment_methods) >= 1 AND fulfillment_methods <@ ARRAY['pickup', 'delivery', 'in_store']::text[]),
  preferred_weekday smallint CHECK (preferred_weekday IS NULL OR preferred_weekday BETWEEN 0 AND 6),
  renewal_lead_days integer NOT NULL DEFAULT 3 CHECK (renewal_lead_days BETWEEN 0 AND 14),
  grace_days integer NOT NULL DEFAULT 5 CHECK (grace_days BETWEEN 0 AND 30),
  max_active_members integer CHECK (max_active_members IS NULL OR max_active_members >= 1),
  sort_order integer NOT NULL DEFAULT 0,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

CREATE INDEX IF NOT EXISTS offer_plans_tenant_status_idx ON public.offer_plans (tenant_id, status);

CREATE TABLE IF NOT EXISTS public.offer_plan_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.offer_plans(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 999),
  position integer NOT NULL DEFAULT 0,
  UNIQUE NULLS NOT DISTINCT (plan_id, product_id, product_variant_id)
);

CREATE INDEX IF NOT EXISTS offer_plan_items_plan_idx ON public.offer_plan_items (plan_id);

ALTER TABLE public.offer_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_plan_items ENABLE ROW LEVEL SECURITY;

-- Writes go through save_offer_plan (service role) after a permission check.
CREATE POLICY "offer_plans: members select" ON public.offer_plans FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.tenant_memberships m WHERE m.tenant_id = offer_plans.tenant_id AND m.user_id = auth.uid())
);
CREATE POLICY "offer_plan_items: members select" ON public.offer_plan_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.tenant_memberships m WHERE m.tenant_id = offer_plan_items.tenant_id AND m.user_id = auth.uid())
);

-- ── 2. Plans in the cart (public_cart_items is not touched) ─────────────────
CREATE TABLE IF NOT EXISTS public.public_cart_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL REFERENCES public.public_carts(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  offer_plan_id uuid NOT NULL REFERENCES public.offer_plans(id) ON DELETE CASCADE,
  billing_method text NOT NULL DEFAULT 'manual' CHECK (billing_method IN ('manual', 'mp_auto')),
  price_snapshot numeric(12,2) NOT NULL CHECK (price_snapshot > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cart_id, offer_plan_id)
);

ALTER TABLE public.public_cart_plans ENABLE ROW LEVEL SECURITY;

-- ── 3. Subscriptions: plan instances reuse the existing table ───────────────
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS offer_plan_id uuid REFERENCES public.offer_plans(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS plan_kind text CHECK (plan_kind IS NULL OR plan_kind IN ('subscription', 'membership')),
  ADD COLUMN IF NOT EXISTS billing_method text CHECK (billing_method IS NULL OR billing_method IN ('manual', 'mp_auto', 'platform_legacy')),
  ADD COLUMN IF NOT EXISTS current_period_number integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_period_start timestamptz,
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS plan_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS fulfillment_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS public_token text,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS past_due_since timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_public_token_idx ON public.subscriptions (public_token) WHERE public_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS subscriptions_offer_plan_idx ON public.subscriptions (offer_plan_id) WHERE offer_plan_id IS NOT NULL;

ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_check CHECK (
  status IN ('pending_setup', 'active', 'paused', 'card_failed', 'completed', 'cancelled', 'past_due')
);

-- ── 4. One row per billed period: the idempotency anchor ────────────────────
CREATE TABLE IF NOT EXISTS public.subscription_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  period_number integer NOT NULL CHECK (period_number >= 1),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'waived', 'cancelled')),
  due_at timestamptz NOT NULL,
  paid_at timestamptz,
  payment_source text,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  mp_payment_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subscription_id, period_number),
  CHECK (ends_at > starts_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS subscription_periods_order_idx ON public.subscription_periods (order_id) WHERE order_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS subscription_periods_mp_payment_idx ON public.subscription_periods (mp_payment_id) WHERE mp_payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS subscription_periods_tenant_status_idx ON public.subscription_periods (tenant_id, status);

ALTER TABLE public.subscription_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscription_periods: members select" ON public.subscription_periods FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.tenant_memberships m WHERE m.tenant_id = subscription_periods.tenant_id AND m.user_id = auth.uid())
);

-- ── 5. The plan charge of an order, without product-less order_items ────────
CREATE TABLE IF NOT EXISTS public.order_plan_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  offer_plan_id uuid REFERENCES public.offer_plans(id) ON DELETE SET NULL,
  period_number integer NOT NULL CHECK (period_number >= 1),
  name_snapshot text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_plan_charges_order_idx ON public.order_plan_charges (order_id);

ALTER TABLE public.order_plan_charges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_plan_charges: members select" ON public.order_plan_charges FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.tenant_memberships m WHERE m.tenant_id = order_plan_charges.tenant_id AND m.user_id = auth.uid())
);

-- ── 6. order_items: what a plan delivers goes as $0 lines with a real product
-- so the existing inventory trigger decrements stock unchanged.
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS line_kind text NOT NULL DEFAULT 'item',
  ADD COLUMN IF NOT EXISTS subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL;

ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_line_kind_check;
ALTER TABLE public.order_items ADD CONSTRAINT order_items_line_kind_check
  CHECK (line_kind IN ('item', 'plan_component', 'membership_redemption'));

-- ── 7. Period math, anchored to the first paid day (no month-end drift) ─────
CREATE OR REPLACE FUNCTION public.plan_period_bounds(
  p_anchor timestamptz, p_unit text, p_count integer, p_period integer,
  OUT starts_at timestamptz, OUT ends_at timestamptz
)
LANGUAGE plpgsql
STABLE
SET search_path = public
SET "TimeZone" = 'America/Mexico_City'
AS $$
BEGIN
  IF p_unit = 'week' THEN
    starts_at := p_anchor + make_interval(weeks => (p_period - 1) * p_count);
    ends_at := p_anchor + make_interval(weeks => p_period * p_count);
  ELSE
    starts_at := p_anchor + make_interval(months => (p_period - 1) * p_count);
    ends_at := p_anchor + make_interval(months => p_period * p_count);
  END IF;
END;
$$;

-- ── 8. save_offer_plan: plan + items in one transaction ─────────────────────
CREATE OR REPLACE FUNCTION public.save_offer_plan(p_plan jsonb, p_items jsonb DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid := NULLIF(p_plan->>'id', '')::uuid;
  v_tenant uuid := (p_plan->>'tenant_id')::uuid;
BEGIN
  IF v_tenant IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED' USING ERRCODE = 'P0001';
  END IF;

  IF v_id IS NULL THEN
    INSERT INTO public.offer_plans (
      tenant_id, kind, status, template_key, name, slug, description, image_url, price,
      interval_unit, interval_count, max_periods, billing_methods, fulfillment_methods,
      preferred_weekday, renewal_lead_days, grace_days, max_active_members
    ) VALUES (
      v_tenant,
      p_plan->>'kind',
      COALESCE(NULLIF(p_plan->>'status', ''), 'draft'),
      NULLIF(p_plan->>'template_key', ''),
      p_plan->>'name',
      p_plan->>'slug',
      NULLIF(p_plan->>'description', ''),
      NULLIF(p_plan->>'image_url', ''),
      (p_plan->>'price')::numeric,
      p_plan->>'interval_unit',
      COALESCE((p_plan->>'interval_count')::integer, 1),
      NULLIF(p_plan->>'max_periods', '')::integer,
      -- ARRAY(SELECT …) of a missing key is '{}', not NULL, so COALESCE would not default.
      CASE WHEN p_plan ? 'billing_methods' THEN ARRAY(SELECT jsonb_array_elements_text(p_plan->'billing_methods')) ELSE ARRAY['manual'] END,
      CASE WHEN p_plan ? 'fulfillment_methods' THEN ARRAY(SELECT jsonb_array_elements_text(p_plan->'fulfillment_methods')) ELSE ARRAY['pickup'] END,
      NULLIF(p_plan->>'preferred_weekday', '')::smallint,
      COALESCE((p_plan->>'renewal_lead_days')::integer, 3),
      COALESCE((p_plan->>'grace_days')::integer, 5),
      NULLIF(p_plan->>'max_active_members', '')::integer
    )
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.offer_plans SET
      status = COALESCE(NULLIF(p_plan->>'status', ''), status),
      template_key = CASE WHEN p_plan ? 'template_key' THEN NULLIF(p_plan->>'template_key', '') ELSE template_key END,
      name = COALESCE(p_plan->>'name', name),
      slug = COALESCE(NULLIF(p_plan->>'slug', ''), slug),
      description = CASE WHEN p_plan ? 'description' THEN NULLIF(p_plan->>'description', '') ELSE description END,
      image_url = CASE WHEN p_plan ? 'image_url' THEN NULLIF(p_plan->>'image_url', '') ELSE image_url END,
      price = COALESCE((p_plan->>'price')::numeric, price),
      interval_unit = COALESCE(p_plan->>'interval_unit', interval_unit),
      interval_count = COALESCE((p_plan->>'interval_count')::integer, interval_count),
      max_periods = CASE WHEN p_plan ? 'max_periods' THEN NULLIF(p_plan->>'max_periods', '')::integer ELSE max_periods END,
      billing_methods = CASE WHEN p_plan ? 'billing_methods' THEN ARRAY(SELECT jsonb_array_elements_text(p_plan->'billing_methods')) ELSE billing_methods END,
      fulfillment_methods = CASE WHEN p_plan ? 'fulfillment_methods' THEN ARRAY(SELECT jsonb_array_elements_text(p_plan->'fulfillment_methods')) ELSE fulfillment_methods END,
      preferred_weekday = CASE WHEN p_plan ? 'preferred_weekday' THEN NULLIF(p_plan->>'preferred_weekday', '')::smallint ELSE preferred_weekday END,
      renewal_lead_days = COALESCE((p_plan->>'renewal_lead_days')::integer, renewal_lead_days),
      grace_days = COALESCE((p_plan->>'grace_days')::integer, grace_days),
      max_active_members = CASE WHEN p_plan ? 'max_active_members' THEN NULLIF(p_plan->>'max_active_members', '')::integer ELSE max_active_members END,
      archived_at = CASE WHEN p_plan->>'status' = 'archived' THEN COALESCE(archived_at, now()) ELSE archived_at END,
      updated_at = now()
    WHERE id = v_id AND tenant_id = v_tenant;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'PLAN_NOT_FOUND' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  IF p_items IS NOT NULL THEN
    DELETE FROM public.offer_plan_items WHERE plan_id = v_id;
    INSERT INTO public.offer_plan_items (plan_id, tenant_id, product_id, product_variant_id, quantity, position)
    SELECT v_id, v_tenant, (item->>'product_id')::uuid, NULLIF(item->>'product_variant_id', '')::uuid,
           (item->>'quantity')::integer, ordinality - 1
    FROM jsonb_array_elements(p_items) WITH ORDINALITY AS t(item, ordinality)
    WHERE EXISTS (SELECT 1 FROM public.products p WHERE p.id = (item->>'product_id')::uuid AND p.tenant_id = v_tenant);
  END IF;

  RETURN v_id;
END;
$$;

-- ── 9. Checkout: turn the cart's plans into pending instances of this order ─
-- Period 1 is billed by the checkout order itself; it starts when it is paid.
CREATE OR REPLACE FUNCTION public.create_checkout_plan_instances(p_order_id uuid, p_cart_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order record;
  v_plan record;
  v_delivery jsonb;
  v_items jsonb;
  v_sub_id uuid;
  v_bounds record;
  v_count integer := 0;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  SELECT to_jsonb(d) - 'order_id' - 'created_at' - 'updated_at' INTO v_delivery
  FROM public.order_delivery_details d WHERE d.order_id = p_order_id;

  FOR v_plan IN
    SELECT p.*, cp.billing_method AS cart_billing_method, cp.price_snapshot
    FROM public.public_cart_plans cp
    JOIN public.offer_plans p ON p.id = cp.offer_plan_id
    WHERE cp.cart_id = p_cart_id AND p.tenant_id = v_order.tenant_id
    ORDER BY cp.created_at
  LOOP
    IF v_plan.status <> 'active' THEN
      RAISE EXCEPTION 'PLAN_NOT_ACTIVE' USING ERRCODE = 'P0001', DETAIL = v_plan.id::text;
    END IF;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'product_id', i.product_id, 'product_variant_id', i.product_variant_id,
      'quantity', i.quantity, 'name', pr.name
    ) ORDER BY i.position), '[]'::jsonb) INTO v_items
    FROM public.offer_plan_items i JOIN public.products pr ON pr.id = i.product_id
    WHERE i.plan_id = v_plan.id;

    SELECT * INTO v_bounds FROM public.plan_period_bounds(now(), v_plan.interval_unit, v_plan.interval_count, 1);

    INSERT INTO public.subscriptions (
      tenant_id, customer_id, customer_name, customer_email, customer_phone,
      type, frequency, frequency_type, original_amount, discount_percent, discounted_amount,
      installment_amount, charge_amount, total_installments, status, mp_fee_absorbed_by,
      original_order_id, concept, items_snapshot,
      offer_plan_id, plan_kind, billing_method, plan_snapshot, fulfillment_snapshot, public_token
    ) VALUES (
      v_order.tenant_id, v_order.customer_id, COALESCE(v_order.customer_name, 'Cliente'),
      COALESCE(v_order.customer_email, ''), v_order.customer_phone,
      'recurring', v_plan.interval_count, v_plan.interval_unit || 's',
      v_plan.price_snapshot, 0, v_plan.price_snapshot, v_plan.price_snapshot, v_plan.price_snapshot,
      v_plan.max_periods, 'pending_setup', 'business',
      p_order_id, v_plan.name, v_items,
      v_plan.id, v_plan.kind, v_plan.cart_billing_method,
      jsonb_build_object(
        'name', v_plan.name, 'kind', v_plan.kind, 'price', v_plan.price_snapshot,
        'interval_unit', v_plan.interval_unit, 'interval_count', v_plan.interval_count,
        'max_periods', v_plan.max_periods, 'renewal_lead_days', v_plan.renewal_lead_days,
        'grace_days', v_plan.grace_days, 'preferred_weekday', v_plan.preferred_weekday,
        'items', v_items
      ),
      jsonb_build_object(
        'method', v_order.fulfillment_method, 'order_type', v_order.order_type,
        'delivery_fee', COALESCE(v_order.delivery_fee, 0), 'payment_method', v_order.payment_method,
        'transfer_payment_method_id', v_order.transfer_payment_method_id,
        'delivery', v_delivery
      ),
      replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
    )
    RETURNING id INTO v_sub_id;

    INSERT INTO public.subscription_periods (tenant_id, subscription_id, period_number, starts_at, ends_at, amount, status, due_at, order_id)
    VALUES (v_order.tenant_id, v_sub_id, 1, v_bounds.starts_at, v_bounds.ends_at, v_plan.price_snapshot, 'pending', now(), p_order_id);

    INSERT INTO public.order_plan_charges (tenant_id, order_id, subscription_id, offer_plan_id, period_number, name_snapshot, amount)
    VALUES (v_order.tenant_id, p_order_id, v_sub_id, v_plan.id, 1, v_plan.name, v_plan.price_snapshot);

    INSERT INTO public.order_items (order_id, product_id, product_variant_id, quantity, unit_price, subtotal, line_kind, subscription_id)
    SELECT p_order_id, i.product_id, i.product_variant_id, i.quantity, 0, 0, 'plan_component', v_sub_id
    FROM public.offer_plan_items i WHERE i.plan_id = v_plan.id ORDER BY i.position;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- ── 10. Renewal order of period N (idempotent per subscription + period) ────
CREATE OR REPLACE FUNCTION public.create_plan_period_order(p_subscription_id uuid, p_period_number integer)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub record;
  v_existing uuid;
  v_bounds record;
  v_fs jsonb;
  v_snapshot jsonb;
  v_price numeric(12,2);
  v_delivery_fee numeric(12,2);
  v_method text;
  v_payment text;
  v_transfer uuid;
  v_order_id uuid;
BEGIN
  SELECT * INTO v_sub FROM public.subscriptions WHERE id = p_subscription_id FOR UPDATE;
  IF NOT FOUND OR v_sub.plan_snapshot IS NULL THEN
    RAISE EXCEPTION 'SUBSCRIPTION_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  SELECT order_id INTO v_existing FROM public.subscription_periods
  WHERE subscription_id = p_subscription_id AND period_number = p_period_number;
  IF FOUND THEN
    RETURN v_existing;
  END IF;

  IF v_sub.start_date IS NULL THEN
    RAISE EXCEPTION 'SUBSCRIPTION_NOT_STARTED' USING ERRCODE = 'P0001';
  END IF;

  v_snapshot := v_sub.plan_snapshot;
  v_fs := COALESCE(v_sub.fulfillment_snapshot, '{}'::jsonb);
  v_price := (v_snapshot->>'price')::numeric;
  v_method := NULLIF(v_fs->>'method', '');
  v_delivery_fee := CASE WHEN v_method = 'delivery' THEN COALESCE((v_fs->>'delivery_fee')::numeric, 0) ELSE 0 END;

  SELECT * INTO v_bounds FROM public.plan_period_bounds(
    v_sub.start_date, v_snapshot->>'interval_unit', (v_snapshot->>'interval_count')::integer, p_period_number
  );

  -- Manual renewals are paid by transfer when the business accepts it, else at the counter.
  v_payment := v_fs->>'payment_method';
  v_transfer := NULLIF(v_fs->>'transfer_payment_method_id', '')::uuid;
  IF v_payment IS DISTINCT FROM 'bank_transfer' AND v_payment IS DISTINCT FROM 'cash' THEN
    SELECT id INTO v_transfer FROM public.tenant_payment_methods
    WHERE tenant_id = v_sub.tenant_id AND kind = 'bank_transfer' AND is_active = true LIMIT 1;
    v_payment := CASE WHEN v_transfer IS NOT NULL THEN 'bank_transfer' ELSE 'cash' END;
  END IF;

  INSERT INTO public.orders (
    tenant_id, status, subtotal, discount, total, source, customer_id, customer_name,
    customer_email, customer_phone, payment_mode, payment_method, fulfillment_method,
    delivery_fee, transfer_payment_method_id, payment_verification_status, payment_plan_status,
    paid_total, balance_due, order_type, subscription_id, subscription_installment, work_metadata
  ) VALUES (
    v_sub.tenant_id, 'pending_payment', v_price, 0, v_price + v_delivery_fee, 'public_store',
    v_sub.customer_id, v_sub.customer_name, v_sub.customer_email, v_sub.customer_phone,
    'single', v_payment, v_method, v_delivery_fee,
    CASE WHEN v_payment = 'bank_transfer' THEN v_transfer END,
    CASE WHEN v_payment = 'bank_transfer' THEN 'proof_required' ELSE 'not_required' END,
    'none', 0, v_price + v_delivery_fee, COALESCE(NULLIF(v_fs->>'order_type', ''), 'takeaway'),
    v_sub.id, p_period_number,
    jsonb_build_object('checkout_mode', 'plan_renewal', 'plan_period', p_period_number)
  )
  RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (order_id, product_id, product_variant_id, quantity, unit_price, subtotal, line_kind, subscription_id)
  SELECT v_order_id, (item->>'product_id')::uuid, NULLIF(item->>'product_variant_id', '')::uuid,
         (item->>'quantity')::integer, 0, 0, 'plan_component', v_sub.id
  FROM jsonb_array_elements(COALESCE(v_snapshot->'items', '[]'::jsonb)) AS item
  WHERE EXISTS (SELECT 1 FROM public.products p WHERE p.id = (item->>'product_id')::uuid);

  INSERT INTO public.order_plan_charges (tenant_id, order_id, subscription_id, offer_plan_id, period_number, name_snapshot, amount)
  VALUES (v_sub.tenant_id, v_order_id, v_sub.id, v_sub.offer_plan_id, p_period_number, v_snapshot->>'name', v_price);

  IF jsonb_typeof(v_fs->'delivery') = 'object' THEN
    INSERT INTO public.order_delivery_details (
      order_id, pickup_point_id, recipient_name, recipient_phone, address_text, reference,
      latitude, longitude, mapbox_feature_id
    ) VALUES (
      v_order_id,
      NULLIF(v_fs->'delivery'->>'pickup_point_id', '')::uuid,
      v_fs->'delivery'->>'recipient_name', v_fs->'delivery'->>'recipient_phone',
      v_fs->'delivery'->>'address_text', v_fs->'delivery'->>'reference',
      NULLIF(v_fs->'delivery'->>'latitude', '')::double precision,
      NULLIF(v_fs->'delivery'->>'longitude', '')::double precision,
      v_fs->'delivery'->>'mapbox_feature_id'
    );
  END IF;

  INSERT INTO public.subscription_periods (tenant_id, subscription_id, period_number, starts_at, ends_at, amount, status, due_at, order_id)
  VALUES (v_sub.tenant_id, v_sub.id, p_period_number, v_bounds.starts_at, v_bounds.ends_at,
          v_price + v_delivery_fee, 'pending', v_bounds.starts_at, v_order_id);

  RETURN v_order_id;
END;
$$;

-- ── 11. On-demand housekeeping (a future cron calls this, unchanged) ────────
CREATE OR REPLACE FUNCTION public.ensure_due_periods(
  p_tenant_id uuid, p_subscription_id uuid DEFAULT NULL, p_now timestamptz DEFAULT now()
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub record;
  v_created integer := 0;
BEGIN
  UPDATE public.subscriptions s
  SET status = 'cancelled', cancelled_at = p_now, updated_at = p_now
  WHERE s.tenant_id = p_tenant_id AND s.offer_plan_id IS NOT NULL
    AND (p_subscription_id IS NULL OR s.id = p_subscription_id)
    AND s.cancel_at_period_end AND s.status IN ('active', 'past_due')
    AND s.current_period_end <= p_now;

  UPDATE public.subscriptions s
  SET status = 'completed', updated_at = p_now
  WHERE s.tenant_id = p_tenant_id AND s.offer_plan_id IS NOT NULL
    AND (p_subscription_id IS NULL OR s.id = p_subscription_id)
    AND s.status = 'active' AND s.total_installments IS NOT NULL
    AND s.current_period_number >= s.total_installments
    AND s.current_period_end <= p_now;

  WITH overdue AS (
    UPDATE public.subscription_periods p
    SET status = 'overdue', updated_at = p_now
    FROM public.subscriptions s
    WHERE p.subscription_id = s.id AND s.tenant_id = p_tenant_id
      AND (p_subscription_id IS NULL OR s.id = p_subscription_id)
      AND p.status = 'pending' AND p.period_number > 1
      AND s.status IN ('active', 'past_due')
      AND p.due_at + make_interval(days => COALESCE((s.plan_snapshot->>'grace_days')::integer, 5)) <= p_now
    RETURNING p.subscription_id
  )
  UPDATE public.subscriptions s
  SET status = 'past_due', past_due_since = COALESCE(s.past_due_since, p_now), updated_at = p_now
  WHERE s.id IN (SELECT subscription_id FROM overdue);

  FOR v_sub IN
    SELECT s.id, s.current_period_number
    FROM public.subscriptions s
    WHERE s.tenant_id = p_tenant_id AND s.offer_plan_id IS NOT NULL
      AND (p_subscription_id IS NULL OR s.id = p_subscription_id)
      AND s.status = 'active' AND s.billing_method = 'manual'
      AND NOT s.cancel_at_period_end
      AND s.current_period_number >= 1
      AND (s.total_installments IS NULL OR s.current_period_number < s.total_installments)
      AND s.current_period_end - make_interval(days => COALESCE((s.plan_snapshot->>'renewal_lead_days')::integer, 3)) <= p_now
      AND NOT EXISTS (
        SELECT 1 FROM public.subscription_periods p
        WHERE p.subscription_id = s.id AND p.period_number = s.current_period_number + 1
      )
  LOOP
    PERFORM public.create_plan_period_order(v_sub.id, v_sub.current_period_number + 1);
    v_created := v_created + 1;
  END LOOP;

  RETURN v_created;
END;
$$;

-- ── 12. Payment of any period's order activates / advances the plan ─────────
-- Same "paid" predicate as handle_order_inventory, so every payment path
-- (MP webhook, approved transfer, caja) is covered without touching them.
CREATE OR REPLACE FUNCTION public.handle_plan_period_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period record;
  v_sub record;
  v_starts timestamptz;
  v_ends timestamptz;
  v_now timestamptz := now();
BEGIN
  IF (NEW.status = 'paid' OR NEW.payment_verification_status = 'approved')
     AND NOT (OLD.status = 'paid' OR OLD.payment_verification_status = 'approved') THEN
    FOR v_period IN
      SELECT * FROM public.subscription_periods
      WHERE order_id = NEW.id AND status IN ('pending', 'overdue')
      FOR UPDATE
    LOOP
      SELECT * INTO v_sub FROM public.subscriptions WHERE id = v_period.subscription_id FOR UPDATE;

      IF v_period.period_number = 1 THEN
        SELECT b.starts_at, b.ends_at INTO v_starts, v_ends FROM public.plan_period_bounds(
          v_now, v_sub.plan_snapshot->>'interval_unit', (v_sub.plan_snapshot->>'interval_count')::integer, 1
        ) b;
        UPDATE public.subscriptions SET start_date = v_now WHERE id = v_sub.id;
      ELSE
        v_starts := v_period.starts_at;
        v_ends := v_period.ends_at;
      END IF;

      UPDATE public.subscription_periods
      SET status = 'paid', paid_at = v_now, payment_source = COALESCE(NEW.payment_method, 'manual'),
          starts_at = v_starts, ends_at = v_ends, updated_at = v_now
      WHERE id = v_period.id;

      UPDATE public.subscriptions s
      SET status = CASE WHEN s.status IN ('pending_setup', 'past_due', 'active') THEN 'active' ELSE s.status END,
          current_period_number = GREATEST(s.current_period_number, v_period.period_number),
          current_period_start = CASE WHEN v_period.period_number >= s.current_period_number THEN v_starts ELSE s.current_period_start END,
          current_period_end = CASE WHEN v_period.period_number >= s.current_period_number THEN v_ends ELSE s.current_period_end END,
          next_charge_date = CASE WHEN v_period.period_number >= s.current_period_number THEN v_ends ELSE s.next_charge_date END,
          completed_installments = s.completed_installments + 1,
          past_due_since = CASE WHEN EXISTS (
            SELECT 1 FROM public.subscription_periods o
            WHERE o.subscription_id = s.id AND o.status = 'overdue' AND o.id <> v_period.id
          ) THEN s.past_due_since END,
          updated_at = v_now
      WHERE s.id = v_sub.id;

      INSERT INTO public.subscription_payments (subscription_id, tenant_id, installment_number, amount, order_id, status)
      VALUES (v_sub.id, v_sub.tenant_id, v_period.period_number, v_period.amount, NEW.id, 'paid');
    END LOOP;
  END IF;

  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
    FOR v_period IN
      SELECT * FROM public.subscription_periods WHERE order_id = NEW.id AND status <> 'cancelled' FOR UPDATE
    LOOP
      UPDATE public.subscription_periods SET status = 'cancelled', updated_at = v_now WHERE id = v_period.id;
      -- A cancelled unpaid period means the customer stopped; without this the
      -- plan would never renew again. A refunded renewal keeps the plan.
      IF v_period.period_number = 1 OR v_period.status <> 'paid' THEN
        UPDATE public.subscriptions
        SET status = 'cancelled', cancelled_at = v_now, updated_at = v_now
        WHERE id = v_period.subscription_id AND status <> 'cancelled';
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS order_plan_period_trigger ON public.orders;
CREATE TRIGGER order_plan_period_trigger
  AFTER UPDATE OF status, payment_verification_status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_plan_period_payment();

-- ── 13. Grants: everything above is server-only ─────────────────────────────
REVOKE ALL ON FUNCTION public.save_offer_plan(jsonb, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_checkout_plan_instances(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_plan_period_order(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ensure_due_periods(uuid, uuid, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_offer_plan(jsonb, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_checkout_plan_instances(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_plan_period_order(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.ensure_due_periods(uuid, uuid, timestamptz) TO service_role;
