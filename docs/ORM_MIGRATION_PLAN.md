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

### Fase 4 — QR / mesas: lectura y estado, sin pagos ⏳ PENDIENTE (siguiente)
Rutas `qr/table/*` de estado (unlink, mergeable, merge-request, close,
merge, device, respond, active, fulfillment, pulse, items) +
`features/qr/services/{tableLinkService, tableMergeRequestService,
tableFulfillmentService, staffOrderService, tableAdminViewService,
splitOrderService}.ts`.

### Fase 5 — Ventas/comisiones/analytics ⏳ PENDIENTE
`sales-commissions`, `commission-payments`, `loan-payments` (ya tocado
parcialmente en Fase 0), `dashboard-sales-by-item`, `sales-cutoffs`,
`sales-analytics`, `orders`, `order-items`, `loans` (ya tocado
parcialmente en Fase 0), `features/prestamos/services/
loanWebhookHandlers.ts` (ya tocado en Fase 0).

### Fase 6 — Carrito público / storefront ⏳ PENDIENTE
`public-cart`, `checkout/services/publicCheckoutOrchestrator.ts`,
`features/sitio/services/subscriptionWebhookHandlers.ts`,
`subscriptions`.

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

### Fase 8 — Núcleo pesado: webhook MP + pagos de mesa ⏳ PENDIENTE
`api/mercadopago/webhook/route.ts` (ya tocado parcialmente en Fase 0),
`features/qr/services/tablePaymentService.ts` (el más pesado — 639
líneas, duplicación ya confirmada de `allPaid` y
`order_activity_log` insert).

---

## Frente 2 — Modularización de componentes por feature

Contexto: no se permiten barrel files (confirmado — hoy no existe
ninguno, la regla ya se respeta). El hallazgo es distinto: varias
features tienen componentes sueltos directo en `components/` que
deberían agruparse en subcarpetas por dominio/cohesión, siguiendo la
única referencia positiva que ya existe en el repo:
`features/sitio/components/icons/`.

**Regla a aplicar:** agrupar por dominio cuando hay 3+ archivos con
prefijo/tema compartido. No forzar subcarpeta en features con 1-2
archivos sueltos (`auth`, `onboarding`, `productos`, `servicios`,
`equipo`, `sitio-web` — tamaño trivial, no aplica).

**Importante (pedido explícito del usuario):** al mover archivos,
actualizar SOLO los imports que apunten a la nueva ruta. No tocar
ninguna otra cosa del archivo (ni lógica, ni estilo, ni nombres) —
esto es un refactor de ubicación, no de contenido.

| Feature | Estado actual | Subcarpetas propuestas | Prioridad |
|---|---|---|---|
| **qr** | 47 archivos sueltos, 0 subcarpetas | `table/`, `bill/`, `payment/`, `split/`, `customer/`, `menu-product/`, `qr-create/`, `order-tracker/` (quedan sueltos genéricos: `BrandImage`, `ConfettiBurst`, `PromoBanner`, `MergeRequestBanner`, `DeviceNamePrompt`, `PerPersonFulfillmentCard`, `ServiceWorkerFreshnessGuard`) | Alta — peor caso, 8+ dominios mezclados |
| **checkout** | Todo bajo `cart/` (16 archivos), pero mezcla dominios distintos | Separar `cart/` (ítems) de `payment-plan/` (`FrequencyPicker`, `InstallmentsPicker`, `MsiPicker`, `MsiBreakdownCard`, `FeesBreakdownCard`, `PaymentModeTabs`) y dejar el resto (`CheckoutBody`, `CheckoutFormFields`, `DesktopCheckoutAside`, `MobileCheckoutBar/Sheet`) en la raíz de `checkout/` o en `checkout-flow/` | Alta — es el caso que motivó la revisión |
| **orders** | 11 sueltos | `order/` (`OrderActionButtons`, `OrderHeader`, `OrderItemsTable`, `OrderPaymentPlanCard`, `CustomerCard`), `payment/` (`ConfirmPaymentModal`, `PaymentLinkCard`, `GenerateLinkModal`, `AssignBeforePaidModal`, `AssignmentCard`, `DiscountModal`), `receipt/` (`ReceiptPreview`, `ReceiptActions`) | Media |
| **configuracion** | 12 sueltos | `site-content/`, `config-sections/`, `bank-account/` (queda suelto: `CardIconSelector`) | Media |
| **prestamos** | 5 sueltos | `customer/` (`CustomerFields`, `CustomerPicker`), `loan-items/` (`AddProductCombobox`, `LoanItemRow`) — `FieldError` es candidato a moverse a `src/components/ui/` (genérico, no específico del feature) | Baja |
| **landing** | 11 sueltos, todos `Landing*` | Opcional — cohesión ya clara por nombre, bajo impacto | Baja / opcional |

**Sin acción:** `sitio` (ya modular, referencia), `sitio-web`, `auth`,
`onboarding`, `productos`, `servicios`, `equipo` (1-2 archivos,
trivial), `promociones`/`ventas`/`suscripciones` (sin carpeta
`components/`).

---

## Actualización de skills pendiente

Una vez validado el patrón en al menos 1-2 features reales, agregar a
`.claude/skills/clean-code/SKILL.md` una regla explícita:
- Umbral de agrupación: 3+ componentes con dominio/prefijo compartido
  → subcarpeta.
- Ejemplo canónico de referencia: `features/sitio/components/icons/`.
- Al mover: solo tocar imports, cero cambios de contenido/lógica.
