"use client";

import {
  Camera,
  CheckCircle2,
  PackageCheck,
  Truck,
} from "lucide-react";
import type { CommerceFulfillmentActionKind } from "@/features/orders/interfaces/commerceFulfillmentAction";
import { OrderActionButton } from "./OrderActionButton";

type CommerceFulfillmentActionProps = {
  action: CommerceFulfillmentActionKind;
  busy: boolean;
  onAction: (action: CommerceFulfillmentActionKind) => void;
};

const ACTION_PRESENTATION: Record<
  CommerceFulfillmentActionKind,
  { label: string; icon: typeof Truck }
> = {
  add_evidence: { label: "Agregar foto de entrega", icon: Camera },
  start_preparation: { label: "Empezar preparación", icon: PackageCheck },
  mark_ready: { label: "Marcar pedido listo", icon: CheckCircle2 },
  start_delivery: { label: "Marcar en camino", icon: Truck },
  confirm_delivery: { label: "Pedido entregado", icon: Camera },
  complete_pickup: { label: "Pedido entregado", icon: Camera },
};

/** Presenta una sola siguiente acción de postventa; nunca combina estados incompatibles. */
export function CommerceFulfillmentAction({
  action,
  busy,
  onAction,
}: CommerceFulfillmentActionProps) {
  const presentation = ACTION_PRESENTATION[action];
  const Icon = presentation.icon;

  return (
    <OrderActionButton
      tone="accent"
      icon={Icon}
      onClick={() => onAction(action)}
      loading={busy}
    >
      {presentation.label}
    </OrderActionButton>
  );
}
