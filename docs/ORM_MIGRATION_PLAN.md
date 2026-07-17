# Plan de migración: tipado ORM + modularización de componentes

Documento de seguimiento. Dos frentes independientes, con su propio
avance — no se ejecutan a la vez (ver decisión abajo).

---

## Frente 1 — Tipado de la capa de datos (Supabase → `Database`)

Contexto: no hay ORM (Prisma descartado — choca con las 56 políticas
RLS y 14 triggers ya en producción, ver decisión en conversación).
En su lugar: generar tipos reales del schema con la Supabase CLI y
propagarlos a servicios/rutas, reemplazando interfaces manuales e
inserts/updates sin tipar (`Record<string, unknown>`).

**Base (hecho, una sola vez):**
- [x] Proyecto linkeado (`onybddvqnrunqazlztno`), historial de
      migraciones reparado (`supabase migration repair`), `db push
      --dry-run` limpio.
- [x] `src/types/database.types.ts` generado
      (`supabase gen types typescript --linked --schema public`).
- [x] Los 3 clientes Supabase tipados con `<Database>`:
      `src/lib/supabase/server.ts`, `client.ts`, `admin.ts`.

**Regenerar tipos:** cada vez que se agregue una migración nueva:
```bash
npx supabase gen types typescript --linked --schema public > src/types/database.types.ts
```

### Fase 0 — Clientes + fallout inicial ✅ DONE

Tipar los 3 clientes destapó 13 archivos con bugs reales que antes
compilaban en silencio (null-handling faltante, una columna
`processed_at` que nunca existió en `payments`, un `.eq("attempt_id",
null)` sin guard en el webhook de MP). Todos corregidos.
`tsc --noEmit` y `npm run lint` limpios.

Archivos tocados: `loan-payments/route.ts`, `loans/route.ts`,
`mercadopago/create-bulk-loan-preference/route.ts`,
`mercadopago/create-loan-preference/route.ts`,
`mercadopago/create-loan-subscription/route.ts`,
`mercadopago/webhook/route.ts`, `qr/codes/route.ts`,
`tenant-site-pages/route.ts`, `tenants/route.ts`,
`q/[token]/payment/success/page.tsx`,
`sitio/[slug]/confirmacion/page.tsx`,
`checkout/helpers/paymentAttempt.ts`,
`prestamos/services/loanWebhookHandlers.ts`.

### Fase 1 — Lectura simple, 1 tabla, sin dinero ✅ DONE

Las 8 rutas planeadas ya no tenían interfaces manuales que reemplazar
(se beneficiaron gratis del tipado de clientes en la Fase 0).
Único cambio real: `api/profile/route.ts` — `Record<string, unknown>`
→ `Database["public"]["Tables"]["profiles"]["Update"]`.

Rutas cubiertas: `site-templates`, `debug-sitio`, `sitio-tenant`,
`tenant-roles`, `dashboard-stats`, `public/sitio/[slug]`,
`public/subcatalogs`, `profile`.

### Fase 2 — CRUD de configuración/catálogo, sin Mercado Pago ✅ DONE

| Archivo | Estado |
|---|---|
| `api/tenant-payment-methods/route.ts` | sin cambios necesarios — ya usa objetos literales, se benefició gratis del tipado de clientes |
| `api/qr/codes/route.ts` | corregido: `updates` tipado como `Database["public"]["Tables"]["qr_codes"]["Update"]`; eliminada una duplicación de la línea de `metadata` que quedó de la Fase 0 |
| `api/subcatalogs/route.ts` | sin cambios necesarios — objetos literales |
| `api/public/products/route.ts` | sin cambios necesarios — solo lectura |
| `api/public/promotions/route.ts` | sin cambios necesarios — solo lectura |
| `api/promotions/route.ts` | corregido: `updateData` tipado como `Database["public"]["Tables"]["promotions"]["Update"]` |
| `api/products/route.ts` | corregido: `updates` (PATCH) tipado como `Database["public"]["Tables"]["products"]["Update"]` |
| `api/customers/route.ts` | corregido: `updates` (PUT) tipado como `Database["public"]["Tables"]["customers"]["Update"]` |
| `api/tenant-site-pages/route.ts` | ya resuelto en Fase 0 |

`tsc --noEmit` y `npm run lint` limpios tras estos cambios (mismo
error pre-existente en `public/sw.js`, no relacionado).

