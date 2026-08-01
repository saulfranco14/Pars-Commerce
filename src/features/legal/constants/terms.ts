import { COMPANY, LEGAL_UPDATED_AT } from "@/features/legal/constants/company";

import type { LegalDoc } from "@/features/legal/interfaces/legal";

/**
 * Términos de servicio. Escritos contra lo que el producto realmente hace:
 * SaaS multi-tenant con plan gratuito, cobros procesados por una red de pagos
 * externa (no nombrada a propósito: es un detalle de implementación que puede
 * cambiar), y catálogo/clientes que el negocio sube y de los que sigue siendo
 * dueño.
 */
export const TERMS: LegalDoc = {
  title: "Términos de servicio",
  summary: `Las reglas de uso de ${COMPANY.brand}. En corto: la cuenta es gratis, tu información es tuya y puedes irte cuando quieras.`,
  updatedAt: LEGAL_UPDATED_AT,
  sections: [
    {
      id: "aceptacion",
      title: "1. Aceptación",
      body: [
        `Al crear una cuenta en ${COMPANY.brand} aceptas estos términos. Si los usas en nombre de un negocio, declaras que tienes facultades para obligarlo.`,
        `El servicio lo presta ${COMPANY.legalName}, con domicilio en ${COMPANY.address}.`,
      ],
    },
    {
      id: "servicio",
      title: "2. Qué es el servicio",
      body: [
        `${COMPANY.brand} es una plataforma para administrar tu negocio: catálogo de productos y servicios, órdenes, cobros con tarjeta mediante códigos QR, tienda en línea, control de pagos diferidos y reportes.`,
        "Somos una herramienta de administración y un intermediario técnico para el cobro. No vendemos tus productos, no somos parte de la relación entre tú y tus clientes, y no otorgamos crédito ni prestamos dinero.",
      ],
    },
    {
      id: "cuenta",
      title: "3. Tu cuenta",
      list: [
        "Debes ser mayor de edad y proporcionar información veraz.",
        "Eres responsable de tu contraseña y de lo que ocurra bajo tu cuenta.",
        "Si invitas a personas a tu equipo, respondes por los permisos que les asignes.",
        "Avísanos de inmediato si detectas un acceso no autorizado.",
      ],
    },
    {
      id: "precio",
      title: "4. Precio y comisiones",
      body: [
        "El plan gratuito no tiene mensualidad ni plazo forzoso, y no cobramos un porcentaje de tus ventas.",
        "Cuando tu cliente paga con tarjeta, la red de pagos que procesa la transacción cobra su comisión, que se descuenta del monto antes de depositarte. Esa comisión no es nuestra y puede cambiar si la red la modifica; te avisaremos si eso ocurre.",
        "Si en el futuro lanzamos planes de pago, te lo informaremos con anticipación y tu plan actual no cambiará sin tu consentimiento.",
      ],
    },
    {
      id: "pagos",
      title: "5. Cobros y depósitos",
      body: [
        "Los pagos con tarjeta los procesa una red de pagos certificada. Los datos de las tarjetas de tus clientes viajan directamente a esa red: no pasan por nuestros servidores ni los almacenamos.",
        "El dinero se deposita en la cuenta bancaria que registres. Eres responsable de que esos datos sean correctos; no respondemos por depósitos fallidos por información equivocada.",
        "Los tiempos de depósito dependen de la red de pagos y de tu banco.",
      ],
    },
    {
      id: "contenido",
      title: "6. Tu contenido",
      body: [
        "Todo lo que subes —productos, fotos, precios, datos de tus clientes— sigue siendo tuyo. Solo lo usamos para operar el servicio que nos pides.",
        "Nos autorizas a alojarlo y mostrarlo en tu tienda pública y en los enlaces que tú compartas, que es lo mínimo necesario para que el producto funcione.",
        "Respondes por tener los derechos sobre lo que subes y por que sea lícito.",
      ],
    },
    {
      id: "uso",
      title: "7. Uso prohibido",
      list: [
        "Vender productos o servicios ilegales, o que requieran una licencia que no tengas.",
        "Suplantar a otra persona o negocio.",
        "Intentar vulnerar la seguridad de la plataforma o acceder a datos de otros negocios.",
        "Usar el servicio para lavado de dinero o cualquier fin fraudulento.",
        "Automatizar el uso de forma que degrade el servicio para los demás.",
      ],
    },
    {
      id: "disponibilidad",
      title: "8. Disponibilidad",
      body: [
        "Trabajamos para que el servicio esté disponible de forma continua, pero no garantizamos que no habrá interrupciones. Podemos hacer mantenimientos y, cuando sean programados, avisaremos con anticipación.",
        "El servicio se presta “tal cual”. En la medida que la ley lo permita, nuestra responsabilidad se limita a lo que hayas pagado por el servicio en los últimos doce meses.",
      ],
    },
    {
      id: "terminacion",
      title: "9. Cancelación",
      body: [
        "Puedes cerrar tu cuenta cuando quieras, sin penalización. Antes de cerrarla puedes exportar tu información.",
        "Podemos suspender una cuenta que incumpla estos términos. Salvo casos graves o que la ley lo impida, avisaremos antes y daremos oportunidad de corregir.",
        "Tras la cancelación conservamos los registros de operaciones el tiempo que exija la ley fiscal y mercantil.",
      ],
    },
    {
      id: "cambios",
      title: "10. Cambios a estos términos",
      body: [
        "Si cambiamos algo relevante te avisaremos por correo o dentro de la plataforma, con al menos 15 días de anticipación. Si no estás de acuerdo, puedes cancelar tu cuenta.",
      ],
    },
    {
      id: "ley",
      title: "11. Ley aplicable",
      body: [
        "Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Para cualquier controversia, las partes se someten a los tribunales competentes de la Ciudad de México, renunciando a cualquier otro fuero.",
      ],
    },
    {
      id: "contacto-terminos",
      title: "12. Contacto",
      body: [
        `Cualquier duda sobre estos términos: ${COMPANY.supportEmail}.`,
      ],
    },
  ],
};
