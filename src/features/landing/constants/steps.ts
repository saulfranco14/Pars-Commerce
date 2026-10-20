import { QrCode, Store, UserPlus } from "lucide-react";

/** `detail` es un dato verificable de cada paso; la URL refleja la ruta real `/sitio/[slug]` en tlaco.app. */
export const STEPS = [
  {
    icon: UserPlus,
    step: 1,
    title: "Crea tu cuenta",
    description: "Gratis y sin tarjeta. Tu correo, el WhatsApp del negocio y una contraseña.",
    detail: "Lista en 2 minutos",
  },
  {
    icon: Store,
    step: 2,
    title: "Elige tu giro",
    description: "Tu catálogo de inicio y tu tienda en línea quedan listos. Los editas cuando quieras.",
    detail: "tlaco.app/sitio/tu-negocio",
  },
  {
    icon: QrCode,
    step: 3,
    title: "Comparte y cobra",
    description: "Pega tu QR en el mostrador o manda tu enlace por WhatsApp. Te pagan desde su celular.",
    detail: "Ves cada pedido al instante",
  },
] as const;
