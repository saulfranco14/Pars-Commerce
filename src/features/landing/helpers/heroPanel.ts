import {
  HERO_LOAN,
  HERO_ORDER_STATUS_LABEL,
} from "@/features/landing/constants/heroSandbox";
import {
  formatHeroAmount,
  formatProductCount,
  formatPlanCharge,
  getMenuTotal,
  getPlan,
  getStoreTotal,
} from "@/features/landing/helpers/heroSandbox";
import { formatMXN } from "@/lib/loanUtils";

import type {
  HeroPanelData,
  HeroPanelNotice,
  HeroPanelView,
  HeroSandboxState,
} from "@/features/landing/interfaces/heroDemo";

function tablesNotice(s: HeroSandboxState, total: number): HeroPanelNotice {
  if (!s.scanned) return { text: "Esperando que alguien escanee…", idle: true };
  switch (s.order) {
    case "draft":
      return s.cart.length > 0
        ? { text: `Mesa 4 está eligiendo · ${formatProductCount(s.cart.length)}` }
        : { text: "Mesa 4 · cliente conectado" };
    case "received":
      return { text: `Nuevo pedido · Mesa 4 · ${formatMXN(total)}` };
    case "paid":
      return { text: `Mesa 4 pagó · ${formatMXN(total)}` };
    default:
      return { text: `Mesa 4 · ${HERO_ORDER_STATUS_LABEL[s.order].toLowerCase()}` };
  }
}

function ordersNotice(s: HeroSandboxState, total: number): HeroPanelNotice {
  switch (s.order) {
    case "draft":
      return { text: "Esperando pedidos de tus mesas", idle: true };
    case "received":
      return { text: `Pedido #1042 · Mesa 4 · ${formatMXN(total)}` };
    case "in_progress":
      return { text: "#1042 · tu equipo lo está atendiendo" };
    case "ready":
      return { text: "Mesa 4 · marcado como listo" };
    case "paid":
      return { text: `#1042 · cobrado · ${formatMXN(total)}` };
  }
}

