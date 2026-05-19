# Architecture — pars_commerce

This document defines **how code must be organized** in this project. It is
the complement to `DESIGN_SYSTEM.md` (which covers visual rules). Both are
mandatory reading before adding or modifying features.

> If a component contains its own interface, its own `fetch()`, its own
> formatter helper, and its own service-shaped logic — it is wrong. Split
> it. Modularization is not optional.

---

## 1. The non-negotiable rules

1. **No inline interfaces** — every prop or domain type lives in
   `features/{name}/interfaces/*.ts`. The component file imports them with
   `import type { ... }`.
2. **No inline `fetch()` in components** — components never call `fetch`,
   `apiFetch`, or any HTTP. All requests live in
   `features/{name}/services/*.ts`.
3. **No inline business logic in components** — multi-step flows
   (load → mutate → invalidate, form state, derived totals, etc.) live in
   `features/{name}/hooks/use*.ts`. Components consume the hook's returned
   shape.
4. **No duplicated helpers** — any function used twice (formatters,
   calculators, key builders) is hoisted to `features/{name}/helpers/*.ts`
   or `src/lib/*.ts`. The DRY rule applies even when the duplicated
   function is only three lines.
5. **No "kitchen-sink" components** — if a component touches more than one
   concern (data + UI + side-effects), split it. The component file should
   only describe what it looks like and which handlers it wires.

---

## 2. Feature folder shape

Every feature under `src/features/{name}/` MUST follow this exact tree:

```
src/features/{name}/
├── components/       # Presentational React components. JSX + classes only.
│                     # Receive props, call handlers. No fetch, no business
│                     # logic, no inline interfaces beyond local-only ones.
├── hooks/            # Custom hooks named `use*.ts`. Own SWR/state machines,
│                     # form state, derived data. Each hook returns a single
│                     # object: { data, isLoading, error, ...handlers }.
├── helpers/          # Pure functions. No React imports. Calculators,
│                     # formatters, SWR key builders, transformations.
├── constants/        # Tabs, options, status maps, reusable CSS class strings.
├── interfaces/       # Types and interfaces shared across the feature.
│                     # Both DTO shapes and component props go here.
├── services/         # Thin wrappers over `apiFetch`. One service per
│                     # endpoint or related group. Server-side service
│                     # logic (admin Supabase ops, business rules) also
│                     # belongs here as `*Service.ts`.
└── validations/      # Yup schemas + inferred types.
```

**An empty subfolder is acceptable.** A folder containing files that should
have been split is not.

---

## 3. Where each kind of code goes (decision tree)

When adding new code, decide where it lives BEFORE writing it:

| What you're writing                                 | Where it goes                                       |
| --------------------------------------------------- | --------------------------------------------------- |
| A `<div>` / JSX block returning visual structure    | `components/SomeName.tsx`                           |
| A `useState` + a `useEffect` + a derived value      | `hooks/useSomeName.ts`                              |
| A `fetch('/api/...')` or `apiFetch(...)`            | `services/someClientService.ts`                     |
| A function with no side-effects (e.g. `format`,    | `helpers/something.ts`                              |
| `calculate`, `transform`)                           |                                                     |
| The shape of an API response or a domain entity     | `interfaces/something.ts`                           |
| The shape of a form's values + validation rules     | `validations/somethingSchema.ts`                    |
| A literal list (tabs, status colors, options)       | `constants/something.ts`                            |
| An admin-side Supabase mutation with business rules | `services/somethingService.ts` (server-only)        |

**If you find yourself adding any of the right-column items inside a
component file (left column), STOP and move it first.**

---

## 4. Component contract

A `*.tsx` component file:

- Starts with `"use client"` ONLY if it needs to (hooks, browser APIs).
- Imports its props type with `import type { ... } from "@/features/.../interfaces/..."`.
- Imports helpers (`formatCurrency`, `getInitials`, etc.) from
  `features/.../helpers/...` — never re-declares them.
- Imports services if it wires a handler that does HTTP, but **never calls
  them directly**. The hook calls the service; the component calls the
  hook handler.
- Local helpers (functions that exist ONLY for this component's JSX, like
  a `renderRow()` extractor) ARE allowed inside the file. The bar: would
  any other component plausibly use this? If yes → extract. If no → keep.
- Stays under ~400 lines per `CLAUDE.md`. Refactor before crossing.

