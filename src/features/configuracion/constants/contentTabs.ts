export const CONTENT_TABS = [
  { value: "inicio", label: "Inicio" },
  { value: "nosotros", label: "Nosotros" },
  { value: "contacto", label: "Contacto" },
] as const;

export type SectionSlug = "inicio" | "nosotros" | "contacto";

export const ACCORDION_SECTIONS: { id: SectionSlug; label: string }[] = [
  { id: "inicio", label: "Inicio" },
  { id: "nosotros", label: "Nosotros" },
  { id: "contacto", label: "Contacto" },
];
