# Diseño — "Novedades / Próximamente" (comunicar lo que viene)

Estado: **diseño, no implementado.** Documento para construir después.

## Objetivo

Comunicar a los negocios las funcionalidades que vienen (facturación
SAT, entrega a domicilio) ANTES de tenerlas listas, para: (a) generar
expectativa y retención, (b) medir interés real ("avísame cuando esté"),
(c) que el negocio sienta que la plataforma crece con él.

Dos superficies, mismo contenido, distinto tono:
1. **Dentro de la sesión del negocio** (dashboard) — a quien ya es
   cliente: "esto viene para ti".
2. **En el sitio web público** (landing) — a quien aún no es cliente:
   "esto es a dónde va la plataforma" (argumento de venta).

Debe usar el sistema visual que ya existe (tokens `bg-surface`,
`border-border`, `text-foreground`, `text-accent`, `shadow-card`,
`lucide-react`), no inventar estilo nuevo. Copy en español, neutral.

---

## Superficie 1 — Dashboard del negocio

### Dónde
Una entrada nueva en el menú lateral: **"Novedades"** (icono `Sparkles`
o `Gift`), y/o un banner discreto en el home del dashboard
(`dashboard/[tenantSlug]` o el home general) que lleve ahí.

Opcional (más adelante): un badge con punto rojo en el item del menú
cuando hay una novedad que el negocio no ha visto (patrón conocido).

### Contenido — tarjetas de "lo que viene"
Página con tarjetas, cada una una feature futura. Estructura de cada
tarjeta (reusar el look de `AdminListCard` / las cards del dashboard):

```
[icono grande]  Título de la feature            [pill: "Próximamente"]
                Descripción de 1–2 líneas en lenguaje del negocio
                (el beneficio, no lo técnico)
                [botón: "Avísame cuando esté"]  ← registra interés
```

### Las tarjetas iniciales (copy real)

**1. Facturación al SAT, sin complicarte**
> Emite facturas desde aquí en segundos y cumple con el SAT sin saber
> de impuestos. Nosotros te ayudamos a darte de alta y, si quieres, un
> contador presenta tus declaraciones por ti. Vende también a quien te
> pide factura.
> Pill: `Próximamente` · CTA: `Me interesa`

**2. Entrega a domicilio por zonas**
> Activa el envío a domicilio y recibe pedidos a domicilio de tus
> clientes. Nosotros coordinamos la entrega por zonas para que llegue
> rápido — tú solo preparas el pedido.
> Pill: `Próximamente` · CTA: `Me interesa`

(El "Me interesa" / "Avísame" guarda una fila de interés por tenant —
sirve como lista de espera y señal de demanda para priorizar.)

### Comportamiento
- La página se ve siempre; las tarjetas marcadas `Próximamente` no
  llevan a una feature, solo registran interés.
- Cuando una feature se libere, su tarjeta cambia de `Próximamente` a
  `Nuevo` con CTA que lleva a la feature real, y a los que pusieron
  "Me interesa" se les puede notificar.

---

## Superficie 2 — Sitio web público (landing)

### Dónde
Una sección nueva en la landing (`src/features/landing/components/
sections/`), estilo `LandingBentoShowcase` / `LandingFeatures`, titulada
algo como **"Lo que viene"** o **"Estamos construyendo más para ti"**.

### Tono
Aquí es ARGUMENTO DE VENTA, no lista de espera. El mensaje: "esta
plataforma no se queda quieta; formaliza y haz crecer tu negocio".

### Contenido
Mismas dos features (facturación, domicilio) presentadas como visión:
- Mockups al estilo de los que ya tiene la landing (tarjetas CSS con
  datos ficticios — factura de ejemplo, mapa de zonas de entrega).
- Sin CTA de "avísame" (eso es del dashboard); aquí el CTA es el mismo
  de la landing: "Crea tu negocio" / "Empieza gratis".

### Nota de honestidad en el copy
Marcar claramente que son funciones **en camino**, no disponibles hoy
(un `Próximamente` visible), para no prometer de más a quien se
registra esperando usarlas ya.

---

## Modelo de datos (mínimo, cuando se implemente)

Una tabla `feature_interest` para registrar el "me interesa":
- `tenant_id`, `feature_key` (ej. `"facturacion"`, `"domicilio"`),
  `created_at`. UNIQUE(tenant_id, feature_key) — un interés por feature.

Un endpoint `POST /api/feature-interest` que inserta (idempotente). El
dashboard lo llama al pulsar "Me interesa". La lista agregada
(cuántos negocios quieren cada feature) es señal para priorizar el
roadmap — y la puede ver el super admin.

---

## Por qué así (racional)

- **Reusa el sistema visual existente** — no introduce estilo nuevo,
  se siente parte del producto desde el día uno.
- **Separa las dos audiencias** — al cliente actual le hablas de "para
  ti"; al prospecto, de "hacia dónde vamos". Mismo contenido, distinto
  gancho.
- **El "Me interesa" no es decorativo** — es investigación de producto
  gratis: te dice qué construir primero según demanda real, no
  corazonada.
- **Bajo costo, alto valor de retención** — es de las cosas más baratas
  de construir (una página de tarjetas + una tabla) y comunica que el
  negocio invirtió en una plataforma que crece.
