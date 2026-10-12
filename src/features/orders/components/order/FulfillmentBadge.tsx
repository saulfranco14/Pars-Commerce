import {
  CheckCircle2,
  LoaderCircle,
  PackageCheck,
  PackageOpen,
  Truck,
} from "lucide-react";

interface FulfillmentBadgeProps {
  source?: string | null;
  orderStatus: string;
  fulfillmentStatus?: string | null;
  fulfillmentMethod?: "delivery" | "pickup" | null;
  eventTypes?: string[];
}

export function FulfillmentBadge({
  source,
  orderStatus,
  fulfillmentStatus,
  fulfillmentMethod,
  eventTypes = [],
}: FulfillmentBadgeProps) {
  if (source !== "public_store") return null;
  if (!["paid", "completed"].includes(orderStatus)) return null;

  const finished = eventTypes.some((type) =>
    fulfillmentMethod === "delivery"
      ? type === "delivered"
      : type === "pickup_completed",
  );
  const inTransit = eventTypes.includes("out_for_delivery") && !finished;

  const state = finished
    ? {
          label: "Entregado",
          icon: CheckCircle2,
          className: "bg-emerald-50 text-emerald-700",
        }
    : inTransit
      ? {
          label: "En camino",
          icon: Truck,
          className: "bg-blue-50 text-blue-700",
        }
      : fulfillmentStatus === "ready"
        ? {
            label: "Listo",
            icon: PackageCheck,
            className: "bg-blue-50 text-blue-700",
          }
        : fulfillmentStatus === "in_progress"
          ? {
              label: "Preparando",
              icon: LoaderCircle,
              className: "bg-blue-50 text-blue-700",
            }
          : {
              label: "Por preparar",
              icon: PackageOpen,
              className: "bg-amber-50 text-amber-700",
            };
  const Icon = state.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${state.className}`}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {state.label}
    </span>
  );
}
