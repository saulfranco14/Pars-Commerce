# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Comandos

```bash
npm run dev      # Next.js dev server en http://localhost:3000
npm run build    # Build de producción
npm run start    # Servir build de producción
npm run lint     # ESLint sobre todo el repo
npx tsc --noEmit # Type-check del proyecto (sin emitir JS)
npm test                 # Vitest unit (*.test.ts, src/test/fakeSupabase.ts, sin red)
npm run test:integration # Vitest integration (*.itest.ts) contra Supabase local
```

Integración: Docker abierto, `npx supabase start` y, si la base local ya
existía, `npx supabase migration up --local` (start no re-aplica migraciones
sobre un volumen existente). Toda migración nueva que toque carrito, pedidos
o promociones lleva su `*.itest.ts` y su script de reversa en
`supabase/snippets/`. `test:integration` corre los archivos en serie: los
scripts de reversa toman locks de DDL que chocan con inserts en paralelo.

**Migraciones Supabase** (en `supabase/migrations/`, orden alfabético = cronológico):

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Alternativa manual: pegar cada `*.sql` en el SQL Editor del dashboard, en orden.

---

## Documentos obligatorios antes de tocar código

Tres documentos son lectura obligatoria antes de modificar cualquier
cosa. NO los repliques aquí — léelos.

- **`.claude/skills/clean-code/SKILL.md`** — disciplina de ingeniería
  agnóstica de stack: modularización, DRY, cuándo comentar, hook vs
  helper vs util, formularios declarativos, capa de datos, loading
  states, performance, seguridad. Léela PRIMERO — es la base sobre la
  que `ARCHITECTURE.md` construye lo específico de este repo.
- **`ARCHITECTURE.md`** — forma real de carpetas de este proyecto,
  contratos concretos (`ServiceResult<T>`), reglas de Mercado Pago, y
  los anti-patrones ya cazados en este repo específicamente.
- **`DESIGN_SYSTEM.md`** — contrato visual para pantallas customer-facing
  (`/src/app/q/**` y features dirigidas al cliente final). Define hero,
  tipografía, color, layout canónico (`CustomerScreen`), primitivas
  obligatorias (`Notification`, `FormSheet`, `FormInput`,
  `ConfirmDialog`).

Si encuentras código que viola estas reglas (ej. `formatCurrency`
duplicado, `fetch` inline en un componente, interface inline en `.tsx`,
banner inline en lugar de `<Notification>`), **refactoriza en vez de
copiar el anti-patrón**.

---

## Stack

Next.js 15 (App Router) + React 19 + TypeScript + Supabase (Auth + Postgres
+ RLS + Storage) + Zustand + SWR + React Hook Form + Yup + Tailwind CSS 4
+ Mercado Pago SDK + SendGrid (correo) + qrcode.react.

PWA: `@serwist/next` (service worker en `public/sw.js`).

---

## Mapa de arquitectura (lo que requiere leer varios archivos para entender)

### 1. Multi-tenant

Todo el dominio está scoped por `tenant_id`. Hay una sola base de datos
con RLS — cada query relevante debe filtrar por tenant.

- Tenant activo en el cliente: `useActiveTenant()` desde `@/stores/useTenantStore`.
- Verificación obligatoria en cada API route protegida:
  `supabase.auth.getUser()` → 401, luego `tenant_memberships` check → 403.
- Los roles NO son un enum en `tenant_memberships`: viven en la tabla
  **`tenant_roles`**, con un array `permissions jsonb`. Cada tenant recibe
  su propia copia de los 4 roles de sistema, sembrada por el trigger
  `handle_new_tenant()`. Un tenant puede además tener roles propios.
- Roles de sistema: `owner`, `member`, `cashier`, `waiter`. `member` es el
  valor por defecto del selector de invitación. No existe `admin` — no
  escribas comprobaciones contra ese rol.
