# Claude Code Configuration

model: claude-sonnet-4-5-20250929

## Project Context

**pars_commerce** — Plataforma multi-tenant de comercio con sistema de préstamos, órdenes, productos, comisiones y pagos integrados con MercadoPago. Stack: Next.js 15 (App Router), React 19, TypeScript, Supabase, Zustand, SWR, React Hook Form + Yup, Tailwind CSS 4.

---

## Arquitectura: Clean Architecture por Features

### Principio fundamental

Cada feature es un módulo autocontenido. No mezclar lógica entre features. Reutilizar solo lo que vive en carpetas compartidas (`/src/lib`, `/src/types`, `/src/stores`, `/src/hooks`, `/src/services`, `/src/constants`, `/src/components/ui`).

### Estructura de un feature (Frontend)

```
src/features/{feature-name}/
├── components/       # Componentes React del feature (máx 400 líneas c/u)
├── hooks/            # Custom hooks (SWR, formularios, lógica de estado)
├── constants/        # Constantes, tabs, opciones, clases CSS reutilizables
├── helpers/          # Funciones puras (cálculos, transformaciones, SWR keys)
├── interfaces/       # Types e interfaces de props y datos locales del feature
├── services/         # Llamadas API (wrappers delgados sobre fetch)
└── validations/      # Schemas de Yup para formularios
```

### Estructura de un feature (Backend — API Routes)

```
src/app/api/{feature-name}/
└── route.ts          # GET / POST / PATCH / DELETE
```

Cada route sigue este orden:
1. **Auth**: `supabase.auth.getUser()` → 401 si falla
2. **Tenant verification**: Validar membership del user en el tenant → 403 si no pertenece
3. **Input validation**: Validar campos requeridos y reglas de negocio → 400
4. **Query/Mutation**: Operación en Supabase
5. **Response**: `NextResponse.json(data)` o error con `resolveUserError()`

---

## Principios SOLID

- **S — Single Responsibility**: Cada archivo tiene una sola razón de cambio. Un hook no hace fetch Y manipula DOM. Un helper no llama APIs.
- **O — Open/Closed**: Usar constantes y configuraciones (tabs, opciones, status maps) en lugar de hardcodear. Agregar nuevos status/opciones sin modificar lógica existente.
- **L — Liskov Substitution**: Las interfaces de props deben ser consistentes entre componentes intercambiables.
- **I — Interface Segregation**: Props interfaces específicas por componente, no interfaces monolíticas. Cada componente recibe solo lo que necesita.
- **D — Dependency Inversion**: Componentes dependen de hooks/services abstraídos, no de implementaciones directas de fetch o Supabase.

---

## Reglas de Código

### Componentes (máx 400 líneas)

- Si un componente supera 400 líneas, extraer subcomponentes, hooks o helpers.
- Patrón responsive: `hidden md:block` para desktop, `md:hidden` con `<BottomSheet>` para mobile.
- No usar `useState` para lógica que se puede extraer a un custom hook.
- No más de 3 `useState` por componente — si necesitas más, crear un custom hook.

### Custom Hooks (obligatorios)

Extraer a `/hooks` cuando:
- Hay lógica de fetching (usar SWR dentro del hook)
- Hay lógica de formulario (react-hook-form + yup)
- Hay más de 2-3 `useState` relacionados
- Hay lógica reutilizable entre componentes

Patrón de retorno:
```typescript
// Devolver objeto con estado y handlers
return { data, isLoading, error, handleAction, resetState };
```

### SWR para Data Fetching

- **Siempre** usar SWR para fetching en componentes. No usar `useEffect` + `fetch` directo.
- Usar `swrFetcher` de `@/lib/swrFetcher.ts` como fetcher estándar.
- Construir SWR keys en archivos de helpers: `helpers/swrKeys.ts` o `helpers/buildXxxKey.ts`.
- Key debe ser `null` cuando las dependencias no estén listas (conditional fetching).
- Opciones estándar: `{ fallbackData: [], revalidateOnFocus: false }`.

```typescript
const key = tenantId ? `/api/endpoint?tenant_id=${tenantId}` : null;
const { data, isLoading, mutate } = useSWR<Type>(key, swrFetcher, {
  fallbackData: [],
  revalidateOnFocus: false,
});
```

### React Hook Form + Yup

- Formularios **siempre** con `react-hook-form` + `yupResolver`.
- Schemas de validación en `validations/` del feature, nunca inline.
- Exportar el tipo inferido: `export type FormValues = yup.InferType<typeof schema>`.
- Schemas modulares: componer con `.concat()` cuando se reutilicen partes.

### Zustand (Estado Global)

- Stores en `/src/stores/` con prefijo `use` (ej: `useTenantStore`, `useSessionStore`).
- Persistencia manual a localStorage cuando sea necesario (no usar plugin persist).
- Computed properties con `get()` dentro del store.
- Solo estado verdaderamente global: auth, tenant, theme. Estado de feature va en hooks/context.

### Services (Llamadas API)

- Wrappers delgados sobre `apiFetch` de `@/services/apiFetch.ts`.
- Un service por dominio: `loanService.ts`, `customerService.ts`, etc.
- Pattern: `async function → fetch → check res.ok → throw/return`.
- Services del feature en `features/{name}/services/`, compartidos en `/src/services/`.

### Helpers (Funciones Puras)

