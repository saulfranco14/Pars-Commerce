import { Banknote, FileText, Globe, Settings, Tag } from "lucide-react";

export type SitioTab = "general" | "redes" | "cobros" | "contenido" | "promociones";

export const SITIO_TABS: {
  value: SitioTab;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "general", label: "General", shortLabel: "General", icon: Settings },
  { value: "redes", label: "Redes", shortLabel: "Redes", icon: Globe },
  { value: "cobros", label: "Cobros y entregas", shortLabel: "Cobros", icon: Banknote },
  {
    value: "contenido",
    label: "Contenido",
    shortLabel: "Contenido",
    icon: FileText,
  },
  { value: "promociones", label: "Promociones", shortLabel: "Promos", icon: Tag },
];
