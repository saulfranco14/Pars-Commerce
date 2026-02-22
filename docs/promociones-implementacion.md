# Promociones: Implementación Completa

Resumen de cambios, casos de uso, BD y ejemplos de UI.

---

## 1. Cambios en Base de Datos

### Tabla `promotions`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `apply_automatically` | boolean | Si true, al agregar producto desde catálogo se aplica esta promo si el producto está en ella |
| `priority` | smallint | Menor = más prioridad cuando varias promos aplican (default 100) |
| `trigger_product_ids` | uuid[] | Para buy_x_get_y_free: productos que deben estar en carrito |
| `trigger_quantity` | integer | Cantidad mínima del trigger por cada beneficio (default 1) |
| `free_quantity_per_trigger` | integer | Unidades gratis por cada trigger cumplido (default 1) |
| `free_quantity_max` | integer | Límite total de unidades gratis (opcional) |

### Tabla `public_cart_items`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `quantity_free` | integer | Unidades de las quantity que son gratis (default 0) |

### Tabla `order_items`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `quantity_free` | integer | Unidades gratis en este item para ticket (default 0) |

### Nuevo tipo de promoción

- `buy_x_get_y_free`: Compra X (trigger), lleva Y (product_ids) gratis.

### Migración

Archivo: `supabase/migrations/20260221000001_promotions_free_and_recalc.sql`

---

## 2. Casos de Uso

### UC1: Agregar producto desde catálogo
- Usuario agrega producto desde `/productos`.
- Si existe promoción con `apply_automatically=true` y el producto está en ella, se aplica el mejor precio.
- Si no, precio base.

### UC2: Agregar promoción al carrito
- Usuario agrega desde `/promociones/[slug]`.
- Para `buy_x_get_y_free`: se agregan trigger + productos gratis. Si no tenía trigger, se agregan ambos.
- Para otros tipos: se agregan productos con precio calculado.

### UC3: Quitar producto trigger (gratis con compra)
- Usuario tiene Vodka + Cerveza gratis. Quita el Vodka.
- Recalculo: la Cerveza ya no cumple condición → se cobra a precio normal o mejor promo aplicable.

### UC4: Mejor precio gana
- Producto en 2 promos: Mitad de precio ($25) y Ahorro $20 ($30).
- Se aplica la de mejor precio ($25).

### UC5: Unidades gratis + unidades pagadas
- Vodka + 1 Cerveza gratis. Usuario agrega 2 Cervezas más.
- Total: 1 gratis, 2 pagadas (a mejor precio si aplica).

---

## 3. Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `supabase/migrations/20260221000001_promotions_free_and_recalc.sql` | Nuevos campos en promotions, public_cart_items, order_items |
| `src/lib/cartRecalculation.ts` | Nuevo: lógica de recálculo (best price, buy_x_get_y_free) |
| `src/app/api/public-cart/route.ts` | recalcAndPersist, GET/POST/PATCH/DELETE recalculan |
| `src/app/api/promotions/route.ts` | Soporte buy_x_get_y_free, apply_automatically, priority, trigger/free |
| `src/app/api/public/promotions/route.ts` | Incluye trigger_product_ids en response |
| `src/app/api/checkout-pickup/route.ts` | quantity_free en order_items, subtotal correcto |
| `src/app/dashboard/[tenantSlug]/promociones/page.tsx` | Formulario buy_x_get_y_free, apply_automatically, priority |
| `src/app/sitio/[slug]/promociones/[promoSlug]/page.tsx` | Soporte buy_x_get_y_free, trigger_product_ids |
| `src/app/sitio/[slug]/carrito/CarritoContent.tsx` | Muestra quantity_free, nombre de promoción |
| `src/services/promotionsService.ts` | Nuevos tipos y campos |
| `src/services/publicCartService.ts` | quantity_free, promotion en PublicCartItem |

---

## 4. Ejemplos de UI

### Carrito con producto gratis
```
Vodka 700ml × 1                    $200.00
  [Mitad de precio]

Cerveza A 355ml × 3                 $ 50.00
  [Vodka + Cerveza gratis]
  $25 × 2 + 1 gratis = $50.00

SUBTOTAL                           $250.00
```

### Carrito sin promoción
```
Cerveza A 355ml × 2                 $100.00
  $50.00 × 2 = $100.00
```

### Ticket / Orden
- Cada ítem muestra: producto, cantidad, unit_price, subtotal.
- quantity_free se guarda para mostrar "X gratis" si se imprime ticket detallado.

---

## 5. Seguridad

- Precios siempre calculados en servidor (nunca del cliente).
- `price_snapshot` no se acepta del request.
- Recálculo en cada operación de carrito.

---

## 6. Cómo probar

1. Ejecutar migración: `supabase db push` o aplicar el SQL.
2. Crear promoción "buy_x_get_y_free": Vodka como trigger, Cerveza como regalo.
3. Agregar Vodka + promo al carrito → Cerveza debe aparecer gratis.
4. Quitar Vodka → Cerveza debe pasar a precio normal.
5. Crear promoción "percentage" con apply_automatically=true.
6. Agregar ese producto desde catálogo → debe aplicar el descuento.
