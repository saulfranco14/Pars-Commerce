# Plan de modularización de componentes por feature

Documento de seguimiento del Frente 2 (ver `ORM_MIGRATION_PLAN.md`
para el Frente 1 — tipado ORM, actualmente en Fase 3, en pausa).

Ambos documentos viven en `docs/` junto con el resto de la
documentación de contexto del proyecto (`docs/init.md`,
`SISTEMA_COMPLETO.md`, etc.) — solo `README.md`, `CLAUDE.md`,
`ARCHITECTURE.md` y `DESIGN_SYSTEM.md` se quedan en la raíz por tener
referencias cruzadas activas desde `CLAUDE.md` y comentarios en
código.

## Objetivo

Agrupar componentes sueltos en `src/features/{name}/components/` en
subcarpetas por dominio, siguiendo la única referencia positiva que
ya existe en el repo: `features/sitio/components/icons/`.

## Regla de alcance (no negociable)

**Esto es un refactor de UBICACIÓN, no de contenido.** Al mover un
archivo:
- Se actualiza el import en cada archivo que lo consume (el path
  cambia de `@/features/x/components/Foo` a
  `@/features/x/components/subcarpeta/Foo`).
- NO se toca nada más: ni lógica, ni props, ni estilos, ni nombres de
  export, ni el propio contenido del archivo movido.
- Nunca se crea un barrel file (`index.ts` que reexporta) — el repo
  no usa barrels hoy y no se introducen en este refactor.
- Cada fase termina con `npx tsc --noEmit` y `npm run lint` limpios
  antes de pasar a la siguiente. Si algo rompe, se revisa antes de
  seguir — no se acumulan fases con errores pendientes.
- Un archivo por fase o grupo de archivos de bajo blast radius por
  PR — no se mezcla media docena de features en un solo commit
  gigante.

## Umbral de agrupación

3+ componentes con dominio/prefijo compartido → subcarpeta. Features
con 1-2 archivos sueltos no se tocan (no aplica: `auth`,
`onboarding`, `productos`, `servicios`, `equipo`, `sitio-web`).

## Patrón de import confirmado en el repo

Alias `@/`, sin extensión de archivo, path completo con subcarpeta:
`@/features/qr/components/subcarpeta/Nombre`. No se usan imports
relativos entre hermanos — todo pasa por el alias, incluida
composición interna dentro del mismo feature.

---

## Orden de fases (menor a mayor blast radius)

| Fase | Feature | Archivos a mover | Blast radius (imports a actualizar) |
|---|---|---|---|
| 1 | checkout | 6 | 1 archivo (`CheckoutBody.tsx`) |
| 2 | prestamos | 4 | bajo (ver detalle) |
| 3 | configuracion | 12 | medio |
| 4 | orders | 11 | medio |
| 5 | qr | 47 | alto — se divide en sub-fases por dominio |
| 6 | landing | 11 (opcional) | bajo, pero de valor marginal — decidir si se hace |

---

### Fase 1 — checkout: separar `payment-plan/` de `cart/` ✅ DONE

`cart/` mezclaba ítems de carrito con selectores de plan de pago.
Se separaron estos 6 archivos a `src/features/checkout/components/
payment-plan/`, dejando el resto de `cart/` intacto:

| Archivo | De | A |
|---|---|---|
| `FeesBreakdownCard.tsx` | `cart/` | `payment-plan/` |
| `FrequencyPicker.tsx` | `cart/` | `payment-plan/` |
| `InstallmentsPicker.tsx` | `cart/` | `payment-plan/` |
| `MsiBreakdownCard.tsx` | `cart/` | `payment-plan/` |
| `MsiPicker.tsx` | `cart/` | `payment-plan/` |
| `PaymentModeTabs.tsx` | `cart/` | `payment-plan/` |

Movidos con `git mv` (historia preservada). Único archivo con
imports actualizados: `CheckoutBody.tsx` (6 líneas de import
corregidas a la nueva ruta). `CheckoutFormFields.tsx` se quedó en
`cart/` sin tocar, tal como estaba previsto.

