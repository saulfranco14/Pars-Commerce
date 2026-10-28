export const HEARD_FROM_OPTIONS = [
  { value: "", label: "Prefiero no decir" },
  { value: "saul", label: "Me escribió o me visitó Saúl" },
  { value: "facebook", label: "Facebook o Instagram" },
  { value: "google", label: "Google" },
  { value: "recomendacion", label: "Me lo recomendaron" },
  { value: "otro", label: "Otro" },
] as const;

export const HEARD_FROM_VALUES: ReadonlySet<string> = new Set(HEARD_FROM_OPTIONS.map((option) => option.value).filter(Boolean));
