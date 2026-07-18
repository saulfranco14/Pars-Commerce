# Plan de testing — red de seguridad para pagos + base reutilizable

## Por qué existe este documento

El repo no tiene tests hoy (`package.json` sin scripts de test, la
propia `clean-code/SKILL.md` parte de "no automated test suite"). Los
cambios recientes al **tipado ORM** tocaron los archivos que mueven
dinero real (`mercadopago/webhook/route.ts`,
`tablePaymentService.ts`). Hasta ahora la validación fue `tsc` +
compilación en navegador — eso prueba que **compila**, NO que el
**comportamiento** sigue correcto. Un refactor puede compilar perfecto
y aun así cobrar dos veces, marcar pagada una orden a medias, o revivir
la identidad de un cliente anterior.

**Objetivo en dos tiempos (decidido con el usuario):**
1. **Red de seguridad YA** — cubrir solo los flujos de pago, que es el
   blast radius de lo que se está cambiando. Cobertura chica, en lo que
   duele.
2. **Base reutilizable** — montar la infraestructura de forma que el
   MISMO patrón escale luego al resto del repo, sin re-armar nada.

No se persigue cobertura total (inviable — 67+ archivos de
rutas/servicios). Se persigue cubrir lo crítico y dejar el camino
pavimentado.

## Arquitectura de DOS NIVELES (decisión tomada)

Un solo nivel no basta. Se montan dos capas complementarias:

| Nivel | Contra qué corre | Qué valida | Velocidad | Cuándo se corre |
|---|---|---|---|---|
| **Unit (fake)** | `fakeSupabase` en memoria | Lógica de negocio: idempotencia, `allPaid`, despacho del webhook, ramas de error | ms | En cada guardado (watch) + CI en cada push |
| **Integración** | Postgres real vía `supabase start` (Docker) | RLS, triggers, nombres de columna reales, SQL real, `ServiceResult` de punta a punta | seg | Antes de cada deploy / en CI con Docker |

**Por qué las dos:** el fake es rápido pero *miente* — responde lo que
le digas, así que no detecta una columna inexistente (como el
`processed_at` que encontramos en Fase 0), ni una política RLS rota,
ni un trigger que dejó de disparar. La capa de integración SÍ ejercita
todo eso contra una DB real idéntica a producción (mismas 49
migraciones). El fake te dice "mi lógica es coherente"; la integración
te dice "sube correcto de verdad".

**Prerrequisito operativo:** la capa de integración necesita Docker
corriendo (`supabase start` levanta Postgres+Auth+Storage locales).
Docker ya está instalado en la máquina (v28.4.0); solo hay que abrir
Docker Desktop antes de correr `npm run test:integration`. Los tests
unit (fake) NO necesitan Docker — corren siempre.

## Lo que hace esto FACTIBLE (hallazgo clave)

Los servicios de pago ya están diseñados para ser testeables sin
tocar red ni DB real: reciben el cliente Supabase por parámetro
(`admin: SupabaseClient`) y devuelven un `ServiceResult<T>` puro. Es
inyección de dependencia — se les puede pasar un cliente FALSO en el
test. No hace falta refactorizar nada para poder testear; el diseño
actual ya lo permite.

```ts
export async function confirmPayment(
  admin: SupabaseClient,          // ← inyectable: en test pasamos un mock
  input: ConfirmPaymentInput,
): Promise<ServiceResult<ConfirmPaymentResult>> { ... }
```

## Regla de oro del refactor seguro

**Escribir los tests ANTES de tocar `webhook`/`tablePaymentService`.**
El orden correcto es:
1. Escribir tests que capturen el comportamiento ACTUAL (verde con el
   código como está hoy).
2. Recién entonces refactorizar.
3. Si los tests siguen verdes → el refactor no cambió el
   comportamiento. Si se ponen rojos → el refactor rompió algo, y lo
   sabemos ANTES de deploy, no en producción.

Esto se llama "characterization test": no verifican lo que el código
*debería* hacer en abstracto, sino que congelan lo que hace HOY, para
detectar regresiones.

---

## Fase T0 — Infraestructura base (una sola vez)

**Stack elegido: Vitest.** Razones concretas para este repo:
- Ya se usa el ecosistema Vite/ESM; Vitest corre TS/ESM nativo sin
  config extra de Babel.
- API compatible con Jest (fácil de leer para cualquiera del equipo).
- El CLAUDE.md global del usuario ya tiene un filtro `rtk vitest run`
  configurado → señal de que Vitest es el runner esperado.
- Rápido en watch mode para el loop escribir-test → refactor.
- Soporta "projects" → misma herramienta corre AMBOS niveles (unit +
  integración) con un solo runner, distinta config.

