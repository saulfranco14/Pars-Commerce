import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  Globe,
  LayoutDashboard,
  Link2,
  Monitor,
  QrCode,
  Smartphone,
  MessageCircle,
} from "lucide-react";

export type OrderSource =
  | "dashboard"
  | "public_store"
  | "staff"
  | "kiosk"
  | "qr_table"
  | "qr_payment"
  | "addendum"
  | "whatsapp";

const SOURCE_CONFIG: Record<
  OrderSource,
  { label: string; icon: LucideIcon; iconClass?: string }
> = {
  dashboard: {
    label: "Dashboard",
    icon: LayoutDashboard,
    iconClass: "text-slate-600",
  },
  public_store: {
    label: "Sitio web",
    icon: Globe,
    iconClass: "text-teal-600",
  },
  // Staff-taken counter order (QR ticket the customer scans to pay).
  staff: {
    label: "Mostrador",
    icon: ClipboardList,
    iconClass: "text-violet-600",
  },
  // El cliente lo armó solo en la pantalla grande. Nadie lo atendió.
  kiosk: {
    label: "Autoservicio",
    icon: Monitor,
    iconClass: "text-indigo-600",
  },
  // Customer-initiated table order via the table's QR.
  qr_table: {
    label: "Mesa QR",
    icon: QrCode,
    iconClass: "text-blue-600",
  },
  // Cobro suelto por QR (propinas, montos libres). Sin catálogo de por medio.
  qr_payment: {
    label: "Cobro QR",
    icon: Smartphone,
    iconClass: "text-cyan-600",
  },
  // Pedido complementario de uno ya pagado: "lo que faltó".
  addendum: {
    label: "Complemento",
    icon: Link2,
    iconClass: "text-amber-600",
  },
  whatsapp: {
    label: "WhatsApp",
    icon: MessageCircle,
    iconClass: "text-emerald-600",
  },
};

export function formatSourceLabel(
  value: string | null | undefined
): string {
  if (!value || typeof value !== "string") return "";
  const normalized = value.toLowerCase().trim() as OrderSource;
  return SOURCE_CONFIG[normalized]?.label ?? value;
}

export function getSourceConfig(
  value: string | null | undefined
): (typeof SOURCE_CONFIG)[OrderSource] | null {
  if (!value || typeof value !== "string") return null;
  const normalized = value.toLowerCase().trim() as OrderSource;
  return SOURCE_CONFIG[normalized] ?? null;
}
