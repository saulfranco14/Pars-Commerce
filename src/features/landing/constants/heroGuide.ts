import type { HeroBeatKey, HeroGuide } from "@/features/landing/interfaces/heroDemo";

/**
 * `done` dice qué ganó el negocio, no qué pasó en pantalla: es la única línea
 * de beneficio de la demo. Sin nombrar al procesador de pagos (ver `faqs.ts`).
 */
export const HERO_GUIDES: Record<HeroBeatKey, HeroGuide> = {
  qr: {
    hint: "Toca «Escanear QR» en el celular",
    done: "Tu cliente entró sin descargar nada y tu panel lo vio llegar.",
  },
  mesas: {
    hint: "Agrega productos y toca «Enviar pedido»",
    done: "El pedido llegó a tu panel al instante. Nadie tuvo que anotarlo.",
  },
  ordenes: {
    hint: "Mira cómo tu equipo avanza el pedido en vivo",
    done: "Pedido listo. Hasta ahora se habilita el pago.",
  },
  suscripciones: {
    hint: "Elige un plan y toca «Pagar»",
    done: "Suscripción activa. Los siguientes cargos se hacen solos.",
  },
  prestamos: {
    hint: "Toca «Pagar mi abono»",
    done: "Abono registrado. Tu panel ya descontó lo que te deben.",
  },
  sitio: {
    hint: "Elige productos y toca «Comprar»",
    done: "Te compraron en línea y el pedido ya está en tu panel.",
  },
  dinero: {
    hint: "Toca «Pagar» en el celular",
    done: "El pago ya aparece en «Por recibir», con su fecha de depósito.",
  },
};
