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

### Fase 2 — prestamos ⏳ PENDIENTE

| Archivo | De | A |
|---|---|---|
| `CustomerFields.tsx` | raíz | `customer/` |
| `CustomerPicker.tsx` | raíz | `customer/` |
| `AddProductCombobox.tsx` | raíz | `loan-items/` |
| `LoanItemRow.tsx` | raíz | `loan-items/` |

**Nota aparte (no es parte de esta fase, es un hallazgo distinto):**
`FieldError.tsx` en este feature es genérico (no específico de
préstamos) — candidato a moverse a `src/components/ui/` en algún
momento futuro, pero eso es "componente compartido mal ubicado", no
"componente de feature sin agrupar". Se deja fuera de este plan; si
se decide moverlo, es su propia fase con su propio blast radius.

---

### Fase 3 — configuracion ⏳ PENDIENTE

| Archivo | De | A |
|---|---|---|
| `SiteContentForm.tsx`, `SiteContentFormSection.tsx`, `SiteContentContactoTab.tsx`, `SiteContentNosotrosTab.tsx`, `SiteContentInicioTab.tsx` | raíz | `site-content/` |
| `ConfigDireccionSection.tsx`, `ConfigFinanzasSection.tsx`, `ConfigNegocioSection.tsx`, `ConfigTicketSection.tsx`, `ConfigRecurrentesSection.tsx` | raíz | `config-sections/` |
| `BankAccountCard.tsx`, `BankAccountForm.tsx` | raíz | `bank-account/` |

Queda suelto en raíz: `CardIconSelector.tsx` (sin grupo claro de 3+).

Antes de ejecutar: correr el mismo tipo de conteo de importadores que
se hizo para qr/checkout (Grep de cada nombre de archivo en `src/`)
para confirmar blast radius real por archivo antes de mover.

---

### Fase 4 — orders ⏳ PENDIENTE

| Archivo | De | A |
|---|---|---|
| `OrderActionButtons.tsx`, `OrderHeader.tsx`, `OrderItemsTable.tsx`, `OrderPaymentPlanCard.tsx`, `CustomerCard.tsx` | raíz | `order/` |
| `ConfirmPaymentModal.tsx`, `PaymentLinkCard.tsx`, `GenerateLinkModal.tsx`, `AssignBeforePaidModal.tsx`, `AssignmentCard.tsx`, `DiscountModal.tsx` | raíz | `payment/` |
| `ReceiptPreview.tsx`, `ReceiptActions.tsx` | raíz | `receipt/` |

Antes de ejecutar: mismo conteo de importadores previo (esta feature
no se auditó a ese nivel de detalle todavía, a diferencia de qr y
checkout).

---

### Fase 5 — qr (la más grande, dividir en sub-fases) ⏳ PENDIENTE

47 archivos, 8 dominios. NO se hace en un solo movimiento — cada
sub-fase es su propio PR, en orden de menor a mayor uso compartido
(menos importadores externos primero = menor riesgo de romper algo
en cascada).

**Hallazgo a resolver ANTES de mover nada en qr:** `BillPayModal.tsx`
tiene **0 importadores** en todo `src/`. No se mueve ni se borra
todavía — primero confirmar con el equipo/`git log` si es código
muerto real o si se invoca de forma dinámica (ej. lazy import) antes
de decidir qué hacer con él. Tratarlo como bloqueante de la sub-fase
`payment/` hasta aclarar.

**Ambigüedades a resolver antes de ejecutar cada sub-fase** (ver
detalle completo en el reporte de investigación, resumen aquí):
- `PerPersonFulfillmentCard.tsx` → ¿`bill/` o `table/`? Revisar el
  componente padre real que lo usa antes de decidir.
- `TableMenuHero.tsx`, `TableMenuSections.tsx` → nombre sugiere
  `table/`, contenido sugiere `menu-product/`. Definir convención:
  ¿se agrupa por pantalla o por dominio de UI? Debe decidirse una
  vez y aplicarse consistente en toda la fase.
