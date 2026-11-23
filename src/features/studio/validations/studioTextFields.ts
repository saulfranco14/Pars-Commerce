import type { FieldSchema } from "@/lib/forms/fieldSchema";

export const studioTextFields: FieldSchema[] = [
  {
    name: "phrase",
    label: "Frase grande",
    type: "text",
    required: true,
    defaultValue: "",
    yupString: (base) => base.max(80, "Usa hasta 80 caracteres."),
  },
  {
    name: "tagline",
    label: "Frase final",
    type: "text",
    defaultValue: "",
    yupString: (base) => base.max(60, "Usa hasta 60 caracteres."),
  },
];
