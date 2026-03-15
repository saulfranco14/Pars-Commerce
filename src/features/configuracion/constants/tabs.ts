export const CONFIG_TABS = [
  { value: "negocio", label: "Negocio" },
  { value: "ticket", label: "Ticket" },
  { value: "finanzas", label: "Finanzas" },
  { value: "direccion", label: "Dirección" },
  { value: "recurrentes", label: "Recurrentes" },
] as const;

export type ConfigTab = (typeof CONFIG_TABS)[number]["value"];
