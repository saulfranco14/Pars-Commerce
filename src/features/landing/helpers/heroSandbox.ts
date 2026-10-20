import { HERO_BEATS } from "@/features/landing/constants/heroDemo";
import {
  HERO_LOAN,
  HERO_MENU_ITEMS,
  HERO_PLANS,
  HERO_SANDBOX_INITIAL,
  HERO_STORE_ITEMS,
} from "@/features/landing/constants/heroSandbox";
import { formatMXN } from "@/lib/loanUtils";

import type {
  HeroBeatKey,
  HeroCatalogItem,
  HeroPlan,
  HeroPlanId,
  HeroSandboxAction,
  HeroSandboxState,
} from "@/features/landing/interfaces/heroDemo";

function sumItems(ids: string[], catalog: HeroCatalogItem[]): number {
  return catalog.reduce(
    (sum, item) => (ids.includes(item.id) ? sum + item.price : sum),
    0,
  );
}

function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id];
}

export function getMenuTotal(state: HeroSandboxState): number {
  return sumItems(state.cart, HERO_MENU_ITEMS);
}

export function getStoreTotal(state: HeroSandboxState): number {
  return sumItems(state.storeCart, HERO_STORE_ITEMS);
}

export function getPlan(id: HeroPlanId): HeroPlan {
  return HERO_PLANS.find((p) => p.id === id) ?? HERO_PLANS[0];
}

/** "$400.00" para cuotas, "$350.00/mes" para recurrentes. */
export function formatPlanCharge(plan: HeroPlan): string {
  return plan.installments ? formatMXN(plan.amount) : `${formatMXN(plan.amount)}/mes`;
}

/** Montos de métricas: sin centavos para que quepan en las tarjetas del panel. */
export function formatHeroAmount(value: number): string {
  return `$${value.toLocaleString("es-MX")}`;
}

export function formatProductCount(count: number): string {
  return `${count} ${count === 1 ? "producto" : "productos"}`;
}

/** El momento clave de cada módulo — lo que la guía le pide al visitante. */
export function isBeatDone(key: HeroBeatKey, state: HeroSandboxState): boolean {
  switch (key) {
    case "qr":
      return state.scanned;
    case "mesas":
      return state.order !== "draft";
    case "ordenes":
      return state.order === "ready" || state.order === "paid";
    case "suscripciones":
      return state.subscribed;
    case "prestamos":
      return state.loanPaid > HERO_LOAN.initialPaid;
    case "sitio":
      return state.storeOrdered;
    case "dinero":
      return state.order === "paid";
  }
}

function applyAction(
  state: HeroSandboxState,
  action: HeroSandboxAction,
): HeroSandboxState {
  switch (action.type) {
    case "scan":
      return { ...state, scanned: true };
    case "setCategory":
      return { ...state, category: action.category };
    case "toggleItem":
      if (state.order !== "draft") return state;
      return { ...state, scanned: true, cart: toggleId(state.cart, action.id) };
    case "sendOrder":
      if (state.order !== "draft" || state.cart.length === 0) return state;
      return { ...state, scanned: true, order: "received" };
    case "advanceOrder":
      if (state.order === "received") return { ...state, order: "in_progress" };
      if (state.order === "in_progress") return { ...state, order: "ready" };
      return state;
    case "pay":
      return state.order === "ready" ? { ...state, order: "paid" } : state;
    case "choosePlan":
      return { ...state, plan: action.plan, subscribed: false };
    case "subscribe":
      return { ...state, subscribed: true };
    case "payLoan":
      return {
        ...state,
        loanPaid: Math.min(state.loanPaid + 1, HERO_LOAN.installments),
      };
    case "toggleStoreItem":
      return {
        ...state,
        storeOrdered: false,
        storeCart: toggleId(state.storeCart, action.id),
      };
    case "placeStoreOrder":
      return state.storeCart.length > 0 ? { ...state, storeOrdered: true } : state;
    case "apply":
      return { ...state, ...action.patch, explored: state.explored };
    case "reset":
      return { ...HERO_SANDBOX_INITIAL, explored: state.explored };
  }
}

/** `apply`/`reset` come from autoplay or navigation, so they never count as the visitor exploring. */
export function heroSandboxReducer(
  state: HeroSandboxState,
  action: HeroSandboxAction,
): HeroSandboxState {
  const next = applyAction(state, action);
  if (action.type === "apply" || action.type === "reset" || next === state) return next;

  const reached = HERO_BEATS.map((b) => b.key).filter(
    (key) => !next.explored.includes(key) && isBeatDone(key, next) && !isBeatDone(key, state),
  );
  return reached.length > 0 ? { ...next, explored: [...next.explored, ...reached] } : next;
}