- **Nunca autorices comparando el nombre del rol.** Un rol personalizado no
  entraría en el `if`, y el mismo nombre puede tener permisos distintos en
  dos tenants. Autoriza siempre por permiso:
  `requirePermission(userId, tenantId, "qr.write")` desde
  `@/lib/auth/requirePermission`, que devuelve
  `{ membershipId, roleId, roleName, permissions }`. El `owner` los pasa
  todos.
- Alcance de pedidos: `orders.view_all` vs `orders.view_assigned` deciden
  *qué* pedidos ve alguien; `orders.assign` / `orders.close` /
  `orders.addendum` / `orders.schedule_config` deciden qué puede hacer con
  ellos. Los nombres están en
  `features/orders/constants/orderPermissions.ts` y la decisión se resuelve
  en `features/orders/services/orderAccessService.ts` — no repitas la lógica
  en el route handler.
- Al invitar o cambiar el rol de alguien, la UI muestra qué podrá hacer.
  Ese texto se **compone de los permisos reales del rol**
  (`features/equipo/constants/roleDescriptions.ts`), no de su nombre; si
  agregas un permiso, agrégale su frase ahí o quedará invisible.

### 2. Features = módulos autocontenidos

Cada feature en `src/features/{name}/` sigue exactamente esta estructura
(ver `ARCHITECTURE.md` §2 para detalles):

```
components/   hooks/   helpers/   constants/   interfaces/   services/   validations/
```

Features actuales: `auth`, `checkout`, `configuracion`, `equipo`,
`landing`, `onboarding`, `orders`, `planes`, `prestamos`, `productos`,
`promociones`, `qr`, `servicios`, `sitio`, `sitio-web`, `suscripciones`,
`ventas`.

Las primitivas verdaderamente compartidas viven fuera de features:
- `src/components/ui/` — primitivas visuales transversales
  (`ConfirmDialog`, `FormSheet`, `FormInput`, `Notification`, `Toast`,
  `BottomSheet`).
- `src/components/admin/` — primitivas de pantallas internas del
  dashboard (`PageHeader`, `MetricsStrip`, `FilterTabs`, `StatusBadge`,
  `EmptyState`, `AdminListCard`, `actionButtonClasses`). Reglas de
  composición en `DESIGN_SYSTEM.md §4.7`.
- `src/lib/` — clientes (`supabase/{client,server,admin}`, `mercadopago`,
  `swrFetcher`), helpers de errores, fee calculators (`loanUtils`).
- `src/stores/` — Zustand global (`useTenantStore`, `useSessionStore`).
- `src/services/apiFetch.ts` — wrapper único sobre `fetch`. Todos los
  client services del repo lo usan.
- `src/types/` — DTOs compartidos entre features.
- `src/constants/` — `commissionConfig.ts` y otras constantes globales.

### 3. Cliente Supabase: tres variantes

- `@/lib/supabase/server` — Server Components y API routes con cookies.
- `@/lib/supabase/client` — Client Components con sesión del browser.
- `@/lib/supabase/admin` — Service role key, salta RLS. Solo en código
  server-only (API routes, webhooks). Nunca importes desde un Client
  Component.

### 4. Patrón de API route (server-side service)

Route handlers en `src/app/api/**/route.ts` son adaptadores delgados:
parse body → llama al servicio → mapea error a HTTP. La lógica vive en
`features/{name}/services/*Service.ts`.

Convención de retorno de servicios server-side:
```ts
type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ServiceError };
```

`serviceErrorToResponse(error)` mapea `code` → HTTP status. Referencia
canónica: `src/features/qr/services/tablePaymentService.ts` +
`src/features/qr/services/serviceErrorToResponse.ts`.

### 5. Mercado Pago

Cliente único en `@/lib/mercadopago`. Toda creación de preferencia debe
seguir `ARCHITECTURE.md §6.1`:

- Negocio absorbe la comisión en flujos QR (mesas, propinas) →
  `metadata.fee_absorbed_by = "business"`. Nunca inflar `unit_price`.
