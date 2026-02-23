import { Gift, Heart, Lock, Shield } from "lucide-react";
import type { SitePageCard } from "@/types/tenantSitePages";

export const ICON_OPTIONS: {
  value: SitePageCard["icon"];
  label: string;
  Icon: typeof Heart;
}[] = [
  { value: "heart", label: "Corazón", Icon: Heart },
  { value: "shield", label: "Escudo", Icon: Shield },
  { value: "lock", label: "Candado", Icon: Lock },
  { value: "gift", label: "Regalo", Icon: Gift },
];
