-- Auto inventory management: deduct stock when order is paid, restore when cancelled

CREATE OR REPLACE FUNCTION handle_order_inventory()
RETURNS TRIGGER AS $$
DECLARE
  v_item RECORD;
BEGIN
  -- Si cambia a 'paid', descontar stock (solo productos)
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    FOR v_item IN 
      SELECT oi.product_id, oi.quantity, p.track_stock, p.type
      FROM public.order_items oi
      JOIN public.products p ON p.id = oi.product_id
      WHERE oi.order_id = NEW.id 
        AND p.track_stock = true 
        AND p.type = 'product'
    LOOP
      -- Descontar del inventario
      UPDATE public.product_inventory
      SET 
        quantity = quantity - v_item.quantity,
        updated_at = now()
      WHERE product_id = v_item.product_id;
      
      -- Registrar movimiento
      INSERT INTO public.inventory_movements (
        product_id,
        type,
        quantity,
        reference,
        reference_id,
        created_by
      ) VALUES (
        v_item.product_id,
        'sale',
        -v_item.quantity,
        'order',
        NEW.id,
        NEW.completed_by
      );
    END LOOP;
  END IF;
  
  -- Si cambia a 'cancelled' desde 'paid', restaurar stock (solo productos)
  IF NEW.status = 'cancelled' AND OLD.status = 'paid' THEN
    FOR v_item IN 
      SELECT oi.product_id, oi.quantity, p.track_stock, p.type
      FROM public.order_items oi
      JOIN public.products p ON p.id = oi.product_id
      WHERE oi.order_id = NEW.id 
        AND p.track_stock = true 
        AND p.type = 'product'
    LOOP
      -- Restaurar inventario
      UPDATE public.product_inventory
      SET 
        quantity = quantity + v_item.quantity,
        updated_at = now()
      WHERE product_id = v_item.product_id;
      
      -- Registrar movimiento de restauración
      INSERT INTO public.inventory_movements (
        product_id,
        type,
        quantity,
        reference,
        reference_id,
        created_by
      ) VALUES (
        v_item.product_id,
        'cancelled_sale',
        v_item.quantity,
        'order',
        NEW.id,
        auth.uid()
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER order_inventory_trigger
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_order_inventory();