- `BillSplitSection.tsx` → límite entre `bill/` y `split/`.
- `CustomerPayModal.tsx`, `TipScreen.tsx` → mezclan dominio customer
  con acción de pago; evaluar si van a `payment/` en vez de
  `customer/`.

**Sub-fase 5a — split/ (3 archivos, menor riesgo)**
| Archivo | Importadores externos |
|---|---|
| `SplitItemsAssigner.tsx` | 3 |
| `SplitModePicker.tsx` | 1 |
| `BillSplitSection.tsx` (si se confirma aquí y no en bill/) | 1 |

**Sub-fase 5b — order-tracker/ (2 archivos)**
| Archivo | Importadores externos |
|---|---|
| `OrderTrackerCard.tsx` | 1 |
| `OrderTrackerSkeleton.tsx` | 2 |

**Sub-fase 5c — qr-create/ (8 archivos)**
| Archivo | Importadores externos |
|---|---|
| `QrKindSelector.tsx` | 1 |
| `QrCreateForm.tsx` | 2 |
| `QrCreateFormSheet.tsx` | 1 |
| `QRCodeCard.tsx` | 1 |
| `CreatedQrSuccess.tsx` | 2 |
| `StaffOrderQrResult.tsx` | 1 |
| `QrPreview.tsx` | 6 (el más compartido de este grupo — mover al final de la sub-fase) |

**Sub-fase 5d — menu-product/ (7-9 archivos, según se resuelva la
ambigüedad de TableMenu*)**
| Archivo | Importadores externos |
|---|---|
| `MenuProductCard.tsx` | 2 |
| `MenuPeekRow.tsx` | 1 |
| `ProductTile.tsx` | 2 |
| `ReorderRow.tsx` | 1 |
| `ProductDetailSheet.tsx` | 1 |
| `ProductImageGallery.tsx` | 1 |
| `TableMenuHero.tsx` | 1 (pendiente decisión) |
| `TableMenuSections.tsx` | 1 (pendiente decisión) |

**Sub-fase 5e — customer/ (5-7 archivos)**
| Archivo | Importadores externos |
|---|---|
| `CustomerScreen.tsx` | 6 |
| `CustomerLoading.tsx` | 1 |
| `CustomerMergeSheet.tsx` | 1 |
| `DeviceNamePrompt.tsx` | 1 |
| `CustomerPayModal.tsx` | 8 (pendiente decisión: ¿customer/ o payment/?) |
| `TipScreen.tsx` | 1 (pendiente decisión) |

**Sub-fase 5f — payment/ (4-5 archivos)**
| Archivo | Importadores externos |
|---|---|
| `PaymentMethodStep.tsx` | 1 |
| `PaymentReceipt.tsx` | 3 |
| `PendingPaymentsCard.tsx` | 1 |
| `BillPayModal.tsx` | 0 — **bloqueado, ver hallazgo arriba** |

**Sub-fase 5g — bill/ (4-5 archivos)**
| Archivo | Importadores externos |
|---|---|
| `BillHero.tsx` | 1 |
| `BillScreenSkeleton.tsx` | 2 |
| `BillSummary.tsx` | 1 |
| `PerPersonFulfillmentCard.tsx` | 1 (pendiente decisión) |

**Sub-fase 5h — table/ (la más grande y más usada, al final)**
| Archivo | Importadores externos |
|---|---|
| `ActiveTablesCard.tsx` | 1 |
| `CloseTableDialog.tsx` | 1 |
| `MergeTableDialog.tsx` | 1 |
| `MergeRequestBanner.tsx` | 2 |
| `MesaDetailContent.tsx` | 2 |
| `TableCtaBar.tsx` | 1 |
| `TableListCard.tsx` | 1 |
| `TableScreenSkeleton.tsx` | 1 |
| `TableTimeline.tsx` | 1 |
| `TablesFilterTabs.tsx` | 1 |

**Quedan sueltos en raíz de `qr/components/` (transversales, sin
dominio de negocio propio — no forman categoría):**
`BrandImage.tsx`, `ConfettiBurst.tsx`, `PromoBanner.tsx`,
`ServiceWorkerFreshnessGuard.tsx`.

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
