-- Update commission calculation trigger to use product commission_amount

CREATE OR REPLACE FUNCTION calculate_order_commission()
RETURNS TRIGGER AS $$
DECLARE
  v_assigned_user uuid;
  v_total_revenue decimal(12,2);
  v_total_cost decimal(12,2);
  v_gross_profit decimal(12,2);
  v_products_count int;
  v_services_count int;
  v_total_items int;
  v_commission_amount decimal(12,2);
  v_commission_config jsonb;
BEGIN
  IF NEW.status = 'paid' AND NEW.assigned_to IS NOT NULL AND OLD.status != 'paid' THEN
    v_assigned_user := NEW.assigned_to;
    
    SELECT 
      COALESCE(SUM(oi.subtotal), 0),
      COALESCE(SUM(p.cost_price * oi.quantity), 0),
      COUNT(CASE WHEN p.type = 'product' THEN 1 END),
      COUNT(CASE WHEN p.type = 'service' THEN 1 END),
      COALESCE(SUM(oi.quantity), 0),
      COALESCE(SUM(COALESCE(p.commission_amount, 0) * oi.quantity), 0)
    INTO 
      v_total_revenue,
      v_total_cost,
      v_products_count,
      v_services_count,
      v_total_items,
      v_commission_amount
    FROM public.order_items oi
    JOIN public.products p ON p.id = oi.product_id
    WHERE oi.order_id = NEW.id;
    
    v_gross_profit := v_total_revenue - v_total_cost;
    
    v_commission_config := jsonb_build_object(
      'products', jsonb_build_object('qty', v_products_count, 'amount', 0),
      'services', jsonb_build_object('qty', v_services_count, 'amount', 0)
    );
    
    INSERT INTO public.sales_commissions (
      tenant_id, order_id, user_id,
      total_items_sold, products_count, services_count,
      total_revenue, total_cost, gross_profit,
      commission_amount, commission_config
    ) VALUES (
      NEW.tenant_id, NEW.id, v_assigned_user,
      v_total_items, v_products_count, v_services_count,
      v_total_revenue, v_total_cost, v_gross_profit,
      v_commission_amount, v_commission_config
    )
    ON CONFLICT (order_id) DO UPDATE SET
      total_items_sold = EXCLUDED.total_items_sold,
      products_count = EXCLUDED.products_count,
      services_count = EXCLUDED.services_count,
      total_revenue = EXCLUDED.total_revenue,
      total_cost = EXCLUDED.total_cost,
      gross_profit = EXCLUDED.gross_profit,
      commission_amount = EXCLUDED.commission_amount,
      commission_config = EXCLUDED.commission_config,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;