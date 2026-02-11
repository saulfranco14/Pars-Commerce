-- Add MercadoPago payment link columns to orders
alter table public.orders add column if not exists payment_link text;
alter table public.orders add column if not exists mp_preference_id text;
