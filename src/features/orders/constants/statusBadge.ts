import type { ComponentType } from "react";
import {
  CalendarCheck,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  Package,
  Repeat,
  UserCheck,
  XCircle,
} from "lucide-react";

export const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  assigned: "Asignada",
  in_progress: "En progreso",
  completed: "Completada",
  pending_payment: "Pago pendiente",
  pending_pickup: "Pendiente recoger",
  paid: "Pagada",
  cancelled: "Cancelada",
  pending_subscription: "Suscripción pendiente",
  installment_active: "En cuotas",
};

export const STATUS_CLASSES: Record<string, string> = {
  draft: "bg-border-soft text-muted-foreground",
  assigned: "bg-blue-100 text-blue-800",
  in_progress: "bg-amber-100 text-amber-800",
  completed: "bg-green-100 text-green-800",
  pending_payment: "bg-orange-100 text-orange-800",
  pending_pickup: "bg-violet-100 text-violet-800",
  paid: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
  pending_subscription: "bg-indigo-100 text-indigo-800",
  installment_active: "bg-purple-100 text-purple-800",
};

export const STATUS_ICONS: Record<
  string,
  ComponentType<{ className?: string }>
> = {
  draft: FileText,
  assigned: UserCheck,
  in_progress: Loader2,
  completed: CheckCircle,
  pending_payment: Clock,
  pending_pickup: Package,
  paid: CheckCircle,
  cancelled: XCircle,
  pending_subscription: Repeat,
  installment_active: CalendarCheck,
};
