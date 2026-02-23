export interface SocialPlatform {
  label: string;
  hint: string;
  placeholder: string;
  type: "tel" | "url";
  badge: string;
  color: string;
}

export const PLATFORMS: Record<string, SocialPlatform> = {
  whatsapp: {
    label: "WhatsApp",
    hint: "Con código de país, sin espacios ni guiones",
    placeholder: "5215512345678",
    type: "tel",
    badge: "WA",
    color: "#25D366",
  },
  instagram: {
    label: "Instagram",
    hint: "URL completa de tu perfil de Instagram",
    placeholder: "https://instagram.com/mi_tienda",
    type: "url",
    badge: "IG",
    color: "#E1306C",
  },
  facebook: {
    label: "Facebook",
    hint: "URL de tu página o perfil de Facebook",
    placeholder: "https://facebook.com/mi_tienda",
    type: "url",
    badge: "FB",
    color: "#1877F2",
  },
  twitter: {
    label: "Twitter / X",
    hint: "URL de tu perfil de Twitter o X",
    placeholder: "https://twitter.com/mi_tienda",
    type: "url",
    badge: "X",
    color: "#111827",
  },
};
