export const CONFIG_TABS = [
  { value: "negocio", label: "Negocio" },
  { value: "ticket", label: "Ticket" },
  { value: "finanzas", label: "Finanzas" },
  { value: "direccion", label: "Dirección" },
  { value: "recurrentes", label: "Recurrentes" },
  { value: "horarios", label: "Horarios" },
  { value: "agenda", label: "Pedidos y agenda" },
  { value: "dispositivos", label: "Pantallas" },
] as const;

export type ConfigTab = (typeof CONFIG_TABS)[number]["value"];
