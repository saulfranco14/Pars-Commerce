import { STATIONS, stationSection } from "@/features/operaciones/constants/stations";

/** Menu entries in sidebar order, as the role preview names them. */
export const MENU_SECTIONS: readonly { key: string; label: string }[] = [
  { key: "inicio", label: "Inicio" },
  ...STATIONS.map((s) => ({ key: stationSection(s.key), label: s.label })),
  { key: "productos", label: "Productos" },
  { key: "servicios", label: "Servicios" },
  { key: "ordenes", label: "Órdenes / Tickets" },
  { key: "cotizaciones", label: "Cotizaciones" },
  { key: "agenda", label: "Agenda" },
  { key: "suscripciones", label: "Suscripciones" },
  { key: "qr", label: "Códigos QR" },
  { key: "mesas", label: "Mesas" },
  { key: "prestamos", label: "Préstamos" },
  { key: "credito", label: "Crédito de clientes" },
  { key: "clientes", label: "Clientes" },
  { key: "ventas", label: "Ventas y comisiones" },
  { key: "liquidaciones", label: "Mi dinero" },
  { key: "equipo", label: "Equipo y roles" },
  { key: "sitio-web", label: "Sitio web" },
  { key: "configuracion", label: "Configuración" },
  { key: "novedades", label: "Novedades" },
];
