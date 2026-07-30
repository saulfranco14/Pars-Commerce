import type { FilterTabItem } from "@/components/ui/FilterTabs";

// Only shown with `orders.view_all`: without it both tabs return the same, and
// an "All" that doesn't show all reads as a broken list.
export const SCOPE_TABS: readonly FilterTabItem[] = [
  { value: "mine", label: "Mis pedidos" },
  { value: "all", label: "Todos" },
];
