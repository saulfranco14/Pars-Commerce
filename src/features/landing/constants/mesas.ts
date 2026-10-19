import {
  Banknote,
  Car,
  ClipboardX,
  Scissors,
  Store,
  TimerReset,
  Users,
  Wrench,
} from "lucide-react";

import type {
  MesasAudience,
  MesasPain,
} from "@/features/landing/interfaces/mesas";

/**
 * "Lo tengo / no lo tengo" — el problema en palabras del dueño y lo que Tlaco
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

