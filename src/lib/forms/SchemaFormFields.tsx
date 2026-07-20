"use client";

import { useEffect, useRef, useState } from "react";

import { ChevronDown } from "lucide-react";

import { FormInput } from "@/components/ui/FormInput";

import type { FieldOption, FieldSchema } from "@/lib/forms/fieldSchema";
import type {
  Control,
  FieldErrors,
  FieldValues,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";

interface SchemaFormFieldsProps<T extends FieldValues> {
  fields: FieldSchema[];
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  /**
   * Required when a field declares `dependsOn` (parent→child selects),
   * `derivedFrom` (e.g. slug), `disabledUnless`, `requiredWhen`, or
   * `showWhen` — the engine watches live values to resolve those.
   */
  watch?: UseFormWatch<T>;
  /** Required by `type: "custom"` fields that need imperative value control. */
  setValue?: UseFormSetValue<T>;
  /** Required by `type: "custom"` fields built around RHF's `Controller`. */
  control?: Control<T>;
}

/**
 * Renders a FieldSchema[] as a column of inputs wired to react-hook-form's
 * register/errors — the render half of the JSON-driven form (see
 * fieldSchema.ts for the validation half). Every schema-driven form (create
 * OR edit) renders through this one component, so there is exactly one place
 * that turns "a field declaration" into markup.
 *
 * Supports text-like inputs (via FormInput), textarea, checkbox, and select —
 * where select options may be static, loaded from an async function (e.g. an
 * endpoint call), or resolved from a parent field's value (`dependsOn` +
 * `optionsForParent`) for cascading selects.
 */
export function SchemaFormFields<T extends FieldValues>({
  fields,
  register,
  errors,
  watch,
  setValue,
  control,
}: SchemaFormFieldsProps<T>) {
  // `field.name` is a runtime string (from the JSON schema), not a literal
  // keyof T — react-hook-form's own types can't express "dynamic field list"
  // statically, so this one indexed read is the single, scoped cast point.
  const errorMap = errors as Record<string, { message?: string } | undefined>;
  const liveValues = watch ? (watch() as unknown as Record<string, unknown>) : {};

  return (
    <div className="space-y-4">
      {fields.map((field) => {
        if (field.showWhen && !field.showWhen(liveValues)) return null;

        const error = errorMap[field.name]?.message;

        if (field.type === "custom") {
          if (!field.render || !watch || !setValue || !control) return null;
          return (
            <div key={field.name}>
              {field.render({
                register: register as never,
                watch: watch as never,
                setValue: setValue as never,
                control: control as never,
              })}
            </div>
          );
        }

        if (field.type === "checkbox") {
          return (
            <label
              key={field.name}
              className="flex min-h-[44px] cursor-pointer items-center gap-2"
            >
              <input
                type="checkbox"
                {...register(field.name as never)}
                className="h-4 w-4 rounded border-border focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              />
              <span className="text-sm text-foreground">
                {field.checkboxLabel ?? field.label}
              </span>
            </label>
          );
        }

        if (field.type === "textarea") {
          return (
            <label key={field.name} className="block">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {field.label}
                {!field.required && (
                  <span className="ml-1 font-medium normal-case text-muted-foreground/60">
                    (opcional)
                  </span>
                )}
              </span>
              <textarea
                rows={field.rows ?? 3}
                placeholder={field.placeholder}
                {...register(field.name as never)}
                className="block w-full rounded-2xl border-2 border-border bg-background px-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 transition-colors focus:border-accent focus:outline-none"
              />
              {error && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {error}
                </p>
              )}
            </label>
          );
        }

        if (field.type === "select") {
          return (
            <SchemaSelectField
              key={field.name}
              field={field}
              register={register}
              error={error}
              watch={watch}
            />
          );
        }

        if (field.derivedFrom && field.deriveValue && watch) {
          return (
            <SchemaDerivedField
              key={field.name}
              field={field}
              register={register}
              error={error}
              watch={watch}
            />
          );
        }

        const disabled = Boolean(
          field.disabledUnless && watch && !watch(field.disabledUnless as never),
        );

        return (
          <FormInput
            key={field.name}
            label={field.label}
            type={field.type}
            icon={field.icon}
            placeholder={field.placeholder}
            optional={!field.required}
            hint={field.hint}
            error={error}
            disabled={disabled}
            {...register(field.name as never)}
          />
        );
      })}
    </div>
  );
}

