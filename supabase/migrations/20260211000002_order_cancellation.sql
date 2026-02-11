-- Order cancellation: cancelled_from, voided_at on commissions, trigger to void commission on cancel

alter table public.orders add column if not exists cancelled_from text;

alter table public.sales_commissions add column if not exists voided_at timestamptz;

create or replace function public.void_sale_commission_on_cancel()
returns trigger as $$
begin
  if NEW.status = 'cancelled' and OLD.status = 'paid' then
    update public.sales_commissions
    set voided_at = now(), updated_at = now()
    where order_id = NEW.id and voided_at is null;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists order_void_commission_trigger on public.orders;
create trigger order_void_commission_trigger
  after update of status on public.orders
  for each row
  execute function void_sale_commission_on_cancel();
