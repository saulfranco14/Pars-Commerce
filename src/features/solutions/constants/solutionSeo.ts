import type { SolutionSeo } from "@/features/solutions/interfaces/solutionSeo";

/**
 * Search-facing title and description per business type. Titles lead with
 * what people type («sistema para …»); the root template appends « · Tlaco».
 */
export const SOLUTION_SEO: Record<string, SolutionSeo> = {
  tienda: {
    title: "Sistema para tiendas de abarrotes: pedidos y cobros",
    description:
      "Recibe pedidos de tu tienda por QR, tienda en línea o WhatsApp y cobra desde el celular. Catálogo de abarrotes listo para empezar, sin tarjeta.",
  },
  panaderia: {
    title: "Sistema para panaderías: pedidos, pasteles y cobros",
    description:
      "Vende el pan del día y pasteles por encargo en línea, agenda pedidos especiales y cobra desde el celular. Catálogo de panadería listo y $0 al mes.",
  },
  "deposito-cerveza": {
    title: "Sistema para depósitos y expendios de cerveza",
    description:
      "Vende bebidas y paquetes para evento con pedidos en línea y entrega local, sin perder el control de cada orden. Catálogo listo y $0 al mes para empezar.",
  },
  materiales: {
    title: "Sistema para materiales de construcción y obra",
    description:
      "Cotiza, registra pedidos y coordina entregas de obra desde un solo lugar. Catálogo de materiales listo para empezar, sin tarjeta y $0 al mes.",
  },
  taqueria: {
    title: "Sistema para taquerías: pedidos por QR y cobros",
    description:
      "Tus clientes piden y pagan desde la mesa con un QR, sin descargar apps. Mostrador, para llevar y tienda en línea en la misma orden. Empieza gratis.",
  },
  veterinaria: {
    title: "Sistema para veterinarias: consultas y cobros",
    description:
      "Vende alimento y accesorios, agenda la atención y envía recordatorios con enlace de pago seguro. Catálogo para veterinaria listo y $0 al mes.",
  },
  mascotas: {
    title: "Sistema para tiendas de mascotas: pedidos y cobros",
    description:
      "Vende alimento y accesorios en línea, recibe cada pedido en un solo flujo y activa recordatorios de recompra. Catálogo listo y sin tarjeta.",
  },
  ropa: {
    title: "Sistema para boutiques: catálogo, apartados y cobros",
    description:
      "Publica tu ropa en línea, registra apartados por talla y cobra desde el celular, también a meses. Catálogo de boutique listo y $0 al mes para empezar.",
  },
  tenis: {
    title: "Sistema para tiendas de tenis: apartados y cobros",
    description:
      "Controla tallas, apartados y servicios de limpieza, y vende tus pares en línea con cobro desde el celular. Catálogo listo y sin tarjeta para empezar.",
  },
  cafeteria: {
    title: "Sistema para cafeterías: pedidos por QR y para llevar",
    description:
      "Tus clientes piden desde la mesa o para llevar con un QR y pagan desde su celular. Carta, combos y tienda en línea en un solo lugar. Empieza gratis.",
  },
  autolavado: {
    title: "Sistema para autolavados: servicios, turnos y cobros",
    description:
      "Registra cada auto y servicio, avisa cuando está listo y cobra desde el celular. Paquetes de lavado y detallado listos para empezar, $0 al mes.",
  },
  otro: {
    title: "Sistema de pedidos y cobros para tu negocio",
    description:
      "Catálogo, pedidos por QR, tienda en línea y cobros desde el celular para cualquier giro. Empieza con una base editable, sin tarjeta y $0 al mes.",
  },
};