interface SchemaSelectFieldProps<T extends FieldValues> {
  field: FieldSchema;
  register: UseFormRegister<T>;
  error?: string;
  watch?: UseFormWatch<T>;
}

/**
 * One `select` field. Resolves its options once (static array or async
 * loader), or re-resolves them whenever `dependsOn`'s value changes (cascading
 * selects) — e.g. a subcategory list scoped to the chosen category.
 */
function SchemaSelectField<T extends FieldValues>({
  field,
  register,
  error,
  watch,
}: SchemaSelectFieldProps<T>) {
  const [options, setOptions] = useState<FieldOption[]>(
    Array.isArray(field.options) ? field.options : [],
  );
  const [loading, setLoading] = useState(false);

  const selectRef = useRef<HTMLSelectElement | null>(null);
  const parentValue = field.dependsOn && watch ? watch(field.dependsOn as never) : undefined;
  const ownValue = watch ? (watch(field.name as never) as unknown as string) : undefined;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (field.dependsOn && field.optionsForParent) {
        if (!parentValue) {
          setOptions([]);
          return;
        }
        setLoading(true);
        try {
          const resolved = await field.optionsForParent(
            parentValue as unknown as string,
          );
          if (!cancelled) setOptions(resolved);
        } finally {
          if (!cancelled) setLoading(false);
        }
        return;
      }

      if (typeof field.options === "function") {
        setLoading(true);
        try {
          const resolved = await field.options();
          if (!cancelled) setOptions(resolved);
        } finally {
          if (!cancelled) setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
    // parentValue drives re-resolution for dependent selects; refreshKey lets
    // a caller force a reload (e.g. after creating a new option inline).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentValue, field.dependsOn, field.refreshKey]);

  const { ref: registerRef, ...registerRest } = register(field.name as never);

  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {field.label}
          {!field.required && (
            <span className="ml-1 font-medium normal-case text-muted-foreground/60">
              (opcional)
            </span>
          )}
        </span>
        {field.onCreateNew && (
          <button
            type="button"
            onClick={field.onCreateNew}
            className="shrink-0 text-[11px] font-semibold normal-case text-accent hover:underline"
          >
            {field.createNewLabel ?? "+ Crear nuevo"}
          </button>
        )}
      </span>
      <div className="relative">
        <select
          {...registerRest}
          ref={(el) => {
            registerRef(el);
            selectRef.current = el;
          }}
          disabled={field.dependsOn ? !parentValue : loading}
          className="block w-full appearance-none rounded-2xl border-2 border-border bg-background py-3 pl-4 pr-10 text-sm font-medium text-foreground focus:border-accent focus:outline-none disabled:opacity-50"
        >
          <option value="">{field.emptyOptionLabel ?? "Selecciona..."}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
      </div>
      {(() => {
        if (!field.hintForOption) return null;
        const selectedOption = options.find((opt) => opt.value === ownValue) ?? null;
        const hint = field.hintForOption(selectedOption);
        return hint ? (
          <p className="mt-1.5 text-[11px] text-muted-foreground">{hint}</p>
        ) : null;
      })()}
      {error && (
        <p className="mt-1 text-xs font-medium text-red-600">{error}</p>
      )}
    </label>
  );
}

interface SchemaDerivedFieldProps<T extends FieldValues> {
  field: FieldSchema;
  register: UseFormRegister<T>;
  error?: string;
  watch: UseFormWatch<T>;
}

/**
 * A field whose value defaults to `deriveValue(sourceField)` until the user
 * types into it directly (e.g. slug auto-derived from name). Shown as the
 * live-computed value while the user hasn't touched the field, exactly like
 * the hand-rolled `slug || deriveSlug(name)` pattern this replaces — but
 * declared once as data instead of re-implemented per form.
 */
function SchemaDerivedField<T extends FieldValues>({
  field,
  register,
  error,
  watch,
}: SchemaDerivedFieldProps<T>) {
  const ownValue = watch(field.name as never) as unknown as string;
  const sourceValue = watch(field.derivedFrom as never) as unknown as string;
  const displayValue = ownValue || field.deriveValue!(sourceValue ?? "");

  const { onChange, ...registerRest } = register(field.name as never);

  return (
    <FormInput
      label={field.label}
      icon={field.icon}
      placeholder={field.placeholder}
      optional={!field.required}
      hint={field.hint}
      error={error}
      value={displayValue}
      onChange={onChange}
      {...registerRest}
    />
  );
}
