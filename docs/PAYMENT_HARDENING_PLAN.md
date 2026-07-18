# Plan de hardening de pagos — que ningún cobro se pierda

## Por qué existe este documento

Una auditoría de reconciliación (ver veredicto abajo) confirmó que
**hoy el sistema puede perder un pago cobrado en Mercado Pago sin que
nadie se entere.** Esto NO es un problema de tests — es de diseño de
sistema. Los tests detectan regresiones; la reconciliación garantiza
que el dinero cuadre. Son trabajos distintos y este plan es del
segundo.

Regla de este plan: cada fase primero **congela el comportamiento
actual con un test** (para no romper lo que funciona), luego aplica el
cambio de diseño, luego re-verifica. La red de `TESTING_PLAN.md` es el
andamio; este plan es la obra.

## Veredicto de la auditoría (estado actual)

**El sistema PUEDE PERDER UN PAGO SILENCIOSAMENTE.** Dos fallos se
combinan:
1. El webhook devuelve `200` incluso cuando el procesamiento falla
   (`webhook/route.ts:394-397` — `catch` global → `{ received: true }`).
   MP solo reintenta ante status ≠ 2xx, así que un fallo interno (DB
   caída, timeout, bug) hace que MP marque el webhook como entregado y
   **nunca reintente**.
2. No existe reconciliación fuera del webhook (ni cron, ni polling, ni
   barrido de pendientes contra la API de MP). Si el webhook se pierde
   o falla, nada vuelve a verificar el estado real en MP.

Cimientos que SÍ existen (sobre los que se construye): `external_reference`
rastreable por flujo (`loan:`, `qr_table:`, `order:...`), estados
`pending` en `payments`/`order_payment_attempts`, e índices únicos de
idempotencia en varias rutas (préstamos, checkout, suscripciones).

---

## Fase P1 — Webhook reintentar ante fallo (5xx) 🔴 CRÍTICO, quick win

**El problema, hoy:** `webhook/route.ts:394-397`
```ts
} catch (err: unknown) {
  console.error("Webhook processing error:", err);
  return NextResponse.json({ received: true });   // ← 200 SIEMPRE
}
```
Y los orquestadores de preapproval (`:57-64`, `:66-73`) también tragan
el error y devuelven 200.

**Qué pasa:** MP cobra al cliente. El webhook llega, pero al procesarlo
la DB da timeout. El `catch` responde 200. MP piensa "entregado", lo
tacha, **no reintenta**. El pago quedó solo en MP. Cliente dice "ya
pagué" y tiene razón — el sistema simplemente lo perdió.

**La solución:** distinguir dos tipos de "no procesado":
- **Ignorado a propósito** (no es un evento que nos interese, firma
  inválida, tipo desconocido) → `200`, está bien, MP no debe reintentar.
- **Fallo real de procesamiento** (excepción, error de DB) → `5xx`,
  para que MP REINTENTE. MP reintenta con backoff varias veces en las
  siguientes horas — es una red de recuperación GRATIS que hoy está
  desactivada.

**Cuidado (por qué el orden importa):** activar reintentos SIN
idempotencia sólida = MP reenvía y se duplica el pago. Por eso P1 y P2
van juntos: reintentos + idempotencia por ruta. No se activa uno sin
el otro.

**Test que lo respalda:** unit del webhook route que congele "error de
handler → status 5xx" y "evento ignorable → 200". (Requiere poder
inyectar/mockear el handler que falla — andamiaje acotado, vale la pena
solo aquí por ser el punto crítico.)

---

## Fase P2 — Idempotencia pareja en todas las rutas 🔴 CRÍTICO

**El problema, hoy:** la idempotencia es DISPAREJA por ruta:
- Préstamos, checkout, suscripciones: bien (índice único +
  manejo de `23505`).
- **QR mesa (`tableMpWebhookService.ts:77-85, 131-140`): débil.** Inserta
  en `payments` con `provider_payment_id`, columna que **no tiene índice
  único** (grep en migraciones = 0). La única defensa es el check
  `order.status === "paid"` — que tiene **race condition**: dos webhooks
  concurrentes leen `status != paid` y ambos insertan un pago duplicado.

