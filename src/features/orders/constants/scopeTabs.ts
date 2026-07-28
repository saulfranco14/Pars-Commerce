import type { FilterTabItem } from "@/components/ui/FilterTabs";

/**
 * "Mis pedidos" / "Todos". Solo se muestran a quien tiene `orders.view_all`:
 * sin ese permiso las dos pestañas devolverían exactamente lo mismo, y ofrecer
 * un "Todos" que no enseña todo se lee como que la lista está incompleta.
 */
export const SCOPE_TABS: readonly FilterTabItem[] = [
  { value: "mine", label: "Mis pedidos" },
  { value: "all", label: "Todos" },
];