**Entregables de T0 (nivel unit / fake):**
- [ ] `vitest` + `@vitest/coverage-v8` como devDependencies.
- [ ] `vitest.config.ts` con dos proyectos: `unit` (entorno node,
      `**/*.test.ts`) e `integration` (`**/*.itest.ts`, setup que
      conecta a la DB local). Alias `@/` → `src/`.
- [ ] Scripts en `package.json`:
      `"test": "vitest run --project unit"` (el rápido, por defecto),
      `"test:watch": "vitest --project unit"`,
      `"test:integration": "vitest run --project integration"`,
      `"test:all": "vitest run"`.
- [ ] Helper `src/test/fakeSupabase.ts` — cliente Supabase falso
      encadenable (`.from().select().eq().single()` etc.) que devuelve
      datos preconfigurados por tabla y REGISTRA las escrituras
      (`.insert`/`.update`) para aseverar sobre ellas. Pieza
      reutilizable clave. **Solo vive en tests — nunca se importa en
      código de producción, no va al bundle.**
- [ ] 1 test de humo para confirmar runner + alias + TS.

**Criterio de cierre T0:** `npm test` verde con el test de humo.

> ✅ **T0 DONE** (rama `feat/testing-safety-net-QR`). Instalado
> `vitest@3.2.7` + `@vitest/coverage-v8`. `vitest.config.ts` con 2
> proyectos (`unit`/`integration`) y alias `@/`. Scripts `test`,
> `test:watch`, `test:integration`, `test:all` en package.json.
> `src/test/fakeSupabase.ts` implementado (lecturas filtradas +
> registro de escrituras + mutación in-memory). `src/test/smoke.test.ts`
> con 3 tests verdes (4ms). `tsc --noEmit` limpio. `test:all` no rompe
> pese a que `integration` aún no tiene tests (stub de setup en
> `src/test/integration/setup.ts`).

## Fase T0b — Infraestructura de integración (una sola vez, necesita Docker)

- [ ] `src/test/integration/setup.ts` — antes de la suite: conecta un
      cliente Supabase real a la instancia local (`supabase start` deja
      la URL y las keys en `supabase status`). Entre tests: limpia/
      resiembra las tablas tocadas (transacción o `TRUNCATE ... CASCADE`
      de las tablas del caso) para aislamiento.
- [ ] Documentar el flujo en el README de tests:
      `supabase start` → `npm run test:integration` → `supabase stop`.
- [ ] 1 test de humo de integración: insertar un tenant y leerlo de
      vuelta contra la DB local, para confirmar que la conexión, las
      migraciones aplicadas y el aislamiento entre tests funcionan.

**Criterio de cierre T0b:** con Docker arriba, `npm run test:integration`
inserta y lee contra Postgres real, verde.

> ✅ **T0b DONE.** `supabase start` levanta Postgres local con las 49
> migraciones. Setup en `src/test/integration/setup.ts`: driver
> `postgres` directo (rol superusuario, para sembrar/limpiar saltando
> RLS/grants) + helpers `createTestServiceClient` /
> `createTestAnonClient` (supabase-js, mismo camino que producción, para
> tests de comportamiento y RLS). `smoke.itest.ts` con 2 tests verdes
> (round-trip + aislamiento). `test:all` corre los 2 niveles (5 tests).
>
> **Hallazgo de la integración (el tipo de bug que solo esta capa
> detecta):** la migración `20260311000001_loans_module.sql` tenía un
> error de sintaxis SQL real en línea 588 (dos string literals
> adyacentes `'...' '...'` en un `COMMENT ON FUNCTION`, inválido en
> Postgres). Nunca falló en prod porque se aplicó vía dashboard, pero
> `supabase start` (validación estricta) lo rechazó. Corregido uniendo
> los strings — es un metadato, no toca lógica ni datos; en prod ya
> está aplicado, solo afecta `db reset`/entornos nuevos.
>
> **Nota de seguridad:** los tests usan las keys LOCALES de la CLI
> (defaults públicos, sin valor fuera del Docker). Nunca la
> service_role de producción.
>
> **Descubrimiento sobre RLS:** el `service_role` vía la API REST da
> `permission denied` en la DB local recién creada (faltan grants de
> tabla que el Supabase remoto sí configura). Por eso el
> setup/limpieza usa conexión directa `postgres`, no la API REST. Los
> tests que quieran ejercitar RLS "como la app" usan los clientes
> supabase-js.

**Nota de realidad:** T0b tiene más fricción (Docker, ~30-60s de
arranque de la DB local). Por eso NO corre en cada guardado — corre
antes de deploy y en CI. El loop rápido del día a día es el nivel unit.

---

## Fase T1 — Red de seguridad: pagos (characterization, ANTES de refactorizar)

Prioridad por riesgo económico. Todos sobre `tablePaymentService.ts` y
el webhook, con el fake client (sin DB real).