**Bad shape (what we're banning):**

```tsx
"use client";
import { useState } from "react";

interface UserCardProps {  // ← interface inline
  userId: string;
}

function formatName(n: string) {  // ← helper inline
  return n.trim().toUpperCase();
}

export function UserCard({ userId }: UserCardProps) {
  const [user, setUser] = useState(null);

  useEffect(() => {  // ← fetch inline
    fetch(`/api/users/${userId}`).then(...).then(setUser);
  }, [userId]);

  return <div>...</div>;
}
```

**Good shape:**

```tsx
// features/users/interfaces/user.ts
export interface User { id: string; name: string }
export interface UserCardProps { userId: string }

// features/users/helpers/format.ts
export function formatName(n: string) { return n.trim().toUpperCase() }

// features/users/services/userService.ts
export async function getUser(id: string): Promise<User> {
  return apiFetch(`/api/users/${id}`) as Promise<User>;
}

// features/users/hooks/useUser.ts
export function useUser(id: string) {
  const { data, error, isLoading } = useSWR(`/api/users/${id}`, () => getUser(id));
  return { user: data, error, isLoading };
}

// features/users/components/UserCard.tsx
"use client";
import { useUser } from "@/features/users/hooks/useUser";
import { formatName } from "@/features/users/helpers/format";
import type { UserCardProps } from "@/features/users/interfaces/user";

export function UserCard({ userId }: UserCardProps) {
  const { user, isLoading } = useUser(userId);
  if (isLoading) return <Skeleton />;
  return <div>{formatName(user.name)}</div>;
}
```

---

## 5. Hook contract

A hook in `features/.../hooks/use*.ts`:

- Receives a typed `params` object (no positional arguments past one).
- Returns a single named object describing its surface:
  ```ts
  return {
    data, isLoading, error,        // state
    handleSubmit, retry, dismiss,  // actions
  };
  ```
- Owns SWR (`useSWR`), `react-hook-form`, `useState`, `useEffect` — that
  way components stay pure and re-mount cleanly.
- Calls services. Never calls `fetch` directly.

**Reference implementations:**
- `features/qr/hooks/useTableSession.ts` — resolve + fingerprint + cache
- `features/qr/hooks/useTableCart.ts` — local cart + send action
- `features/qr/hooks/useDeviceNaming.ts` — name state + persist
- `features/qr/hooks/usePaymentFlow.ts` — payment state machine
- `features/qr/hooks/useBillData.ts` — SWR + fingerprint header

---

## 6. Service contract

A client-side service in `features/.../services/*ClientService.ts`:

- Thin wrapper over `apiFetch` (`@/services/apiFetch`).
- One function per endpoint, named after the action: `resolveTableSession`,
  `sendItems`, `createPaymentIntent`.
- Takes a single typed `payload` object. Returns a typed promise.
- Header injection (fingerprint, auth) lives inside the service, not at
  the call site.
- No JSON parsing in callers — services return parsed objects.

**Reference:** `features/qr/services/tableClientService.ts`.

A server-side service in `features/.../services/*Service.ts`:

- Receives an admin Supabase client as the first argument.
- Returns a `ServiceResult<T> = { ok: true, data: T } | { ok: false, error: ServiceError }`.
- Encapsulates business rules (validation, state machine transitions,
  related table writes, audit log inserts).
- Route handlers under `src/app/api/**` stay thin: parse body → call
  service → map error to HTTP status with `serviceErrorToResponse`.

**Reference:** `features/qr/services/tablePaymentService.ts`.

---

## 7. Anti-patterns we've explicitly killed

| Anti-pattern                                          | Where we killed it                          |
| ----------------------------------------------------- | ------------------------------------------- |
| `DeviceNamePrompt` building its own hero + sheet      | Now uses `<CustomerScreenLayout>`           |
| `TableSession` doing inline `fetch()` + `ResolveResponse` interface | Now uses `useTableSession` + `tableClientService.resolveTableSession` + `interfaces/tableSession.ts` |
| `TableQRClient` with inline `fetch` for name + items + interfaces + helpers | Now uses `useDeviceNaming`, `useTableCart`, `TableHeader`, `TableCtaBar`, `helpers/format` |
| `formatCurrency` duplicated in 12+ component files    | Now imported from `features/qr/helpers/format` |
| `MesasPage` dual-rendering `ModalShell` + `BottomSheet` for responsive forms | Now uses `<FormSheet>` (mobile sheet + desktop modal in one) |
| Inline `<div className="rounded-2xl border border-emerald-200 ...">` banners duplicated across screens | Now use `<Notification tone="success|error|warning|info">` |
| Inline `<label><input className="...">` blocks duplicated across forms | Now use `<FormInput label icon error optional>` |
| `PaymentMethodStep` rendering its own back button + duplicate method header card | Now lives inside `<CustomerScreenLayout>` with `<PaymentMethodHero>` as the hero |
| `METHOD_META` / `METHOD_LABELS` / `METHOD_ICONS` redeclared in `CustomerPayModal`, `PaymentMethodStep`, `PaymentReceipt`, `PendingPaymentsCard` | Now in `features/qr/constants/paymentMethodMeta.ts` — single source of truth |
| `TableMenuGrid` rendering all products at once (1000+ unusable) | Now uses `useMenuFilter` (search + chunked rendering via IntersectionObserver) + `MenuProductCard` + `MenuSearchBar` |

When you spot any of these patterns in new code, refactor BEFORE shipping.

---

## 8. Reuse before creating

Before writing a new component, hook, service, or helper:

1. **Search.** Is there already one that does this? Use `Grep` /
   `Glob` over `src/features/{name}/` and `src/lib/`, `src/components/ui/`.
2. **Extend.** If something close exists, extend it rather than forking.
   Add a prop, add an option to the hook — don't create
   `UserCardV2.tsx` next to `UserCard.tsx`.
3. **Promote.** If a helper is used in two features, promote it to
   `src/lib/`. If a UI primitive (button, input, dialog) is used in two
   features, promote it to `src/components/ui/`.

---

## 9. PR checklist (paste this into every PR description)

- [ ] No inline interfaces in `.tsx` files; types live in `interfaces/`.
- [ ] No `fetch()` / `apiFetch()` calls inside components.
- [ ] No business logic, `useEffect`, or multi-`useState` blocks inside
      components beyond trivial UI state.
- [ ] No duplicated helpers — checked with grep before adding any.
- [ ] Touch-targets ≥ 48px on customer-facing UI; design follows
      `DESIGN_SYSTEM.md`.
- [ ] Customer-facing screens use `<CustomerScreenLayout>`.

If any box is unchecked, the change is not done — go back and finish.
