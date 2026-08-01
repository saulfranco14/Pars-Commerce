/**
 * Paleta de las gráficas de ventas.
 *
 * Regla (DESIGN_SYSTEM.md §3): ningún componente de gráfica hardcodea un hex,
 * todo sale de aquí. Los tonos evitan a propósito dos bandas:
 *   · 200-240 (el azul de marca `#3483fa`) — un tono ahí se lee como acento de
 *     UI y no como categoría de dato.
 *   · 340-15 (rojo/rosa) — reservada a error y destructivo.
 */

/**
 * Serie única de ingresos (tendencia y barras semanales).
 *
 * Espeja `--accent` / `--color-default` de globals.css. Va literal y no
 * `var(--accent)` por dos razones: recharts emite `stroke`/`fill` como atributos
 * de presentación en el path hijo (un `className="stroke-accent"` cae en el `<g>`
 * contenedor y nunca aplica), y `--accent` se sobrescribe por tenant dentro de
 * `/sitio/[slug]`, así que una gráfica embebida ahí heredaría el color del
 * negocio en vez del nuestro. Si cambia el token, hay que cambiar esto.
 */
export const COLOR_REVENUE = "#3483fa";

/**
 * Método de pago. Es un RECORD y no un array a propósito: antes el color se
 * asignaba por índice sobre la lista ya filtrada por `value > 0`, así que el
 * tono de un método cambiaba según qué otros métodos hubieran vendido ese
 * periodo — la gráfica no se podía aprender. La clave fija el tono.
 *
 * Separación mínima entre tonos: 50° (142 → 192).
 */
export const COLORS_PAYMENT_METHOD: Record<string, string> = {
  efectivo: "hsl(142 71% 45%)", // verde — dinero en mano
  transferencia: "hsl(263 70% 50%)", // violeta — banco
  tarjeta: "hsl(25 95% 53%)", // naranja — terminal física
  mercadopago: "hsl(192 91% 36%)", // cian — antes azul, chocaba con la marca
  other: "hsl(215 16% 47%)", // acromático — sin clasificar
};

/** Tono de reserva si llega un método que no está en el record. */
export const COLOR_METHOD_FALLBACK = "hsl(215 16% 47%)";

/** Origen de la venta. Slate + teal: sin colisión con marca ni con error. */
export const COLORS_SOURCE = ["hsl(215 16% 47%)", "hsl(173 80% 40%)"];
