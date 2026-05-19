# Design System — pars_commerce

This is the design contract for all customer-facing flows (QR table, tips,
payments, receipts). Follow this when building or modifying ANY screen in
`/src/app/q/**` or any feature targeting end customers.

> If a screen looks bland, generic, or "form-shaped", it's wrong. Customers
> only spend ~10 seconds deciding whether to engage. Every screen must feel
> intentional, confident, and on-brand.

---

## 1. Visual hierarchy rules

1. **Hero first.** Every customer screen starts with an accent-colored hero
   block (`bg-accent text-accent-foreground`) showing tenant name + screen
   purpose. No screen is just a white card on white background.
2. **Amount is the protagonist.** Whenever there's a monetary amount it must
   be `text-3xl` to `text-5xl`, `font-bold`, `tracking-tight`. Never small.
3. **Cards lift off the page.** Use `rounded-2xl` (cards) / `rounded-3xl`
   (hero sheets), `shadow-sm` for static cards, `shadow-md shadow-accent/20`
   for primary CTAs.
4. **No bare inputs.** Inputs must have a leading icon, a clear label above,
   and `rounded-2xl border-2 border-border focus:border-accent` styling.
   Bare `<input>` with placeholder-only is forbidden.
5. **Touch targets ≥ 48px.** Every interactive element on customer-facing
   screens uses `min-h-[48px]` (or 52/56 for primary CTAs).

---

## 2. Typography scale

| Use case                | Class                                    |
| ----------------------- | ---------------------------------------- |
| Tenant name / eyebrow   | `text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground` |
| Screen title            | `text-2xl font-bold tracking-tight`      |
| Hero amount             | `text-4xl` or `text-5xl font-bold tracking-tight` |
| Card title              | `text-base font-bold`                    |
| Body                    | `text-sm text-foreground`                |
| Secondary body          | `text-xs text-muted-foreground`          |
| Label/eyebrow on card   | `text-[10px] font-bold uppercase tracking-wider text-muted-foreground` |

**Banned:** `font-extrabold` (too heavy on body type), uppercase body text,
serif fonts, centered paragraphs longer than 2 lines.

---

## 2.1 Icons — `lucide-react` ONLY

- **Use `lucide-react` for every icon in customer-facing UI.** Never
  emojis (👍 ✨ 💎), never inline SVG, never icon libraries mixed in
  (Heroicons, react-icons, etc.).
- Reason: emojis render differently on every OS/browser (Apple, Windows,
  Android), break visual consistency, and don't respect the brand. Lucide
  is the project-wide system.
- Color icons with Tailwind text classes (`text-accent`, `text-amber-500`,
  `text-violet-500`).
- For filled icons use `fill="currentColor" strokeWidth={0}` (e.g., Heart
  in the tip hero).
- Acceptable sizes: `h-3.5 w-3.5` (inline), `h-4 w-4` (chips/buttons),
  `h-5 w-5` (CTAs), `h-7 w-7` to `h-10 w-10` (hero avatars).

## 2.2 Content-adaptive sizing

Hero illustrations, cards, and decorative elements must scale to the
content density of the screen.

- A 3-input form does not need a 50%-viewport hero card pushing everything
  below the fold.
- On mobile, the primary CTA should be reachable without scrolling on a
  standard ~700px viewport (iPhone 14 Pro / Pixel 7).
- Hero illustration max height on mobile: `~220px` (small card, max-w-xs).
  On desktop (`lg:`), max-w-sm and centered vertically.
- Form `space-y-5` (mobile) feels right. `space-y-7` or larger pushes
  content off-screen — avoid unless the form is genuinely sparse.

---

## 3. Color usage

- `bg-accent` / `text-accent-foreground` — primary CTAs, hero blocks, active
  states. Never use for warnings or errors.
- `bg-emerald-50/100/600` — success / paid / approved.
- `bg-amber-50/100/600` — pending validation, warnings (non-blocking).
- `bg-red-50/200/600/700` — destructive actions (manual close, reject) and
  error states only.
