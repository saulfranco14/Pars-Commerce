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
4. Carrusel de recompra con `ProductTile` y detalle en `ProductDetailSheet`.
5. Detalle de compra plegable.

Reglas:

- El seguimiento siempre aparece antes que las recomendaciones.
- El carrusel reutiliza `ProductTile`, el patrón ya probado del menú QR:
  foto cuadrada, nombre, precio y botón `+` visible. No crear cards anchas ni
  enlaces que saquen al usuario del flujo.
- Al tocar una tarjeta, abrir `ProductDetailSheet` dentro de la misma UI; al
  agregar, guardar el producto para una nueva compra y confirmar con un toast.
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

## Patrón: mesa con pedido activo

Al volver a una mesa que ya tiene pedido, iniciar en recompra: un CTA azul de
56 px, **"Pedir algo más"**, abre el menú completo de forma inequívoca. Debajo
quedan las sugerencias y la fila **"Vuelve a pedir"** para repetir una ronda en
un toque. En el menú abierto, el retorno a sugerencias es una tarjeta táctil de
48 px; nunca un enlace pequeño de "Ocultar".

## Patrón: resumen fijo de seguimiento móvil

En las páginas públicas de pedido, la franja inferior es el **recibo vivo**:
usa una superficie blanca con radio superior amplio y sombra sutil, conserva el
monto total dominante, el estado corto a la derecha y una acción azul, amplia y de 56 px
para actualizar el seguimiento. Se reserva espacio inferior suficiente
para que no cubra el último bloque. El detalle de artículos muestra dos líneas
primero y el resto se despliega; la entrega o recolección antecede al detalle.

Este patrón reduce la incertidumbre sin convertir el seguimiento en un checkout:
azul para la acción de actualizar, ámbar sólo si el pago aún está pendiente y
verde sólo después de confirmación. En escritorio el total sigue visible dentro
del resumen, sin forzar una barra fija.

## Patrón: postventa de pedidos del sitio

El pago no termina el recorrido. En pedidos del sitio, la preparación y la
entrega son un segundo eje visible para negocio y cliente:

1. Pedido recibido.
2. En preparación.
3. Listo.
4. En camino o listo para recoger.
5. Pedido entregado.

La barra fija del negocio muestra una sola siguiente acción contextual: empezar,
marcar listo, marcar en camino o confirmar la entrega. Tanto la entrega a
domicilio como la entrega en un punto de recolección se cierran con foto desde
una hoja mobile-first. “Recolección” describe dónde lo recibe; el estado final
siempre se comunica como **Pedido entregado**. El cliente ve el mismo avance en su enlace privado y no
debe seguir viendo “comprobante por validar” después de confirmar el pago.

En la bandeja, cobro y postventa son filtros separados. **Pagada** responde si
el dinero fue confirmado; **Por preparar, Preparando, Lista, En camino y
Entregada/Recogida** responden qué falta físicamente. Nunca se usa `paid` como
estado terminal de una compra del sitio ni se bloquea una transición operativa
porque el pago ya fue confirmado.

Implementación canónica:

- `src/features/orders/components/tracking/CommerceFulfillmentTracker.tsx`
- `src/features/orders/components/order/DeliveryCompletionSheet.tsx`
- `src/features/orders/components/order/OrderActionButtons.tsx`

Reglas de consistencia:

- El detalle inmutable capturado al finalizar compra es la evidencia más
  específica: `pickup_point_id` identifica recolección y una dirección sin
  punto identifica domicilio. Después manda `fulfillment_method`;
  `scheduled_for` sólo cubre pedidos antiguos sin ninguna de esas evidencias.
- Un evento `pickup_completed` nunca cierra una entrega y un evento `delivered`
  nunca cierra una recolección. Cada recorrido reconoce únicamente su final.
- Cuando existe evidencia de pago (`paid_at`, total cubierto o transferencia
  aprobada), desaparecen los controles de cobro y queda una sola acción física.
- Todo cierre físico se registra con fotografía privada y ésta aparece en el
  enlace del cliente antes de solicitar una reseña. Si una orden histórica ya
  fue cerrada sin foto, la acción principal será **Agregar foto de entrega** y
  completará el evento existente sin duplicarlo.

## Patrón: detalle de producto y reseñas verificadas

El detalle de producto resuelve primero la decisión de compra dentro de una
sola superficie: galería contenida a la izquierda y nombre, precio, opciones y
CTA con padding propio a la derecha en escritorio; en móvil conserva ese mismo
orden en una sola columna. La imagen usa `object-contain` para mostrar el
artículo completo, sin convertir la foto en un fondo recortado. Descripción, materiales,
cuidados y medidas viven en acordeones posteriores, no compiten con el CTA.

Las reseñas públicas se cargan por páginas cortas. En el pedido terminado,
cada artículo tiene su propio acordeón para calificar; el botón se bloquea y
muestra progreso desde el primer toque, y la API trata un envío duplicado como
éxito idempotente. La evidencia y el seguimiento siempre anteceden a las
reseñas. Después aparecen productos similares y servicios complementarios en
un rail táctil móvil que se convierte en grid en escritorio.

En la página pública de seguimiento, escritorio usa dos zonas dentro del mismo
recibo: estado/entrega a la izquierda y artículos/evidencia/reseñas a la
derecha. Móvil mantiene una sola secuencia y el recibo vivo fijo inferior.
