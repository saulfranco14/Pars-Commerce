import { MENU_ITEMS, menuItemSection } from "@/constants/dashboardMenu";

/** Menu sections in sidebar order, as the role preview names them (one per section). */
export const MENU_SECTIONS: readonly { key: string; label: string }[] = [
  { key: "inicio", label: "Inicio" },
  ...MENU_ITEMS.flatMap((item) => {
    const section = menuItemSection(item);
    return section ? [{ key: section, label: item.label }] : [];
  }).filter((entry, index, all) => all.findIndex((e) => e.key === entry.key) === index),
];