- `bg-violet-100 text-violet-700` — transferencia method icon.
- `bg-blue-100 text-blue-700` — Mercado Pago / tarjeta method icon.
- **Never mix more than 2 status colors on the same screen.** No
  rainbow gradients (orange→amber→red was wrong).

---

## 4. Required patterns per screen type

### 4.1 CANONICAL LAYOUT — `CustomerScreenLayout`

**EVERY customer-facing screen in `/src/app/q/**` MUST use
`<CustomerScreenLayout>` from `src/features/qr/components/CustomerScreenLayout.tsx`.**

This component encodes the one accepted layout pattern:

```
┌─────────────────────────┬─────────────────────────┐
│                         │                         │
│      HERO (accent bg)   │      BODY (form/cards)  │   <- desktop (lg+)
│                         │                         │
└─────────────────────────┴─────────────────────────┘

┌─────────────────────────┐
│      HERO (accent bg)   │
├─────────────────────────┤
│   BODY sheet slides up  │   <- mobile
└─────────────────────────┘
```

Required props:
- `hero` — the hero content (eyebrow + title + amount + status pills)
- `children` — the body content (cards, lists, forms)
- `heroBgClass` — `"bg-accent"` (default), `"bg-emerald-600"` (success),
  `"bg-amber-500"` (pending), `"bg-red-600"` (failure)
- `tenantName` — shown as eyebrow top-right
- `backHref` or `onBack` — back button top-left

The layout handles:
- Mobile/desktop responsiveness (stack vs split-pane)
- Depth gradients on the hero
- Sheet-slide-up animation on mobile (`-mt-8 rounded-t-3xl`)
- Grabber on mobile
- Body content max-width and centering

**DO NOT build a custom `<main>` + `<section>` hero stack again.** If you
need something the layout doesn't support, extend `CustomerScreenLayout`
itself — don't fork.

**Canonical implementations:**
- `TipScreen` (`bg-accent`)
- Bill page (`bg-accent` or `bg-emerald-600` when paid)
- QR payment success page (`bg-emerald-600` / `bg-amber-500` / `bg-red-600`)

### 4.2 Receipt-style screens

Always use `PaymentReceipt` OR `CustomerScreenLayout` with a status hero.
Status = `approved` → emerald hero. Status = `pending_validation` → accent
hero. **Never orange.** Always include a "Verificar estado" refresh button
when pending.

### 4.3 Pickers (preset choices)

For tips, amounts, methods: never a bare input first. Always offer **preset
chips** (e.g., 5% / 10% / 15% / custom) as the primary choice, with custom
input revealed only when selected. Customers should be able to commit in 1
tap, not 4 keystrokes.

### 4.4 Bottom-sheet modals

Use the right primitive for the job. Never roll your own modal shell.

| Use case                                    | Primitive                  |
| ------------------------------------------- | -------------------------- |
| Yes/No confirmation                         | `ConfirmDialog`            |
| Form / wizard in a modal context            | `FormSheet`                |
| Full-screen customer flow with hero + body  | `CustomerScreenLayout`     |

`FormSheet` and `ConfirmDialog` both render as a bottom sheet on mobile
(with grabber) and a centered modal on desktop in a single component —
NEVER render both `BottomSheet` and a custom desktop modal in the same
page. That dual-render pattern is banned.

### 4.5 Inline notifications / banners

For success/error/warning/info banners use `<Notification>` from
`@/components/ui/Notification`. Pick a `tone` (`"success" | "error" |
"warning" | "info"`), pass a `message`, optional `title` and `onDismiss`.

**Banned:** ad-hoc `<div className="rounded-2xl border border-emerald-200
bg-emerald-50 ...">` blocks copy-pasted around the codebase. They get out
of sync. Use the component.

### 4.6 Form inputs

For any text/number/email input in a form, use `<FormInput>` from
`@/components/ui/FormInput`. It encodes the canonical input pattern
described in §5 (eyebrow label, leading icon, rounded-2xl border-2,
inline error). Pass `icon`, `error`, `optional` props as needed.

