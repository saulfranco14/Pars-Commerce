# Sistema Completo de Stock, Costos y Comisiones

## ✅ IMPLEMENTACIÓN COMPLETA

### 1. Gestión Automática de Stock

**Solo para productos** (`type = 'product'`):

- ✅ Descuento automático cuando orden pasa a `paid`
- ✅ Restauración automática si orden `paid` se cancela
- ✅ Registro en `inventory_movements`
- ✅ Validación de stock disponible al agregar items

**Servicios** (`type = 'service'`):

- ✅ NO controlan stock (`track_stock = false`)
- ✅ No aplican validaciones de inventario

### 2. Campos de Precio y Costo

**Productos:**

- ✅ `price` - Precio de venta (requerido)
- ✅ `cost_price` - Costo del producto (requerido)
- ✅ `commission_amount` - Comisión por unidad (opcional)

**Servicios:**

- ✅ `price` - Precio de venta (requerido)
- ✅ `cost_price` - Costo del servicio (requerido)
- ✅ `commission_amount` - Comisión por servicio (opcional)
- ✅ `track_stock` - Siempre false

### 3. Sistema de Comisiones

**Automático al marcar orden como `paid`:**

- ✅ Crea registro en `sales_commissions`
- ✅ Calcula automáticamente:
  - Total vendido (revenue)
  - Costo total
  - Ganancia bruta (revenue - cost)
  - Comisión (suma de `commission_amount` × cantidad por cada item)
  - Cuenta de productos y servicios vendidos

**API completa:**

- ✅ GET con filtros (persona, estado, fechas)
- ✅ PATCH para marcar individual como pagada
- ✅ PATCH para editar monto de comisión

### 4. Sistema de Pagos por Períodos

**Tabla `commission_payments`:**

- ✅ Agrupa comisiones por día/semana/mes
- ✅ Estados: `pending` (activo) y `paid` (archivado)
- ✅ Al marcar como pagado: actualiza todas las `sales_commissions` del período

**API completa:**

- ✅ GET con filtros (persona, estado, fechas)
- ✅ POST para generar pago de período
- ✅ PATCH para marcar como pagado
- ✅ PATCH para editar monto

### 5. Interfaz de Usuario Completa

**Página "Ventas y Comisiones" con 4 pestañas:**

1. **Resumen** - Cards con totales:

   - Total vendido
   - Costo total
   - Ganancia bruta
   - Comisiones pendientes
   - Comisiones pagadas

2. **Por persona** - Tabla agrupada:

   - Productos vendidos
   - Servicios vendidos
   - Total vendido
   - Ganancia bruta
   - Comisión total
   - Estado (pendiente/pagada)

3. **Por orden** - Tabla detallada:

   - Link a orden
   - Fecha, persona asignada
   - Productos y servicios
   - Total, ganancia, comisión
   - Estado y acción para marcar como pagada

4. **Pagos** - Gestión de períodos:
   - Selector de período (día/semana/mes)
   - Botones para generar pagos por persona
   - Tabla de pagos registrados
   - Acciones: editar monto y marcar como pagado
   - Filtros por persona y estado

**Formularios actualizados:**

- ✅ Productos (nuevo y editar): precio venta, costo, comisión
- ✅ Servicios (nuevo y editar): precio venta, costo, comisión

## Migraciones Creadas (7)

1. `20260208000001_add_products_theme.sql` - Campo theme
2. `20260208000002_auto_inventory_management.sql` - Stock automático
3. `20260208000003_add_product_cost.sql` - Campo cost_price
4. `20260208000004_sales_commissions.sql` - Tabla comisiones + trigger
5. `20260208000005_add_product_commission.sql` - Campo commission_amount
6. `20260208000006_update_commission_calculation.sql` - Trigger actualizado
7. `20260208000007_commission_payments.sql` - Tabla pagos por períodos

## Aplicar Cambios

```bash
npx supabase db push
```

## Flujo de Uso Completo

### Configuración inicial:

1. Crear productos/servicios con:
   - Precio de venta
   - Costo
   - Comisión por unidad (opcional)

### Operación diaria:

2. Crear órdenes y agregar items
3. Validación automática de stock (solo productos)
4. Asignar orden a persona del equipo
5. Marcar orden como `paid`:
   - Se descuenta stock (productos)
   - Se crea comisión automáticamente

### Revisión y pagos:

6. Ver comisiones en "Ventas y Comisiones":

   - Filtrar por persona/fecha
   - Ver resumen de ganancias
   - Ver detalle por persona o por orden

7. Generar pagos periódicos (pestaña "Pagos"):

   - Seleccionar período (día/semana/mes actual)
   - Ver personas con comisiones pendientes
   - Generar pago agrupado
   - Editar monto si es necesario
   - Marcar como pagado cuando se realice

8. Consultar histórico:
   - Filtrar por estado "Pagados"
   - Ver todos los pagos realizados

## Ventajas del Sistema

- **Automatización**: Stock y comisiones se calculan automáticamente
- **Flexibilidad**: Comisiones configurables por producto/servicio
- **Trazabilidad**: Histórico completo de pagos y movimientos
- **Organización**: Pagos agrupados por períodos para mejor control
- **Separación**: Productos con stock, servicios sin stock
- **Claridad**: Ganancias brutas visibles separadas de comisiones