const BUILDERS: Record<HeroPanelView, (s: HeroSandboxState) => HeroPanelData> = {
  tables: (s) => {
    const total = getMenuTotal(s);
    const open = s.order !== "draft" && s.order !== "paid";
    const active = { label: "Mesas activas", value: String(s.scanned ? 3 : 2) };
    const toCollect = { label: "Por cobrar", value: formatHeroAmount(open ? total : 0) };
    return {
      notice: tablesNotice(s, total),
      metrics: [
        {
          label: "Ventas de hoy",
          value: formatHeroAmount(12450 + (s.order === "paid" ? total : 0)),
        },
        active,
        toCollect,
      ],
      headers: ["Mesa", "Estado", "Total"],
      rows: [
        {
          left: "Mesa 4",
          middle: s.scanned ? HERO_ORDER_STATUS_LABEL[s.order] : "Libre",
          right: formatMXN(s.scanned ? total : 0),
          highlight: s.scanned,
        },
        { left: "Mesa 2", middle: "Pagado", right: formatMXN(156) },
        { left: "Mesa 7", middle: "Pagado", right: formatMXN(92) },
      ],
    };
  },

  orders: (s) => {
    const total = getMenuTotal(s);
    const sent = s.order !== "draft";
    const working = s.order === "received" || s.order === "in_progress";
    const today = { label: "Órdenes hoy", value: String(84 + (sent ? 1 : 0)) };
    return {
      notice: ordersNotice(s, total),
      metrics: [
        today,
        { label: "En proceso", value: String(3 + (working ? 1 : 0)) },
        { label: "Listas", value: String(12 + (s.order === "ready" ? 1 : 0)) },
      ],
      headers: ["Orden", "Estado", "Total"],
      rows: [
        {
          left: "#1042 · Mesa 4",
          middle: sent ? HERO_ORDER_STATUS_LABEL[s.order] : "Sin enviar",
          right: formatMXN(total),
          highlight: sent,
        },
        { left: "#1041 · Mostrador", middle: "En proceso", right: formatMXN(210) },
        { left: "#1040 · Mesa 2", middle: "Pagado", right: formatMXN(156) },
      ],
    };
  },

  subscriptions: (s) => {
    const plan = getPlan(s.plan);
    const charge = formatPlanCharge(plan);
    const active = { label: "Activas", value: String(17 + (s.subscribed ? 1 : 0)) };
    return {
      notice: s.subscribed
        ? { text: `Nueva suscripción · ${plan.label} · ${charge}` }
        : { text: `Ana Ríos está viendo: ${plan.label}`, idle: true },
      metrics: [
        active,
        {
          label: "Cobro al mes",
          value: formatHeroAmount(9000 + (s.subscribed ? plan.amount : 0)),
        },
        { label: "Próx. cargo", value: "3 días" },
      ],
      headers: ["Cliente", "Plan", "Cuota"],
      rows: [
        {
          left: "Ana Ríos",
          middle: s.subscribed ? plan.label : "Eligiendo",
          right: formatMXN(plan.amount),
          highlight: true,
        },
        { left: "Luis Mena", middle: "6 pagos", right: formatMXN(200) },
        { left: "Sofía Cruz", middle: "Mensual", right: formatMXN(350) },
      ],
    };
  },

  loans: (s) => {
    const extra = s.loanPaid - HERO_LOAN.initialPaid;
    const pending = {
      label: "Por cobrar",
      value: formatHeroAmount(22000 - extra * HERO_LOAN.amount),
    };
    return {
      notice:
        extra > 0
          ? { text: `Abono recibido · Ana Ríos · ${formatMXN(HERO_LOAN.amount)}` }
          : { text: "Ana Ríos tiene un abono para hoy", idle: true },
      metrics: [
        { label: "Prestado", value: formatHeroAmount(48000) },
        pending,
        { label: "Al corriente", value: "92%" },
      ],
      headers: ["Cliente", "Abono", "Monto"],
      rows: [
        {
          left: "Ana Ríos",
          middle: `${s.loanPaid} de ${HERO_LOAN.installments}`,
          right: formatMXN(HERO_LOAN.amount),
          highlight: true,
        },
        { left: "Luis Mena", middle: "5 de 6", right: formatMXN(300) },
        { left: "Sofía Cruz", middle: "1 de 4", right: formatMXN(900) },
      ],
    };
  },

  site: (s) => {
    const total = getStoreTotal(s);
    const orders = { label: "Pedidos web", value: String(8 + (s.storeOrdered ? 1 : 0)) };
    let notice: HeroPanelNotice = { text: "Tu tienda está abierta 24/7", idle: true };
    if (s.storeOrdered) notice = { text: `Pedido en línea · ${formatMXN(total)}` };
    else if (s.storeCart.length > 0)
      notice = { text: `Alguien tiene ${s.storeCart.length} en su carrito`, idle: true };
    return {
      notice,
      metrics: [
        { label: "Visitas hoy", value: "248" },
        orders,
        { label: "Ticket prom.", value: formatHeroAmount(412) },
      ],
      headers: ["Pedido", "Estado", "Total"],
      rows: [
        {
          left: "#1043 · en línea",
          middle: s.storeOrdered ? "Nuevo" : "En carrito",
          right: formatMXN(total),
          highlight: s.storeCart.length > 0,
        },
        { left: "#1039 · en línea", middle: "Enviado", right: formatMXN(285) },
        { left: "#1036 · en línea", middle: "Entregado", right: formatMXN(310) },
      ],
    };
  },

  money: (s) => {
    const paid = s.order === "paid" ? getMenuTotal(s) : 0;
    const incoming = { label: "Por recibir", value: formatHeroAmount(7956 + paid) };
    return {
      notice:
        paid > 0
          ? { text: `Mesa 4 pagó ${formatMXN(paid)} · cae mañana` }
          : { text: "Depósito programado · mañana", idle: true },
      metrics: [
        incoming,
        { label: "Recibido", value: formatHeroAmount(34120) },
        { label: "Comisiones", value: formatHeroAmount(612) },
      ],
      headers: ["Depósito", "Estado", "Monto"],
      rows: [
        {
          left: "Mañana",
          middle: "Programado",
          right: formatMXN(7956 + paid),
          highlight: true,
        },
        { left: "22 de julio", middle: "Recibido", right: formatMXN(6180) },
        { left: "21 de julio", middle: "Recibido", right: formatMXN(5940) },
      ],
    };
  },
};

/** El panel nunca tiene datos propios: todo sale de lo que hizo el cliente. */
export function buildHeroPanel(
  view: HeroPanelView,
  state: HeroSandboxState,
): HeroPanelData {
  return BUILDERS[view](state);
}
