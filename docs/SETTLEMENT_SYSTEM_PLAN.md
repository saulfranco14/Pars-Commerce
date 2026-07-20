# Plan del sistema de liquidación (settlement) y comisión de plataforma

## Qué es esto

El modelo de negocio central del producto: una plataforma de pagos
multi-negocio que **custodia el dinero de Mercado Pago, lo liquida a
cada negocio según su ciclo, y cobra una comisión escalonada por
frecuencia.** Más el ledger que le da visibilidad total al negocio de
"cuánto entró, por qué método, cuánto me toca, cuándo lo recibo".

Este documento es el diseño maestro. Depende de que el hueco de
conciliación esté cerrado primero (`PAYMENT_HARDENING_PLAN.md`) —
liquidar dinero que podría estar mal registrado es peligroso.

## Decisiones de negocio (tomadas, no asumidas)

1. **Solo se custodia y liquida el dinero de MERCADO PAGO.** El
   efectivo y las transferencias directas ya son del negocio (nunca
   pasaron por la plataforma) → se REPORTAN en el ledger para que el
   negocio vea su total, pero NO se liquidan ni se les cobra comisión de
   custodia. Modelo limpio legal y técnicamente.
2. **Comisión escalonada POR FRECUENCIA.** Mientras menos frecuente sea
   la liquidación, menor la comisión — porque la plataforma retiene el
   dinero más tiempo (float). Diario = comisión más alta; mensual =
   más baja. Incentiva ciclos largos.
3. **Ciclos configurables por negocio:** diario / semanal / quincenal /
   mensual / personalizado.
4. **Cada liquidación se cierra confirmando la transferencia** — el
   negocio ve "te transferí $X", confirma recibido, y el ciclo queda
   cerrado y auditable.

## Lo que YA existe (cimientos, ~30-40%)

- Multi-tenancy con RLS sólido (todas las tablas por `tenant_id`).
- Método de pago registrado en `orders.payment_method` y
  `loan_payments.payment_method` (efectivo/transferencia/mercadopago).
- Comisión de MP con neto capturado
  (`loan_payments.mp_fee_amount/mp_net_amount`,
  `subscription_payments.net_amount`).
- **Plantillas reutilizables:** `sales_cutoffs` (ciclo por período con
  snapshot inmutable) y `commission_payments` (pago agrupado por período
  con estado pending/paid, `period_type` day/week/month/custom,
  `paid_at`/`paid_by`). El settlement copia estos moldes.
- `PARS_SERVICE_FEE_PERCENT` ya existe como concepto (hoy en 0).

## Lo que FALTA (construcción nueva, ~60-70%)

- Concepto de "la plataforma liquida/le cobra al negocio" — no existe.
- Comisión escalonada por frecuencia — hoy solo % fijo de MP.
- Ledger unificado con `tenant_id` + `payment_method` consistente
  (hoy `payments` no tiene `tenant_id` propio ni método).
- Tabla de ciclos de liquidación con estados.
- Flag/derivación explícita "dinero MP a redistribuir".

---

## FASE S0 — Prerrequisito: conciliación cerrada 🔴 BLOQUEANTE

**No se liquida dinero que no está garantizado como correcto.** Antes
de S1, deben estar hechas P1 (webhook reintenta) y P2 (idempotencia
pareja) de `PAYMENT_HARDENING_PLAN.md`. Si un pago puede perderse o
duplicarse, cualquier liquidación calculada sobre esos datos está
mal. El reconciliador (P3) idealmente también, pero P1+P2 es el mínimo.

---

## FASE S1 — Ledger unificado de movimientos 🟠 FUNDACIÓN

**El objetivo:** una consulta / vista que responda "todos los
movimientos del negocio X en periodo Y" con: monto, método
(efectivo/transferencia/MP), estado, confirmaciones, reintentos, fee de
MP, neto. Es la fuente de verdad sobre la que se construye todo lo
demás.

**Diseño:** una VISTA (o tabla materializada) `payment_ledger` que
unifique los pagos de los distintos módulos (`payments`,
`loan_payments`, `subscription_payments`) normalizados a columnas
comunes: `tenant_id`, `amount`, `method`, `provider`, `mp_payment_id`,
`mp_fee_amount`, `net_amount`, `status`, `is_platform_custodied`
(true solo si method = mercadopago), `retry_count`, `created_at`,
`confirmed_at`.