- Sin side effects, sin imports de React.
- Cálculos, transformaciones de datos, formateo.
- SWR key builders van aquí.
- Nombrar descriptivamente: `buildOrdersKey`, `calcInterestAccrued`, `getPeriodDates`.

### Constants

- Tabs, opciones de select, status maps, clases CSS reutilizables.
- Nunca hardcodear strings repetidos en componentes.

### Interfaces / Types

- Props de componentes en `interfaces/` del feature.
- Types de dominio compartidos en `/src/types/` (loans.ts, customers.ts, orders.ts, etc.).
- Usar `type` para datos y `interface` para props de componentes.
- Payloads de API: `CreateXxxPayload`, `UpdateXxxPayload`.

### Validations

- Schemas Yup en `validations/` del feature.
- Exportar schemas Y tipos inferidos.
- Reutilizar schemas parciales con `.concat()`.

---

## Organización de Imports

Orden estricto en cada archivo:

```typescript
"use client"; // 1. Directiva (si aplica)

// 2. Librerías externas
import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import useSWR from "swr";

// 3. Hooks del feature
import { useCustomerSearch } from "@/features/prestamos/hooks/useCustomerSearch";

// 4. Componentes (UI compartidos, luego del feature)
import { BottomSheet } from "@/components/ui/BottomSheet";
import { CustomerPicker } from "@/features/prestamos/components/CustomerPicker";

// 5. Services, helpers, constants
import { swrFetcher } from "@/lib/swrFetcher";
import { btnPrimary } from "@/components/ui/buttonClasses";

// 6. Types (siempre con `import type`)
import type { CustomerPickerProps } from "@/features/prestamos/interfaces/loanForm";
import type { Customer } from "@/types/customers";
```

Usar siempre path aliases `@/` — nunca imports relativos (`../../../`).

---

## Backend — API Routes

### Patrones obligatorios

1. **Auth guard** en toda ruta protegida:
```typescript
const supabase = await createClient();
const { data: { user }, error: authError } = await supabase.auth.getUser();
if (authError || !user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

2. **Tenant membership check**:
```typescript
const { data: membership } = await supabase
  .from("tenant_memberships")
  .select("id")
  .eq("tenant_id", tenant_id)
  .eq("user_id", user.id)
  .single();
if (!membership) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

3. **Validación de inputs** antes de cualquier operación.
4. **Error handling** con `resolveUserError()` de `@/lib/errors/resolveUserError.ts`.
5. **State machines** para transiciones de estado (orders, loans) con `ALLOWED_TRANSITIONS`.

### DTOs y Types

- Definir en `/src/types/{domain}.ts`.
- Payloads: `CreateXxxPayload`, `UpdateXxxPayload`.
- Response types cuando aplique.
- Enums como union types: `type Status = "pending" | "partial" | "paid"`.

### MercadoPago

- Cliente inicializado en `/src/lib/mercadopago.ts`.
- Webhooks en `/api/mercadopago/webhook/` con verificación de firma.
- Fee calculations en `/src/lib/loanUtils.ts` y `/src/constants/commissionConfig.ts`.
- `external_reference` format: `loan:{id}`, `bulk_loan:{id}`, `{orderId}`.
- Siempre manejar `mp_fee_absorbed_by`: customer | business.

### Supabase

- Server client: `@/lib/supabase/server.ts` (rutas API, server components).
- Browser client: `@/lib/supabase/client.ts` (client components).
- Admin client: `@/lib/supabase/admin.ts` (operaciones privilegiadas).
- Storage: `@/lib/supabase/storage.ts` (uploads de imágenes).

---

## Multi-Tenant

- **Todo** scoped por `tenant_id`. Nunca queries sin filtro de tenant.
- Tenant activo viene de `useTenantStore`.
- Verificar membership en cada API route.
- Roles verificados cuando se requieren permisos especiales (owner, admin).

---

## Estilo y UI

- Tailwind CSS 4 con tokens de diseño: `bg-surface`, `text-foreground`, `border-border`, `bg-accent`, etc.
- Componentes UI compartidos en `/src/components/ui/`.
- Botones: usar clases de `/src/components/ui/buttonClasses.ts`.
- Inputs: clases base en `constants/formClasses.ts` del feature.
- Responsive: mobile-first, `BottomSheet` para modales en mobile, modales estándar en desktop.
- Min touch target: `min-h-[44px] min-w-[44px]` en elementos interactivos.

---

## Errores

- Mensajes en español para el usuario final.
- Usar `resolveUserError(error, source)` con sources: `"supabase"`, `"sendgrid"`, `"mercadopago"`.
- Mapeos en `/src/lib/errors/errorMessages.ts`.

---

## Checklist para nuevos features

- [ ] Crear estructura de carpetas del feature (components, hooks, helpers, constants, interfaces, services, validations)
- [ ] Types/interfaces definidos antes de implementar
- [ ] SWR para todo fetching, key builders en helpers
- [ ] Formularios con react-hook-form + yup (schema en validations/)
- [ ] Componentes < 400 líneas, lógica extraída a hooks
- [ ] No más de 3 useState por componente
- [ ] Services como wrappers delgados sobre apiFetch
- [ ] Constants para valores repetidos (tabs, opciones, clases CSS)
- [ ] API routes con auth → tenant check → validation → operation → response
- [ ] Error handling con resolveUserError
- [ ] Imports organizados según convención
- [ ] Responsive: mobile-first con BottomSheet pattern
