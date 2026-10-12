"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Info,
  PackagePlus,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";

import { FormSheet } from "@/components/ui/FormSheet";
import { btnPrimaryFlex, btnSecondary } from "@/components/ui/buttonClasses";
import { apiFetch } from "@/services/apiFetch";

type EditableVariant = {
  clientId: string;
  id: string | null;
  size: string;
  color: string;
  sku: string;
  price: string;
  stock: string;
  imageUrl: string | null;
  active: boolean;
};

type CommerceData = {
  product?: {
    has_variants?: boolean;
    size_guide?: string | null;
    care_instructions?: string | null;
    material_info?: string | null;
  } | null;
  variants?: Array<{
    id: string;
    selection_key: string;
    sku: string | null;
    price: number | string;
    stock: number;
    image_url: string | null;
    is_active: boolean;
  }>;
  reviews?: Array<{ rating: number; status: string }>;
};

type Section = "variants" | "details" | "reviews";
type VariantEditor = { mode: "new" | "edit"; variant: EditableVariant };

export type ProductCommerceDetailsHandle = { save: () => Promise<void> };

interface ProductCommerceDetailsProps {
  productId: string;
  basePrice: number;
  onVariantModeChange?: (enabled: boolean) => void;
}

function makeClientId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

function makeVariant(basePrice: number): EditableVariant {
  return {
    clientId: makeClientId(),
    id: null,
    size: "",
    color: "",
    sku: "",
    price: Number.isFinite(basePrice) ? String(basePrice) : "0",
    stock: "0",
    imageUrl: null,
    active: true,
  };
}

function parseSelectionKey(selectionKey: string) {
  const result = { size: "", color: "" };
  for (const rawPart of selectionKey.split("/")) {
    const part = rawPart.trim();
    const separator = part.indexOf(":");
    if (separator < 0) continue;
    const name = part.slice(0, separator).trim().toLocaleLowerCase("es-MX");
    const value = part.slice(separator + 1).trim();
    if (name === "talla") result.size = value;
    if (name === "color") result.color = value;
  }
  return result;
}

function variantLabel(variant: EditableVariant) {
  return [variant.size && `Talla ${variant.size}`, variant.color]
    .filter(Boolean)
    .join(" · ") || "Nueva variante";
}

function validateVariant(variant: EditableVariant) {
  if (!variant.size.trim() && !variant.color.trim()) {
    return "Indica una talla, un color o ambos.";
  }
  const price = Number(variant.price);
  if (!Number.isFinite(price) || price < 0) return "Captura un precio válido.";
  const stock = Number(variant.stock);
  if (!Number.isInteger(stock) || stock < 0) return "Las existencias deben ser un número entero igual o mayor a cero.";
  return null;
}

