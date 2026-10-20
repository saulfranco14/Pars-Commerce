import {
  BadgePercent,
  CalendarClock,
  CreditCard,
  HandCoins,
  MonitorSmartphone,
  Store,
  UsersRound,
} from "lucide-react";

import type {
  Journey,
  PaymentMethod,
  SolutionCapability,
} from "@/features/solutions/interfaces/solutionExperience";

export const SOLUTION_CAPABILITIES: SolutionCapability[] = [
  {
    key: "store",
    title: "Tienda en línea",
    short: "Vende con un enlace",
    promise: "Tus clientes ven productos, promociones y disponibilidad sin preguntarte todo por WhatsApp.",
    benefits: ["Catálogo siempre accesible", "Carrito y pedido ordenado", "Enlace y QR para compartir"],
    action: "Publicar catálogo",
    completed: "Catálogo publicado y listo para compartir",
    icon: Store,
  },
  {
    key: "payments",
    title: "Pagos en línea",
    short: "Cobra sin perseguir",
    promise: "Genera el cobro desde el pedido y distingue claramente entre pendiente, confirmado y pagado.",
    benefits: ["Efectivo, transferencia o pago digital", "Enlace de pago por pedido", "Confirmación financiera visible"],
    action: "Crear enlace de pago",
    completed: "Enlace creado; el pedido sigue pendiente hasta confirmar el pago",
    icon: CreditCard,
  },
  {
    key: "schedule",
    title: "Pedidos y agenda",
    short: "Piden ahora, pasan después",
    promise: "El cliente elige cuándo recoge, recibe o toma el servicio; tu equipo ve la hora prometida.",
    benefits: ["Entrega o recolección", "Fecha y horario acordados", "Cola de trabajo por atender"],
    action: "Confirmar para las 18:30",
    completed: "Pedido reservado para hoy a las 18:30",
    icon: CalendarClock,
  },
  {
    key: "promotions",
    title: "Promociones",
    short: "Haz visible una oferta",
    promise: "Arma descuentos y combos que el cliente realmente puede ver y usar desde la tienda.",
    benefits: ["Descuento o precio especial", "Vigencia y condiciones", "Resultado medible por promoción"],
    action: "Publicar 2 × $55",
    completed: "Promoción visible en la tienda y en el carrito",
    icon: BadgePercent,
  },
  {
    key: "memberships",
    title: "Membresías de clientes",
    short: "Haz que regresen",
    promise: "Ofrece beneficios recurrentes y registra cada visita, consumo o renovación desde el negocio.",
    benefits: ["Beneficio claro para el cliente", "Visitas y vigencia", "Renovación y seguimiento"],
    action: "Registrar visita",
    completed: "Visita 8 de 10 registrada; beneficio próximo",
    icon: UsersRound,
  },
  {
    key: "credit",
    title: "Crédito y préstamos",
    short: "Controla quién debe",
    promise: "Registra saldos, abonos y fechas sin depender de una libreta o conversaciones perdidas.",
    benefits: ["Saldo por cliente", "Historial de abonos", "Recordatorios con evidencia"],
    action: "Registrar abono de $200",
    completed: "Abono registrado; nuevo saldo $380",
    icon: HandCoins,
  },
  {
    key: "kiosk",
    title: "Kiosco de autoservicio",
    short: "El cliente arma su orden",
    promise: "Convierte una pantalla en un punto de pedido tipo restaurante de autoservicio, conectado a la misma operación.",
    benefits: ["Menú táctil y visual", "Pedido directo a la cola", "Mismos productos, precios y estados"],
    action: "Enviar pedido a preparación",
    completed: "Pedido K-014 enviado a la misma bandeja del negocio",
    icon: MonitorSmartphone,
  },
];

export const JOURNEY_TABS: { id: Journey; label: string }[] = [
  { id: "customer", label: "Cliente compra" },
  { id: "orders", label: "Negocio atiende" },
  { id: "checkout", label: "Cobra y actualiza" },
];

export const PAYMENT_METHODS: PaymentMethod[] = ["Efectivo", "Transferencia", "En línea"];
