import type { HeroBeat, HeroBeatKey } from "@/features/landing/interfaces/heroDemo";

/**
 * El hero cuenta UNA historia en DOS dispositivos: lo que hace el cliente en su
 * celular y lo que el negocio ve en su panel en el mismo instante. Los beats
 * recorren MÓDULOS DISTINTOS (no solo mesas) para que se vea de entrada que es
 * una plataforma completa. Copy neutral/multinegocio (CLAUDE.md §6).
 */
export const HERO_BEATS: HeroBeat[] = [
  { key: "qr", label: "Códigos QR", phone: { view: "scan" }, panel: { view: "tables", title: "Mesas" } },
  { key: "mesas", label: "Mesas", phone: { view: "menu" }, panel: { view: "tables", title: "Mesas" } },
  { key: "ordenes", label: "Órdenes", phone: { view: "tracker" }, panel: { view: "orders", title: "Órdenes / Tickets" } },
  { key: "suscripciones", label: "Suscripciones", phone: { view: "subscription" }, panel: { view: "subscriptions", title: "Suscripciones" } },
  { key: "prestamos", label: "Préstamos", phone: { view: "loan" }, panel: { view: "loans", title: "Préstamos" } },
  { key: "sitio", label: "Sitio web", phone: { view: "storefront" }, panel: { view: "site", title: "Sitio web" } },
  { key: "dinero", label: "Mi dinero", phone: { view: "checkout" }, panel: { view: "money", title: "Mi dinero" } },
];

/** Milisegundos que dura cada beat antes de avanzar solo. */
export const HERO_BEAT_MS = 7000;

/** Momento del beat en que el autoplay "toca" la pantalla. */
export const HERO_SCRIPT_ACTION_MS = 2600;

/** Cada cuánto el "staff" simulado avanza el pedido del visitante. */
export const HERO_STAFF_STEP_MS = 2000;

/** La demo abre en el momento que vende: un pedido llegando al panel, no un panel vacío. */
export const HERO_START_KEY: HeroBeatKey = "mesas";