export const ProductCommerceDetails = forwardRef<ProductCommerceDetailsHandle, ProductCommerceDetailsProps>(
  function ProductCommerceDetails({ productId, basePrice, onVariantModeChange }, ref) {
    const [openSections, setOpenSections] = useState<Record<Section, boolean>>({
      variants: true,
      details: false,
      reviews: false,
    });
    const [loaded, setLoaded] = useState(false);
    const [variantsEnabled, setVariantsEnabledState] = useState(false);
    const [variants, setVariants] = useState<EditableVariant[]>([]);
    const [sizeGuide, setSizeGuide] = useState("");
    const [materialInfo, setMaterialInfo] = useState("");
    const [careInstructions, setCareInstructions] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [reviewCount, setReviewCount] = useState(0);
    const [rating, setRating] = useState<number | null>(null);
    const [variantEditor, setVariantEditor] = useState<VariantEditor | null>(null);
    const [variantEditorError, setVariantEditorError] = useState<string | null>(null);

    const toggleSection = (section: Section) => {
      setOpenSections((current) => ({ ...current, [section]: !current[section] }));
    };

    function setVariantsEnabled(enabled: boolean) {
      setVariantsEnabledState(enabled);
      onVariantModeChange?.(enabled);
      setOpenSections((current) => ({ ...current, variants: true }));
    }

    useEffect(() => {
      let cancelled = false;
      void (async () => {
        try {
          const data = await apiFetch(`/api/products/${encodeURIComponent(productId)}/commerce-details`) as CommerceData;
          if (cancelled) return;
          const enabled = Boolean(data.product?.has_variants);
          setVariantsEnabledState(enabled);
          onVariantModeChange?.(enabled);
          setVariants((data.variants ?? []).map((variant) => {
            const selection = parseSelectionKey(variant.selection_key);
            return {
              clientId: variant.id,
              id: variant.id,
              size: selection.size,
              color: selection.color,
              sku: variant.sku ?? "",
              price: String(variant.price),
              stock: String(variant.stock),
              imageUrl: variant.image_url,
              active: variant.is_active,
            };
          }));
          setSizeGuide(data.product?.size_guide ?? "");
          setMaterialInfo(data.product?.material_info ?? "");
          setCareInstructions(data.product?.care_instructions ?? "");
          const reviews = data.reviews ?? [];
          setReviewCount(reviews.length);
          setRating(reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : null);
        } catch (caught) {
          if (!cancelled) setError(caught instanceof Error ? caught.message : "No se pudo cargar la configuración del producto.");
        } finally {
          if (!cancelled) setLoaded(true);
        }
      })();
      return () => { cancelled = true; };
    }, [onVariantModeChange, productId]);

    const activeVariants = useMemo(() => variants.filter((variant) => variant.active), [variants]);
    const totalStock = useMemo(
      () => activeVariants.reduce((sum, variant) => sum + Math.max(0, Number(variant.stock) || 0), 0),
      [activeVariants],
    );
    const minimumPrice = useMemo(() => {
      const prices = activeVariants.map((variant) => Number(variant.price)).filter((value) => Number.isFinite(value));
      return prices.length ? Math.min(...prices) : null;
    }, [activeVariants]);
    const hasSizes = variants.some((variant) => variant.size.trim());

    function openNewVariant() {
      setVariantEditorError(null);
      setVariantEditor({ mode: "new", variant: makeVariant(basePrice) });
    }

    function openEditVariant(variant: EditableVariant) {
      setVariantEditorError(null);
      setVariantEditor({ mode: "edit", variant: { ...variant } });
    }

    function saveVariantFromSheet() {
      if (!variantEditor) return;
      const message = validateVariant(variantEditor.variant);
      if (message) {
        setVariantEditorError(message);
        return;
      }
      const normalizedKey = `${variantEditor.variant.size.trim().toLocaleLowerCase("es-MX")}|${variantEditor.variant.color.trim().toLocaleLowerCase("es-MX")}`;
      const duplicate = variants.some((variant) => variant.clientId !== variantEditor.variant.clientId && `${variant.size.trim().toLocaleLowerCase("es-MX")}|${variant.color.trim().toLocaleLowerCase("es-MX")}` === normalizedKey);
      if (duplicate) {
        setVariantEditorError("Esa combinación de talla y color ya existe.");
        return;
      }
      setVariants((current) => variantEditor.mode === "new"
        ? [...current, variantEditor.variant]
        : current.map((variant) => variant.clientId === variantEditor.variant.clientId ? variantEditor.variant : variant));
      setVariantEditor(null);
    }

    function removeVariant(clientId: string) {
      setVariants((current) => current.filter((variant) => variant.clientId !== clientId));
    }

    function moveVariant(clientId: string, direction: -1 | 1) {
      setVariants((current) => {
        const index = current.findIndex((variant) => variant.clientId === clientId);
        const nextIndex = index + direction;
        if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
        const next = [...current];
        [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
        return next;
      });
    }

    async function save() {
      if (!loaded) return;
      setError(null);
      if (variantsEnabled) {
        if (variants.length === 0) {
          setOpenSections((current) => ({ ...current, variants: true }));
          setError("Agrega al menos una variante.");
          throw new Error("Agrega al menos una variante.");
        }
        const keys = new Set<string>();
        for (const variant of variants) {
          const validationError = validateVariant(variant);
          if (validationError) {
            setOpenSections((current) => ({ ...current, variants: true }));
            setError(validationError);
            throw new Error(validationError);
          }
          const key = `${variant.size.trim().toLocaleLowerCase("es-MX")}|${variant.color.trim().toLocaleLowerCase("es-MX")}`;
          if (keys.has(key)) {
            setError("No puedes repetir la misma combinación de talla y color.");
            throw new Error("No puedes repetir la misma combinación de talla y color.");
          }
          keys.add(key);
        }
        if (!activeVariants.length) {
          setError("Deja al menos una variante visible.");
          throw new Error("Deja al menos una variante visible.");
        }
      }

      try {
        await apiFetch(`/api/products/${encodeURIComponent(productId)}/commerce-details`, {
          method: "PATCH",
          body: JSON.stringify({
            has_variants: variantsEnabled,
            size_guide: hasSizes ? sizeGuide : "",
            material_info: materialInfo,
            care_instructions: careInstructions,
            variants: variantsEnabled ? variants.map((variant) => ({
              id: variant.id,
              size: variant.size,
              color: variant.color,
              sku: variant.sku,
              price: Number(variant.price),
              stock: Number(variant.stock),
              image_url: variant.imageUrl,
              is_active: variant.active,
            })) : [],
          }),
        });
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "No se pudo guardar la configuración del producto.";
        setError(message);
        throw new Error(message);
      }
    }

    useImperativeHandle(ref, () => ({ save }), [loaded, variantsEnabled, variants, sizeGuide, materialInfo, careInstructions, hasSizes, activeVariants.length]);

    const variantSummary = variantsEnabled
      ? `${activeVariants.length} ${activeVariants.length === 1 ? "variante" : "variantes"} · ${totalStock} ${totalStock === 1 ? "pieza" : "piezas"}${minimumPrice === null ? "" : ` · desde $${minimumPrice.toFixed(2)}`}`
      : "Precio y stock generales";
    const detailCount = [materialInfo.trim(), careInstructions.trim(), hasSizes && sizeGuide.trim()].filter(Boolean).length;

    return (
      <div className="space-y-3">
        <AccordionSection title="Precio, variantes y stock" summary={variantSummary} icon={<CircleDollarSign className="h-5 w-5" />} open={openSections.variants} onToggle={() => toggleSection("variants")}>
          <div className="grid gap-3 sm:grid-cols-2">
            <ModeCard selected={!variantsEnabled} title="Producto simple" description="Un precio y una existencia general." onClick={() => setVariantsEnabled(false)} />
            <ModeCard selected={variantsEnabled} title="Con talla o color" description="Precio y stock por cada combinación." onClick={() => setVariantsEnabled(true)} />
          </div>

          {!variantsEnabled ? (
            <div className="mt-4 flex gap-3 rounded-xl bg-border-soft/40 p-4 text-sm text-muted-foreground"><Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" /><p>Este producto usará el precio y las existencias de Información general.</p></div>
          ) : (
            <div className="mt-5">
              <div className="flex items-end justify-between gap-3"><div><p className="text-sm font-bold text-foreground">Combinaciones</p><p className="mt-0.5 text-xs leading-5 text-muted-foreground">Agrega sólo las tallas y colores que realmente vendes.</p></div><button type="button" onClick={openNewVariant} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-accent px-3 text-sm font-bold text-white transition-opacity hover:opacity-90"><PackagePlus className="h-4 w-4" />Agregar</button></div>
              {variants.length ? <div className="mt-4 space-y-2">{variants.map((variant, index) => <VariantRow key={variant.clientId} variant={variant} index={index} total={variants.length} onEdit={() => openEditVariant(variant)} onRemove={() => removeVariant(variant.clientId)} onMove={(direction) => moveVariant(variant.clientId, direction)} />)}</div> : <button type="button" onClick={openNewVariant} className="mt-4 flex min-h-28 w-full flex-col items-center justify-center rounded-xl border border-dashed border-border px-4 text-center"><PackagePlus className="h-5 w-5 text-accent" /><span className="mt-2 text-sm font-bold text-foreground">Agrega tu primera combinación</span><span className="mt-1 text-xs text-muted-foreground">Ej. talla M · negro · $399 · 3 piezas</span></button>}
            </div>
          )}
        </AccordionSection>

        <AccordionSection title="Detalles para el cliente" summary={detailCount ? `${detailCount} ${detailCount === 1 ? "dato configurado" : "datos configurados"}` : "Opcional"} icon={<Info className="h-5 w-5" />} open={openSections.details} onToggle={() => toggleSection("details")}>
          <div className="grid gap-4 md:grid-cols-2"><Field label="Materiales (opcional)" value={materialInfo} onChange={setMaterialInfo} placeholder="Ej. 55% lino, 45% algodón" /><Field label="Cuidados (opcional)" value={careInstructions} onChange={setCareInstructions} placeholder="Ej. Lavar con agua fría" />{hasSizes ? <Field className="md:col-span-2" label="Referencia de medidas (opcional)" value={sizeGuide} onChange={setSizeGuide} placeholder="Ej. S: busto 86 cm · M: busto 92 cm" /> : null}</div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">Sólo mostraremos en el sitio los datos que completes.</p>
        </AccordionSection>

        <AccordionSection title="Reseñas" summary={reviewCount ? `${rating?.toFixed(1) ?? "—"} · ${reviewCount} ${reviewCount === 1 ? "reseña" : "reseñas"}` : "Sin reseñas todavía"} icon={<Star className="h-5 w-5" />} open={openSections.reviews} onToggle={() => toggleSection("reviews")}>
          <div className="rounded-xl bg-border-soft/40 p-4"><p className="font-bold text-foreground">Reseñas verificadas</p><p className="mt-1 text-sm leading-5 text-muted-foreground">Las opiniones sólo pueden enviarse desde una compra pagada y entregada.</p></div>
        </AccordionSection>

        {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p> : null}

        <FormSheet isOpen={variantEditor !== null} onClose={() => setVariantEditor(null)} title={variantEditor?.mode === "edit" ? "Editar variante" : "Agregar variante"} description="Define una combinación con su precio y existencias." icon={PackagePlus} footer={<div className="flex flex-col gap-2 sm:flex-row-reverse"><button type="button" onClick={saveVariantFromSheet} className={`${btnPrimaryFlex} w-full sm:w-auto`}>{variantEditor?.mode === "edit" ? "Guardar cambios" : "Agregar variante"}</button><button type="button" onClick={() => setVariantEditor(null)} className={`${btnSecondary} w-full sm:w-auto`}>Cancelar</button></div>}>
          {variantEditor ? <VariantEditorFields variant={variantEditor.variant} error={variantEditorError} onChange={(patch) => setVariantEditor((current) => current ? { ...current, variant: { ...current.variant, ...patch } } : current)} /> : null}
        </FormSheet>
      </div>
    );
  },
);

function AccordionSection({ title, summary, icon, open, onToggle, children }: { title: string; summary: string; icon: ReactNode; open: boolean; onToggle: () => void; children: ReactNode }) {
  return <section className="overflow-hidden rounded-xl border border-border bg-surface"><button type="button" onClick={onToggle} aria-expanded={open} className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-border-soft/30 sm:px-5"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${open ? "bg-accent text-white" : "bg-accent/10 text-accent"}`}>{icon}</span><span className="min-w-0 flex-1"><span className="block font-bold text-foreground">{title}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{summary}</span></span><ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} /></button>{open ? <div className="border-t border-border px-4 py-5 sm:px-5">{children}</div> : null}</section>;
}

function ModeCard({ selected, title, description, onClick }: { selected: boolean; title: string; description: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} aria-pressed={selected} className={`min-h-20 rounded-xl border p-3 text-left transition-colors ${selected ? "border-accent bg-accent/5 ring-1 ring-accent" : "border-border bg-surface hover:border-muted-foreground/40"}`}><span className="block font-bold text-foreground">{title}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span></button>;
}

function VariantRow({ variant, index, total, onEdit, onRemove, onMove }: { variant: EditableVariant; index: number; total: number; onEdit: () => void; onRemove: () => void; onMove: (direction: -1 | 1) => void }) {
  const stock = Math.max(0, Number(variant.stock) || 0);
  return <article className="flex min-h-[4.5rem] items-center gap-2 rounded-xl border border-border bg-surface-raised px-3 py-2"><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-foreground">{variantLabel(variant)}</p><p className={`mt-0.5 text-xs ${variant.active && stock > 0 ? "text-emerald-700" : "text-muted-foreground"}`}>{variant.active ? `${stock} ${stock === 1 ? "pieza" : "piezas"} · $${(Number(variant.price) || 0).toFixed(2)}` : "Oculta en el sitio"}</p></div><div className="flex shrink-0 items-center"><button type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label="Mover variante arriba" className="flex h-11 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-border-soft disabled:opacity-25"><ChevronUp className="h-4 w-4" /></button><button type="button" onClick={() => onMove(1)} disabled={index === total - 1} aria-label="Mover variante abajo" className="flex h-11 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-border-soft disabled:opacity-25"><ChevronDown className="h-4 w-4" /></button><button type="button" onClick={onEdit} className="flex h-11 w-9 items-center justify-center rounded-lg text-accent hover:bg-accent/10" aria-label={`Editar ${variantLabel(variant)}`}><Pencil className="h-4 w-4" /></button><button type="button" onClick={onRemove} className="flex h-11 w-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-50" aria-label={`Quitar ${variantLabel(variant)}`}><Trash2 className="h-4 w-4" /></button></div></article>;
}

function VariantEditorFields({ variant, error, onChange }: { variant: EditableVariant; error: string | null; onChange: (patch: Partial<EditableVariant>) => void }) {
  return <div className="space-y-4"><p className="rounded-xl bg-accent/5 px-3 py-2.5 text-sm text-accent">Cada fila es una combinación real. Ejemplo: M · negro · $399 · 3 piezas.</p><div className="grid gap-4 sm:grid-cols-2"><Field label="Talla" value={variant.size} onChange={(value) => onChange({ size: value })} placeholder="Ej. M" autoFocus /><Field label="Color" value={variant.color} onChange={(value) => onChange({ color: value })} placeholder="Ej. Negro" /><Field label="Precio" value={variant.price} onChange={(value) => onChange({ price: value })} placeholder="0.00" inputMode="decimal" /><Field label="Existencias" value={variant.stock} onChange={(value) => onChange({ stock: value })} placeholder="0" inputMode="numeric" /><Field className="sm:col-span-2" label="SKU (opcional)" value={variant.sku} onChange={(value) => onChange({ sku: value })} placeholder="Ej. BLA-NEG-M" /></div><label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-border px-3 text-sm font-semibold text-foreground"><input type="checkbox" checked={variant.active} onChange={(event) => onChange({ active: event.target.checked })} className="h-4 w-4 rounded border-border" />Visible en el sitio</label>{error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p> : null}</div>;
}

function Field({ label, value, onChange, placeholder, inputMode, className = "", autoFocus = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; inputMode?: "numeric" | "decimal"; className?: string; autoFocus?: boolean }) {
  return <label className={`block text-sm font-semibold text-foreground ${className}`}>{label}<input autoFocus={autoFocus} value={value} inputMode={inputMode} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="input-form mt-1.5 min-h-11 w-full rounded-xl border px-3 py-2.5 text-base font-normal text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" /></label>;
}
