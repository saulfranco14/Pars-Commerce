-- Run BEFORE applying 20261022000001_offer_plans.sql. Read-only.
-- Every query must return zero rows for the migration to be safe.

-- 1. Subscription statuses outside the widened CHECK list.
SELECT status, count(*) AS rows
FROM public.subscriptions
WHERE status NOT IN ('pending_setup', 'active', 'paused', 'card_failed', 'completed', 'cancelled', 'past_due')
GROUP BY status;

-- 2. Tables or columns the migration adds must not already exist.
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    table_name IN ('offer_plans', 'offer_plan_items', 'public_cart_plans', 'subscription_periods', 'order_plan_charges')
    OR (table_name = 'subscriptions' AND column_name IN (
      'offer_plan_id', 'plan_kind', 'billing_method', 'current_period_number', 'current_period_start',
      'current_period_end', 'plan_snapshot', 'fulfillment_snapshot', 'public_token',
      'cancel_at_period_end', 'past_due_since'))
    OR (table_name = 'order_items' AND column_name IN ('line_kind', 'subscription_id'))
  );

-- 3. Triggers on orders with the same name.
SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.orders'::regclass AND tgname = 'order_plan_period_trigger';

-- Informational (not a blocker): legacy subscriptions stay on their current flow.
SELECT status, count(*) FROM public.subscriptions GROUP BY status;
