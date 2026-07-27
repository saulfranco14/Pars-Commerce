import { COMPANY, LEGAL_UPDATED_AT } from "@/features/legal/constants/company";

import type { LegalDoc } from "@/features/legal/interfaces/legal";

/**
 * Aviso de Privacidad conforme a la LFPDPPP. La ley mexicana pide elementos
 * concretos que una "privacy policy" genérica no cubre: identidad y domicilio
 * del responsable, finalidades separadas en necesarias y secundarias, medios
 * para limitar el uso, y el procedimiento de derechos ARCO.
 *
 * Distinción importante y deliberada: sobre los datos de SUS clientes, el
 * negocio es el responsable y nosotros somos el encargado que los trata por su
 * cuenta. Confundir esos dos papeles es el error habitual en los avisos de
 * plataformas SaaS y cambia de quién es la obligación frente al titular.
 */
export const PRIVACY: LegalDoc = {
  title: "Aviso de Privacidad",
  summary:
    "Qué datos tratamos, para qué, y cómo ejercer tus derechos ARCO. Conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.",
  updatedAt: LEGAL_UPDATED_AT,
  sections: [
    {
      id: "responsable",
      title: "1. Responsable",
      body: [
        `${COMPANY.legalName}, operando como “${COMPANY.brand}”, con domicilio en ${COMPANY.address}, es responsable del tratamiento de tus datos personales.`,
      ],
    },
    {
      id: "datos",
      title: "2. Qué datos tratamos",
      body: ["Recabamos únicamente lo necesario para operar el servicio:"],
      list: [
        "De identificación y contacto: nombre, correo electrónico y teléfono.",
        "Del negocio: nombre comercial, giro, domicilio y logotipo.",
        "Bancarios: la cuenta donde quieres recibir tus depósitos.",
        "De uso: registros de acceso, dirección IP y actividad dentro de la plataforma, para seguridad y soporte.",
      ],
    },
    {
      id: "no-tarjetas",
      title: "3. Datos que NO tratamos",
      body: [
        "No recabamos ni almacenamos números de tarjeta, CVV ni fechas de vencimiento. Esa información viaja directamente del navegador de tu cliente a la red de pagos certificada que procesa la transacción; nunca pasa por nuestros servidores.",
      ],
    },
    {
      id: "finalidades",
      title: "4. Para qué los usamos",
      body: [
        "Finalidades necesarias, sin las cuales el servicio no puede prestarse:",
      ],
      list: [
        "Crear y administrar tu cuenta y la de tu equipo.",
        "Procesar los cobros de tus ventas y depositarte lo que te corresponde.",
        "Generar tus reportes, comprobantes y registros de operaciones.",
        "Darte soporte y avisarte de cambios en el servicio.",
        "Cumplir obligaciones fiscales y prevenir fraude.",
      ],
    },
    {
      id: "finalidades-secundarias",
      title: "5. Finalidades secundarias",
      body: [
        "De forma adicional, y solo si no te opones, podemos usar tu correo para enviarte novedades del producto y encuestas de satisfacción.",
        `Puedes negarte desde ahora escribiendo a ${COMPANY.privacyEmail}. Negarte no afecta la prestación del servicio ni tu cuenta.`,
      ],
    },
    {
      id: "clientes-del-negocio",
      title: "6. Datos de tus clientes",
      body: [
        "Cuando registras a tus clientes en la plataforma, tú eres el responsable de esos datos y nosotros actuamos como encargado: los tratamos únicamente siguiendo tus instrucciones y para prestarte el servicio.",
        "Como responsable, a ti te corresponde informar a tus clientes con tu propio aviso de privacidad y obtener su consentimiento cuando la ley lo exija.",
        "No usamos los datos de tus clientes para fines propios, no los vendemos y no los compartimos con otros negocios de la plataforma.",
      ],
    },
    {
      id: "transferencias",
      title: "7. Transferencias",
      body: [
        "No vendemos tus datos personales. Los compartimos únicamente con quienes son indispensables para operar:",
      ],
      list: [
        "La red de pagos que procesa los cobros y ejecuta los depósitos.",
        "Nuestros proveedores de infraestructura y correo transaccional, que los tratan por nuestra cuenta bajo obligación de confidencialidad.",
        "Autoridades competentes, cuando exista requerimiento fundado y motivado.",
      ],
    },
    {
      id: "arco",
      title: "8. Tus derechos ARCO",
      body: [
        "Tienes derecho a Acceder a tus datos, Rectificarlos si son inexactos, Cancelarlos cuando consideres que no se requieren, y Oponerte a su tratamiento para fines específicos. También puedes revocar tu consentimiento.",
        `Para ejercerlos, envía tu solicitud a ${COMPANY.privacyEmail} indicando tu nombre, un medio para responderte, los documentos que acrediten tu identidad y la descripción clara de los datos sobre los que buscas ejercer el derecho.`,
        "Responderemos en un plazo máximo de 20 días hábiles y, de resultar procedente, la haremos efectiva dentro de los 15 días hábiles siguientes.",
      ],
    },
    {
      id: "conservacion",
      title: "9. Cuánto tiempo los conservamos",
      body: [
        "Conservamos tus datos mientras tu cuenta esté activa. Al cancelarla los eliminamos, salvo los registros de operaciones que debemos resguardar por obligación fiscal y mercantil, que se conservan por el plazo que marca la ley.",
      ],
    },
    {
      id: "seguridad",
      title: "10. Seguridad",
      body: [
        "Aplicamos medidas administrativas, técnicas y físicas para proteger tus datos: cifrado en tránsito, control de acceso por roles y aislamiento entre los datos de cada negocio.",
        "Ningún sistema es infalible. Si ocurriera una vulneración que afecte de forma significativa tus derechos, te lo notificaremos sin demora.",
      ],
    },
    {
      id: "cookies",
      title: "11. Cookies y almacenamiento local",
      body: [
        "Usamos cookies y almacenamiento local del navegador para mantener tu sesión iniciada y recordar preferencias como el tema claro u oscuro. No usamos cookies de publicidad ni de seguimiento entre sitios.",
        "Puedes bloquearlas desde tu navegador, pero entonces no podrás mantener la sesión abierta.",
      ],
    },
    {
      id: "cambios-aviso",
      title: "12. Cambios a este aviso",
      body: [
        `Cualquier modificación se publicará en ${COMPANY.domain} y, si es relevante, te la notificaremos por correo. La fecha de la última actualización aparece al inicio de este documento.`,
      ],
    },
    {
      id: "inai",
      title: "13. Autoridad",
      body: [
        "Si consideras que tu derecho a la protección de datos ha sido vulnerado, puedes acudir al Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos Personales (INAI).",
      ],
    },
  ],
};
