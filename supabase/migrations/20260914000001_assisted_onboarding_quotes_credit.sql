-- Assisted business provisioning, commercial quotes, customer credit and
-- private customer documents.  All mutable money paths are server/RPC only.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.assisted_onboardings (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  provisioning_key uuid NOT NULL DEFAULT extensions.uuid_generate_v4() UNIQUE,
  tenant_id uuid UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  owner_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  owner_email text NOT NULL,
  owner_phone text,
  owner_name text,
  catalog_template_key text,
  billing_mode text NOT NULL DEFAULT 'configuration_limited'
    CHECK (billing_mode IN ('configuration_limited', 'contracted', 'courtesy')),
  status text NOT NULL DEFAULT 'invited'
    CHECK (status IN ('provisioning', 'invited', 'accepted', 'payments_pending', 'ready', 'cancelled', 'failed')),
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes text,
  invitation_sent_at timestamptz,
  invitation_accepted_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS assisted_onboardings_status_idx
  ON public.assisted_onboardings(status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.assisted_onboarding_events (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  onboarding_id uuid NOT NULL REFERENCES public.assisted_onboardings(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS assisted_onboarding_events_onboarding_idx
  ON public.assisted_onboarding_events(onboarding_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.quotes (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  parent_quote_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL,
  quote_number text NOT NULL,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'internal_review', 'ready_to_send', 'sent', 'viewed',
    'changes_requested', 'accepted', 'converted', 'conversion_blocked',
    'rejected', 'expired', 'cancelled', 'superseded'
  )),
  conversion_reason text,
  subtotal numeric(12,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  discount numeric(12,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total numeric(12,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  internal_notes text,
  customer_note text,
  valid_until timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  public_token_hash text UNIQUE,
  public_token_expires_at timestamptz,
  order_id uuid UNIQUE REFERENCES public.orders(id) ON DELETE SET NULL,
  accepted_at timestamptz,
  accepted_by text CHECK (accepted_by IN ('customer', 'staff', 'phone', 'in_person')),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, quote_number, version)
);
CREATE INDEX IF NOT EXISTS quotes_tenant_status_idx ON public.quotes(tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS quotes_customer_idx ON public.quotes(tenant_id, customer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.quote_items (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  name_snapshot text NOT NULL,
  description_snapshot text,
  image_url_snapshot text,
  item_type text NOT NULL CHECK (item_type IN ('product', 'service')),
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
  subtotal numeric(12,2) NOT NULL CHECK (subtotal >= 0),
  position integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.quote_events (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  source text CHECK (source IN ('staff', 'customer', 'phone', 'in_person', 'system')),
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS quote_events_quote_idx ON public.quote_events(quote_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.customer_credit_accounts (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  credit_limit numeric(12,2) NOT NULL CHECK (credit_limit >= 0),
  debt_balance numeric(12,2) NOT NULL DEFAULT 0 CHECK (debt_balance >= 0),
  stored_balance numeric(12,2) NOT NULL DEFAULT 0 CHECK (stored_balance >= 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),
  internal_notes text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, customer_id),
  CHECK (debt_balance <= credit_limit)
);
CREATE INDEX IF NOT EXISTS customer_credit_accounts_tenant_idx ON public.customer_credit_accounts(tenant_id, status);

CREATE TABLE IF NOT EXISTS public.customer_credit_movements (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  account_id uuid NOT NULL REFERENCES public.customer_credit_accounts(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  movement_type text NOT NULL CHECK (movement_type IN (
    'charge', 'payment', 'deposit', 'stored_balance_used', 'change_returned', 'refund', 'limit_adjustment', 'manual_adjustment'
  )),
  debt_delta numeric(12,2) NOT NULL DEFAULT 0,
  stored_balance_delta numeric(12,2) NOT NULL DEFAULT 0,
  received_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (received_amount >= 0),
  change_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (change_amount >= 0),
  debt_after numeric(12,2) NOT NULL CHECK (debt_after >= 0),
  stored_balance_after numeric(12,2) NOT NULL CHECK (stored_balance_after >= 0),
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  loan_id uuid REFERENCES public.loans(id) ON DELETE SET NULL,
  loan_payment_id uuid REFERENCES public.loan_payments(id) ON DELETE SET NULL,
  note text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS customer_credit_movements_account_idx ON public.customer_credit_movements(account_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS customer_credit_charge_order_unique
  ON public.customer_credit_movements(order_id) WHERE movement_type = 'charge';

-- Stores the exact outcome of an abono so a browser/network retry cannot
-- create a second payment or a second saldo a favor.
CREATE TABLE IF NOT EXISTS public.credit_payment_requests (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  account_id uuid NOT NULL REFERENCES public.customer_credit_accounts(id) ON DELETE CASCADE,
  idempotency_key uuid NOT NULL,
  applied_amount numeric(12,2) NOT NULL DEFAULT 0,
  change_amount numeric(12,2) NOT NULL DEFAULT 0,
  stored_amount numeric(12,2) NOT NULL DEFAULT 0,
  debt_after numeric(12,2) NOT NULL DEFAULT 0,
  stored_balance_after numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(account_id, idempotency_key)
);

ALTER TABLE public.loans
  ADD COLUMN IF NOT EXISTS credit_account_id uuid REFERENCES public.customer_credit_accounts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS loans_credit_account_idx ON public.loans(credit_account_id) WHERE credit_account_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS loans_credit_account_order_unique
  ON public.loans(credit_account_id, order_id)
  WHERE credit_account_id IS NOT NULL AND order_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.customer_document_links (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('quote', 'order', 'loan_payment', 'credit_account')),
  entity_id uuid NOT NULL,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS customer_document_links_entity_idx
  ON public.customer_document_links(tenant_id, entity_type, entity_id)
  WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS public.customer_document_link_accesses (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  document_link_id uuid NOT NULL REFERENCES public.customer_document_links(id) ON DELETE CASCADE,
  ip_hash text,
  user_agent text,
  accessed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS customer_document_link_accesses_link_idx
  ON public.customer_document_link_accesses(document_link_id, accessed_at DESC);

ALTER TABLE public.communication_events
  DROP CONSTRAINT IF EXISTS communication_events_entity_type_check;
ALTER TABLE public.communication_events
  ADD CONSTRAINT communication_events_entity_type_check
  CHECK (entity_type IN ('order', 'loan', 'subscription', 'appointment', 'quote', 'loan_payment', 'credit_account'));

ALTER TABLE public.assisted_onboardings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assisted_onboarding_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_credit_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_credit_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_document_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_document_link_accesses ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'assisted_onboardings', 'assisted_onboarding_events', 'quotes', 'quote_items',
    'quote_events', 'customer_credit_accounts', 'customer_credit_movements', 'credit_payment_requests', 'customer_document_links', 'customer_document_link_accesses'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_name || ': service role', table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL USING (auth.role() = ''service_role'') WITH CHECK (auth.role() = ''service_role'')', table_name || ': service role', table_name);
  END LOOP;
END $$;

-- Platform APIs call this after resolving/inviting the auth user.  It keeps
-- tenant, seeded catalog, billing-safe flags and invited owner consistent.
CREATE OR REPLACE FUNCTION public.provision_assisted_tenant(
  p_provisioning_key uuid,
  p_owner_user_id uuid,
  p_owner_email text,
  p_owner_phone text,
  p_owner_name text,
  p_name text,
  p_slug text,
  p_business_type text,
  p_catalog_template_key text,
  p_site_template_id uuid,
  p_billing_mode text,
  p_actor_id uuid,
  p_notes text DEFAULT NULL
)
RETURNS TABLE(onboarding_id uuid, tenant_id uuid, tenant_slug text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_onboarding public.assisted_onboardings%ROWTYPE;
  v_created record;
BEGIN
  SELECT * INTO v_onboarding FROM public.assisted_onboardings WHERE provisioning_key = p_provisioning_key FOR UPDATE;
  IF FOUND AND v_onboarding.tenant_id IS NOT NULL THEN
    RETURN QUERY SELECT v_onboarding.id, v_onboarding.tenant_id, (SELECT slug FROM public.tenants WHERE id = v_onboarding.tenant_id);
    RETURN;
  END IF;

  IF NOT FOUND THEN
    INSERT INTO public.assisted_onboardings(provisioning_key, owner_user_id, owner_email, owner_phone, owner_name, catalog_template_key, billing_mode, status, assigned_to, notes)
    VALUES (p_provisioning_key, p_owner_user_id, lower(btrim(p_owner_email)), NULLIF(btrim(p_owner_phone), ''), NULLIF(btrim(p_owner_name), ''), p_catalog_template_key, p_billing_mode, 'provisioning', p_actor_id, NULLIF(btrim(p_notes), ''))
    RETURNING * INTO v_onboarding;
  END IF;

  SELECT * INTO v_created FROM public.create_tenant_with_catalog(
    p_owner_user_id, p_name, p_slug, p_business_type, NULLIF(p_catalog_template_key, ''), p_site_template_id, false, NULL
  );

  UPDATE public.tenants
  SET public_store_enabled = false,
      accepting_orders = false,
      merchant_payments_v2_enabled = false,
      settings = COALESCE(settings, '{}'::jsonb) || jsonb_build_object('assisted_onboarding', true),
      updated_at = now()
  WHERE id = v_created.id;

  UPDATE public.tenant_memberships
  SET status = 'invited', accepted_at = NULL, invited_at = now(), invitation_expires_at = now() + interval '7 days', updated_at = now()
  WHERE tenant_id = v_created.id AND user_id = p_owner_user_id;

  UPDATE public.assisted_onboardings
  SET tenant_id = v_created.id, owner_user_id = p_owner_user_id, status = 'invited', invitation_sent_at = now(), updated_at = now()
  WHERE id = v_onboarding.id;
  INSERT INTO public.assisted_onboarding_events(onboarding_id, actor_id, event_type, metadata)
  VALUES (v_onboarding.id, p_actor_id, 'business_provisioned', jsonb_build_object('tenant_id', v_created.id));
  RETURN QUERY SELECT v_onboarding.id, v_created.id, (SELECT slug FROM public.tenants WHERE id = v_created.id);
END $$;

CREATE OR REPLACE FUNCTION public.convert_quote_to_order(
  p_quote_id uuid,
  p_actor_id uuid,
  p_acceptance_source text
)
RETURNS TABLE(order_id uuid, result text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_quote public.quotes%ROWTYPE;
  v_customer public.customers%ROWTYPE;
  v_order_id uuid;
  v_assignee uuid;
  v_reason text;
BEGIN
  SELECT * INTO v_quote FROM public.quotes WHERE id = p_quote_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'QUOTE_NOT_FOUND'; END IF;
  IF v_quote.status = 'converted' THEN RETURN QUERY SELECT v_quote.order_id, 'converted'; RETURN; END IF;
  IF v_quote.status NOT IN ('sent', 'viewed', 'accepted', 'ready_to_send') THEN RAISE EXCEPTION 'QUOTE_NOT_ACCEPTABLE'; END IF;
  IF v_quote.valid_until < now() THEN
    UPDATE public.quotes SET status = 'expired', updated_at = now() WHERE id = v_quote.id;
    RETURN QUERY SELECT NULL::uuid, 'expired'; RETURN;
  END IF;
  SELECT * INTO v_customer FROM public.customers WHERE id = v_quote.customer_id;
  v_assignee := p_actor_id;
  IF v_assignee IS NULL THEN
    SELECT m.user_id INTO v_assignee
    FROM public.tenant_memberships m
    JOIN public.tenant_roles r ON r.id = m.role_id
    WHERE m.tenant_id = v_quote.tenant_id AND m.status = 'active' AND r.name = 'owner'
    LIMIT 1;
  END IF;

  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM public.quote_items qi JOIN public.products p ON p.id = qi.product_id WHERE qi.quote_id = v_quote.id AND (p.tenant_id <> v_quote.tenant_id OR p.deleted_at IS NOT NULL)) THEN 'product_inactive'
    WHEN EXISTS (SELECT 1 FROM public.quote_items qi JOIN public.products p ON p.id = qi.product_id LEFT JOIN public.product_inventory pi ON pi.product_id = p.id WHERE qi.quote_id = v_quote.id AND p.type = 'product' AND p.track_stock = true AND COALESCE(pi.quantity, 0) < qi.quantity) THEN 'stock_insufficient'
  END INTO v_reason;
  IF v_reason IS NOT NULL THEN
    UPDATE public.quotes SET status = 'conversion_blocked', conversion_reason = v_reason, accepted_at = now(), accepted_by = p_acceptance_source, updated_at = now() WHERE id = v_quote.id;
    INSERT INTO public.quote_events(quote_id, actor_id, event_type, source, reason) VALUES (v_quote.id, p_actor_id, 'conversion_blocked', p_acceptance_source, v_reason);
    RETURN QUERY SELECT NULL::uuid, v_reason; RETURN;
  END IF;

  INSERT INTO public.orders(tenant_id, status, subtotal, discount, total, source, created_by, assigned_to, customer_id, customer_name, customer_email, customer_phone)
  VALUES(v_quote.tenant_id, 'assigned', v_quote.subtotal, v_quote.discount, v_quote.total, 'quote', p_actor_id, v_assignee, v_quote.customer_id, v_customer.name, v_customer.email, v_customer.phone)
  RETURNING id INTO v_order_id;
  INSERT INTO public.order_items(order_id, product_id, quantity, unit_price, subtotal)
  SELECT v_order_id, product_id, quantity, unit_price, subtotal FROM public.quote_items WHERE quote_id = v_quote.id ORDER BY position;
  UPDATE public.quotes SET status = 'converted', order_id = v_order_id, accepted_at = COALESCE(accepted_at, now()), accepted_by = COALESCE(accepted_by, p_acceptance_source), conversion_reason = NULL, updated_at = now(), updated_by = p_actor_id WHERE id = v_quote.id;
  INSERT INTO public.quote_events(quote_id, actor_id, event_type, source, metadata) VALUES(v_quote.id, p_actor_id, 'converted', p_acceptance_source, jsonb_build_object('order_id', v_order_id));
  RETURN QUERY SELECT v_order_id, 'converted';
END $$;

-- A requested change never mutates the document the customer saw.  Cloning in
-- the database keeps the old version and its item snapshots together even if
-- the request is retried by the browser.
CREATE OR REPLACE FUNCTION public.create_quote_revision(
  p_quote_id uuid,
  p_actor_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS TABLE(quote_id uuid, version integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_source public.quotes%ROWTYPE;
  v_quote_id uuid;
  v_version integer;
BEGIN
  SELECT * INTO v_source FROM public.quotes WHERE id = p_quote_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'QUOTE_NOT_FOUND'; END IF;
  IF v_source.status NOT IN ('changes_requested', 'conversion_blocked', 'sent', 'viewed', 'ready_to_send') THEN
    RAISE EXCEPTION 'QUOTE_REVISION_NOT_ALLOWED';
  END IF;
  SELECT COALESCE(MAX(q.version), 0) + 1 INTO v_version
  FROM public.quotes q
  WHERE q.tenant_id = v_source.tenant_id AND q.quote_number = v_source.quote_number;
  UPDATE public.quotes
  SET status = 'superseded', updated_by = p_actor_id, updated_at = now()
  WHERE id = v_source.id;
  INSERT INTO public.quotes(
    tenant_id, customer_id, parent_quote_id, quote_number, version, status,
    subtotal, discount, total, internal_notes, customer_note, valid_until,
    created_by, updated_by
  ) VALUES (
    v_source.tenant_id, v_source.customer_id, v_source.id, v_source.quote_number,
    v_version, 'draft', v_source.subtotal, v_source.discount, v_source.total,
    v_source.internal_notes, v_source.customer_note, now() + interval '7 days',
    p_actor_id, p_actor_id
  ) RETURNING id INTO v_quote_id;
  INSERT INTO public.quote_items(
    quote_id, product_id, name_snapshot, description_snapshot, image_url_snapshot,
    item_type, quantity, unit_price, subtotal, position
  )
  SELECT v_quote_id, product_id, name_snapshot, description_snapshot, image_url_snapshot,
    item_type, quantity, unit_price, subtotal, position
  FROM public.quote_items WHERE quote_id = v_source.id ORDER BY position;
  INSERT INTO public.quote_events(quote_id, actor_id, event_type, source, reason)
  VALUES(v_source.id, p_actor_id, 'superseded', 'staff', NULLIF(btrim(p_reason), ''));
  INSERT INTO public.quote_events(quote_id, actor_id, event_type, source, reason, metadata)
  VALUES(v_quote_id, p_actor_id, 'revision_created', 'staff', NULLIF(btrim(p_reason), ''), jsonb_build_object('previous_quote_id', v_source.id, 'version', v_version));
  RETURN QUERY SELECT v_quote_id, v_version;
END $$;

CREATE OR REPLACE FUNCTION public.sync_credit_account_on_loan_payment()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_account_id uuid;
  v_tenant_id uuid;
  v_debt numeric(12,2);
  v_store numeric(12,2);
BEGIN
  SELECT credit_account_id, tenant_id INTO v_account_id, v_tenant_id FROM public.loans WHERE id = NEW.loan_id;
  IF v_account_id IS NULL THEN RETURN NEW; END IF;
  UPDATE public.customer_credit_accounts
  SET debt_balance = GREATEST(0, debt_balance - NEW.amount), updated_at = now(), updated_by = NEW.registered_by
  WHERE id = v_account_id
  RETURNING debt_balance, stored_balance INTO v_debt, v_store;
  INSERT INTO public.customer_credit_movements(account_id, tenant_id, movement_type, debt_delta, debt_after, stored_balance_after, loan_id, loan_payment_id, note, created_by)
  VALUES(v_account_id, v_tenant_id, 'payment', -NEW.amount, v_debt, v_store, NEW.loan_id, NEW.id, NEW.notes, NEW.registered_by);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_sync_credit_account_on_loan_payment ON public.loan_payments;
CREATE TRIGGER trg_sync_credit_account_on_loan_payment
  AFTER INSERT ON public.loan_payments
  FOR EACH ROW EXECUTE FUNCTION public.sync_credit_account_on_loan_payment();

CREATE OR REPLACE FUNCTION public.apply_credit_payment(
  p_account_id uuid,
  p_received_amount numeric,
  p_overage_action text,
  p_payment_method text,
  p_actor_id uuid,
  p_note text DEFAULT NULL,
  p_idempotency_key uuid DEFAULT NULL
)
RETURNS TABLE(applied_amount numeric, change_amount numeric, stored_amount numeric, debt_after numeric, stored_balance_after numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_account public.customer_credit_accounts%ROWTYPE;
  v_loan record;
  v_apply numeric(12,2);
  v_over numeric(12,2);
  v_remaining numeric(12,2);
  v_debt numeric(12,2);
  v_store numeric(12,2);
  v_request public.credit_payment_requests%ROWTYPE;
BEGIN
  IF p_received_amount <= 0 THEN RAISE EXCEPTION 'PAYMENT_AMOUNT_INVALID'; END IF;
  IF p_overage_action NOT IN ('return_change', 'store_balance') THEN RAISE EXCEPTION 'OVERAGE_ACTION_REQUIRED'; END IF;
  SELECT * INTO v_account FROM public.customer_credit_accounts WHERE id = p_account_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'CREDIT_ACCOUNT_NOT_FOUND'; END IF;
  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_request
    FROM public.credit_payment_requests
    WHERE account_id = p_account_id AND idempotency_key = p_idempotency_key
    FOR UPDATE;
    IF FOUND THEN
      RETURN QUERY SELECT v_request.applied_amount, v_request.change_amount, v_request.stored_amount, v_request.debt_after, v_request.stored_balance_after;
      RETURN;
    END IF;
    INSERT INTO public.credit_payment_requests(account_id, idempotency_key)
    VALUES(p_account_id, p_idempotency_key);
  END IF;
  v_apply := LEAST(p_received_amount, v_account.debt_balance);
  v_over := p_received_amount - v_apply;
  v_debt := v_account.debt_balance - v_apply;
  v_store := v_account.stored_balance + CASE WHEN p_overage_action = 'store_balance' THEN v_over ELSE 0 END;
  v_remaining := v_apply;
  FOR v_loan IN
    SELECT id, amount_pending
    FROM public.loans
    WHERE credit_account_id = v_account.id AND status IN ('pending', 'partial')
    ORDER BY created_at ASC
    FOR UPDATE
  LOOP
    EXIT WHEN v_remaining <= 0;
    INSERT INTO public.loan_payments(loan_id, tenant_id, amount, payment_method, source, registered_by, notes)
    VALUES(v_loan.id, v_account.tenant_id, LEAST(v_remaining, v_loan.amount_pending), p_payment_method, 'manual', p_actor_id, NULLIF(btrim(p_note), ''));
    v_remaining := v_remaining - LEAST(v_remaining, v_loan.amount_pending);
  END LOOP;
  IF v_over > 0 AND p_overage_action = 'store_balance' THEN
    UPDATE public.customer_credit_accounts SET stored_balance = stored_balance + v_over, updated_by = p_actor_id, updated_at = now() WHERE id = v_account.id RETURNING debt_balance, stored_balance INTO v_debt, v_store;
    INSERT INTO public.customer_credit_movements(account_id, tenant_id, movement_type, stored_balance_delta, received_amount, debt_after, stored_balance_after, note, created_by)
    VALUES(v_account.id, v_account.tenant_id, 'deposit', v_over, v_over, v_debt, v_store, NULLIF(btrim(p_note), ''), p_actor_id);
  ELSIF v_over > 0 THEN
    SELECT debt_balance, stored_balance INTO v_debt, v_store FROM public.customer_credit_accounts WHERE id = v_account.id;
    INSERT INTO public.customer_credit_movements(account_id, tenant_id, movement_type, received_amount, change_amount, debt_after, stored_balance_after, note, created_by)
    VALUES(v_account.id, v_account.tenant_id, 'change_returned', p_received_amount, v_over, v_debt, v_store, NULLIF(btrim(p_note), ''), p_actor_id);
  ELSE
    SELECT debt_balance, stored_balance INTO v_debt, v_store FROM public.customer_credit_accounts WHERE id = v_account.id;
  END IF;
  IF p_idempotency_key IS NOT NULL THEN
    UPDATE public.credit_payment_requests
    SET applied_amount = v_apply,
        change_amount = CASE WHEN p_overage_action = 'return_change' THEN v_over ELSE 0 END,
        stored_amount = CASE WHEN p_overage_action = 'store_balance' THEN v_over ELSE 0 END,
        debt_after = v_debt,
        stored_balance_after = v_store
    WHERE account_id = p_account_id AND idempotency_key = p_idempotency_key;
  END IF;
  RETURN QUERY SELECT v_apply, CASE WHEN p_overage_action = 'return_change' THEN v_over ELSE 0 END, CASE WHEN p_overage_action = 'store_balance' THEN v_over ELSE 0 END, v_debt, v_store;
END $$;

CREATE OR REPLACE FUNCTION public.charge_order_to_credit(
  p_account_id uuid,
  p_order_id uuid,
  p_actor_id uuid,
  p_note text DEFAULT NULL
)
RETURNS TABLE(loan_id uuid, charged_amount numeric, stored_balance_used numeric, debt_after numeric, stored_balance_after numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_account public.customer_credit_accounts%ROWTYPE;
  v_order public.orders%ROWTYPE;
  v_remaining numeric(12,2);
  v_used numeric(12,2);
  v_loan_id uuid;
  v_item record;
BEGIN
  SELECT * INTO v_account FROM public.customer_credit_accounts WHERE id = p_account_id FOR UPDATE;
  IF NOT FOUND OR v_account.status <> 'active' THEN RAISE EXCEPTION 'CREDIT_ACCOUNT_UNAVAILABLE'; END IF;
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND OR v_order.tenant_id <> v_account.tenant_id OR v_order.customer_id <> v_account.customer_id THEN RAISE EXCEPTION 'ORDER_DOES_NOT_MATCH_CREDIT_ACCOUNT'; END IF;
  IF v_order.status IN ('paid', 'cancelled') THEN RAISE EXCEPTION 'ORDER_NOT_CHARGEABLE'; END IF;
  v_used := LEAST(v_account.stored_balance, v_order.total);
  v_remaining := v_order.total - v_used;
  IF v_remaining > (v_account.credit_limit - v_account.debt_balance) THEN RAISE EXCEPTION 'CREDIT_LIMIT_EXCEEDED'; END IF;

  -- A fully stored-balance purchase becomes `paid` and the existing paid-order
  -- trigger deducts inventory.  Only the unpaid credit remainder is deducted
  -- here, at delivery time, so it can never be counted twice.
  IF v_remaining > 0 THEN
    FOR v_item IN
      SELECT oi.product_id, oi.quantity, p.name
      FROM public.order_items oi JOIN public.products p ON p.id = oi.product_id
      WHERE oi.order_id = v_order.id AND p.type = 'product' AND p.track_stock = true
    LOOP
      UPDATE public.product_inventory SET quantity = quantity - v_item.quantity, updated_at = now()
      WHERE product_id = v_item.product_id AND quantity >= v_item.quantity;
      IF NOT FOUND THEN RAISE EXCEPTION 'STOCK_INSUFFICIENT: %', v_item.name; END IF;
      INSERT INTO public.inventory_movements(product_id, type, quantity, reference, reference_id, created_by)
      VALUES(v_item.product_id, 'credit_sale', -v_item.quantity, 'credit_order', v_order.id, p_actor_id);
    END LOOP;
  END IF;

  IF v_remaining > 0 THEN
    INSERT INTO public.loans(tenant_id, customer_id, credit_account_id, amount, concept, order_id, notes, created_by)
    VALUES(v_account.tenant_id, v_account.customer_id, v_account.id, v_remaining, 'Compra a crédito', v_order.id, NULLIF(btrim(p_note), ''), p_actor_id)
    RETURNING id INTO v_loan_id;
  END IF;
  UPDATE public.customer_credit_accounts
  SET debt_balance = debt_balance + v_remaining,
      stored_balance = stored_balance - v_used,
      updated_by = p_actor_id, updated_at = now()
  WHERE id = v_account.id;
  UPDATE public.orders
  SET status = CASE WHEN v_remaining = 0 THEN 'paid' ELSE 'completed' END,
      payment_method = CASE WHEN v_remaining = 0 THEN 'customer_balance' ELSE 'credit' END,
      completed_by = p_actor_id, completed_at = now(), paid_at = CASE WHEN v_remaining = 0 THEN now() ELSE paid_at END,
      updated_at = now()
  WHERE id = v_order.id;
  INSERT INTO public.customer_credit_movements(account_id, tenant_id, movement_type, debt_delta, stored_balance_delta, debt_after, stored_balance_after, order_id, loan_id, note, created_by)
  SELECT v_account.id, v_account.tenant_id, 'charge', v_remaining, -v_used, debt_balance, stored_balance, v_order.id, v_loan_id, NULLIF(btrim(p_note), ''), p_actor_id
  FROM public.customer_credit_accounts WHERE id = v_account.id;
  RETURN QUERY SELECT v_loan_id, v_remaining, v_used,
    (SELECT debt_balance FROM public.customer_credit_accounts WHERE id = v_account.id),
    (SELECT stored_balance FROM public.customer_credit_accounts WHERE id = v_account.id);
END $$;

REVOKE ALL ON FUNCTION public.provision_assisted_tenant(uuid, uuid, text, text, text, text, text, text, text, uuid, text, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.convert_quote_to_order(uuid, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_quote_revision(uuid, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_credit_payment(uuid, numeric, text, text, uuid, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.charge_order_to_credit(uuid, uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.provision_assisted_tenant(uuid, uuid, text, text, text, text, text, text, text, uuid, text, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.convert_quote_to_order(uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_quote_revision(uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.apply_credit_payment(uuid, numeric, text, text, uuid, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.charge_order_to_credit(uuid, uuid, uuid, text) TO service_role;
