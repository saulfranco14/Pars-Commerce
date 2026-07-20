# Architecture — pars_commerce

Este documento define cómo se organiza el código **específico de
pars_commerce**: la forma real de carpetas, las convenciones de este
repo, y los anti-patrones que ya cazamos aquí. Es el complemento de
`DESIGN_SYSTEM.md` (reglas visuales).

**Las reglas genéricas de ingeniería (modularización, DRY, cuándo
comentar, hook vs helper vs util, formularios declarativos, capa de
datos, performance, seguridad) viven en la skill `clean-code`
(`.claude/skills/clean-code/SKILL.md`) — léela primero, es de lectura
obligatoria junto con este archivo.** Este documento solo cubre lo que
esa skill no puede saber por ser específico de este proyecto: nombres
reales de carpetas, contratos concretos (`ServiceResult<T>`), reglas de
Mercado Pago, y los anti-patrones que ya se corrigieron aquí.

---

## 1. Reglas no negociables (aplican vía `clean-code` + este proyecto)

Ver `clean-code` §"The core question" para el principio general. Aplicado
a este repo específicamente:

1. No inline interfaces — todo tipo va a `features/{name}/interfaces/*.ts`.
2. No `fetch()`/`apiFetch()` inline en componentes — todo vive en
   `features/{name}/services/*.ts`.
3. No lógica de negocio inline en componentes — flujos multi-paso viven
   en `features/{name}/hooks/use*.ts`.
4. No helpers duplicados — cualquier función usada 2 veces se promueve
   (ver `clean-code/examples/modularization.md` para el criterio exacto
   de cuándo a `features/x/helpers/` vs `src/lib/`).
5. No componentes "kitchen-sink" — si toca datos + UI + side-effects,
   se parte.

---

## 2. Forma de carpetas del feature (específico de este repo)

Cada feature en `src/features/{name}/` sigue exactamente esta estructura:

```
src/features/{name}/
├── components/       # Presentacionales. JSX + clases. Sin fetch, sin
│                     # lógica de negocio, sin interfaces más allá de
│                     # las locales-only (ver clean-code/modularization.md).
├── hooks/            # use*.ts — SWR/máquinas de estado/form state.
├── helpers/          # Funciones puras, sin import de React.
├── constants/        # Tabs, opciones, mapas de status, clases CSS reusables.
├── interfaces/       # Tipos compartidos dentro de la feature.
├── services/         # Wrappers sobre apiFetch + servicios server-side.
└── validations/       # FieldSchema[] (ver clean-code/examples/forms.md)
```

**Una subcarpeta vacía es aceptable.** Una carpeta con archivos que
debieron partirse, no.

Features actuales: `auth`, `checkout`, `configuracion`, `equipo`,
`landing`, `onboarding`, `orders`, `prestamos`, `productos`,
`promociones`, `qr`, `servicios`, `sitio`, `sitio-web`, `suscripciones`,
`ventas`.

Fuera de features, lo verdaderamente compartido:
- `src/components/ui/` — primitivas visuales transversales
  (`ConfirmDialog`, `FormSheet`, `FormInput`, `Notification`, `Toast`,
  `BottomSheet`, `Skeleton`).
- `src/components/admin/` — primitivas de pantallas internas del
  dashboard (`PageHeader`, `MetricsStrip`, `StatusBadge`, `EmptyState`,
  `AdminListCard`, `actionButtonClasses`). Reglas de composición en
  `DESIGN_SYSTEM.md §4.7`.
- `src/lib/` — clientes (`supabase/{client,server,admin}`,
  `mercadopago`, `swrFetcher`), helpers de errores, fee calculators
  (`loanUtils`, `uploadUtils`).
- `src/stores/` — Zustand global (`useTenantStore`, `useSessionStore`).
- `src/services/apiFetch.ts` — wrapper único sobre `fetch`.
- `src/types/` — DTOs compartidos entre features.
- `src/constants/` — `commissionConfig.ts` y otras constantes globales.

---

## 3. Dónde va cada tipo de código

El principio general y la tabla de decisión completa viven en
`clean-code/SKILL.md` — es la misma tabla, adaptada a los nombres reales
de arriba. No se repite aquí.

---

## 4. Contrato de componente

Ver `clean-code/examples/modularization.md` para el patrón completo
(bad/good shape) y la regla de "¿esta interface se importaría desde otro
archivo?". Lo específico de este repo:

- Todo `*.tsx` empieza con `"use client"` solo si lo necesita.
- Se mantiene bajo ~400 líneas — refactoriza antes de cruzar ese límite.
- Importa helpers de `features/.../helpers/...` — nunca los redeclara.

---

## 5. Contrato de hook

Ver `clean-code/SKILL.md` para el contrato genérico (recibe un `params`
tipado, retorna un objeto único `{ data, isLoading, error, ...handlers }`,
posee el ciclo de vida — SWR/RHF/useState/useEffect — para que el
componente se quede puro).

