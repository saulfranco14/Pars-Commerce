# Ampliación de la red de testing — fases por riesgo real

Continuación de `TESTING_PLAN.md` (T2). La red de T1 cubre
`tablePaymentService` (pagos de mesa/split). Este documento prioriza
QUÉ cubrir después, ordenado por **riesgo real de dinero**, con
ejemplos concretos de qué puede salir mal en cada servicio — para
decidir con evidencia, no por corazonada.

## Cómo se prioriza (el criterio)

Riesgo = **probabilidad de fallo silencioso** × **impacto en dinero si
falla**. Un servicio sube en prioridad si:
- Escribe montos/estados de pago (no solo lee).
- Corre SIN un humano mirando (webhooks: MP dispara, nadie revisa).
- Tiene lógica condicional sobre montos (loops, distribución, cuotas).
- Ya dio bugs antes (señal de que la zona es frágil).

Un webhook es más peligroso que una ruta con UI: si una ruta falla, el
usuario ve un error y reintenta. Si un webhook falla en silencio, el
dinero ya se movió en MP pero el sistema no lo refleja — descuadre.

---

## Fase E1 — `loanWebhookHandlers.ts` 🔴 PRIORIDAD ALTA

**Por qué primero:** es webhook (corre solo), escribe pagos de
préstamos, tiene un LOOP sobre una distribución de montos, y ya dio
bugs de `amount_pending` en la Fase 0 del ORM. Máxima densidad de
riesgo.

**Ejemplo concreto de qué puede pasar — `handleBulkLoanPayment`:**
Un cliente paga 3 préstamos en un solo link. El código recorre
`distribution = { loan1: 500, loan2: 300, loan3: 200 }` e inserta un
`loan_payment` por cada uno:

```ts
for (const [loanId, loanAmount] of Object.entries(distribution)) {
  const { error } = await supabase.from("loan_payments").insert({ ... });
  if (error && error.code !== "23505") {
    console.error(...);   // ← solo loguea, NO aborta ni revierte
  }
}
await supabase.from("loan_bulk_payments").update({ status: "paid" });
```

Escenarios que un test congelaría:
- **Fallo parcial del loop:** si el insert de `loan2` falla (no 23505,
  sino p.ej. un error de red), el código lo loguea y **sigue** — luego
  marca el bulk entero como `"paid"`. Resultado: el cliente pagó 1000,
  MP lo cobró, pero solo se registraron 2 de 3 préstamos, y el bulk
  dice "pagado". Un préstamo queda con saldo vivo aunque el cliente ya
  pagó. **Descuadre de dinero silencioso.**
- **Idempotencia (doble webhook):** MP reenvía el mismo webhook. El
  `23505` (índice único de `mp_payment_id`) lo absorbe — bien. Un test
  congela que un reenvío NO duplica pagos.
- **Distribución vacía o malformada:** `distribution = {}` → no inserta
  nada pero marca "paid". ¿Correcto? Congelar la decisión.

**Cobertura sugerida:** unit (fake) para el loop y la idempotencia +
integración (1 caso) para confirmar que el índice único `23505`
realmente existe en la DB (un fake no lo sabe).

---

## Fase E2 — `tableMpWebhookService.ts` 🟠 PRIORIDAD MEDIA-ALTA

**Por qué segundo:** webhook, cierra el flujo QR de punta a punta
(complementa `tablePaymentService`), y comparte el patrón de "marcar
pagado" que ya sabemos que es delicado.

**Ejemplo concreto — `settleFullOrder` / `settleSplitGroup`:**
MP aprueba un pago QR y dispara el webhook. El código marca la orden
pagada:

```ts
if (!order) return;              // ← si no encuentra la orden, silencio total
if (order.status === "paid") return;   // idempotencia: bien
await admin.from("orders").update({ status: "paid", balance_due: 0, ... });
```

