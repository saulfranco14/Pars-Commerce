import type {
  SettlementCycle,
  SettlementStatus,
} from "@/types/settlement";
import type { StatusTone } from "@/components/admin/StatusBadge";

export const CYCLE_LABEL: Record<SettlementCycle, string> = {
  daily: "Diario",
  weekly: "Semanal",
  biweekly: "Quincenal",
  monthly: "Mensual",
  custom: "Personalizado",
};

export const STATUS_LABEL: Record<SettlementStatus, string> = {
  open: "En curso",
  closed: "Por transferir",
  transfer_pending: "Transferencia en proceso",
  transfer_confirmed: "Recibido",
  disputed: "En revisión",
};

export const STATUS_TONE: Record<SettlementStatus, StatusTone> = {
  open: "neutral",
  closed: "warning",
  transfer_pending: "info",
  transfer_confirmed: "success",
  disputed: "danger",
};