**Verificación realizada:**
- `tsc --noEmit` limpio.
- `npm run lint` limpio (el único error de lint es en
  `public/sw.js`, artefacto generado por Serwist, ajeno a este
  cambio — pre-existente).
- Servidor de dev levantado y `GET /sitio/[slug]/checkout` compiló
  833 módulos sin error (redirect 307 a `/inicio` es comportamiento
  esperado por carrito vacío, no una falla).

---

### Fase 2 — prestamos ✅ DONE

| Archivo | De | A |
|---|---|---|
| `CustomerFields.tsx` | raíz | `customer/` |
| `CustomerPicker.tsx` | raíz | `customer/` |
| `AddProductCombobox.tsx` | raíz | `loan-items/` |
| `LoanItemRow.tsx` | raíz | `loan-items/` |

Movidos con `git mv`. Se encontró un quinto archivo no listado en la
auditoría original, `NewCustomerModal.tsx` — se revisó y NO importa
ninguno de los 4 movidos (usa un helper de validaciones, no el
componente), así que no requirió cambios y se queda en la raíz de
`components/` (no forma parte de ningún grupo de 3+ por ahora).

**Importadores externos actualizados (2 archivos, ambos con 1 línea
de import cada uno):**
- `src/app/dashboard/[tenantSlug]/prestamos/nuevo/page.tsx` — importaba
  `CustomerPicker`, `LoanItemRow`, `AddProductCombobox` (3 imports en
  este único archivo).
- `src/features/orders/components/CustomerCard.tsx` — importaba
  `CustomerFields` (uso cross-feature de prestamos → orders, ya
  existía antes de este refactor, no es nuevo).

**Nota aparte (no es parte de esta fase, es un hallazgo distinto):**
`FieldError.tsx` en este feature es genérico (no específico de
préstamos) — candidato a moverse a `src/components/ui/` en algún
momento futuro, pero eso es "componente compartido mal ubicado", no
"componente de feature sin agrupar". Se deja fuera de este plan; si
se decide moverlo, es su propia fase con su propio blast radius. Sus
2 importadores (`CustomerPicker.tsx`, `CustomerFields.tsx`, ambos ya
movidos a `customer/`) lo referencian por path absoluto
(`@/features/prestamos/components/FieldError`), así que no requirió
ningún cambio al moverlos.

**Verificación:** `tsc --noEmit` limpio, `npm run lint` limpio (49
problemas / 1 error, igual que antes de este cambio — el error es el
mismo pre-existente de `public/sw.js`, ajeno a este refactor).

---

### Fase 3 — configuracion ✅ DONE

| Archivo | De | A |
|---|---|---|
| `SiteContentForm.tsx`, `SiteContentFormSection.tsx`, `SiteContentContactoTab.tsx`, `SiteContentNosotrosTab.tsx`, `SiteContentInicioTab.tsx`, `CardIconSelector.tsx` | raíz | `site-content/` |
| `ConfigDireccionSection.tsx`, `ConfigFinanzasSection.tsx`, `ConfigNegocioSection.tsx`, `ConfigTicketSection.tsx`, `ConfigRecurrentesSection.tsx` | raíz | `config-sections/` |
| `BankAccountCard.tsx`, `BankAccountForm.tsx` | raíz | `bank-account/` |

**Desviación del plan original (decidida con el usuario antes de
ejecutar):** `CardIconSelector.tsx` iba a quedarse suelto en raíz por
no tener grupo de 3+, pero al auditar se encontró que su único
consumidor es `SiteContentInicioTab.tsx` (que sí se mueve a
`site-content/`), y ese consumidor lo importa con path RELATIVO
(`./CardIconSelector`, no alias `@/`). Dejarlo suelto habría roto
ese import relativo. Se decidió moverlo junto a su consumidor real —
cohesión de uso gana sobre la categoría genérica original.