- `auto_return: "approved"` solo cuando `base.startsWith("https://")`.
  En localhost MP rechaza la preferencia.
- Logear el error real del SDK (extraer de `err.cause.message`), no
  devolver mensajes genéricos.
- `external_reference` con prefijos por flujo:
  - `qr_table:{order_id}` → pago completo de mesa
  - `qr_table_group:{group_id}` → pago de grupo de split
  - `order:{order_id}:mode:single:attempt:{attempt_id}` → storefront
  - `loan:{id}` / `bulk_loan:{id}` → préstamos

Webhook en `/api/mercadopago/webhook/`. El despacho por prefijo se hace
en `tableMpWebhookService` (`isQrTableReference`, `handleQrTableMpPayment`)
y handlers análogos para storefront y préstamos.

Cálculo de fees: `src/constants/commissionConfig.ts` (`calcMsiBuyerTotal`,
`calcBuyerTotal`) y `src/lib/loanUtils.ts` para préstamos.

### 6. Flujo customer-facing (QR)

Las pantallas en `src/app/q/[token]/**` son la cara al cliente final.
Reglas no negociables:

- TODAS usan `<CustomerScreenLayout>` (`features/qr/components/`). No
  construyas un `<main>` + hero custom — extiende el layout si necesitas
  algo nuevo.
- Banners de status → `<Notification tone="...">`. Confirmaciones →
  `<ConfirmDialog>`. Forms en modal → `<FormSheet>`. Inputs →
  `<FormInput>`. Cero `window.confirm`, cero banners ad-hoc.
- Iconos: `lucide-react` ÚNICAMENTE. Cero emojis en componentes.
- **Copy e íconos NEUTRALES (multinegocio).** El QR de mesas lo usan
  negocios de cualquier rubro (autolavado, taller, spa, comida…), NO solo
  restaurantes. Prohibido copy/íconos específicos de comida en pantallas
  customer-facing: nada de `¿Qué se te antoja?`, `En preparación`,
  `ChefHat`, `Coffee`, `Utensils`, "cocina", "menú de platillos", etc.
  Usa términos universales: `pedido`/`orden`, `En proceso`, `Listo`,
  `productos`, íconos neutrales (`Clock`, `PackageCheck`, `Store`).
- **Estado de preparación = estado real, no cosmético.** El avance
  `recibido → en proceso → listo` vive en `orders.fulfillment_status`
  (no en `orders.status`, que es el ciclo de pago). Solo el staff con el
  permiso `qr.fulfill` (roles `owner` y `waiter`; el `cashier` NO) puede
  avanzarlo vía `POST /api/qr/table/[orderId]/fulfillment`. El cliente NO
  puede pagar hasta que `fulfillment_status === "ready"` — hay guarda en
  UI y en los servicios de pago (`tablePaymentService`,
  `tableMpPreferenceService`).
- El monto en pesos es el protagonista visual de cada pantalla
  (`text-5xl` o más, `font-bold`, `tracking-tight`).
- Para propinas/montos: chips de presets primero, input custom solo si
  el cliente toca "Otro monto".
- Aislamiento de sesión QR: cuando una orden cierra y se crea una nueva
  en el mismo QR, hay que limpiar `device_name` de `localStorage`. La
  lógica vive en `useTableSession` + el flag `is_new_session` que
  devuelve `/api/qr/resolve`. NUNCA revivas la identidad del cliente
  anterior en una orden nueva — es un bug de privacidad.

### 7. Storefront público

