-- Reverts 20261022000001_offer_plans.sql. Run only if the release that uses
-- plans is rolled back too. Plan instances are left as plain cancelled
-- subscriptions; their orders and payments are kept.

BEGIN;

DROP TRIGGER IF EXISTS order_plan_period_trigger ON public.orders;
DROP FUNCTION IF EXISTS public.handle_plan_period_payment();
DROP FUNCTION IF EXISTS public.ensure_due_periods(uuid, uuid, timestamptz);
DROP FUNCTION IF EXISTS public.create_plan_period_order(uuid, integer);
DROP FUNCTION IF EXISTS public.create_checkout_plan_instances(uuid, uuid);
DROP FUNCTION IF EXISTS public.save_offer_plan(jsonb, jsonb);
DROP FUNCTION IF EXISTS public.plan_period_bounds(timestamptz, text, integer, integer);

ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_line_kind_check;
ALTER TABLE public.order_items
  DROP COLUMN IF EXISTS subscription_id,
  DROP COLUMN IF EXISTS line_kind;

DROP TABLE IF EXISTS public.order_plan_charges;
DROP TABLE IF EXISTS public.subscription_periods;
DROP TABLE IF EXISTS public.public_cart_plans;

UPDATE public.subscriptions
SET status = 'cancelled', cancelled_at = COALESCE(cancelled_at, now())
WHERE status = 'past_due' OR (offer_plan_id IS NOT NULL AND status NOT IN ('completed', 'cancelled'));

ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_check CHECK (
  status IN ('pending_setup', 'active', 'paused', 'card_failed', 'completed', 'cancelled')
);

DROP INDEX IF EXISTS public.subscriptions_public_token_idx;
DROP INDEX IF EXISTS public.subscriptions_offer_plan_idx;
ALTER TABLE public.subscriptions
  DROP COLUMN IF EXISTS past_due_since,
  DROP COLUMN IF EXISTS cancel_at_period_end,
  DROP COLUMN IF EXISTS public_token,
  DROP COLUMN IF EXISTS fulfillment_snapshot,
  DROP COLUMN IF EXISTS plan_snapshot,
  DROP COLUMN IF EXISTS current_period_end,
  DROP COLUMN IF EXISTS current_period_start,
  DROP COLUMN IF EXISTS current_period_number,
  DROP COLUMN IF EXISTS billing_method,
  DROP COLUMN IF EXISTS plan_kind,
  DROP COLUMN IF EXISTS offer_plan_id;

DROP TABLE IF EXISTS public.offer_plan_items;
DROP TABLE IF EXISTS public.offer_plans;

COMMIT;
