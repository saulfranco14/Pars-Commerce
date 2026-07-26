import {
  Clock,
  PackageCheck,
  QrCode,
  ShoppingBag,
  SplitSquareHorizontal,
  Wallet,
  Store,
  Car,
  Scissors,
  Wrench,
  Banknote,
  Users,
  TimerReset,
  ClipboardX,
} from "lucide-react";

import type {
  MesasAudience,
  MesasDemoStep,
  MesasPain,
} from "@/features/landing/interfaces/mesas";

/**
 * Steps of the interactive demo. These mirror the REAL customer flow in
 * `src/app/q/[token]/table/**` — scan → pedir → en proceso → listo → dividir →
 * pagar. Copy is neutral/multinegocio (CLAUDE.md §6): nada de "cocina",
 * "platillos" ni íconos de comida.
 */
export const MESAS_DEMO_STEPS: MesasDemoStep[] = [
  {
    key: "scan",
    label: "Escanea",
    title: "Tu cliente escanea y ya está dentro",
    description:
      "Pega el QR en la mesa, el mostrador o la ventanilla. Tu cliente lo escanea con su cámara — sin descargar ninguna app, sin crear cuenta.",
    action: "Escanear el QR",
    icon: QrCode,
  },
  {
    key: "order",
    label: "Pide",
    title: "Pide desde su propio celular",
    description:
      "Ve tu catálogo con fotos y precios, arma su pedido y lo envía. Tú lo recibes al instante — nadie tiene que anotar nada en papel.",
    action: "Enviar pedido",
    icon: ShoppingBag,
  },
  {
    key: "progress",
    label: "En proceso",
    title: "Sabe en qué va, sin preguntar",
    description:
      "Tu equipo marca el avance y el cliente lo ve en su pantalla. Se acaban los “¿ya casi?” y tu personal deja de dar explicaciones.",
    action: "Marcar en proceso",
    icon: Clock,
  },
  {
    key: "ready",
    label: "Listo",
    title: "Cuando está listo, se entera solo",
    description:
      "Al marcar listo, el cliente lo ve de inmediato y hasta ese momento se habilita el pago. Cobras por lo que ya entregaste.",
    action: "Marcar listo",
    icon: PackageCheck,
  },
  {
    key: "split",
    label: "Divide",
    title: "Dividen la cuenta entre ellos",
    description:
      "Cada quien paga lo suyo, en partes iguales o eligiendo quién paga qué. Tu personal ya no hace cuentas ni recibe cinco tarjetas.",
    action: "Dividir la cuenta",
    icon: SplitSquareHorizontal,
  },
  {
    key: "pay",
    label: "Paga",
    title: "Paga desde su celular y listo",
    description:
      "Tarjeta, débito o efectivo en caja. Tú ves el pago confirmado en tu panel y la mesa se libera sola para el siguiente cliente.",
    action: "Pagar $284.00",
    icon: Wallet,
  },
];

/**
 * "Lo tengo / no lo tengo" — el problema en palabras del dueño y lo que Pars
 * hace en su lugar. Sirve para que el prospecto se reconozca antes de que le
 * expliquemos la función.
 */
export const MESAS_PAINS: MesasPain[] = [
  {
    key: "papel",
    pain: "Anoto los pedidos en papel y se me pierden.",
    solution:
      "El pedido entra directo a tu panel desde el celular del cliente. Queda registrado con hora, productos y total.",
    icon: ClipboardX,
  },
  {
    key: "esperas",
    pain: "Mis clientes se van porque tardan en que los atiendan.",
    solution:
      "El cliente pide en cuanto llega, sin esperar a que alguien se desocupe. Tu equipo atiende más gente con el mismo personal.",
    icon: TimerReset,
  },
  {
    key: "cuentas",
    pain: "Dividir la cuenta entre varios es un pleito.",
    solution:
      "Ellos la dividen solos en su celular: lo que pidió cada quien, partes iguales o quién paga qué.",
    icon: Users,
  },
  {
    key: "efectivo",
    pain: "Solo acepto efectivo y pierdo ventas.",
    solution:
      "Cobras con tarjeta y débito sin terminal ni renta mensual. La comisión la absorbe el negocio, tu cliente paga el precio de lista.",
    icon: Banknote,
  },
];

/**
 * Multinegocio: el QR de mesas NO es solo para restaurantes. Estos chips lo
 * dejan claro de entrada (CLAUDE.md §6).
 */
export const MESAS_AUDIENCES: MesasAudience[] = [
  {
    key: "local",
    label: "Locales y tienditas",
    example: "Pide en el mostrador y paga sin hacer fila.",
    icon: Store,
  },
  {
    key: "autolavado",
    label: "Autolavado y taller",
    example: "El cliente pide su servicio y ve cuándo está listo su carro.",
    icon: Car,
  },
  {
    key: "estetica",
    label: "Estética y spa",
    example: "Elige servicios desde la sala de espera y paga al terminar.",
    icon: Scissors,
  },
  {
    key: "servicios",
    label: "Servicios a domicilio",
    example: "Cobra el servicio en sitio con un QR, sin terminal.",
    icon: Wrench,
  },
];