`SiteContentForm.tsx` y sus 3 tabs + `SiteContentFormSection.tsx` ya
se importaban entre sí con paths relativos (`./`) — al moverse todos
juntos a `site-content/`, esos imports internos siguieron siendo
válidos sin ningún cambio.

**Importadores externos actualizados (3 archivos, 1-5 líneas cada
uno):**
- `app/dashboard/[tenantSlug]/sitio-web/SiteWebConfigSection.tsx` — `SiteContentForm`.
- `app/dashboard/[tenantSlug]/configuracion/page.tsx` — los 5 `Config*Section`.
- `app/dashboard/[tenantSlug]/configuracion/cuentas-bancarias/page.tsx` — `BankAccountCard`, `BankAccountForm`.

**Verificación:** `tsc --noEmit` limpio, `npm run lint` sin cambios
en el conteo de problemas (49 / 1 error, el mismo pre-existente de
`public/sw.js`).

---

### Fase 4 — orders ✅ DONE

| Archivo | De | A |
|---|---|---|
| `OrderActionButtons.tsx`, `OrderHeader.tsx`, `OrderItemsTable.tsx`, `OrderPaymentPlanCard.tsx`, `CustomerCard.tsx`, `GenerateLinkModal.tsx` | raíz | `order/` |
| `ConfirmPaymentModal.tsx`, `PaymentLinkCard.tsx`, `AssignBeforePaidModal.tsx`, `AssignmentCard.tsx`, `DiscountModal.tsx` | raíz | `payment/` |
| `ReceiptPreview.tsx`, `ReceiptActions.tsx` | raíz | `receipt/` |

**Hallazgo no contemplado en la auditoría original:** existía un
archivo extra, `OrderFormSheet.tsx` (formulario de creación de orden
nueva, usado en `dashboard/page.tsx` y `ordenes/page.tsx` — no en el
detalle de orden). Sin 3+ hermanos de su mismo propósito, se dejó
suelto en la raíz de `components/`, mismo criterio aplicado a
`NewCustomerModal.tsx` en la Fase 2.

**Desviación del plan (decidida con el usuario antes de mover):**
`GenerateLinkModal.tsx` iba a `payment/` según el plan original, pero
su único consumidor (`OrderActionButtons.tsx`, que va a `order/`) lo
importaba con path RELATIVO (`./GenerateLinkModal`). Se movió junto
a `order/` para no romper ese import — mismo criterio que
`CardIconSelector.tsx` en la Fase 3.

**Imports internos corregidos tras cruzar de carpeta (4 archivos):**
- `OrderActionButtons.tsx` (→ `order/`) importaba `AssignBeforePaidModal`
  y `ConfirmPaymentModal` (→ `payment/`) por alias absoluto — 2 líneas
  corregidas con el nuevo path.
- `OrderItemsTable.tsx` (→ `order/`) importaba `OrderActionButtons`
  (mismo grupo, solo cambia el path) y `DiscountModal` (→ `payment/`)
  — 2 líneas corregidas.
- `ReceiptActions.tsx` (→ `receipt/`) importaba `ReceiptPreview`
  (mismo grupo) — 1 línea corregida.
- `PaymentLinkCard.tsx` (→ `payment/`) tenía un import relativo hacia
  fuera de `components/` (`../interfaces/orderDetail`), roto al bajar
  un nivel de profundidad — corregido a alias absoluto
  `@/features/orders/interfaces/orderDetail` (más robusto que un
  relativo frágil ante futuros movimientos).

**Importadores externos actualizados (3 archivos):**
- `app/dashboard/[tenantSlug]/ordenes/[orderId]/page.tsx` — 8 imports.
- `src/components/orders/TicketDownloadActions.tsx` — `ReceiptPreview`.
- `src/features/qr/components/BillPayModal.tsx` — `ConfirmPaymentModal`
  (uso cross-feature qr → orders, ya existía antes de este refactor).

