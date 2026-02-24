export const STATUS_BORDER: Record<string, string> = {
  draft: "border-l-slate-400",
  assigned: "border-l-blue-500",
  in_progress: "border-l-amber-500",
  completed: "border-l-green-500",
  pending_payment: "border-l-orange-500",
  pending_pickup: "border-l-violet-500",
  paid: "border-l-emerald-500",
  cancelled: "border-l-red-400",
};

export const PRICE_COLOR: Record<string, string> = {
  draft: "text-muted-foreground",
  assigned: "text-blue-600",
  in_progress: "text-amber-600",
  completed: "text-emerald-600",
  pending_payment: "text-orange-600",
  pending_pickup: "text-violet-600",
  paid: "text-emerald-600",
  cancelled:
    "text-muted-foreground/60 line-through decoration-red-400",
};
