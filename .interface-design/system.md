# Pars Commerce — patrones de interfaz

## Dirección

Las pantallas posteriores a una compra deben sentirse como una **espera útil**:
primero reducen incertidumbre mostrando el avance real del pedido y después
ofrecen una oportunidad contextual de recompra, sin interrumpir el seguimiento.

Conceptos del dominio: turno, avance, preparación, complemento, próxima visita
y comprobante.

## Lenguaje visual

- Verde: exclusivamente pago confirmado, pedido listo y otros estados exitosos.
- Azul de acento: progreso activo, enlaces, foco y acciones de compra.
- Superficies: fondo neutral y tarjetas `bg-surface` con borde discreto.
- Profundidad: sombras sutiles; no mezclar con sombras dramáticas o gradientes
  decorativos.
- Tipografía: conservar la familia sans del producto; monto y estado dominan la
  jerarquía.
- Espaciado: base de 4 px, contenido móvil con 20 px laterales.
- Interacciones táctiles: mínimo 44 px; CTA principal de 48–56 px.

## Patrón: espera útil + recompra

Aplicar sólo cuando el usuario ya completó una compra y todavía existe un
periodo natural de espera.

Orden de la información:

1. Confirmación breve del pago.
2. Seguimiento del pedido y mensaje de actualización automática.
3. Comprobante digital descargable dentro del mismo flujo.
4. Detalle de compra plegable.

Reglas:

- El seguimiento siempre aparece antes que las recomendaciones.
- No desviar al cliente al sitio público desde un comprobante. Cualquier
  siguiente compra se diseña como un flujo separado, nunca como un carrusel
  recortado dentro de esta pantalla.
- El comprobante es una tarjeta visible con folio, total, método, fecha y un
  botón de descarga; no una acción escondida o un enlace externo.
- El detalle queda abierto antes de pagar y plegado después del pago.
- Un comprobante pagado debe seguir accesible desde su URL original.
- El recibo agregado se consulta una vez; el estado vivo usa un pulso ligero y
  deja de consultarse al alcanzar un estado terminal.

Implementación canónica actual:

- `src/app/q/[token]/order/OrderTicketScreen.tsx`
- `src/features/qr/components/order-ticket/PostPurchaseRecommendations.tsx`
- `src/features/qr/components/order-tracker/PickupTrackerCard.tsx`
