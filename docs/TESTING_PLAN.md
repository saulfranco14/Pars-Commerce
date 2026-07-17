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

**Entregables de T0:**
- [ ] `vitest` + `@vitest/coverage-v8` como devDependencies.
- [ ] `vitest.config.ts` — entorno `node` (los servicios no tocan DOM),
      alias `@/` apuntando a `src/` (igual que tsconfig), `include`
      apuntando a `**/*.test.ts`.
- [ ] Script en `package.json`: `"test": "vitest run"`,
      `"test:watch": "vitest"`.
- [ ] Helper de test `src/test/fakeSupabase.ts` — un cliente Supabase
      falso encadenable (`.from().select().eq().single()` etc.) que
      devuelve datos preconfigurados por tabla y REGISTRA las
      escrituras (`.insert`/`.update`) para poder aseverar sobre ellas.
      Este helper es la pieza reutilizable clave: sirve para pagos HOY
      y para cualquier servicio del repo mañana.
- [ ] 1 test trivial de humo (`expect(1+1).toBe(2)`) para confirmar que
      el runner + alias + TS funcionan de punta a punta antes de
      escribir tests reales.

**Criterio de cierre T0:** `npm test` corre verde con el test de humo.

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

**Criterio de cierre T1:** todos verdes CON el código actual. Recién
ahí se aplica el refactor de `webhook`/`tablePaymentService`, y se
re-corre: si siguen verdes, el refactor es seguro.

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

- **No es E2E.** No arranca navegador ni prueba la UI real. Para eso
  queda la verificación manual en navegador que ya venimos haciendo
  (`/q/[token]`, etc.) y, si algún día se quiere, Playwright — pero eso
  es otro proyecto.
- **No prueba RLS ni triggers de Postgres.** El fake client salta la DB
  real, así que las 56 políticas RLS y 14 triggers NO se ejercitan
  aquí. Eso solo se valida contra una DB real (staging) — fuera de
  alcance de esta red de seguridad.
- **No garantiza "todo el repo".** Cubre pagos. El resto es T2, gradual.

## Checklist de arranque

- [ ] T0 infraestructura (vitest + fakeSupabase + humo).
- [ ] T1.1–T1.5 characterization de pagos, VERDES con código actual.
- [ ] Recién entonces: refactor de `webhook`/`tablePaymentService`.
- [ ] Re-correr T1 → confirmar verde → deploy seguro.
