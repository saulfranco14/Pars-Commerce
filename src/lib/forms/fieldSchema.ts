import * as yup from "yup";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type {
  Control,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";

/** Context passed to `FieldSchema.render` for `type: "custom"` fields. */
export interface CustomFieldRenderContext {
  register: UseFormRegister<Record<string, unknown>>;
  watch: UseFormWatch<Record<string, unknown>>;
  setValue: UseFormSetValue<Record<string, unknown>>;
  control: Control<Record<string, unknown>>;
  disabled?: boolean;
}

/** One selectable option for a `select` field. */
export interface FieldOption {
  value: string;
  label: string;
}

/**
 * Declarative field definition — one JSON object per form field. A form is
 * just `FieldSchema[]`. This is the "JSON Schema" layer requested: define the
 * registration fields once as data, and both the Yup validation object AND
 * the rendered input come out of that same declaration. Adding a field to a
 * form means adding one entry here — not touching a JSX file, a validation
 * file, and a service file separately.
 *
 * Still backed by Yup + React Hook Form under the hood (the stack every other
 * dashboard form already uses — see useNewCustomerForm.ts) so this composes
 * with the existing resolver/register pattern instead of replacing it.
 */
export interface FieldSchema {
  /** react-hook-form field name; also the object key sent to the API. */
  name: string;
  /** FormInput/label text (rendered as the uppercase eyebrow). Unused for `type: "custom"`. */
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
  /**
   * Conditional required, evaluated against the form's current values (e.g.
   * `table_capacity` required only when `kind === "table"`). Takes
   * precedence over the static `required` when present. Folds into the same
   * per-field Yup schema via `.test()` so it participates in `isValid`.
   */
  requiredWhen?: (values: Record<string, unknown>) => boolean;
  /**
   * Conditionally render this field at all, evaluated against the form's
   * current values (e.g. `preset_amount` only shown when `kind ===
   * "payment"`). Omit to always show. A hidden field still validates if
   * `required`/`requiredWhen` says so — pair with a matching condition to
   * avoid validating a field the user can't see.
   */
  showWhen?: (values: Record<string, unknown>) => boolean;
  /**
   * `type: "custom"` — delegates rendering entirely to this function (e.g. a
   * radio-card picker like QrKindSelector that doesn't fit text/select/
   * checkbox). Receives the same register/watch/setValue the rest of the
   * engine uses, plus RHF's `control` for fields that need a `Controller`.
   */
  render?: (ctx: CustomFieldRenderContext) => ReactNode;
  /** Shown as "(opcional)" next to the label when false. */
  hint?: string;
  /** `type: "textarea"` row count. */
  rows?: number;
  /** `type: "checkbox"` label shown next to the box (defaults to `label`). */
  checkboxLabel?: string;

  /**
   * `type: "select"` options. Three shapes, in increasing order of dynamism:
   *   - a static array — the common case (e.g. unit: pza/kg/hora).
   *   - an async loader (e.g. `() => fetchSubcatalogs(tenantId)`) — for
   *     options that come from an endpoint (a select fed by an API call).
   *   - a function of another field's current value — for parent→child
   *     dependent selects (e.g. category → subcategory). Not used by any
   *     form yet, but the shape is here so a future field can declare
   *     `dependsOn: "category"` without changing the engine.
   */
  options?: FieldOption[] | (() => Promise<FieldOption[]>);
  /** Name of the field this select's options depend on (parent→child selects). */
  dependsOn?: string;
  /** Resolve this select's options from the current value of `dependsOn`. */
  optionsForParent?: (parentValue: string) => Promise<FieldOption[]>;
  /** Placeholder row shown when nothing is selected (default "Selecciona..."). */
  emptyOptionLabel?: string;
  /**
   * `type: "select"` — when set, a small link/legend renders below the
   * select ("+ Crear subcatálogo"). Clicking it doesn't touch the field's
   * value; it calls this callback so the page can open its own create-record
   * sheet and, once created, set the field's value and refresh `options`
   * itself. Keeps the generic engine decoupled from any specific entity.
   */
  onCreateNew?: () => void;
  /** Label for the `onCreateNew` link (default "+ Crear nuevo"). */
  createNewLabel?: string;
  /**
   * Bump this (e.g. a counter) to force a `select` field to re-run its async
   * `options` loader — used after `onCreateNew` creates a new record so the
   * dropdown picks it up without a full page reload.
   */
  refreshKey?: number;

  /**
   * Extra Yup refinements beyond the base type/required (e.g. min/max/matches).
   * Typed per field `type` so string-only methods (trim, matches...) are
   * available directly for text/email/tel/textarea/select fields; number
   * fields get the number-schema refiner instead.
   */
  yupString?: (base: yup.StringSchema) => yup.StringSchema;
  yupNumber?: (base: yup.NumberSchema) => yup.NumberSchema;

  /**
   * When set, this field's value defaults to `deriveValue(otherFieldValue)`
   * until the user edits it directly (e.g. slug auto-derived from name).
   * `derivedFrom` names the source field; the page still owns the actual
   * derivation function via `deriveValue` — the engine only wires the watch.
   */
  derivedFrom?: string;
  deriveValue?: (sourceValue: string) => string;

  /** Initial value RHF starts with (default: "" for most types, false for checkbox). */
  defaultValue?: string | boolean;

  /**
   * Disable this field based on another field's live value (e.g. "stock"
   * only makes sense while "track_stock" is checked). Named after the field
   * to watch; `disabledWhen` returns true when this field should be disabled.
   */
  disabledUnless?: string;
}

/**
 * A validation rule spanning more than one field (e.g. "both wholesale
 * fields must be set together, or neither"). Declared alongside `fields` and
 * folded into the same yup.object() via `.test()`, so it participates in the
 * same isValid/errors the rest of the form already tracks — no separate
 * manual-if-statements block in the submit handler.
 */
export interface CrossFieldRule {
  /** Unique name for this test (yup requirement, also shows up in errors). */
  name: string;
  message: string;
  /** Which field the error attaches to (where it renders inline). */
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

/**
 * Build a yup.object() validation schema from a field list, optionally
 * folding in cross-field rules (e.g. "both wholesale fields or neither") via
 * `.test()` so they validate and gate `isValid` exactly like every other
 * field — no manual if-chain in the submit handler.
 */
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
      // Rendering is entirely delegated; whatever value it sets on
      // `field.name` is passed through unvalidated by the base type check —
      // only requiredWhen/cross-field rules apply, same as everything else.
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
        .typeError(`${field.label} debe ser un número`);
      if (field.yupNumber) numberSchema = field.yupNumber(numberSchema);
      shape[field.name] = field.required
        ? numberSchema.required(`${field.label} es requerido`)
        : numberSchema.optional();
      continue;
    }

    // text | email | tel | textarea | select
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

/** Default value map so React Hook Form starts controlled. */
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