**Verificación:** `tsc --noEmit` limpio (tras corregir el import roto
de `PaymentLinkCard.tsx`), `npm run lint` sin cambios en el conteo
(49 / 1 error, el mismo pre-existente de `public/sw.js`).

---

### Fase 5 — qr (la más grande) ✅ DONE

47 componentes sueltos → 8 subcarpetas por dominio, ejecutado en 8
sub-fases (5a–5h) de menor a mayor blast radius. tsc --noEmit
verificado en checkpoints; verificación final con tsc, lint y prueba
en navegador de las 3 rutas críticas.

**Código muerto eliminado:** BillPayModal.tsx tenía 0 consumidores en
todo src/ (ni estáticos ni dinámicos, confirmado con grep global +
git log). Con confirmación del usuario se borró (git rm) — no se movió.
Total real: 46 componentes reubicados + 1 borrado.

**Ambigüedades resueltas por DOMINIO REAL (no por nombre), revisando
qué compone/importa cada uno:**
- CustomerPayModal, TipScreen → payment/ (no customer/): CustomerPayModal
  compone PaymentMethodStep y es el origen del tipo CustomerPayMethod
  que consumen los componentes de pago.
- TableMenuHero, TableMenuSections → menu-product/ (no table/ pese al
  prefijo): su contenido es 100% menú de productos.
- BillSplitSection → split/: orquesta SplitItemsAssigner + SplitModePicker.
- PerPersonFulfillmentCard → table/: lo usa MesaDetailContent.

**Subcarpetas finales:** split/ (3), order-tracker/ (2), qr-create/ (7),
menu-product/ (8), customer/ (4), payment/ (5), bill/ (3), table/ (11).

**Quedan sueltos en raíz (transversales):** BrandImage, ConfettiBurst,
PromoBanner, ServiceWorkerFreshnessGuard.

**Verificación final:**
- tsc --noEmit limpio.
- npm run lint sin cambios (49 / 1 error, el pre-existente de public/sw.js).
- Navegador: /q/[token] (customer-facing, 969 módulos), /dashboard/x/mesas
  (1325 mód.) y /dashboard/x/qr (1354 mód.) sirvieron HTTP 200, sin ningún
  Module not found.

---

### Fase 6 — landing (opcional, bajo valor) ⏳ PENDIENTE / A DECIDIR

11 archivos, todos `Landing*` (Cta, Faq, Features, Footer,
HowItWorks, Logos, Nav, Pricing, Showflow, BentoShowcase, Hero). La
cohesión ya es evidente por el prefijo compartido en el nombre —
agruparlos en una subcarpeta `sections/` es opcional y de impacto
marginal. Decidir si se hace al llegar a esta fase, no es
bloqueante para nada más.

---

## Checklist por fase (repetir en cada una)

- [ ] Confirmar conteo de importadores de cada archivo a mover
      (`Grep` del nombre en todo `src/`) — ya hecho para checkout y
      qr, pendiente para configuracion y orders.
- [ ] Resolver cualquier ambigüedad de categoría antes de mover (no
      "sobre la marcha").
- [ ] Mover archivo(s) + actualizar únicamente los imports afectados.
- [ ] `npx tsc --noEmit` limpio.
- [ ] `npm run lint` limpio (sin warnings/errores nuevos).
- [ ] Si la fase toca un flujo con UI real y usable (ej. checkout,
      pantallas `/q/[token]/**`), probar el flujo en navegador antes
      de cerrar la fase — no basta con que compile.
- [ ] Actualizar este documento marcando la fase como DONE con un
      resumen de lo tocado.

## Actualización de skills (pendiente, después de validar el patrón)

Una vez cerradas 2-3 fases reales, agregar a
`.claude/skills/clean-code/SKILL.md`:
- Umbral de agrupación: 3+ componentes con dominio/prefijo
  compartido → subcarpeta.
- Ejemplo canónico: `features/sitio/components/icons/`.
- Regla de movimiento: solo imports, cero cambios de contenido.
- Regla de barrels: nunca crear `index.ts` de reexport al agrupar.
