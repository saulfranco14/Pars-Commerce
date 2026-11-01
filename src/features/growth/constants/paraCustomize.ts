/** «Hazla tuya»: the three quick choices the owner makes before activating. */
export const PARA_STORE_COLORS = [
  { key: "azul", label: "Azul", hex: "#3483fa" },
  { key: "rojo", label: "Rojo", hex: "#e2553b" },
  { key: "verde", label: "Verde", hex: "#13876a" },
  { key: "morado", label: "Morado", hex: "#7c5cd6" },
  { key: "negro", label: "Negro", hex: "#1f2937" },
] as const;

export const PARA_STORE_HOURS = [
  { key: "manana", label: "8:00 a 16:00" },
  { key: "dia", label: "9:00 a 21:00" },
  { key: "tarde", label: "14:00 a 22:00" },
  { key: "siempre", label: "Las 24 horas" },
] as const;

export const PARA_CUSTOMIZE_STEPS = 3;
