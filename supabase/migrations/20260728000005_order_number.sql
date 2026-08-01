-- El número que el cliente lee en voz alta en el mostrador ("C12FE2D3") era una
-- rebanada del id calculada en la UI, así que no se podía buscar por él. Ahora es
-- una columna generada: mismo valor, pero indexable.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS order_number text
  GENERATED ALWAYS AS (upper(left(id::text, 8))) STORED;

COMMENT ON COLUMN orders.order_number IS
  'Primeros 8 del id en mayúsculas. Es el número que se canta en el mostrador.';

-- Se busca siempre dentro de un negocio, nunca global.
CREATE INDEX IF NOT EXISTS orders_tenant_order_number_idx
  ON orders (tenant_id, order_number text_pattern_ops);
