import * as yup from "yup";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type {
  Control,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";

export interface CustomFieldRenderContext {
  register: UseFormRegister<Record<string, unknown>>;
  watch: UseFormWatch<Record<string, unknown>>;
  setValue: UseFormSetValue<Record<string, unknown>>;
  control: Control<Record<string, unknown>>;
  disabled?: boolean;
}
export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldSchema {
  name: string;
  label: string;
  type:
    | "text"
    | "email"
    | "tel"
    | "number"
    | "textarea"
    | "select"
    | "checkbox"
    | "custom";
  icon?: LucideIcon;
  placeholder?: string;
  required?: boolean;
  requiredWhen?: (values: Record<string, unknown>) => boolean;
  showWhen?: (values: Record<string, unknown>) => boolean;
  render?: (ctx: CustomFieldRenderContext) => ReactNode;
  hint?: string;
  rows?: number;
  checkboxLabel?: string;
  options?: FieldOption[] | (() => Promise<FieldOption[]>);
  dependsOn?: string;
  optionsForParent?: (parentValue: string) => Promise<FieldOption[]>;
  emptyOptionLabel?: string;
  onCreateNew?: () => void;
  createNewLabel?: string;
  refreshKey?: number;
  hintForOption?: (option: FieldOption | null) => string | undefined;
  yupString?: (base: yup.StringSchema) => yup.StringSchema;
  yupNumber?: (base: yup.NumberSchema) => yup.NumberSchema;
  derivedFrom?: string;
  deriveValue?: (sourceValue: string) => string;
  defaultValue?: string | boolean;
  disabledUnless?: string;
}

export interface CrossFieldRule {
  name: string;
  message: string;
  path: string;
  test: (values: Record<string, unknown>) => boolean;
}

const TEXT_LIKE: FieldSchema["type"][] = [
  "text",
  "email",
  "tel",
  "textarea",
  "select",
];

export function buildYupSchema(
  fields: FieldSchema[],
  crossFieldRules: CrossFieldRule[] = [],
) {
  const shape: Record<string, yup.AnySchema> = {};
  const requiredWhenRules: CrossFieldRule[] = [];

  for (const field of fields) {
    if (field.requiredWhen) {
      requiredWhenRules.push({
        name: `${field.name}-required-when`,
        message: `${field.label} es requerido`,
        path: field.name,
        test: (values) =>
          !field.requiredWhen!(values) || hasFieldValue(values[field.name]),
      });
    }

    if (field.type === "custom") {
      shape[field.name] = yup.mixed().optional();
      continue;
    }

    if (field.type === "checkbox") {
      shape[field.name] = yup.boolean().default(false);
      continue;
    }

    if (field.type === "number") {
      let numberSchema = yup
        .number()
        .transform((value, original) =>
          typeof original === "string" && original.trim() === ""
            ? undefined
            : value,
        )
        .typeError(`${field.label} debe ser un número`);
      if (field.yupNumber) numberSchema = field.yupNumber(numberSchema);
      shape[field.name] = field.required
        ? numberSchema.required(`${field.label} es requerido`)
        : numberSchema.optional();
      continue;
    }

    let stringSchema = yup.string();
    if (field.type === "email") {
      stringSchema = stringSchema.email("Correo inválido");
    }
    if (field.yupString) stringSchema = field.yupString(stringSchema);

    shape[field.name] = field.required
      ? stringSchema.required(`${field.label} es requerido`)
      : stringSchema.optional();
  }

  let schema = yup.object(shape);
  for (const rule of [...requiredWhenRules, ...crossFieldRules]) {
    schema = schema.test(rule.name, rule.message, (values) =>
      rule.test(values as Record<string, unknown>)
        ? true
        : new yup.ValidationError(rule.message, values, rule.path),
    ) as typeof schema;
  }
  return schema;
}

function hasFieldValue(v: unknown): boolean {
  return v !== undefined && v !== null && v !== "";
}

export function buildDefaultValues(
  fields: FieldSchema[],
): Record<string, string | boolean> {
  return Object.fromEntries(
    fields.map((f) => [
      f.name,
      f.defaultValue ?? (f.type === "checkbox" ? false : ""),
    ]),
  );
}

export { TEXT_LIKE as TEXT_LIKE_FIELD_TYPES };
