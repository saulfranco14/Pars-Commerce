import type { CartPlanLine } from "@/types/cart";

export interface CartPlansSectionProps {
  plans: CartPlanLine[];
  accentColor: string;
  onRemove: (planLineId: string) => void;
}
