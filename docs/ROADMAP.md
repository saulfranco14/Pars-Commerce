# Roadmap — iniciativas grandes pendientes

Estado: **planeación.** Ninguna implementada aún. Ordena las 4
iniciativas que surgieron por valor, esfuerzo y dependencias, para
decidir la secuencia. Cada una tiene (o tendrá) su propio doc de diseño.

## Contexto: qué ya está construido (para no re-hacerlo)

Base sobre la que estas iniciativas se apoyan:
- **Settlement (S1–S6)** — ledger de pagos, comisión por ciclo,
  liquidaciones, config por negocio, scheduler, entrega con evidencia,
  super admin de plataforma. Con red de tests (unit + integración).
- **UI de settlement (S7)** — pantalla del negocio ("Mi dinero"),
  tablero de plataforma, onboarding guiado.
- **Payment hardening (P1–P2)** — webhook idempotente + reintentos.
- Módulos de negocio: productos, servicios, órdenes, QR/mesas,
  préstamos, promociones, sitio web público, equipo, suscripciones
  (que el negocio cobra a SUS clientes).

Hoy la plataforma monetiza vía **comisión de settlement** (% sobre
dinero MP). NO cobra mensualidad a los negocios todavía.

---

## Las 4 iniciativas

### A — Novedades / Próximamente 🟢 pequeño, hazlo primero
**Qué:** comunicar a los negocios lo que viene (facturación, domicilio)
en su dashboard y en el sitio web, con un "me interesa" que mide demanda.
**Doc:** `NOVEDADES_DESIGN.md` (ya diseñado).
**Esfuerzo:** bajo — una página de tarjetas + tabla `feature_interest` +
un endpoint. Reusa el sistema visual existente.
**Valor:** alto en relación al costo — retención, expectativa, y datos
de demanda para priorizar el resto.
**Depende de:** nada.
**Por qué primero:** barato, no bloquea nada, y el "me interesa" te dice
con datos reales si construir facturación o domicilio antes.

### B — Facturación SAT + config de IVA 🔴 grande, alto valor
**Qué:** el negocio emite CFDI desde la plataforma (vía PAC), con manejo
seguro de su CSD; config donde declara si su precio ya incluye IVA o no;
y (premium) un contador presenta declaraciones. Introduce el modelo de
**membresía** para los negocios (el primer cobro recurrente de plataforma).
**Doc:** por diseñar (`FACTURACION_DESIGN.md`). El análisis de negocio
está en el artefacto de SAT (ver conversación) + los detalles fiscales.
**Esfuerzo:** alto — integración PAC, almacenamiento cifrado de CSD (muy
sensible, nivel de cuidado = dinero), pantallas de facturación, config
de IVA, y el modelo de membresía/planes. Requiere además contador
titulado en la operación (no es solo código).
**Valor:** muy alto — formaliza informales, abre el cobro por membresía,
y se apoya en el ledger que ya sabe cuánto vendió cada negocio.
**Depende de:** decisión de negocio (contador, PAC elegido) + validación
fiscal. El código depende del ledger (ya existe).
**Riesgo:** el CSD es la firma fiscal del negocio — custodiarlo mal es
fraude en su nombre. Requiere `/security-review` obligatorio.

### C — Entrega a domicilio por zonas 🔴 grande, nuevo dominio
**Qué:** el negocio activa domicilio y define zonas; el cliente arma su
pedido en el sitio público; la plataforma coordina la entrega por zonas
(reparto local rápido, no por repartidores individuales que tardan).
**Doc:** por diseñar (`DOMICILIO_DESIGN.md`).
**Esfuerzo:** alto y en un dominio NUEVO (logística): definición de
zonas geográficas, cálculo de costo de envío por zona, estado del pedido
en ruta, y — el punto duro — **quién reparte**. "Por zonas, no por
repartidores" sugiere un modelo de reparto agrupado que hay que diseñar
con cuidado (¿repartidores propios?, ¿aliados por zona?, ¿el negocio?).
**Valor:** alto para negocios de comida/retail, pero es el más
operativamente complejo (coordina gente física, no solo datos).
**Depende de:** el checkout público y el catálogo (ya existen); la parte
de reparto es infraestructura/operación nueva.
**Advertencia:** la logística de última milla es un negocio en sí mismo.
Vale diseñar el MVP más chico posible (ej. el negocio define zonas +
costo, y al inicio el reparto lo resuelve él o un aliado, sin construir
una flota) antes de invertir en coordinación de repartidores.

### D — Membresías / planes de plataforma 🟠 mediano, habilitador
**Qué:** cobrar a los NEGOCIOS por usar la plataforma (hoy no se hace).
Un plan "Formal" que combine facturación + declaración + comisión de
settlement más baja. Es el vehículo de monetización de B.
**Doc:** por diseñar (`MEMBRESIAS_DESIGN.md`).
**Esfuerzo:** medio — reusa la infra de suscripciones existente
(adaptada de "negocio cobra a cliente" a "plataforma cobra a negocio") +
gating de features por plan.
**Valor:** alto — ingreso recurrente predecible además de la comisión.
**Depende de:** conceptualmente va PEGADO a B (la facturación es lo que
justifica la primera membresía). Puede diseñarse junto con B.

---

## Secuencia recomendada

```
A (Novedades)  →  [medir demanda]  →  B+D (Facturación + Membresía)  →  C (Domicilio)
 pequeño            datos reales         grande, el gran salto           grande, dominio nuevo
```

**Razón del orden:**
1. **A primero** — barato, y su "me interesa" te da datos para saber si
   los negocios quieren más facturación o domicilio. Decides B-vs-C con
   evidencia, no corazonada.
2. **B+D juntos** — la facturación es el mayor diferenciador y el ledger
   ya la habilita; la membresía es su modelo de cobro natural. Van de la
   mano. Es el salto de "plataforma de cobro" a "plataforma que formaliza".
3. **C al final** — el más complejo y en dominio nuevo (logística
   física). Conviene abordarlo cuando el producto core (cobro +
   formalización) esté sólido, y con un MVP mínimo de reparto.

**Nota transversal:** B y C ambos tocan dinero/datos sensibles o
coordinación física — los dos requieren `/security-review` y, para C,
validar el modelo operativo/legal del reparto antes de construir.

## Docs relacionados
- `NOVEDADES_DESIGN.md` — diseño de A (listo).
- `SETTLEMENT_SYSTEM_PLAN.md` — lo ya construido que B reusa.
- Artefacto de análisis SAT (en conversación) — negocio de B.
- Por crear: `FACTURACION_DESIGN.md`, `DOMICILIO_DESIGN.md`,
  `MEMBRESIAS_DESIGN.md` cuando se aborde cada uno.