---

## 5. Input pattern (mandatory)

```tsx
<label className="block">
  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
    Nombre
  </span>
  <div className="relative">
    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <input
      className="block w-full rounded-2xl border-2 border-border bg-background py-3.5 pl-10 pr-3 text-base font-medium text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none transition-colors"
      placeholder="Tu nombre"
    />
  </div>
  {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
</label>
```

---

## 6. CTA pattern (primary button)

```tsx
<button className="flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-base font-bold text-accent-foreground shadow-md shadow-accent/20 hover:bg-accent/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 transition-all">
  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
  {label}
</button>
```

Secondary action: `border border-border bg-surface text-foreground` instead
of `bg-accent`. Never two filled buttons next to each other.

---

## 7. Customer-facing emotional design

These screens are seen for ~10s while a customer decides whether to engage.
Apply these tactics:

- **Personalization.** Address the customer by name once we have it
  ("Listo, Saul").
- **Anchoring.** Always show preset amounts ordered with a "popular" one in
  the middle highlighted (e.g., 10% with a small "Más elegido" chip).
- **Reassurance.** Below the CTA, a 1-line note explaining what happens
  next ("Pago seguro procesado por Mercado Pago.").
- **Micro-interactions.** `active:scale-[0.99]` on every button. Confirm
  toasts auto-dismiss after 4s. Animated check on receipt.

---

## 8. When in doubt, check existing screens

These are the canonical references — match their pattern:

**Layouts**

| Screen                                       | File                                                             |
| -------------------------------------------- | ---------------------------------------------------------------- |
| **CustomerScreenLayout (REQUIRED wrapper)**  | `src/features/qr/components/CustomerScreenLayout.tsx`            |
| TipScreen (uses layout, preset chips)        | `src/features/qr/components/TipScreen.tsx`                       |
| Bill page (uses layout, totals hero)         | `src/app/q/[token]/table/bill/page.tsx`                          |
| Finalizar pago (uses layout + method hero)   | `src/app/q/[token]/table/bill/page.tsx` (method branch)          |
| QR payment success page (uses layout)        | `src/app/q/[token]/payment/success/page.tsx`                     |
| PaymentReceipt (focused card overlay)        | `src/features/qr/components/PaymentReceipt.tsx`                  |
| DeviceNamePrompt (hero + form)               | `src/features/qr/components/DeviceNamePrompt.tsx`                |

**Hero blocks (live inside CustomerScreenLayout)**

| Hero                                         | File                                                             |
| -------------------------------------------- | ---------------------------------------------------------------- |
| PaymentMethodHero (method icon + amount)     | `src/features/qr/components/PaymentMethodHero.tsx`               |

**Reusable primitives (use these — do not redeclare)**

| Primitive                                    | File                                                             |
| -------------------------------------------- | ---------------------------------------------------------------- |
| `Notification` (success/error/warning/info)  | `src/components/ui/Notification.tsx`                             |
| `FormInput` (canonical labeled input)        | `src/components/ui/FormInput.tsx`                                |
| `FormSheet` (mobile sheet + desktop modal)   | `src/components/ui/FormSheet.tsx`                                |
| `ConfirmDialog` (yes/no confirmations)       | `src/components/ui/ConfirmDialog.tsx`                            |

**Feature-internal pieces**

| Component                                    | File                                                             |
| -------------------------------------------- | ---------------------------------------------------------------- |
| CustomerPayModal (method picker bottom sheet)| `src/features/qr/components/CustomerPayModal.tsx`                |
| PaymentMethodStep (bank info / instructions) | `src/features/qr/components/PaymentMethodStep.tsx`               |
| BillSummary (cards in body)                  | `src/features/qr/components/BillSummary.tsx`                     |
| MenuProductCard + MenuSearchBar + grid       | `src/features/qr/components/{MenuProductCard,MenuSearchBar,TableMenuGrid}.tsx` |

If a new screen doesn't follow these patterns, it should be reworked, not
shipped.