### T1.1 — `areAllSplitGroupsPaid` (el helper recién extraído)
El caso más directo y el que YA cambiamos en Fase 8 del ORM. Tests:
- [ ] Todos los grupos `payment_status: "paid"` → `true`.
- [ ] Un grupo `pending` → `false`.
- [ ] Cero grupos (`data: []` / `null`) → `true` (comportamiento actual
      de `.every` sobre vacío — CONGELAR este comportamiento tal cual,
      aunque sea discutible, para detectar si un refactor lo cambia).

### T1.2 — `confirmPayment`
- [ ] Pago inexistente → `err("not_found")`.
- [ ] Pago ya `approved` → early return `allPaid: false`, sin
      re-escribir (aseverar que NO se llamó `.update` de nuevo —
      idempotencia).
- [ ] Pago de split, y es el último pendiente → marca grupo pagado +
      orden pagada, `allPaid: true`.
- [ ] Pago de split, quedan otros pendientes → `allPaid: false`, orden
      NO marcada pagada.

### T1.3 — `payGroup`
- [ ] Paga un grupo; con otros aún pendientes → grupo pagado,
      `allPaid: false`.
- [ ] Paga el último grupo → `allPaid: true`, orden pagada.
- [ ] Doble pago del mismo grupo (idempotencia) → congelar
      comportamiento actual.

### T1.4 — webhook: despacho por `external_reference`
El webhook es un router por prefijo (`qr_table:`, `loan:`,
`order:...`). Tests del DESPACHO (a qué handler manda cada prefijo),
mockeando los handlers:
- [ ] `qr_table_group:{id}` → llama `handleQrTableMpPayment`.
- [ ] `loan:{id}` → llama `handleSingleLoanPayment`.
- [ ] `order:{id}:mode:single:...` → rama de checkout.
- [ ] Firma inválida → 401 sin despachar nada (ya lo vimos manual: el
      webhook responde 401; congelarlo como test).

### T1.5 — el bug de privacidad ya conocido (regresión)
`ARCHITECTURE.md §6` y la memoria del proyecto marcan un bug de
aislamiento de sesión QR: al cerrar una orden y abrir otra en el mismo
QR, NO se debe revivir el `device_name` del cliente anterior. Si hay
una función pura detrás de eso (`useTableSession` / `is_new_session`
de `/api/qr/resolve`), añadir un test que congele "orden nueva ⇒
identidad limpia". Es el tipo de regresión que un refactor de pagos
podría reintroducir sin querer.

**T1.1–T1.5 son nivel unit (fake)** — lógica pura, corren en ms.

### T1-INT — los mismos flujos críticos, pero contra DB real
Un subconjunto de T1 se re-verifica en integración, porque el fake no
puede probarlos:
- [ ] `confirmPayment` del último grupo → contra Postgres local,
      confirmar que la orden queda `paid` Y que cualquier trigger
      asociado disparó (inventario/comisión si aplica). El fake no ve
      triggers; esto sí.
- [ ] Que los `.select("...")` de los servicios de pago usen columnas
      que EXISTEN (el caso `processed_at`). Un select contra la DB real
      falla en runtime si la columna no existe — el fake no.
- [ ] Aislamiento multi-tenant: una query de pagos de un tenant no
      devuelve filas de otro (ejercita RLS). Solo verificable con DB
      real + dos tenants sembrados.

**Criterio de cierre T1:** unit verde con código actual + T1-INT verde
contra DB local. Recién ahí se aplica el refactor de
`webhook`/`tablePaymentService`, y se re-corren AMBOS niveles: si
siguen verdes, el refactor es seguro para deploy.