**Qué pasa:** MP reenvía el webhook de una mesa (normal, MP reenvía por
diseño), o P1 activa reintentos. Sin índice único, se inserta un
segundo `payment` por el mismo cobro → `paid_total` descuadrado, la
mesa registra que cobró el doble.

**La solución:**
- Migración: índice único sobre el identificador de pago de MP en
  `payments` para la ruta QR (alinear con `external_id` o agregar el
  índice sobre `provider_payment_id`, decidir cuál columna es la
  canónica — hoy conviven dos nombres, eso hay que limpiarlo).
- Manejar `23505` en la ruta QR igual que en préstamos.

**Test que lo respalda:** integración (necesita DB real para probar el
índice único) — insertar el mismo pago dos veces y confirmar que el
segundo es rechazado/absorbido, no duplicado.

---

## Fase P3 — Reconciliador (la red de recuperación de fondo) 🟠 ALTO

**El problema, hoy:** aunque P1 active reintentos, un webhook puede no
llegar NUNCA (MP tuvo un incidente, la URL estuvo caída todo el ciclo
de reintentos, etc.). No hay nada que, después, note el hueco.

**La solución:** un job periódico (cron) que:
1. Barra las entidades en estado no-final (`orders` en
   `pending_payment`, `order_payment_attempts` en `pending`, préstamos
   con saldo, más antiguas que N minutos).
2. Para cada una, consulte a MP por su `external_reference`
   (`payments/search` de la API de MP) el estado REAL del pago.
3. Si MP dice "aprobado" pero local no lo refleja → aplicar el mismo
   settle que haría el webhook (reusando los handlers, idempotentes por
   P2, así que es seguro aunque el webhook también llegue después).

**Por qué va después de P1/P2:** el reconciliador REUSA los handlers de
settle. Si esos no son idempotentes (P2), el reconciliador duplica. Y
si P1 ya recupera el 99% vía reintentos, el reconciliador es la malla
fina para el 1% restante — importante, pero no lo primero.

**Decisiones de diseño a resolver antes de construir:**
- ¿Dónde corre el cron? (Vercel Cron, un endpoint protegido llamado
  externamente, Supabase scheduled function). Hoy no hay `vercel.json`
  ni cron alguno — es infra nueva.
- ¿Cada cuánto? (trade-off: frecuencia vs. carga/rate-limit de la API
  de MP).
- ¿Cómo se autentica ese endpoint para que no lo llame cualquiera?

**Test que lo respalda:** unit del barrido (dado un set de entidades
pendientes y respuestas mockeadas de MP, ¿concilia las correctas?) +
integración del settle idempotente.

---

## Fase P4 — Observabilidad de pagos perdidos 🟡 MEDIO

**El problema:** aunque P1-P3 cierren el hueco, si algo se rompe hay que
ENTERARSE. Hoy los fallos de webhook van a `console.error` y se pierden
en los logs.

**La solución:** que un fallo de procesamiento de pago (el `catch` de
P1, un mismatch del reconciliador) emita una señal visible — una fila en
una tabla `payment_incidents`, o una alerta. Para que "perdimos un
pago" sea un evento accionable, no un log que nadie lee.

Menor prioridad: es la malla de seguridad de la malla de seguridad.

---

## Resumen de prioridad

| Fase | Qué | Riesgo si no se hace | Tamaño |
|---|---|---|---|
| P1 | Webhook 5xx en fallo → MP reintenta | 🔴 pagos perdidos hoy | pequeño |
| P2 | Idempotencia pareja (índice único QR) | 🔴 duplicación al reintentar | pequeño |
| P3 | Reconciliador (cron vs MP) | 🟠 hueco del 1% que P1 no cubre | grande (infra) |
| P4 | Observabilidad de incidentes | 🟡 fallos invisibles | medio |

**P1 + P2 son inseparables y van primero** (activar reintentos sin
idempotencia duplica pagos). P3 es el arreglo de fondo pero depende de
P2. P4 es la guinda.

## Relación con los otros planes

- `TESTING_PLAN.md` — la red que respalda cada cambio de este plan.
- `TESTING_EXPANSION_PLAN.md` (E1/E2/E3) — cubre los MISMOS servicios
  (loan/qr/checkout handlers). Conviene FUSIONAR: al cubrir cada
  handler con tests (E1/E2), aprovechar para aplicar su hardening de
  P1/P2. Un solo pase por archivo, no dos.