Escenarios que un test congelaría:
- **Orden no encontrada (`!order` → return):** MP cobró pero el
  `orderId` del `external_reference` no existe (typo en el prefijo, o
  la orden se borró). El webhook retorna en silencio → **MP tiene el
  dinero, el sistema no registró nada.** Un test congela este camino
  para que un refactor no lo empeore (p.ej. que deje de ser
  idempotente).
- **Idempotencia (`status === "paid"` → return):** MP reenvía el
  webhook de una orden ya pagada. Debe ser no-op. Test lo congela —
  crítico, porque sin él un reenvío insertaría un segundo `payment` y
  descuadraría `paid_total`.
- **Split group vs full order:** el mismo webhook maneja dos prefijos.
  Un test por rama congela que `qr_table_group:` liquida SOLO el grupo
  y `qr_table:` la orden completa — que no se crucen.

**Cobertura sugerida:** unit (fake) para ambas ramas + idempotencia +
el camino "no encontrado".

---

## Fase E3 — Checkout handlers (single/partial/subscription) 🟡 PRIORIDAD MEDIA

**Por qué después:** son el otro gran camino de dinero (storefront
público), PERO son más de "armar una preferencia MP y devolverla" que
de "escribir el pago final". El pago real lo confirma el webhook
(cubierto en E2/webhook central). El riesgo aquí es de CÁLCULO, no de
descuadre de estado.

**Ejemplo concreto — `handlePartialCheckout`:**
Calcula el monto por abono de una compra a plazos:

```ts
const partialInstallments = installments >= 2 ? installments : 3;
const installmentBase = Math.round((subtotal / partialInstallments) * 100) / 100;
if (installmentBase < MIN_INSTALLMENT_AMOUNT_MXN) {
  return NextResponse.json({ error: "..." }, { status: 400 });
}
```

Escenarios que un test congelaría:
- **Redondeo de cuotas:** `subtotal = 100, installments = 3` →
  `33.33 × 3 = 99.99`, falta 1 centavo. ¿Quién absorbe el redondeo?
  Un test congela el cálculo para que un refactor no cambie el monto
  que ve el cliente (aunque sea 1 centavo, en pagos importa y es
  auditable).
- **Fallback de installments:** `installments < 2 → 3`. Un test congela
  esta regla de negocio implícita (fácil de romper sin querer).
- **Guarda de monto mínimo:** que un abono por debajo del mínimo
  devuelva 400 y NO cree preferencia.

**Cobertura sugerida:** unit para los cálculos (son funciones casi
puras dado un `CheckoutContext`). La integración aporta poco aquí
(no escriben estado de pago final).

---

## Fase E4 — el resto (webhook central completo, tableCloseService) 🟢 BAJA

- **`mercadopago/webhook/route.ts` (cuerpo del POST):** hoy cubrimos el
  DESPACHO (funciones puras). El cuerpo entero requiere mockear
  `paymentClient` + handlers → alto andamiaje, bajo retorno. Se cubre
  indirectamente cuando E1/E2/E3 cubren los handlers que despacha.
- **`tableCloseService`:** cierre manual de mesa (un humano lo hace,
  hay UI de por medio → menor riesgo de fallo silencioso).

---

## Resumen de prioridad

| Fase | Servicio | Riesgo | Por qué |
|---|---|---|---|
| E1 | `loanWebhookHandlers` | 🔴 alto | webhook + loop de montos + ya dio bugs |
| E2 | `tableMpWebhookService` | 🟠 medio-alto | webhook + marca pagado + idempotencia |
| E3 | checkout handlers | 🟡 medio | cálculo de cuotas (no escribe pago final) |
| E4 | webhook body, tableClose | 🟢 bajo | andamiaje alto / hay humano en el loop |

## Lo que NO cambia (recordatorio)

Cada fase = characterization tests (congelar comportamiento actual),
NO reescribir lógica. Si al cubrir un servicio se DESTAPA un bug (como
pasó con `areAllSplitGroupsPaid` en T1), se documenta y se decide
aparte si arreglarlo — no se mezcla "cubrir" con "arreglar" en el
mismo paso sin querer.