> ✅ **T1 DONE.** 27 tests verdes (23 unit + 4 integración), `tsc`
> limpio. `areAllSplitGroupsPaid` exportado para poder testearlo
> directo (cambio mínimo, no altera comportamiento).
>
> - **T1.1** `areAllSplitGroupsPaid` — 4 casos (todos pagados, uno
>   pending, cero grupos→true congelado, filtra por order).
> - **T1.2** `confirmPayment` — 5 casos (not_found, idempotencia de
>   ya-approved sin writes, último grupo→orden pagada, grupo con otros
>   pendientes→no paga orden).
> - **T1.3** `payGroup` — 6 casos (not_found, idempotencia, gate de
>   fulfillment por orden y por device, último grupo→paga, grupo con
>   otros pendientes).
> - **T1.4** despacho del webhook — 6 casos sobre las funciones PURAS
>   de clasificación (`isQrTableReference`, `parseCheckoutReference`).
>   El `POST` completo no se unit-testea (depende de `paymentClient`
>   real + handlers importados; se cubre por verificación manual).
> - **T1-INT** — `areAllSplitGroupsPaid` contra Postgres real vía el
>   MISMO cliente supabase-js que producción (2 casos).
>
> **DOS hallazgos que solo la capa de integración pudo destapar:**
>
> 1. **Grants faltantes → riesgo de pago de más.** Contra la DB local,
>    `areAllSplitGroupsPaid` devolvía `true` (todos pagados) cuando había
>    un grupo pending. Causa: el `service_role` vía supabase-js recibía
>    `permission denied` (42501) sobre `order_split_groups` — las tablas
>    del QR module definen POLICIES RLS para service_role pero nunca
>    hicieron el `GRANT` de tabla (capas independientes en Postgres). El
>    código hace `(groups ?? []).every(...)`, así que un error de query
>    se traga silenciosamente como "sin grupos" → orden marcada pagada de
>    más. En prod no se dispara (Supabase remoto sí tiene los grants por
>    defecto), pero el patrón "error de query → allPaid true" es un riesgo
>    real que conviene endurecer aparte.
>    **Fix:** migración `20260717000001_grant_supabase_roles_public_schema.sql`
>    — GRANTs explícitos e idempotentes a los 3 roles sobre `public`,
>    replicando el default de Supabase. No-op en prod, necesario en local.
>
> 2. (De T0b) el error de sintaxis del `COMMENT` en la migración de
>    loans.
>
> Un fake NUNCA habría mostrado ninguno de los dos. Es exactamente el
> valor de la capa de integración.

## Hardening H1 — cerrar el bug de "pago de más" ✅ DONE

Con la red de T1 puesta, se corrigió el riesgo que la integración
destapó, con seguridad de no romper comportamiento.

**Antes:** `areAllSplitGroupsPaid` hacía
`return (groups ?? []).every(g => g.payment_status === "paid")`. Si la
query fallaba (`data: null`), el `?? []` la volvía `[]` y `.every()`
sobre vacío devuelve `true` → la orden se marcaba **totalmente
pagada sin verificar un solo grupo**. Riesgo de dinero: un pago
parcial + un fallo de query transitorio = mesa cerrada como saldada.

**Después:** se captura `error` y se trata `error || sin grupos` como
`false` (lado seguro: ante la duda NO cobrar de más; solo se pospone
el cierre al siguiente intento). Los callers solo llaman este helper
tras confirmar que existe un split group, así que "cero grupos" es
siempre anomalía, nunca un caso legítimo.

**Tests que lo congelan:**
- unit: "zero groups → FALSE" (antes era true — cambio a propósito).
- unit: "query error → FALSE" (el escenario exacto del bug; requirió
  extender `fakeSupabase` para poder sembrar errores de query por
  tabla — capacidad reutilizable para T2).
- integración: sigue verde contra Postgres real.

`tsc` limpio, 28 tests verdes, ruta `/q/[token]/table/bill` compila y
sirve 200.

---

## Fase T2 — Base escalable al resto del repo (después, gradual)

Con el `fakeSupabase` ya montado, cada servicio nuevo a cubrir es
"copiar el patrón". Orden sugerido cuando se retome, por criticidad:
1. `loanWebhookHandlers` (dinero, préstamos).
2. `checkout/services/*Handler` (dinero, storefront).
3. `staffOrderService`, `splitOrderService` (estado de órdenes).
4. Rutas CRUD (`products`, `promotions`, `customers`) — menor riesgo,
   buen terreno para que el equipo aprenda el patrón.

No es bloqueante para nada. Se hace cuando haya espacio.

---

## Lo que este plan NO cubre (honestidad de alcance)

- **No es E2E de UI.** No arranca navegador ni prueba la interfaz. Para
  eso queda la verificación manual en navegador que ya venimos haciendo
  (`/q/[token]`, etc.) y, si algún día se quiere, Playwright — otro
  proyecto. La capa de integración prueba servicios contra DB real,
  pero no clicks en pantalla.
- **RLS/triggers: SÍ se cubren, pero solo en la capa de integración**
  (T0b/T1-INT), no en unit. Si Docker no está arriba, esa garantía no
  corre — por eso el criterio de cierre exige AMBOS niveles verdes
  antes de deploy.
- **No garantiza "todo el repo".** Cubre pagos. El resto es T2, gradual.

## Checklist de arranque

- [ ] T0 — vitest + fakeSupabase + humo (nivel unit, sin Docker).
- [ ] T0b — setup de integración + humo contra DB local (con Docker).
- [ ] T1.1–T1.5 unit de pagos, VERDES con código actual.
- [ ] T1-INT integración de pagos, VERDE con código actual.
- [ ] Recién entonces: refactor de `webhook`/`tablePaymentService`.
- [ ] Re-correr unit + integración → verde → deploy seguro.