Rutas `src/app/sitio/[slug]/**` para el sitio público de cada tenant.
**Antes de tocarlas lee `.claude/skills/storefront-ux/SKILL.md`** (e-commerce
de bloques con impacto, cero scroll horizontal; su referencia es la skill
`ui-ux-pro-max`).
Un solo `StoreShell` (`features/sitio/components/shell/`) sirve todas las
plantillas: cada `layout_variant` es una entrada en
`features/sitio/constants/storeThemes.ts` con tokens `--store-*`, nunca un
layout nuevo. Los datos públicos salen de
`features/sitio/services/storefrontService.ts` (con `cache()` por request);
la búsqueda en vivo es `GET /api/public/sitio/[slug]/search`. El texto del
comerciante se renderiza como texto, nunca con `dangerouslySetInnerHTML`.
Comparten infraestructura con el checkout en `src/features/checkout/`:
`singleCheckoutHandler`, `partialCheckoutHandler`,
`subscriptionCheckoutHandler` reciben un `CheckoutContext` y devuelven
una preferencia MP. El `back_urls` por defecto apunta a
`/sitio/{slug}/confirmacion`; flujos como pagos QR sobrescriben con
`ctx.backUrls` para apuntar a su propia página branded.

**Carrito y promociones (reglas duras):**
- Toda escritura a `public_cart_items` pasa por
  `features/checkout/services/cartLineService.ts`. Un pack o un 2x1 es un
  grupo (`group_id`): crece, baja y se quita completo; nunca se edita una
  línea suelta de un pack.
- Precios de promoción sólo desde `src/lib/offers/pricing.ts`
  (`bestUnitPromotion`, `allocatePackPrice`, `nxmUnitPrice`). Packs y NxM
  jamás cambian el precio de un producto comprado solo.
- El checkout re-precia el carrito (`cartPricingService.repriceCart`) y
  responde 409 si algo cambió; nunca confía en `price_snapshot`.
- Etiqueta de una promoción: `formatOfferLabel` (`src/lib/offers/`).
- Promociones se archivan (`status`), no se borran; lectores públicos con
  cliente admin filtran `status = 'active'`.

**Planes / suscripciones (Fase 2a, cobro manual, sin cron):**
- Un plan (`offer_plans` + `offer_plan_items`, feature `planes`) NO es una
  promoción ni toca `public_cart_items`: en el carrito vive en
  `public_cart_plans` (`cartPlanService`). Todo lugar que vacía el carrito
  también llama `clearCartPlans`.
- Checkout con planes = un solo pago hoy (productos + primer periodo). El
  precio del plan va en `order_plan_charges`; lo que entrega va como
  `order_items` de $0 con `line_kind = 'plan_component'` (así el trigger de
  inventario descuenta stock sin cambios).
- La instancia es una fila de `subscriptions` con `offer_plan_id`; cada
  periodo es una fila de `subscription_periods` (UNIQUE por número = ancla de
  idempotencia). Nunca crees pedidos de renovación a mano: usa
  `ensure_due_periods` / `create_plan_period_order`.
- Pagar un pedido de periodo por CUALQUIER vía activa/avanza el plan vía el
  trigger `order_plan_period_trigger` (mismo predicado de pagado que el de
  inventario). Cancelar el pedido de un periodo sin pagar cancela el plan.
- Sin cron: `ensureDuePeriods` corre al abrir Suscripciones, Operaciones y
  `/plan/{token}`. Un cron futuro sólo debe llamarlo por tenant.
- `/plan/{token}` es la credencial del cliente (token de 64 hex); nunca la
  expongas fuera del cliente y del negocio.

### 8. Estado global

Zustand stores en `src/stores/` — solo lo verdaderamente global:
sesión (`useSessionStore`), tenant activo (`useTenantStore`), tema. El
resto del estado vive en hooks de feature. Persistencia a `localStorage`
manual (no usar el plugin `persist`).

### 9. PWA y service worker

`@serwist/next` controla el service worker en `public/sw.js`. Cuando
veas logs como `serwist Router is responding to: /api/...` en el
console del browser, vienen del SW. Si una request a un endpoint nuevo
hace algo raro, revisa la config de Serwist antes que el endpoint en sí.

---

## Errores