**Referencias reales de este proyecto** (léelas antes de escribir un hook
nuevo — el objetivo es que el décimo hook se vea como el primero):
- `features/qr/hooks/useTableSession.ts` — resolve + fingerprint + cache
- `features/qr/hooks/useTableCart.ts` — carrito local + acción de envío
- `features/qr/hooks/useDeviceNaming.ts` — estado de nombre + persistencia
- `features/qr/hooks/usePaymentFlow.ts` — máquina de estados de pago
- `features/qr/hooks/useBillData.ts` — SWR + header de fingerprint
- `features/qr/hooks/useTableAdminLive.ts` — SWR + múltiples acciones
  (confirmar/rechazar pago, avanzar fulfillment, cerrar/unir mesa)

---

## 6. Contrato de servicio

Un servicio client-side en `features/.../services/*ClientService.ts`:

- Wrapper delgado sobre `apiFetch` (`@/services/apiFetch`).
- Una función por endpoint, nombrada por la acción: `resolveTableSession`,
  `sendItems`, `createPaymentIntent`.
- Recibe un `payload` tipado único. Retorna una promesa tipada.
- Inyección de headers (fingerprint, auth) vive dentro del servicio, no
  en el call site.

**Referencia:** `features/qr/services/tableClientService.ts`.

Un servicio server-side en `features/.../services/*Service.ts`:

- Recibe un cliente admin de Supabase como primer argumento.
- Retorna `ServiceResult<T> = { ok: true, data: T } | { ok: false, error: ServiceError }`.
- Encapsula reglas de negocio (validación, transiciones de estado,
  escrituras relacionadas, inserts de auditoría).
- Los route handlers en `src/app/api/**` quedan delgados: parsear body →
  llamar servicio → mapear error a HTTP con `serviceErrorToResponse`.
- Queries inline dentro de la función de negocio (ver
  `clean-code/examples/data-layer.md` para el razonamiento completo de
  por qué NO se separa en una capa de repositorio/ORM en este proyecto).

**Referencia:** `features/qr/services/tablePaymentService.ts`.

---

## 6.1 Reglas de integración con Mercado Pago

Aplican a cualquier servicio que cree una `Preference` (storefront,
propinas, mesas, préstamos):

- **El negocio absorbe la comisión MP en flujos de QR (mesas y propinas).**
  El cliente paga exactamente el monto mostrado; nunca inflamos
  `unit_price` con la comisión. Marca la preferencia con
  `metadata.fee_absorbed_by = "business"` y deja que MP descuente su
  comisión del depósito. Para checkout de storefront con MSI se usa
  `calcMsiBuyerTotal(..., absorbedBy)` — el flag viene de
  `recurringConfig.fee_absorbed_by`.
- **`auto_return: "approved"` solo se envía cuando las `back_urls` son
  HTTPS públicas.** En desarrollo (`http://localhost`) MP rechaza la
  preferencia con `auto_return invalid`. Guarda detrás de
  `base.startsWith("https://")`. Patrón aplicado en
  `singleCheckoutHandler` y `tableMpPreferenceService`.
- **Los errores del SDK de MP deben loguearse con detalle.** El SDK
  envuelve el mensaje en `err.cause.message`. Usa el helper
  `extractMercadoPagoError` (o equivalente) para sacar el mensaje real,
  loguéalo en el servidor con contexto (`orderId`, `amount`, etc.) y
  propágalo al cliente cuando esté disponible — nunca devuelvas un
  genérico *"No se pudo conectar con Mercado Pago"* si tienes el mensaje
  real. (Esto es un caso concreto de la regla general de `clean-code`
  §Security "no leak internal errors to the end user" — aquí es al
  revés: SÍ propaga el mensaje real de MP porque es información útil
  para el usuario, no un detalle interno sensible.)
- **`external_reference` debe seguir convenciones por flujo** para que el
  webhook (`/api/mercadopago/webhook`) sepa a qué servicio derivar:
  - `qr_table:{order_id}` → pago completo de mesa
  - `qr_table_group:{group_id}` → pago de grupo de split
  - `order:{order_id}:mode:single:attempt:{attempt_id}` → storefront
  - `loan:{id}` / `bulk_loan:{id}` → préstamos

---

## 7. Anti-patrones explícitamente cazados en este repo

