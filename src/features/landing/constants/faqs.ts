/**
 * Copy agnóstico de proveedor: no se nombra ni al procesador de pagos ni al
 * proveedor de base de datos. Son detalles de implementación que pueden
 * cambiar, y nombrarlos enseña al negocio a pensar en ellos y no en nosotros.
 * El compromiso con el usuario (quién cobra qué, dónde vive su dinero) sí se
 * explica completo — lo que se omite es la marca del tercero, no el hecho.
 */
export const FAQS = [
  {
    question: "¿Mi cliente tiene que descargar una app?",
    answer:
      "No. Escanea el QR con la cámara de su celular y se abre todo en el navegador — no descarga nada ni crea cuenta. Tampoco necesitas terminal ni lector: el cliente usa su propio teléfono.",
  },
  {
    question: "¿Y si mi negocio no es un restaurante?",
    answer:
      "Funciona igual. Lo usan autolavados, talleres, estéticas, tiendas y negocios de servicios. Tú defines tu catálogo y el flujo es el mismo: tu cliente pide, tú marcas el avance, te paga.",
  },
  {
    question: "¿Puede pagarme antes de que le entregue?",
    answer:
      "No, y es a propósito. El pago se habilita solo cuando tu equipo marca el pedido como listo, para que nunca cobres algo que todavía no entregaste. Además solo tu personal autorizado puede mover ese estado.",
  },
  {
    question: "¿Necesito conocimientos técnicos para usar Tlaco?",
    answer:
      "No. Todo es visual e intuitivo. Creas tu cuenta, agregas productos con fotos y precios, y tu tienda se genera automáticamente. No necesitas saber programar.",
  },
  {
    question: "¿Cuánto cuesta usar la plataforma?",
    answer:
      "Tlaco es gratis: $0 al mes y 0% de tus ventas, sin plazo forzoso. La única comisión aparece cuando tu cliente paga con tarjeta, y la cobra la red de pagos que procesa la transacción — igual que en cualquier terminal. Nosotros no te cobramos nada encima.",
  },
  {
    question: "¿Puedo personalizar mi tienda?",
    answer:
      "Sí. Puedes elegir los colores de tu tienda, subir tu logo, crear páginas personalizadas y configurar tu catálogo como quieras. Cada negocio tiene su URL única.",
  },
  {
    question: "¿Cómo funcionan los pagos?",
    answer:
      "Tus clientes pagan con tarjeta de crédito, débito y otros métodos disponibles, incluyendo meses sin intereses. El cobro lo procesa una red de pagos certificada y el dinero se deposita en la cuenta bancaria que tú registres.",
  },
  {
    question: "¿Puedo vender servicios además de productos?",
    answer:
      "Sí. La plataforma soporta tanto productos físicos como servicios. Ideal para negocios que ofrecen lavado, rentas, consultoría o cualquier tipo de servicio.",
  },
  {
    question: "¿Mis datos están seguros?",
    answer:
      "Sí. Tu información viaja cifrada y cada negocio queda aislado del resto. Los datos de las tarjetas los maneja directamente la red de pagos certificada: nunca pasan por nuestros servidores ni los guardamos.",
  },
] as const;
