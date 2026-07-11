import type { LucideIcon } from "lucide-react";
import { ClipboardList, Globe, LayoutDashboard, QrCode } from "lucide-react";

export type OrderSource = "dashboard" | "public_store" | "staff" | "qr_table";

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
  // Customer-initiated table order via the table's QR.
  qr_table: {
    label: "Mesa QR",
    icon: QrCode,
    iconClass: "text-blue-600",
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
