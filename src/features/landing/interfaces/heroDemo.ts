/** Qué pantalla ve el cliente en su celular durante el beat. */
export type HeroPhoneView =
  | "scan"
  | "menu"
  | "tracker"
  | "subscription"
  | "loan"
  | "storefront"
  | "checkout";

/** Qué vista del panel ve el negocio durante el beat. */
export type HeroPanelView =
  | "tables"
  | "orders"
  | "subscriptions"
  | "loans"
  | "site"
  | "money";

export type HeroBeatKey =
  | "qr"
  | "mesas"
  | "ordenes"
  | "suscripciones"
  | "prestamos"
  | "sitio"
  | "dinero";

export interface HeroBeat {
  key: HeroBeatKey;
  /** Nombre del módulo en las pestañas. */
  label: string;
  phone: { view: HeroPhoneView };
  panel: {
    view: HeroPanelView;
    /** Título de la pantalla del panel (como en el Sidebar). */
    title: string;
  };
}

/** Mismo ciclo que `orders.fulfillment_status` + el pago. */
export type HeroOrderStatus = "draft" | "received" | "in_progress" | "ready" | "paid";

export type HeroMenuCategory = "all" | "services" | "drinks";

export type HeroPlanId = "three" | "six" | "monthly";

export interface HeroCatalogItem {
  id: string;
  name: string;
  price: number;
  category?: Exclude<HeroMenuCategory, "all">;
}

export interface HeroPlan {
  id: HeroPlanId;
  label: string;
  detail: string;
  /** Monto de cada cargo. */
  amount: number;
  /** Sin número de pagos = recurrente hasta que se cancele. */
  installments?: number;
}

/** Qué tocar en el módulo y qué significa para el negocio cuando pasa. */
export interface HeroGuide {
  hint: string;
  done: string;
}

/** Todo lo que el visitante puede cambiar tocando el celular de la demo. */
export interface HeroSandboxState {
  scanned: boolean;
  category: HeroMenuCategory;
  cart: string[];
  order: HeroOrderStatus;
  plan: HeroPlanId;
  subscribed: boolean;
  loanPaid: number;
  storeCart: string[];
  storeOrdered: boolean;
  /** Módulos cuyo momento clave hizo el visitante (no el autoplay). */
  explored: HeroBeatKey[];
}

export type HeroSandboxAction =
  | { type: "scan" }
  | { type: "setCategory"; category: HeroMenuCategory }
  | { type: "toggleItem"; id: string }
  | { type: "sendOrder" }
  | { type: "advanceOrder" }
  | { type: "pay" }
  | { type: "choosePlan"; plan: HeroPlanId }
  | { type: "subscribe" }
  | { type: "payLoan" }
  | { type: "toggleStoreItem"; id: string }
  | { type: "placeStoreOrder" }
  | { type: "apply"; patch: Partial<HeroSandboxState> }
  | { type: "reset" };

/** Lo que el autoplay hace en cada beat: estado al entrar y la "acción" del cliente. */
export interface HeroBeatScript {
  before: Partial<HeroSandboxState>;
  after: Partial<HeroSandboxState>;
}

export interface HeroPanelMetric {
  label: string;
  value: string;
}

export interface HeroPanelRow {
  left: string;
  middle: string;
  right: string;
  highlight?: boolean;
}

export interface HeroPanelNotice {
  text: string;
  /** Sin evento nuevo — se pinta apagado para no competir con un aviso real. */
  idle?: boolean;
}

/** Lo que muestra el panel del negocio, derivado del estado del celular. */
export interface HeroPanelData {
  notice: HeroPanelNotice;
  metrics: [HeroPanelMetric, HeroPanelMetric, HeroPanelMetric];
  headers: [string, string, string];
  rows: HeroPanelRow[];
}

export interface HeroPhoneControls {
  act: (action: HeroSandboxAction) => void;
  next: () => void;
  nextLabel: string;
  goToBeat: (key: HeroBeatKey) => void;
  restart: () => void;
}

export interface HeroPhoneViewProps {
  sandbox: HeroSandboxState;
  controls: HeroPhoneControls;
}

export interface UseHeroDemoResult {
  index: number;
  beat: HeroBeat;
  playing: boolean;
  /** El visitante ya tocó el celular — se apaga la pista "Pruébalo". */
  touched: boolean;
  sandbox: HeroSandboxState;
  panel: HeroPanelData;
  guide: HeroGuide;
  /** El momento clave del módulo actual ya ocurrió. */
  beatDone: boolean;
  /** Cambia cada vez que el autoplay "toca" la pantalla — dispara el ripple. */
  tapKey: number;
  controls: HeroPhoneControls;
  containerRef: React.RefObject<HTMLDivElement | null>;
  goTo: (i: number) => void;
  toggle: () => void;
}