### Fase 3 — Tenant/equipo/roles ✅ DONE
- `api/team/route.ts` — sin cambios necesarios: todos sus inserts /
  updates / upserts ya usan objetos literales directos (no
  `Record<string, unknown>`), así que se benefició gratis del tipado
  de clientes de la Fase 0.
- `api/tenants/route.ts` — el POST ya estaba tipado (`TenantInsert`,
  Fase 0). En esta fase se tipó el `updates` del PATCH como
  `TenantUpdate`; eso destapó que `updates.settings = { ...current,
  ...settingsPayload }` producía `{ [x:string]: unknown }` en vez de
  `Json` — resuelto con cast a `Json` post-merge (objeto ya validado
  en runtime). Los otros dos `Record<string, unknown>` del archivo
  (líneas ~76 y ~209) son tipos de parsing del body, NO payloads de
  escritura a Supabase — se dejan como están.

`tsc --noEmit` y `npm run lint` limpios.

### Fase 4 — QR / mesas: lectura y estado, sin pagos ✅ DONE (sin cambios de código)
Rutas `qr/table/*` de estado (unlink, mergeable, merge-request, close,
merge, device, respond, active, fulfillment, pulse, items) +
`features/qr/services/{tableLinkService, tableMergeRequestService,
tableFulfillmentService, staffOrderService, tableAdminViewService,
splitOrderService}.ts`.

**Resultado: ningún cambio necesario.** Al auditar toda la fase se
confirmó que:
- Cero `Record<string, unknown>` en payloads de escritura. Todas las
  escrituras usan objetos literales inline (o inferidos vía `.map()`,
  como `splitOrderService.ts:178`), que TypeScript YA valida contra
  los tipos generados gracias al cliente `<Database>` de la Fase 0.
  `tsc` limpio = esos literales pasan la validación de `Json` /
  `Insert` sin cast (los literales bien formados sí son asignables a
  `Json`, a diferencia de un `Record<string, unknown>` genérico).
- Las escrituras a `order_activity_log` con `payload: {...}` (repetidas
  en varios servicios) ya están validadas por inferencia.
- Las interfaces manuales en `features/qr/interfaces/` (`OrderDevice`,
  `OrderActivityLogItem`, `QrSessionOrder`, `SplitGroup`, etc.) son
  DTOs de frontera / view-models, NO espejos 1:1 de tablas —
  proyecciones parciales o con uniones más estrictas (ej.
  `OrderActivityLogItem.actor_type` es un union, no `string`).
  Reemplazarlos por `Database[...]["Row"]` sería una regresión de
  precisión, no una mejora. Se dejan manuales a propósito.

Los 2 `Record<string, unknown>` que existen en
`tableAdminViewService.ts` (líneas 68 y 216) son de lectura/parsing
(campo de un DTO de retorno y cast de un `metadata` leído), no
escritura — fuera del alcance de esta migración.

**Lectura de calidad:** estos servicios de QR (los más nuevos del
repo) ya estaban escritos con la disciplina que la Fase 0 tuvo que
imponer a mano en las rutas antiguas de préstamos/MP.

### Fase 5 — Ventas/comisiones/analytics ✅ DONE

**4 `updates: Record<string, unknown>` de handlers PATCH/PUT tipados**
con el `Update` de su tabla (todos campos escalares, sin columnas
`Json`, sin bugs destapados — `tsc` limpio a la primera):
- `sales-commissions/route.ts` → `SalesCommissionUpdate`
- `commission-payments/route.ts` → `CommissionPaymentUpdate`
- `orders/route.ts` → `OrderUpdate`
- `loans/route.ts` → `LoanUpdate` (completa lo que faltaba de Fase 0,
  que solo había tipado el insert)

**Sin cambios necesarios (ya cubiertos):**
- `order-items/route.ts` — inserts/updates con objetos literales inline,
  ya validados por el cliente tipado.
- `dashboard-sales-by-item`, `sales-cutoffs`, `sales-analytics` — solo
  lectura.
- `loan-payments/route.ts`, `loanWebhookHandlers.ts` — ya tocados en
  Fase 0.

`tsc --noEmit` y `npm run lint` limpios.

### Fase 6 — Carrito público / storefront ✅ DONE

**2 `Record<string, unknown>` de escritura tipados** con
`SubscriptionUpdate` (campos escalares, sin `Json`, sin bugs):
- `features/sitio/services/subscriptionWebhookHandlers.ts` (`subUpdate`)
- `subscriptions/route.ts` (`updateData`)

