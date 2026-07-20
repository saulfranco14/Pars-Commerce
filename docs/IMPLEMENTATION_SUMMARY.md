# Sistema de Stock, Costos y Comisiones - Implementación Completa

## Resumen de Cambios Realizados

### 1. ✅ Gestión Automática de Stock (Solo Productos)

**Archivos creados:**

- `supabase/migrations/20260208000002_auto_inventory_management.sql`

**Funcionalidad:**

- Trigger que descuenta stock automáticamente cuando orden pasa a `paid`
- Trigger que restaura stock cuando orden `paid` se cancela
- **IMPORTANTE:** Solo aplica a productos (`type = 'product'`), los servicios NO controlan stock
- Validación en API de order-items solo verifica stock para productos

### 2. ✅ Campo de Costo en Productos y Servicios

**Archivos creados:**

- `supabase/migrations/20260208000003_add_product_cost.sql`

**Archivos modificados:**

- `src/lib/productValidation.ts` - Agregado `cost_price` requerido
- `src/lib/serviceValidation.ts` - Agregado `cost_price` requerido
- `src/app/api/products/route.ts` - Incluido en GET/POST/PATCH
- Formularios de productos y servicios (nuevo y editar)

**Funcionalidad:**

- Campo `cost_price` requerido para calcular ganancias
- Formularios actualizados con campo "Costo del producto/servicio"

### 3. ✅ Campo de Comisión Opcional por Producto/Servicio

**Archivos creados:**

- `supabase/migrations/20260208000005_add_product_commission.sql`
- `supabase/migrations/20260208000006_update_commission_calculation.sql`

**Funcionalidad:**

- Campo `commission_amount` opcional en productos y servicios
- Trigger actualizado para calcular comisión usando este valor al crear `sales_commissions`
- Formularios actualizados con campo "Comisión por unidad (opcional)"

### 4. ✅ Módulo de Ventas y Comisiones

**Archivos creados:**

- `supabase/migrations/20260208000004_sales_commissions.sql`
- `src/app/api/sales-commissions/route.ts`
- `src/types/sales.ts`
- `src/app/dashboard/[tenantSlug]/ventas/page.tsx`

**Archivos modificados:**

- `src/components/layout/Sidebar.tsx` - Agregado enlace "Ventas y Comisiones"

**Funcionalidad:**

- Tabla `sales_commissions` que registra automáticamente comisiones cuando orden pasa a `paid`
- Cálculo automático de: revenue, costo, ganancia bruta, comisión
- API con filtros por persona, estado de pago, fechas
- Página con 3 vistas:
  - **Resumen**: Cards con totales
  - **Por persona**: Tabla agrupada por miembro del equipo
  - **Por orden**: Tabla detallada con opción de marcar como pagada

### 5. ✅ Sistema de Pagos por Períodos

**Archivos creados:**

- `supabase/migrations/20260208000007_commission_payments.sql`
- `src/app/api/commission-payments/route.ts`

**Funcionalidad:**

- Tabla `commission_payments` para agrupar pagos por períodos (día/semana/mes)
- API para crear pagos de períodos y marcarlos como pagados
- Cuando se marca un pago como pagado, actualiza todas las `sales_commissions` del período
- Estados: `pending` (actual/visible) y `paid` (archivado/histórico)

## Flujo Completo del Sistema

```
1. Crear producto/servicio con:
   - price (precio de venta) *requerido*
   - cost_price (costo) *requerido*
   - commission_amount (comisión por unidad) *opcional*
   - track_stock (solo productos)

2. Crear orden y agregar items:
   - Si es producto con track_stock: valida stock disponible
   - Si es servicio: no valida stock

3. Orden pasa a estado 'paid':
   - Trigger descuenta stock (solo productos)
   - Trigger crea registro en sales_commissions con:
     * total_revenue (suma de precios de venta)
     * total_cost (suma de cost_price * quantity)
     * gross_profit (revenue - cost)
     * commission_amount (suma de commission_amount * quantity)

4. Ver comisiones en página "Ventas y Comisiones":
   - Filtrar por persona/fecha/estado
   - Ver resumen, por persona, por orden
   - Marcar comisiones individuales como pagadas

5. Sistema de Pagos (pendiente de UI completa):
   - Crear pago de período (día/semana/mes)
   - Agrupa todas las comisiones pendientes del período
   - Al marcar como pagado:
     * Actualiza commission_payments a 'paid'
     * Actualiza todas sales_commissions del período a is_paid=true
   - Pagos marcados se archivan (filtro muestra solo mes actual por defecto)
   - Histórico consultable
```

## Próximos Pasos Sugeridos

### UI de Pagos por Períodos (Pestaña adicional en Ventas)

1. Agregar pestaña "Pagos" en página de ventas
2. Selector de período: día/semana/mes actual
3. Lista de personas con comisiones pendientes del período
4. Botón "Generar pago" por persona
5. Vista de pagos realizados (histórico)

### Configuración de Comisiones por Usuario (Opcional)

- Tabla `user_commission_config` para configurar:
  - Comisión por defecto por tipo (producto/servicio)
  - Porcentaje vs monto fijo
  - Aplicar automáticamente si producto no tiene commission_amount

## Notas Importantes

- **Servicios NO controlan stock** - `track_stock` siempre false para `type='service'`
- **Comisiones son opcionales** - Si no se especifica en producto, queda en 0
- **Pagos archivados** - Una vez marcados como pagados, se pueden consultar pero no aparecen en vista principal
- **Trigger automático** - Todo el cálculo de comisiones es automático al marcar orden como `paid`

## Migraciones a Aplicar

```bash
npx supabase db push
```

Esto aplicará todas las migraciones en orden:

1. 20260208000002_auto_inventory_management.sql
2. 20260208000003_add_product_cost.sql
3. 20260208000004_sales_commissions.sql
4. 20260208000005_add_product_commission.sql
5. 20260208000006_update_commission_calculation.sql
6. 20260208000007_commission_payments.sql
