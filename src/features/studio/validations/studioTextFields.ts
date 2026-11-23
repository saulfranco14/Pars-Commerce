import type { FieldSchema } from "@/lib/forms/fieldSchema";

export const studioTextFields: FieldSchema[] = [
  {
    name: "headline",
    label: "Nombre en el anuncio",
    type: "text",
    required: true,
    defaultValue: "",
    yupString: (base) => base.max(120, "Usa hasta 120 caracteres."),
  },
  {
    name: "tagline",
    label: "Frase corta",
    type: "text",
    defaultValue: "",
    yupString: (base) => base.max(60, "Usa hasta 60 caracteres."),
  },
];
