import type {
  HeroBeatKey,
  HeroBeatScript,
  HeroCatalogItem,
  HeroMenuCategory,
  HeroOrderStatus,
  HeroPlan,
  HeroSandboxState,
} from "@/features/landing/interfaces/heroDemo";

export const HERO_MENU_ITEMS: HeroCatalogItem[] = [
  { id: "lavado", name: "Lavado bronce", price: 100, category: "services" },
  { id: "encerado", name: "Encerado", price: 150, category: "services" },
  { id: "aspirado", name: "Aspirado interior", price: 80, category: "services" },
  { id: "bebida", name: "Bebida 473ml", price: 34, category: "drinks" },
  { id: "agua", name: "Agua natural", price: 20, category: "drinks" },
];

export const HERO_MENU_CATEGORIES: { id: HeroMenuCategory; label: string }[] = [
  { id: "all", label: "Todo" },
  { id: "services", label: "Servicios" },
  { id: "drinks", label: "Bebidas" },
];

export const HERO_STORE_ITEMS: HeroCatalogItem[] = [
  { id: "basico", name: "Paquete básico", price: 320 },
  { id: "express", name: "Servicio express", price: 180 },
  { id: "completo", name: "Paquete completo", price: 640 },
  { id: "kit", name: "Kit de cuidado", price: 260 },
];

export const HERO_PLANS: HeroPlan[] = [
  { id: "three", label: "3 pagos", detail: "Cada 15 días", amount: 400, installments: 3 },
  { id: "six", label: "6 pagos", detail: "Cada mes", amount: 200, installments: 6 },
  { id: "monthly", label: "Mensual", detail: "Se renueva solo", amount: 350 },
];

export const HERO_LOAN = { installments: 6, amount: 500, initialPaid: 2 };

export const HERO_ORDER_STATUS_LABEL: Record<HeroOrderStatus, string> = {
  draft: "Pidiendo",
  received: "Recibido",
  in_progress: "En proceso",
  ready: "Listo",
  paid: "Pagado",
};

const DEFAULT_CART = ["lavado", "encerado", "bebida"];

export const HERO_SANDBOX_INITIAL: HeroSandboxState = {
  scanned: false,
  category: "all",
  cart: [],
  order: "draft",
  plan: "three",
  subscribed: false,
  loanPaid: HERO_LOAN.initialPaid,
  storeCart: ["completo"],
  storeOrdered: false,
  explored: [],
};

/** El autoplay ejecuta las mismas acciones que podría hacer el visitante. */
export const HERO_BEAT_SCRIPTS: Record<HeroBeatKey, HeroBeatScript> = {
  qr: { before: HERO_SANDBOX_INITIAL, after: { scanned: true } },
  mesas: {
    before: { scanned: true, category: "all", cart: DEFAULT_CART, order: "draft" },
    after: { order: "received" },
  },
  ordenes: {
    before: { scanned: true, cart: DEFAULT_CART, order: "in_progress" },
    after: { order: "ready" },
  },
  suscripciones: {
    before: { plan: "six", subscribed: false },
    after: { plan: "three", subscribed: true },
  },
  prestamos: {
    before: { loanPaid: HERO_LOAN.initialPaid },
    after: { loanPaid: HERO_LOAN.initialPaid + 1 },
  },
  sitio: {
    before: { storeCart: ["completo"], storeOrdered: false },
    after: { storeOrdered: true },
  },
  dinero: {
    before: { scanned: true, cart: DEFAULT_CART, order: "ready" },
    after: { order: "paid" },
  },
};