- Mensajes para el usuario final SIEMPRE en español.
- Usar `resolveUserError(error, source)` de `@/lib/errors/resolveUserError`
  con `source: "supabase" | "sendgrid" | "mercadopago"`.
- Mapeos en `src/lib/errors/errorMessages.ts`.

---

## Comentarios

- **En inglés.** Una línea; tres como máximo absoluto.
- Solo si son necesarios. Si el código ya lo dice, el comentario es ruido.
- Nunca describir lo que hace la línea de abajo, ni narrar decisiones de
  layout/CSS, ni dejar bloques `/* … */` dentro del JSX.
- Sí vale un comentario corto para: un `?? 0` que existe por compatibilidad,
  una omisión deliberada (no poner `qr_code_id` al hijo), o una constante cuyo
  valor no se deduce.

---

## Clases de Tailwind

- Usar la escala canónica, no valores arbitrarios: `min-h-11` en vez de
  `min-h-[44px]`, `h-4.5` en vez de `h-[18px]`, `bg-foreground/6` en vez de
  `bg-foreground/[0.06]`. El linter de Tailwind avisa (`suggestCanonicalClasses`)
  y esos warnings no se dejan pasar.
- Arbitrario solo cuando no hay equivalente en la escala (`w-[302px]` de un
  ticket térmico, `text-[15px]`).

---

## Organización de imports

```ts
"use client";

import { useState } from "react";          // 1. Externos
import { Search } from "lucide-react";
import useSWR from "swr";

import { useFoo } from "@/features/x/hooks/useFoo";   // 2. Hooks del feature
import { Bar } from "@/components/ui/Bar";            // 3. Componentes (UI compartidos → feature)
import { CustomerPicker } from "@/features/x/components/CustomerPicker";

import { swrFetcher } from "@/lib/swrFetcher";        // 4. Services, helpers, constants

import type { FooProps } from "@/features/x/interfaces/foo"; // 5. Types con `import type`
```

Usar siempre alias `@/` — nunca `../../../`.

---

## Anti-patrones explícitamente prohibidos

Prohibiciones genéricas (interfaces inline, `fetch` en componentes,
helpers duplicados, `useState` xN con lógica de dominio) están en
`clean-code/SKILL.md` — no se repiten aquí. Específicos de este repo,
versión larga con ejemplos en `ARCHITECTURE.md §7`:

- Renderizar `ModalShell` + `BottomSheet` en paralelo para responsive
  (usar `FormSheet`)
- Banners de status `<div className="rounded-2xl border border-emerald-200 ...">`
  copiados (usar `<Notification>`)
- `METHOD_META` / `METHOD_LABELS` redeclarado por componente (usar
  `features/qr/constants/paymentMethodMeta.ts`)
- Pantallas customer-facing sin `<CustomerScreen>`
- Emojis en componentes (solo `lucide-react`)
- Copy/íconos de comida en customer-facing (`¿Qué se te antoja?`,
  `En preparación`, `ChefHat`, `Coffee`…) — es multinegocio, usa copy
  neutral (ver §6)
- `window.confirm` (usar `<ConfirmDialog>`)
- `font-extrabold` en body type

---

## Checklist al cerrar un cambio

- [ ] `clean-code/SKILL.md` §"Before shipping" completo.
- [ ] Estructura del feature respetada (`ARCHITECTURE.md §2`).
- [ ] Pantallas customer-facing usan `<CustomerScreen>` + las
      primitivas (`Notification`, `FormInput`, `FormSheet`,
      `ConfirmDialog`)
- [ ] API routes: auth → tenant check → validación → operación →
      response, con `resolveUserError`
- [ ] Servicios server-side devuelven `ServiceResult<T>` y rutas usan
      `serviceErrorToResponse`
- [ ] Si toca Mercado Pago: `ARCHITECTURE.md §6.1` (`fee_absorbed_by`,
      `auto_return` guard, error real propagado, `external_reference`
      prefijado)
- [ ] `npx tsc --noEmit` y `npm run lint` limpios