| Anti-patrón                                          | Dónde se corrigió                          |
| ----------------------------------------------------- | -------------------------------------------- |
| `DeviceNamePrompt` construyendo su propio hero + sheet | Ahora usa `<CustomerScreenLayout>`           |
| `TableSession` con `fetch()` inline + interface `ResolveResponse` | Ahora usa `useTableSession` + `tableClientService.resolveTableSession` + `interfaces/tableSession.ts` |
| `TableQRClient` con fetch inline para nombre + items + interfaces + helpers | Ahora usa `useDeviceNaming`, `useTableCart`, `TableHeader`, `TableCtaBar`, `helpers/format` |
| `formatCurrency` duplicado en 12+ archivos de componente | Ahora se importa de `features/qr/helpers/format` |
| `MesasPage` renderizando `ModalShell` + `BottomSheet` en paralelo para responsive | Ahora usa `<FormSheet>` (sheet móvil + modal desktop en uno) |
| `<div className="rounded-2xl border border-emerald-200 ...">` banners duplicados entre pantallas | Ahora usan `<Notification tone="success\|error\|warning\|info">` |
| `<label><input className="...">` bloques duplicados entre forms | Ahora usan `<FormInput label icon error optional>` |
| `PaymentMethodStep` renderizando su propio back button + card de header duplicada | Ahora vive dentro de `<CustomerScreenLayout>` con `<PaymentMethodHero>` como hero |
| `METHOD_META`/`METHOD_LABELS`/`METHOD_ICONS` redeclarado en `CustomerPayModal`, `PaymentMethodStep`, `PaymentReceipt`, `PendingPaymentsCard` | Ahora en `features/qr/constants/paymentMethodMeta.ts` — única fuente de verdad |
| `TableMenuGrid` renderizando todos los productos a la vez (1000+ inutilizable) | Ahora usa `useMenuFilter` (búsqueda + render por chunks vía IntersectionObserver) + `MenuProductCard` + `MenuSearchBar` |
| Header `<h1>` + descripción + botón "Nuevo…" copy-pasteado en cada página del dashboard | Ahora `<PageHeader title description action>` en `src/components/admin/PageHeader.tsx` |
| Filtros con pills + count badges reimplementados en `qr/page.tsx`, `mesas/page.tsx`, `TablesFilterTabs.tsx` con el mismo Tailwind | Ahora `<FilterTabs>` (`@/components/ui/FilterTabs`), con `TablesFilterTabs` como wrapper delgado |
| Estados vacíos (`border-dashed` + icon circle + h2 + descripción + CTA) replicados en `mesas/page`, `qr/page`, `cuentas-bancarias/page` | Ahora `<EmptyState icon title description action>` |
| Status pills (`bg-emerald-100 text-emerald-800` + dot) inline en `TableListCard`, `QRCodeCard`, `mesas/[mesaId]`, `BankAccountCard` | Ahora `<StatusBadge tone label>` |
| Toast `createPortal` ad-hoc dentro de `cuentas-bancarias/page` | Ahora `<Toast message tone onDone>` en `src/components/ui/Toast.tsx` |
| Botones pequeños `inline-flex min-h-[36px] rounded-lg border …` copy-pasteados en 5+ cards | Ahora `adminActionButtonSecondary \| Primary \| Danger` desde `actionButtonClasses.ts` |
| Cards de listado con la misma estructura (icon + title + meta + badge + actions) reescritas en `TableListCard`, `QRCodeCard`, `BankAccountCard` | Ahora extienden `<AdminListCard>` (composición vía props `thumbnail`, `meta`, `badge`, `body`, `actions`) |
| Detalle de mesa solo accesible navegando a `/mesas/[mesaId]` (round-trip completo para un check rápido) | Ahora `MesaDetailContent` se reusa en un `FormSheet` modal desde la lista Y en la página standalone (fallback para links directos) |
| Opción "Cobré fuera del sistema" en `CloseTableDialog` solo cancelaba la orden sin marcarla pagada (`paid_total` nunca se actualizaba) | Ahora `closeTableOrder` liquida la orden como `paid` cuando el motivo es `paid_outside_system` — mismo shape de settlement que `payFullOrder` |
| `useTablesList` con `refreshInterval` de polling continuo para el estado ocupada/libre | Ahora revalida forzado al entrar (bypassa el dedupe de SWR) + `refresh()` manual — el polling de 8s se quitó porque ocupada/libre solo cambia por acciones reales, no cada pocos segundos |

Al detectar cualquiera de estos patrones en código nuevo, refactoriza
ANTES de entregar.

---

## 8. Reutilizar antes de crear

Ver `clean-code` §"reuse" (implícito en la regla de promoción de
helpers). Regla operativa de este repo: antes de escribir un componente,
hook, servicio o helper nuevo, `Grep`/`Glob` sobre
`src/features/{name}/`, `src/lib/`, `src/components/ui/` — si algo
parecido existe, extiéndelo (agrega una prop, agrega una opción al hook)
en vez de crear `ComponentV2.tsx` junto al original.

---

## 9. Checklist al cerrar un cambio

- [ ] `clean-code` §"Before shipping" completo (bucket correcto,
      comentarios, formularios declarativos, promoción de helpers,
      skeletons, performance, security gate).
- [ ] Estructura del feature respetada (§2 de este archivo).
- [ ] Pantallas customer-facing usan `<CustomerScreenLayout>` +
      primitivas (`DESIGN_SYSTEM.md`).
- [ ] API routes: auth → tenant check → validación → operación →
      response, con `resolveUserError`.
- [ ] Servicios server-side devuelven `ServiceResult<T>` y rutas usan
      `serviceErrorToResponse`.
- [ ] Si toca Mercado Pago: §6.1 completo (`fee_absorbed_by`,
      `auto_return` guard, error real propagado, `external_reference`
      prefijado).
- [ ] `npx tsc --noEmit` y `npm run lint` limpios.

Si falta una casilla, el cambio no está terminado.