**Por qué vista y no tabla nueva:** los datos ya existen dispersos; una
vista los unifica sin duplicar ni desincronizar. Si el rendimiento a
escala (miles de negocios, millones de movimientos) lo exige, se
promueve a tabla materializada con refresh incremental — pero eso es
optimización posterior, no diseño inicial.

**Reintentos:** el conteo sale de `order_payment_attempts` (que ya
registra cada intento con su `status`). El ledger expone
`retry_count` por movimiento.

**Entregable:** migración con la vista + endpoint
`GET /api/ledger?tenant_id&from&to&method` que la consulta, con la
agregación que el negocio quiere ver ("$30mil: $X efectivo, $Y transf,
$Z MP; 100 movimientos, 5 con reintento, todos OK").

> 🔨 **S1 en progreso** (rama `feat/payment-hardening-QR`):
> - ✅ Vista `payment_ledger` creada (migración
>   `20260718000001_payment_ledger_view.sql`) — unifica payments +
>   loan_payments + subscription_payments (solo cobros confirmados), con
>   `tenant_id`/`payment_method` vía join a orders, `fee_amount`,
>   `net_amount`, y `is_platform_custodied` (true solo para dinero MP).
> - ✅ Vista `payment_retry_counts` — reintentos por orden derivados de
>   order_payment_attempts (métrica aparte, no filas del ledger).
> - ✅ 3 tests de integración verdes contra Postgres real: unifica
>   MP+efectivo con custody flag correcto, incluye loan con fee/neto, y
>   agrega "cuánto entró por método" (`{efectivo: 30, mercadopago: 100}`).
> - ✅ Super admin de plataforma: tabla `platform_admins` (migración
>   `20260718000002`, RLS estricta + seed condicional por email de
>   `saul.franco1420@gmail.com`), helper `isPlatformAdmin(userId)`
>   server-only, con test de integración (2 casos).
> - ✅ Endpoint `GET /api/ledger` — bifurca por rol: super admin ve
>   TODOS los tenants (filtro opcional por tenant_id); owner ve solo el
>   suyo (requirePermission). Devuelve rows + summary por método +
>   total custodiado por la plataforma (MP).
> - **Seed del super admin:** la migración marca a
>   `saul.franco1420@gmail.com` como platform admin SOLO si su cuenta ya
>   existe (por email, sin contraseñas en código). Si aún no te has
>   registrado, tras crear la cuenta hay que re-ejecutar el INSERT del
>   seed (o correrlo a mano con service_role).
> - **Nota de mantenimiento (aprendida):** regenerar tipos tras una
>   migración con `supabase gen types typescript --db-url "postgresql://
>   postgres:postgres@127.0.0.1:54322/postgres" --schema public`. El
>   flag `--local` falló ("config.toml not found") en este entorno;
>   `--db-url` funciona.

---

## FASE S2 — Comisión escalonada por frecuencia ✅ DONE

> Implementada en `src/constants/platformCommission.ts` (11 tests unit
> verdes). Función pura `calcPlatformCommission(netMpAmount, cycle,
> overridePercent?)` → `{ netMp, commissionPercent, commissionAmount,
> amountToTransfer }`.
> - Escalón por frecuencia (elegido con negocio): `daily 3.5%`,
>   `weekly 3%`, `biweekly 2.5%`, `monthly 2%`. Constante versionada
>   `PLATFORM_COMMISSION_BY_CYCLE`.
> - `custom` NO tiene default: exige `overridePercent` explícito
>   (comisión por contrato) o lanza error.
> - Se cobra sobre el NETO de MP. Redondeo a centavos. Rechaza netos
>   negativos y overrides fuera de 0–1.
> - El override por-negocio (contrato) queda soportado en la firma; el
>   DÓNDE se guarda el ciclo/override de cada tenant es S4.

---

## FASE S2 (diseño original) — Comisión escalonada por frecuencia

**El objetivo:** una función pura `calcPlatformCommission(netMpAmount,
cycle)` que devuelva la comisión de plataforma según el ciclo de
liquidación del negocio.

**Diseño:**
- Una tabla de config `platform_commission_tiers` (o constante
  versionada si es global): mapea `cycle → fee_percent`. Ej:
  `daily → 3.5%`, `weekly → 3.0%`, `biweekly → 2.5%`,
  `monthly → 2.0%`, `custom → definido por contrato`.
- Vive junto a `commissionConfig.ts` (que ya tiene el patrón de
  funciones puras de fee). Se testea unit trivialmente (dado monto +
  ciclo → comisión).
- **Importante:** esta comisión es SOBRE EL NETO DE MP (lo que queda
  tras el fee de MP), no sobre el bruto. El negocio ya absorbió el fee
  de MP; la plataforma cobra su parte sobre lo que va a liquidar.

**Decisión a resolver antes de construir:** ¿la comisión de plataforma
la fija la plataforma globalmente, o es negociable por negocio
(contratos distintos)? Para vender a miles, probablemente un DEFAULT
global + override por tenant. Confirmar antes de la migración.

---

## FASE S3 — Ciclos de liquidación ✅ DONE

> Implementada en rama `feat/settlement-runs-QR` (65 tests verdes).
> - **Migración `20260718000003_settlements.sql`:** tabla `settlements`
>   (cabecera con montos + ciclo de vida + snapshot inmutable + UNIQUE
>   por tenant+periodo) y `settlement_items` (tabla puente elegida por
>   el usuario, con UNIQUE(source_table, source_id) = un cobro se
>   liquida una sola vez). RLS: owner lee lo suyo, platform_admin lee
>   todo, service_role gestiona.
> - **`createSettlement.ts`:** lee del `payment_ledger` los cobros MP
>   custodiados del periodo NO liquidados aún, suma gross/fees/net,
>   aplica la comisión de S2, y escribe header + items. Idempotente por
>   el UNIQUE (rollback del header si fallan los items).
> - **`advanceSettlement.ts`:** máquina de estados
>   `open→closed→transfer_pending→transfer_confirmed` (+ disputed).
>   `canTransition` pura; confirmar transferencia exige referencia;
>   guarda contra transición concurrente (update `.eq(status, from)`).
> - **Tests:** unit de la máquina de estados (6, congela qué
>   transiciones son legales) + integración end-to-end (4: crea con
>   comisión correcta, idempotencia de re-liquidación, ciclo de vida
>   completo con referencia, rechazo de transición ilegal).
> - ⏳ Pendiente de S3: el JOB que dispara el cierre por ciclo (hoy
>   `createSettlement` se invoca a mano; el scheduler que lo llama por
>   tenant según su config es parte de S4).

---

## FASE S3 (diseño original) — Ciclos de liquidación (settlement runs) 🟠 EL CORAZÓN

**El objetivo:** el objeto "liquidación" con su ciclo de vida completo,
copiando el molde de `commission_payments` pero para plataforma→negocio.

**Diseño — tabla `settlements`:**
- `tenant_id`, `cycle_type` (daily/weekly/biweekly/monthly/custom),
  `period_start`, `period_end`.
- `gross_mp_amount` (bruto MP del periodo), `mp_fees_total`,
  `net_mp_amount`, `platform_commission` (de S2),
  `amount_to_transfer` (net − platform_commission).
- `status`: `open` → `closed` → `transfer_pending` →
  `transfer_confirmed`. (Y un `disputed` por si el negocio no reconoce
  un monto).
- `transfer_reference`, `transfer_confirmed_at`, `transfer_confirmed_by`
  (auditoría de "ya te pagué / lo recibí").
- `snapshot` (jsonb inmutable del ledger del periodo, como hace
  `sales_cutoffs`) — para que la liquidación sea auditable aunque los
  datos cambien después.

**Ciclo de vida:**
1. Un job (por ciclo) cierra el periodo → crea `settlement` en `open`
   con el snapshot y montos calculados.
2. Plataforma revisa/confirma → `closed`.
3. Se ejecuta la transferencia (manual o vía MP disbursement) →
   `transfer_pending`.
4. Se confirma recepción → `transfer_confirmed`. Ciclo cerrado.

**Idempotencia:** un periodo no puede liquidarse dos veces (único por
`tenant_id + period_start + period_end`).

---

## FASE S4 — Config de ciclo por negocio ✅ DONE

> Implementada en rama `feat/settlement-config-QR` (75 tests verdes).
> - **Migración `20260718000004_tenant_settlement_config.sql`:** ciclo
>   por negocio (`cycle_type`, `custom_cycle_days`, `commission_override`,
>   `last_settled_at`). Separación de poderes: el owner elige su ciclo;
>   el `commission_override` (comisión por contrato) SOLO la plataforma.
>   RLS: owner lee lo suyo, platform_admin todo, service_role gestiona.
> - **`GET/PUT /api/settlement-config`:** el owner ve su config + un
>   PREVIEW de lo que cuesta cada ciclo (para comparar antes de elegir),
>   y cambia su `cycle_type`. El endpoint NO acepta `commission_override`
>   del owner (no puede bajarse su propia comisión).
> - **Helpers puros:** `cyclePreview.ts` (preview de comisión por ciclo,
>   reusa S2) y `cycleDue.ts` (¿venció el ciclo? + período a liquidar,
>   con `now` inyectable para tests deterministas).
> - **Scheduler `POST /api/settlement-run`:** el cron. Barre las configs,
>   evalúa cuáles vencieron, llama `createSettlement` (S3) por cada una,
>   y estampa `last_settled_at`. Auth por `CRON_SECRET` en header (falla
>   cerrado si no está configurado). `?now=ISO` para tests.
> - **Tests:** unit de `cycleDue` (timing del scheduler) + `cyclePreview`
>   + integración del flujo completo del scheduler contra Postgres real
>   (liquida un tenant vencido, no liquida uno cuyo ciclo no elapsó).
> - ⏳ Pendiente operativo (fuera de código): registrar el cron real
>   (Vercel Cron / scheduler externo) que llame `/api/settlement-run`
>   con el `CRON_SECRET`, y setear esa env var en prod.

---

## FASE S4 (diseño original) — Config de ciclo por negocio 🟡 UX

**El objetivo:** que cada negocio elija su ciclo (diario/semanal/
quincenal/mensual/personalizado) y vea su comisión resultante ANTES de
confirmar ("si eliges mensual, tu comisión es 2% en vez de 3.5%").

**Diseño:** columna(s) en `tenants` o tabla `tenant_settlement_config`:
`cycle_type`, `custom_cycle_days`, `commission_override`. UI en la
config del negocio. El scheduler de S3 lee esta config para saber
cuándo cerrar el ciclo de cada tenant.

---

## FASE S5 — Panel de conciliación para la plataforma ✅ DONE

> Implementada en rama `feat/settlement-dashboard-QR` (76 tests verdes).
> Solo agregación sobre S1-S4, sin migración nueva.
> - **`getPlatformDashboard` (servicio):** resume TODOS los settlements
>   → por estado (count + monto), total pendiente de liquidar
>   (outstanding = open/closed/transfer_pending), comisión ya confirmada,
>   deuda por tenant (mayor primero = a quién pagar next), cola de
>   trabajo (needs_action) y disputados.
> - **`GET /api/settlement-dashboard`:** el tablero de tesorería. SOLO
>   super admin (isPlatformAdmin). La vista "operar miles de negocios".
> - **`GET /api/settlements`:** el lado del NEGOCIO — sus liquidaciones
>   con estado + resumen (pendiente de recibir / confirmado recibido).
>   El "¿cuándo recibo mi dinero?". Owner ve lo suyo; admin cualquiera.
> - **Test de integración** contra Postgres real: 2 tenants con
>   settlements en varios estados → verifica outstanding, deuda por
>   tenant, orden desc, cola de trabajo y comisión confirmada.

---

## 🎯 Sistema de settlement (S1-S5) COMPLETO

De punta a punta, con red de tests en los dos niveles:
- **S1** ledger unificado + super admin de plataforma.
- **S2** comisión escalonada por frecuencia (función pura).
- **S3** settlements con ciclo de vida + tabla puente (un cobro se
  liquida una sola vez).
- **S4** config de ciclo por negocio + scheduler (cron).
- **S5** tableros: plataforma (tesorería) y negocio (¿cuándo cobro?).
- **S6** confirmación de entrega con evidencia (nota + foto).

### S6 — Entrega manual con evidencia ✅ DONE
Modelo real de operación: el dinero llega a la cuenta MP de la
plataforma; la plataforma lo saca y lo transfiere fuera del sistema;
luego CONFIRMA la entrega con evidencia. NO hay transferencia
automática desde el sistema.
- **Migración `20260719000001`:** columnas `transfer_note` +
  `transfer_proof_url` en settlements; bucket PRIVADO
  `settlement-proofs` (info financiera, no público) — sube solo
  platform_admin, lee el owner de esa liquidación o un platform_admin.
- **`advanceSettlement` extendido:** al confirmar acepta nota +
  URL del comprobante (foto del SPEI/depósito). La referencia sigue
  siendo obligatoria.
- **`POST /api/settlements/[id]/confirm`:** endpoint SOLO super admin
  para registrar la entrega con evidencia → transfer_confirmed.
- **`GET /api/settlements`** ya expone note + proof al negocio (ve su
  comprobante).
- **Cambio de ciclo (diario→mensual) cuando el negocio quiera:** ya
  funcionaba en S4 — el scheduler lee `cycle_type` EN VIVO de la config
  en cada run, así que el cambio aplica desde el próximo cierre (sin
  tocar el dinero ya acumulado). Confirmado, sin código nuevo.

**Pendientes OPERATIVOS (fuera de código, para producción):**
1. Registrar el cron real que llama `/api/settlement-run` + setear
   `CRON_SECRET`.
2. Crear la cuenta de super admin (registro normal) y re-ejecutar el
   seed de `platform_admins` por email.
3. `supabase db push` de todas las migraciones nuevas a prod cuando se
   decida (ledger, platform_admins, settlements, config).
4. **Legal/fiscal:** la figura de custodiar y redistribuir dinero de
   terceros (posible PSP/agregador ante CNBV). El diseño ya da la
   trazabilidad total que eso exigiría; la decisión es de negocio.

**Lo que NO cubre este sistema (por diseño):**
- La transferencia real al negocio es MANUAL (por decisión de negocio):
  el dinero llega a MP de la plataforma, se saca y se transfiere fuera
  del sistema, y se CONFIRMA con evidencia (nota + foto, S6).
  Automatizarla (SPEI / MP disbursements) sería una fase futura si se
  decidiera — hoy no está en el alcance a propósito.
- Contracargos/reversas de MP sobre un pago ya liquidado → existe el
  estado `disputed` pero la lógica de ajuste en el siguiente ciclo es
  trabajo futuro.

---

## FASE S5 (diseño original) — Panel de conciliación para la plataforma 🟡 OPERACIÓN

**El objetivo:** la vista de TU lado (plataforma) para operar miles de
negocios: cuánto debes liquidar hoy, a quién, cuántos movimientos, qué
reintentos hubo, qué está en disputa, qué falta confirmar. Es el
tablero de tesorería.

Depende de S1-S3. Es reporte/agregación sobre lo ya construido.

---

## Orden y dependencias

```
PAYMENT_HARDENING (P1+P2)  ← BLOQUEANTE, va primero
        │
        ▼
S1 ledger ──► S2 comisión ──► S3 settlements ──► S4 config ciclo
                                     │
                                     ▼
                              S5 panel plataforma
```

| Fase | Qué | Depende de | Tamaño |
|---|---|---|---|
| S0 | Conciliación cerrada | — | (es P1+P2) |
| S1 | Ledger unificado | S0 | mediano |
| S2 | Comisión escalonada | S1 | pequeño |
| S3 | Settlements + ciclo de vida | S1, S2 | grande |
| S4 | Config de ciclo por negocio | S3 | mediano |
| S5 | Panel plataforma | S1-S3 | mediano |

## Cómo se relaciona con los otros planes

- **`PAYMENT_HARDENING_PLAN.md`** — prerrequisito. Sin conciliación, el
  ledger miente y las liquidaciones salen mal.
- **`TESTING_PLAN.md` / `TESTING_EXPANSION_PLAN.md`** — cada función de
  cálculo de comisión (S2) y cada transición de estado de settlement
  (S3) se cubre con tests. El dinero no se calcula sin red.
- **`commissionConfig.ts`** — S2 extiende este archivo (ya tiene el
  patrón de fees puros).

## Riesgos y decisiones abiertas (resolver antes de construir cada fase)

- **Legal/fiscal:** custodiar dinero de terceros y redistribuirlo tiene
  implicaciones regulatorias (puede requerir figura de agregador/
  PSP ante la CNBV en México). NO es una decisión de código — pero el
  diseño debe poder soportar los requisitos que resulten (trazabilidad
  total, que este plan ya da).
- **¿La transferencia al negocio es manual o automática (MP
  disbursements / SPEI)?** Cambia S3 fase 3. Empezar manual (registrar
  que se pagó) y automatizar después es un camino válido.
- **Comisión global vs. por contrato** (ver S2).
- **Manejo de disputas / contracargos de MP** — si MP revierte un pago
  ya liquidado, ¿cómo se recupera? Diseñar el estado `disputed` y el
  ajuste en el siguiente ciclo.