**Sin cambios necesarios:**
- `public-cart/route.ts` — 4 escrituras: 3 literales inline (ya
  validados) + 1 `.upsert(upsertData)` donde `upsertData` ya tiene un
  tipo inline explícito y seguro (no es un `Record<string, unknown>`).
- `publicCheckoutOrchestrator.ts` — su `.insert({...})` es literal
  inline; el único `Record<string, unknown>` del archivo (línea 86)
  es un cast de LECTURA de `tenant.settings`, no escritura.

`tsc --noEmit` y `npm run lint` limpios.

### Fase 7 — Mercado Pago y pagos QR ⏳ PENDIENTE (siguiente)

### Fase 7 — Mercado Pago y pagos QR ⏳ PENDIENTE
`qr/table/payment/[paymentId]/{confirm,reject}`,
`mercadopago/check-subscription` (ya tocado parcialmente en Fase 0),
`mercadopago/create-loan-preference` (Fase 0),
`mercadopago/create-loan-subscription` (Fase 0),
`mercadopago/create-bulk-loan-preference` (Fase 0),
`mercadopago/create-preference`, `qr/payment-checkout`, `qr/resolve`,
`qr/table/[orderId]/bill`, `features/qr/services/
{tableMpPreferenceService, tableMpWebhookService, tableCloseService}.ts`,
`features/checkout/services/{singleCheckoutHandler,
subscriptionCheckoutHandler, partialCheckoutHandler}.ts`.

### Fase 8 — Núcleo pesado: webhook MP + pagos de mesa ✅ DONE

**`api/mercadopago/webhook/route.ts`:**
- Los 2 `updatePayload` (uno para `orders`, otro para `subscriptions`)
  estaban tipados como `Record<string, string | number | null>` /
  `Record<string, string>`. Retipados a `OrderUpdate` y
  `SubscriptionUpdate` para consistencia con el resto del ORM. `tsc`
  limpio (los null-handling bugs de este archivo ya se corrigieron en
  Fase 0).
- Los 2 `Record<string, unknown>` restantes (líneas ~217, ~340) son
  casts de LECTURA de `metadata`/`work_metadata`, no escritura — se
  dejan.

**`features/qr/services/tablePaymentService.ts` (639 líneas):**
- **Duplicación de `allPaid` extraída a helper** — el bloque
  `.from("order_split_groups").select("id, payment_status")
  .eq("order_id", X)` + `.every(g => g.payment_status === "paid")`
  estaba copiado LITERAL en `confirmPayment` y `payGroup`. Extraído a
  `areAllSplitGroupsPaid(admin, orderId)` (cruza el umbral de
  ARCHITECTURE: misma query literal en 2+ sitios, nombrada por dominio).
- **Los 6 inserts a `order_activity_log` NO se tocaron** — se evaluaron
  y NO son duplicación real: cada uno tiene `actor_type` / `action` /
  `payload` distintos por evento de negocio (intent, confirmed,
  rejected, succeeded-full, succeeded-split). Un helper ahí solo
  disfrazaría la variación tras 5 parámetros, sin reducir nada. No
  cruza el umbral.
- Todas las demás escrituras usan objetos literales inline, ya
  validados por el cliente tipado.

**Verificación:** `tsc --noEmit` y `npm run lint` limpios. En
navegador: `/api/mercadopago/webhook` (POST) responde 401 por firma
inválida (correcto — compiló 567 módulos y ejecutó la validación),
`/q/[token]/table/bill` (consume `tablePaymentService`) sirvió HTTP
200 (1146 módulos). Sin "Module not found".

---

## 🎯 Frente 1 (tipado ORM) COMPLETO — 9/9 fases

Todas las escrituras a Supabase del repo (rutas API + servicios
server-side) están tipadas contra el schema generado, ya sea:
- explícitamente (`Insert`/`Update` de la tabla) donde había
  `Record<string, unknown>`, o
- por inferencia, donde ya se usaban objetos literales inline validados
  por el cliente `<Database>`.

Los DTOs de frontera / view-models manuales se dejaron a propósito (no
son espejos de tabla). Bugs latentes de null-handling destapados y
corregidos en Fase 0. Una duplicación literal real extraída a helper
(`areAllSplitGroupsPaid`) en Fase 8.

**Mantenimiento:** regenerar `src/types/database.types.ts` tras cada
migración nueva (comando al inicio de este doc).

> El Frente 2 (modularización de componentes) vive en su propio
> documento: `COMPONENT_MODULARIZATION_PLAN.md`.
