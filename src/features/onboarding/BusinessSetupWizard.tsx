"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR, { mutate as mutateGlobal } from "swr";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Camera,
  ClipboardCheck,
  Check,
  ExternalLink,
  Link2,
  Loader2,
  PackageCheck,
  ReceiptText,
  Send,
  Share2,
  ShoppingBag,
  Store,
  Trash2,
  X,
  WalletCards,
} from "lucide-react";

import { TlacoLogo } from "@/components/brand/TlacoLogo";
import { SetupFulfillmentDetails } from "@/features/onboarding/components/SetupFulfillmentDetails";
import { SetupPaymentDetails } from "@/features/onboarding/components/SetupPaymentDetails";
import { deriveSlug } from "@/features/onboarding/helpers/deriveSlug";
import { SETUP_TEST_STEP, resumeSetupStep } from "@/features/onboarding/helpers/setupResume";
import { needsPickupAddress, setupCheckoutProblem } from "@/features/onboarding/helpers/setupCheckoutValidation";
import { newPickupPoint } from "@/features/configuracion/helpers/paymentsAndDeliveryForm";
import { formatMexicanPhoneInput, normalizeMexicanPhone } from "@/lib/phone";
import { uploadProductImage } from "@/lib/supabase/storage";
import { publicSitePath } from "@/lib/publicSitePath";
import { swrFetcher } from "@/lib/swrFetcher";
import { useTenantStore } from "@/stores/useTenantStore";
import { PRODUCTION_APP_URL } from "@/lib/env/appUrl";
import {
  PLAN_PRESENTATION,
  planCapabilities,
} from "@/features/landing/constants/pricing";
import type { BillingPlan } from "@/features/billing/entitlements";
import type { PickupPointDraft } from "@/features/configuracion/interfaces/paymentsAndDelivery";
import type {
  SetupCheckoutSnapshot,
  SetupDeliveryDraft,
  SetupFulfillment,
  SetupPaymentMethod,
  SetupTransferDraft,
} from "@/features/onboarding/interfaces/setupCheckout";

interface SetupProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  cost_price: number;
  stock: number;
  type: "product" | "service";
  track_stock: boolean;
  is_public: boolean;
}

interface EditableItem {
  id: string;
  name: string;
  price: string;
  stock: string;
  type: "product" | "service";
  trackStock: boolean;
  isPublic: boolean;
}

interface PhotoProductDraft {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  price: string;
  stock: string;
}

const STEP_LABELS = [
  "Contacto",
  "Productos",
  "Precio y stock",
  "Cobro",
  "Prueba",
];
const TEST_STAGES = [
  {
    title: "Cliente envía el pedido",
    text: "Productos, cantidades y total llegan juntos.",
    icon: Send,
  },
  {
    title: "El negocio lo recibe",
    text: "Aparece como nuevo y listo para aceptar.",
    icon: ClipboardCheck,
  },
  {
    title: "Tu equipo lo prepara",
    text: "El estado mantiene informado al cliente.",
    icon: PackageCheck,
  },
  {
    title: "Caja registra el pago",
    text: "El pedido queda listo para entregar.",
    icon: WalletCards,
  },
  {
    title: "Venta terminada",
    text: "Ticket, inventario e historial quedan actualizados.",
    icon: CheckCircle2,
  },
];

async function requestJson(url: string, init: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  const payload = await response.json();
  if (!response.ok)
    throw new Error(payload.error ?? "No pudimos guardar este paso");
  return payload;
}

function SetupProgress({ step }: { step: number }) {
  return (
    <div
      className="grid grid-cols-5 gap-1.5"
      aria-label={`Paso ${step + 1} de ${STEP_LABELS.length}`}
    >
      {STEP_LABELS.map((label, index) => (
        <div key={label}>
          <div
            className={`h-1.5 rounded-full ${index <= step ? "bg-accent" : "bg-border"}`}
          />
          <p
            className={`mt-2 hidden text-[11px] font-semibold sm:block ${index === step ? "text-foreground" : "text-muted"}`}
          >
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}

function PhotoProductDrafts({
  drafts,
  onFiles,
  onUpdate,
  onRemove,
}: {
  drafts: PhotoProductDraft[];
  onFiles: (files: FileList | null) => void;
  onUpdate: (
    id: string,
    patch: Partial<Pick<PhotoProductDraft, "name" | "price" | "stock">>,
  ) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <section className="mt-6 rounded-2xl border border-dashed border-accent/45 bg-accent/[0.035] p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Camera className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold">Crear productos desde fotos</h2>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            Selecciona varias imágenes. Tlaco crea borradores para que sólo
            confirmes nombre, precio y stock.
          </p>
        </div>
      </div>
      <label className="mt-4 inline-flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-border bg-white px-4 text-sm font-bold text-foreground hover:bg-border-soft">
        Elegir fotografías
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          onChange={(event) => {
            onFiles(event.target.files);
            event.currentTarget.value = "";
          }}
        />
      </label>
      {drafts.length ? (
        <div className="mt-4 space-y-3">
          {drafts.map((draft) => (
            <article
              id={`photo-draft-${draft.id}`}
              key={draft.id}
              className="grid gap-3 rounded-xl border border-border bg-white p-3 sm:grid-cols-[72px_1fr_112px_100px_44px] sm:items-center"
            >
              <Image
                src={draft.previewUrl}
                alt="Vista previa del producto"
                width={72}
                height={72}
                unoptimized
                className="h-[72px] w-[72px] rounded-lg object-cover"
              />
              <label className="text-xs font-semibold text-muted-foreground">
                Nombre
                <input
                  value={draft.name}
                  onChange={(event) =>
                    onUpdate(draft.id, { name: event.target.value })
                  }
                  className="mt-1 min-h-11 w-full rounded-lg border border-border px-3 text-sm text-foreground"
                  placeholder="Nombre del producto"
                />
              </label>
              <label className="text-xs font-semibold text-muted-foreground">
                Precio
                <input
                  value={draft.price}
                  onChange={(event) =>
                    onUpdate(draft.id, { price: event.target.value })
                  }
                  inputMode="decimal"
                  className="mt-1 min-h-11 w-full rounded-lg border border-border px-3 text-sm text-foreground"
                  placeholder="$0"
                />
              </label>
              <label className="text-xs font-semibold text-muted-foreground">
                Stock
                <input
                  value={draft.stock}
                  onChange={(event) =>
                    onUpdate(draft.id, { stock: event.target.value })
                  }
                  inputMode="numeric"
                  className="mt-1 min-h-11 w-full rounded-lg border border-border px-3 text-sm text-foreground"
                />
              </label>
              <button
                type="button"
                onClick={() => onRemove(draft.id)}
                aria-label={`Quitar ${draft.name || "fotografía"}`}
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function money(value: number) {
  return value === 0 ? "$0" : `$${value.toLocaleString("es-MX")}`;
}

function MembershipWelcomeModal({ onClose }: { onClose: () => void }) {
  const [showPlans, setShowPlans] = useState(false);
  const { data: plans, isLoading } = useSWR<BillingPlan[]>(
    "/api/public/billing-plans",
    swrFetcher,
  );
  const paidPlans = (plans ?? []).filter((plan) => plan.code !== "free");

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="membership-welcome-title"
    >
      <section className="flex max-h-[calc(100dvh-0.75rem)] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[min(760px,calc(100dvh-2.5rem))] sm:rounded-3xl">
        <header className="flex items-start justify-between gap-4 border-b border-border-soft px-5 py-5 sm:px-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
              Tu operación ya está lista
            </p>
            <h2
              id="membership-welcome-title"
              className="mt-2 text-2xl font-bold tracking-tight text-foreground"
            >
              Empieza con Gratis.
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar información de membresías"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
          <p className="text-sm leading-6 text-muted-foreground">
            La membresía no desbloquea tu tienda: tu sitio, catálogo y pedidos
            ya funcionan. Sólo se vuelve útil cuando tu operación necesita más
            capacidad o automatización.
          </p>

          <article className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">
                  Plan inicial
                </p>
                <h3 className="mt-1 text-lg font-bold text-foreground">
                  Gratis · $0 al mes
                </h3>
              </div>
              <CheckCircle2
                className="h-6 w-6 shrink-0 text-emerald-600"
                aria-hidden
              />
            </div>
            <ul className="mt-3 space-y-2 text-sm text-foreground">
              <li className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                Tu sitio, catálogo, clientes y pedidos.
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                Sin tarjeta ni cobro automático.
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                Si cambias de plan, tus datos se conservan.
              </li>
            </ul>
          </article>

          <section className="mt-6">
            <h3 className="text-base font-bold text-foreground">
              ¿Cuándo te ayuda una membresía?
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Cuando elimina trabajo repetido o te da control sobre más
              operación.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {[
                {
                  icon: Store,
                  title: "Más negocios",
                  text: "Coordina sucursales sin separar la información.",
                },
                {
                  icon: ReceiptText,
                  title: "Más atención",
                  text: "Activa mesas o un kiosco para tomar pedidos.",
                },
                {
                  icon: WalletCards,
                  title: "Mejores decisiones",
                  text: "Consulta reportes y automatiza seguimiento.",
                },
              ].map(({ icon: Icon, title, text }) => (
                <article
                  key={title}
                  className="rounded-xl border border-border bg-surface-raised p-3"
                >
                  <Icon className="h-5 w-5 text-accent" aria-hidden />
                  <h4 className="mt-3 text-sm font-bold text-foreground">
                    {title}
                  </h4>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {text}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <button
            type="button"
            onClick={() => setShowPlans((current) => !current)}
            className="mt-6 flex min-h-12 w-full items-center justify-between rounded-xl border border-border bg-white px-4 text-left text-sm font-bold text-foreground"
          >
            <span>
              {showPlans ? "Ocultar comparación" : "Ver qué cambia al crecer"}
            </span>
            <ArrowRight
              className={`h-4 w-4 transition-transform ${showPlans ? "rotate-90" : ""}`}
            />
          </button>
          {showPlans ? (
            <div className="mt-3 space-y-3">
              {isLoading
                ? [0, 1, 2].map((index) => (
                    <div
                      key={index}
                      className="h-28 animate-pulse rounded-2xl border border-border bg-border-soft/45"
                    />
                  ))
                : paidPlans.map((plan) => {
                    const copy = PLAN_PRESENTATION[plan.code];
                    return (
                      <article
                        key={plan.code}
                        className="rounded-2xl border border-border bg-white p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-bold text-foreground">
                              {plan.name}
                            </h4>
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                              {copy.promise}
                            </p>
                          </div>
                          <p className="shrink-0 text-base font-bold text-foreground">
                            {money(plan.amount_mxn)}
                            <span className="text-xs font-medium text-muted-foreground">
                              /mes
                            </span>
                          </p>
                        </div>
                        <p className="mt-3 rounded-lg bg-border-soft/55 px-3 py-2 text-xs font-semibold text-foreground">
                          {copy.fit}
                        </p>
                        <ul className="mt-3 space-y-1.5">
                          {planCapabilities(plan)
                            .slice(0, 2)
                            .map((capability) => (
                              <li
                                key={capability}
                                className="flex gap-2 text-xs leading-5 text-muted-foreground"
                              >
                                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                                {capability}
                              </li>
                            ))}
                        </ul>
                      </article>
                    );
                  })}
            </div>
          ) : null}
        </div>

        <footer className="border-t border-border-soft bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 w-full rounded-xl bg-accent px-4 text-sm font-bold text-white"
          >
            Entrar con Gratis
          </button>
          <p className="mt-2 text-center text-xs leading-5 text-muted-foreground">
            Puedes revisar o activar una membresía después, cuando realmente la
            necesites.
          </p>
        </footer>
      </section>
    </div>
  );
}

export function BusinessSetupWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTenantId = searchParams.get("tenant");
  const memberships = useTenantStore((state) => state.memberships);
  const tenantsLoaded = useTenantStore((state) => state.tenantsLoaded);
  const setActiveTenantId = useTenantStore((state) => state.setActiveTenantId);
  const membership =
    memberships.find((item) => item.tenant_id === requestedTenantId) ??
    memberships[0];
  const tenant = membership?.tenant;
  const tenantId = tenant?.id ?? null;
  const productsKey = tenantId
    ? `/api/products?tenant_id=${encodeURIComponent(tenantId)}`
    : null;
  const {
    data: productsData,
    mutate: mutateProducts,
    isLoading: productsLoading,
  } = useSWR<SetupProduct[]>(productsKey, swrFetcher, { fallbackData: [] });
  const products = useMemo(
    () => (Array.isArray(productsData) ? productsData : []),
    [productsData],
  );
  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [fulfillment, setFulfillment] = useState<SetupFulfillment>("pickup");
  const [orderOwner, setOrderOwner] = useState("owner");
  const [items, setItems] = useState<EditableItem[]>([]);
  const [customItems, setCustomItems] = useState([
    { name: "", price: "", stock: "10" },
    { name: "", price: "", stock: "10" },
    { name: "", price: "", stock: "10" },
  ]);
  const [photoDrafts, setPhotoDrafts] = useState<PhotoProductDraft[]>([]);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(
    null,
  );
  const itemRefs = useRef(new Map<string, HTMLDivElement>());
  const [paymentMethod, setPaymentMethod] = useState<SetupPaymentMethod>("cash");
  const [pickupPoint, setPickupPoint] = useState<PickupPointDraft>(newPickupPoint);
  const [delivery, setDelivery] = useState<SetupDeliveryDraft>({ area: "", fee: "" });
  const [transfer, setTransfer] = useState<SetupTransferDraft>({ bank_name: "", account_holder: "", clabe: "" });
  const { data: checkoutSnapshot } = useSWR<SetupCheckoutSnapshot>(
    tenantId ? `/api/tenants/${encodeURIComponent(tenantId)}/setup-checkout` : null,
    swrFetcher,
    { revalidateOnFocus: false },
  );
  const [testStage, setTestStage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activatedSlug, setActivatedSlug] = useState<string | null>(null);
  const [showMemberships, setShowMemberships] = useState(false);
  const [resumed, setResumed] = useState(false);
  const returningFromLegal = searchParams.get("resume") === "activate";

  // The tenants cache predates this session's saves (the legal flow keeps the dashboard mounted), so resume from a fresh read.
  useEffect(() => {
    if (!tenantId || resumed) return;
    let cancelled = false;
    void mutateGlobal("/api/tenants")
      .then((list) => {
        if (cancelled) return;
        const fresh = (Array.isArray(list) ? list : []).find((item) => item.tenant_id === tenantId)?.tenant;
        const next = resumeSetupStep(fresh?.settings);
        const saved = (fresh?.settings as { onboarding?: { fulfillment?: SetupFulfillment; payment_method?: SetupPaymentMethod } } | null)?.onboarding;
        if (saved?.fulfillment) setFulfillment(saved.fulfillment);
        if (saved?.payment_method) setPaymentMethod(saved.payment_method);
        setStep(next);
        if (next === SETUP_TEST_STEP && returningFromLegal) setTestStage(TEST_STAGES.length - 1);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setResumed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId, resumed, returningFromLegal]);

  // Resuming the wizard shows what the checkout already has instead of empty fields.
  const [prefilled, setPrefilled] = useState(false);
  if (checkoutSnapshot && !prefilled) {
    setPrefilled(true);
    if (checkoutSnapshot.pickupPoint) setPickupPoint(checkoutSnapshot.pickupPoint);
    setDelivery(checkoutSnapshot.delivery);
    setTransfer(checkoutSnapshot.transfer);
  }

  useEffect(() => {
    if (!tenant) return;
    setPhone(formatMexicanPhoneInput(tenant.whatsapp_phone ?? ""));
    setActiveTenantId(tenant.id);
    try {
      localStorage.setItem("tlaco_activeTenantId", tenant.id);
    } catch {
      /* almacenamiento opcional */
    }
  }, [setActiveTenantId, tenant]);

  useEffect(() => {
    if (!products.length) return;
    setItems((current) => {
      const currentById = new Map(current.map((item) => [item.id, item]));
      return products.map(
        (product) =>
          currentById.get(product.id) ?? {
            id: product.id,
            name: product.name,
            price: String(product.price),
            stock: String(product.stock ?? 0),
            type: product.type,
            trackStock: product.track_stock,
            isPublic: product.is_public,
          },
      );
    });
  }, [products]);

  const publicItems = useMemo(
    () => items.filter((item) => item.isPublic),
    [items],
  );
  const originalById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );
  const requiredCount = items.some((item) => item.type === "product") ? 3 : 1;
  const previewItem = publicItems[0] ?? items[0];
  const phoneError =
    phoneTouched && !normalizeMexicanPhone(phone)
      ? "Ingresa un WhatsApp mexicano de 10 dígitos."
      : null;

  if (!tenantsLoaded || !tenant || productsLoading || !resumed) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-accent" />
          <p className="mt-3 text-sm text-muted-foreground">
            Preparando tu negocio…
          </p>
        </div>
      </div>
    );
  }

  function updateItem(id: string, patch: Partial<EditableItem>) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
    if (highlightedItemId === id) setHighlightedItemId(null);
  }

  function focusItem(id: string, field: "row" | "price" = "row") {
    setHighlightedItemId(id);
    requestAnimationFrame(() => {
      const element = itemRefs.current.get(id);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (field === "price")
        element
          ?.querySelector<HTMLInputElement>('input[data-field="price"]')
          ?.focus();
      else
        element
          ?.querySelector<HTMLInputElement>('input[type="checkbox"]')
          ?.focus();
    });
  }

  function addPhotoDrafts(files: FileList | null) {
    if (!files) return;
    const next = Array.from(files)
      .filter((file) =>
        ["image/jpeg", "image/png", "image/webp"].includes(file.type),
      )
      .slice(0, 12)
      .map((file, index) => ({
        id: `${Date.now().toString(36)}-${index}`,
        file,
        previewUrl: URL.createObjectURL(file),
        name: file.name
          .replace(/\.[^.]+$/, "")
          .replace(/[-_]+/g, " ")
          .trim(),
        price: "",
        stock: "10",
      }));
    setPhotoDrafts((current) => [...current, ...next].slice(0, 12));
  }

  function updatePhotoDraft(
    id: string,
    patch: Partial<Pick<PhotoProductDraft, "name" | "price" | "stock">>,
  ) {
    setPhotoDrafts((current) =>
      current.map((draft) =>
        draft.id === id ? { ...draft, ...patch } : draft,
      ),
    );
  }

  function removePhotoDraft(id: string) {
    setPhotoDrafts((current) => {
      const target = current.find((draft) => draft.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((draft) => draft.id !== id);
    });
  }

  async function createPhotoProducts() {
    const invalid = photoDrafts.find(
      (draft) => !draft.name.trim() || Number(draft.price) <= 0,
    );
    if (invalid) {
      document
        .getElementById(`photo-draft-${invalid.id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      document
        .querySelector<HTMLInputElement>(`#photo-draft-${invalid.id} input`)
        ?.focus();
      throw new Error(
        "Confirma el nombre y un precio mayor a cero en la fotografía señalada.",
      );
    }
    for (const draft of photoDrafts) {
      const created = (await requestJson("/api/products", {
        method: "POST",
        body: JSON.stringify({
          tenant_id: tenant.id,
          name: draft.name.trim(),
          slug: `${deriveSlug(draft.name)}-${draft.id.slice(-4)}`,
          price: Number(draft.price),
          cost_price: 0,
          stock: Math.max(0, Number(draft.stock) || 0),
          type: "product",
          track_stock: true,
          is_public: true,
        }),
      })) as { id: string };
      const imageUrl = await uploadProductImage(
        draft.file,
        tenant.id,
        created.id,
      );
      await requestJson("/api/products", {
        method: "PATCH",
        body: JSON.stringify({
          product_id: created.id,
          image_urls: [imageUrl],
        }),
      });
      URL.revokeObjectURL(draft.previewUrl);
    }
    if (photoDrafts.length) setPhotoDrafts([]);
  }

  async function saveContact() {
    const normalized = normalizeMexicanPhone(phone);
    if (!normalized) {
      setPhoneTouched(true);
      document.getElementById("setup-phone")?.focus();
      throw new Error("Revisa el WhatsApp antes de continuar.");
    }
    const checkout = { step: "fulfillment" as const, fulfillment, pickupPoint, delivery };
    const problem = setupCheckoutProblem(checkout);
    if (problem) throw new Error(problem);
    await requestJson(`/api/tenants/${encodeURIComponent(tenant.id)}/setup-checkout`, {
      method: "POST",
      body: JSON.stringify(checkout),
    });
    await requestJson("/api/tenants", {
      method: "PATCH",
      body: JSON.stringify({
        tenant_id: tenant.id,
        whatsapp_phone: normalized,
        whatsapp_orders_enabled: false,
        settings: {
          onboarding: {
            fulfillment,
            order_owner: orderOwner,
            contact_completed: true,
          },
        },
      }),
    });
    setPhone(normalized);
  }

  async function saveCatalog() {
    const validRows = customItems.filter(
      (item) => item.name.trim() && Number(item.price) > 0,
    );
    if (items.length === 0) {
      if (validRows.length + photoDrafts.length < 3)
        throw new Error(
          "Agrega al menos tres productos con nombre y precio, usando captura o fotografías.",
        );
      await Promise.all(
        validRows.map((item) =>
          requestJson("/api/products", {
            method: "POST",
            body: JSON.stringify({
              tenant_id: tenant.id,
              name: item.name.trim(),
              slug: deriveSlug(item.name),
              price: Number(item.price),
              cost_price: 0,
              stock: Number(item.stock) || 0,
              type: "product",
              track_stock: true,
              is_public: true,
            }),
          }),
        ),
      );
      await createPhotoProducts();
      await mutateProducts();
      return;
    }
    if (publicItems.length + photoDrafts.length < requiredCount) {
      const hidden = items.find((item) => !item.isPublic);
      if (hidden) focusItem(hidden.id);
      throw new Error(
        `Activa al menos ${requiredCount} ${requiredCount === 1 ? "servicio" : "productos"}. Te llevamos al primero que puedes mostrar.`,
      );
    }
    const visibilityChanges = items.filter(
      (item) => originalById.get(item.id)?.is_public !== item.isPublic,
    );
    await Promise.all(
      visibilityChanges.map((item) =>
        requestJson("/api/products", {
          method: "PATCH",
          body: JSON.stringify({
            product_id: item.id,
            is_public: item.isPublic,
          }),
        }),
      ),
    );
    await createPhotoProducts();
    await mutateProducts();
  }

  async function saveAvailability() {
    const invalidItem = publicItems.find((item) => Number(item.price) <= 0);
    if (invalidItem) {
      focusItem(invalidItem.id, "price");
      throw new Error(
        `Corrige el precio de “${invalidItem.name}”. Ya te llevamos al producto.`,
      );
    }
    const changedItems = publicItems.filter((item) => {
      const original = originalById.get(item.id);
      return (
        !original ||
        Number(item.price) !== Number(original.price) ||
        Number(item.stock) !== Number(original.stock) ||
        item.trackStock !== original.track_stock
      );
    });
    await Promise.all(
      changedItems.map((item) =>
        requestJson("/api/products", {
          method: "PATCH",
          body: JSON.stringify({
            product_id: item.id,
            price: Number(item.price),
            stock: Math.max(0, Number(item.stock) || 0),
            track_stock: item.type === "product" ? item.trackStock : false,
          }),
        }),
      ),
    );
    await requestJson("/api/tenants", {
      method: "PATCH",
      body: JSON.stringify({
        tenant_id: tenant.id,
        settings: {
          onboarding: { catalog_completed: true, availability_completed: true },
        },
      }),
    });
    await mutateProducts();
  }

  async function savePayment() {
    const checkout = { step: "payment" as const, method: paymentMethod, transfer };
    const problem = setupCheckoutProblem(checkout);
    if (problem) throw new Error(problem);
    await requestJson(`/api/tenants/${encodeURIComponent(tenant.id)}/setup-checkout`, {
      method: "POST",
      body: JSON.stringify(checkout),
    });
    await requestJson("/api/tenants", {
      method: "PATCH",
      body: JSON.stringify({
        tenant_id: tenant.id,
        settings: {
          onboarding: {
            payment_method: paymentMethod,
            payment_completed: true,
          },
        },
      }),
    });
  }

  async function continueStep() {
    setBusy(true);
    setError(null);
    try {
      if (step === 0) await saveContact();
      // Cash is only taken on pickup, so a delivery-only business starts from transfer.
      if (step === 0 && !needsPickupAddress(fulfillment) && paymentMethod === "cash") setPaymentMethod("transfer");
      if (step === 1) await saveCatalog();
      if (step === 2) await saveAvailability();
      if (step === 3) await savePayment();
      if (step < 4) setStep((current) => current + 1);
    } catch (value) {
      setError(
        value instanceof Error ? value.message : "No pudimos guardar este paso",
      );
    } finally {
      setBusy(false);
    }
  }

  async function advanceTest() {
    setError(null);
    if (testStage < TEST_STAGES.length - 1) {
      setTestStage((current) => current + 1);
      return;
    }
    setBusy(true);
    try {
      const legalResponse = await fetch(`/api/legal/status?tenant_id=${encodeURIComponent(tenant.id)}`, { cache: "no-store" });
      const legal = await legalResponse.json() as { pending?: { tenant_id?: string } | null };
      if (legalResponse.ok && legal.pending?.tenant_id === tenant.id) {
        router.push(`/dashboard/legal?tenant=${encodeURIComponent(tenant.id)}&return=${encodeURIComponent(`/dashboard/preparar-negocio?tenant=${tenant.id}&resume=activate`)}`);
        return;
      }
      await requestJson("/api/tenants", {
        method: "PATCH",
        body: JSON.stringify({
          tenant_id: tenant.id,
          settings: { onboarding: { customer_preview_completed: true } },
        }),
      });
      const result = (await requestJson("/api/tenants/complete-setup", {
        method: "POST",
        body: JSON.stringify({ tenant_id: tenant.id }),
      })) as { slug: string };
      setActivatedSlug(result.slug);
      setShowMemberships(true);
      await mutateGlobal("/api/tenants");
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "No pudimos activar los pedidos",
      );
    } finally {
      setBusy(false);
    }
  }

  if (activatedSlug) {
    const publicUrl = publicSitePath(tenant);
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f5f7fa] px-4 py-10">
        {showMemberships ? (
          <MembershipWelcomeModal onClose={() => setShowMemberships(false)} />
        ) : null}
        <div className="w-full max-w-2xl rounded-3xl border border-emerald-200 bg-white p-6 text-center shadow-[0_24px_70px_rgba(25,38,61,0.1)] sm:p-10">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.12em] text-emerald-700">
            Negocio operativo
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Tu tienda ya puede recibir pedidos
          </h1>
          <p className="mx-auto mt-3 max-w-lg leading-7 text-muted-foreground">
            El sitio está publicado, el catálogo fue aprobado y los pedidos
            están activos. Ya no necesitas configurar nada para compartirlo.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Link
              href={`/dashboard/${activatedSlug}`}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-bold text-white"
            >
              Entrar a mi negocio <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={publicUrl}
              target="_blank"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 text-sm font-bold text-foreground"
            >
              Ver mi tienda <ExternalLink className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() =>
                navigator.clipboard.writeText(
                  `${window.location.origin}${publicUrl}`,
                )
              }
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 text-sm font-bold text-foreground"
            >
              <Link2 className="h-4 w-4" />
              Copiar enlace
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Conoce ${tenant.name}: ${typeof window !== "undefined" ? window.location.origin : PRODUCTION_APP_URL}${publicUrl}`)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 text-sm font-bold text-foreground"
            >
              <Share2 className="h-4 w-4" />
              Compartir por WhatsApp
            </a>
          </div>
        </div>
      </div>
    );
  }

  const test = TEST_STAGES[testStage];
  const TestIcon = test.icon;

  return (
    <div className="business-setup-flow flex min-h-dvh flex-col bg-white text-foreground">
      <header className="border-b border-border-soft">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <TlacoLogo size="md" />
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            Sitio publicado
          </span>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pt-6 sm:px-6 sm:pt-10">
        <div className="mx-auto w-full max-w-3xl">
          <SetupProgress step={step} />
        </div>
        {/* The step grows so the action bar rests at the bottom of the screen even on short steps. */}
        <div className="mx-auto mt-7 flex w-full max-w-3xl flex-1 flex-col sm:mt-9 [&>section]:flex-1">
          {step === 0 ? (
            <section>
              <p className="text-sm font-bold text-accent">PASO 1 DE 5</p>
              <h1 className="mt-2 font-bold tracking-tight">
                Confirma cómo recibirás pedidos
              </h1>
              <p className="mt-3 text-muted-foreground">
                Ya conservamos el WhatsApp que escribiste al registrarte. Puedes
                corregirlo aquí.
              </p>
              <label
                htmlFor="setup-phone"
                className="mt-7 block text-sm font-semibold"
              >
                WhatsApp del negocio
              </label>
              <input
                id="setup-phone"
                value={phone}
                onChange={(event) => {
                  setPhone(formatMexicanPhoneInput(event.target.value));
                  setPhoneTouched(true);
                }}
                onBlur={() => setPhoneTouched(true)}
                inputMode="tel"
                pattern="[0-9 ]*"
                maxLength={18}
                autoComplete="tel"
                aria-invalid={Boolean(phoneError)}
                aria-describedby="setup-phone-help"
                className={`mt-2 min-h-12 w-full rounded-xl border bg-[#f8f9fb] px-4 text-base outline-none focus:ring-4 focus:ring-accent/10 ${phoneError ? "border-red-500" : "border-border focus:border-accent"}`}
                placeholder="55 1234 5678"
              />
              <p
                id="setup-phone-help"
                className={`mt-2 text-xs ${phoneError ? "font-semibold text-red-600" : normalizeMexicanPhone(phone) ? "font-semibold text-emerald-700" : "text-muted-foreground"}`}
              >
                {phoneError ??
                  (normalizeMexicanPhone(phone)
                    ? "Número listo para mostrarse y recibir seguimiento."
                    : "Escribe un número mexicano de 10 dígitos.")}
              </p>
              <fieldset className="mt-6">
                <legend className="text-sm font-semibold">
                  Forma principal de entrega
                </legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {[
                    { id: "pickup", label: "Recogen aquí" },
                    { id: "delivery", label: "Entrega local" },
                    { id: "onsite", label: "Atención en sitio" },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setFulfillment(option.id as SetupFulfillment)}
                      className={`min-h-20 rounded-2xl border p-4 text-left font-semibold ${fulfillment === option.id ? "border-foreground ring-1 ring-foreground" : "border-border"}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <SetupFulfillmentDetails
                  fulfillment={fulfillment}
                  pickupPoint={pickupPoint}
                  delivery={delivery}
                  onPickupPointChange={setPickupPoint}
                  onDeliveryChange={setDelivery}
                />
              </fieldset>
              <fieldset className="mt-6">
                <legend className="text-sm font-semibold">
                  ¿Quién atenderá los pedidos?
                </legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      id: "owner",
                      label: "Yo los atenderé",
                      text: "Llegarán a mi panel principal.",
                    },
                    {
                      id: "team",
                      label: "Mi equipo",
                      text: "Después podré invitar responsables.",
                    },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setOrderOwner(option.id)}
                      className={`min-h-20 rounded-2xl border p-4 text-left ${orderOwner === option.id ? "border-foreground ring-1 ring-foreground" : "border-border"}`}
                    >
                      <span className="block font-semibold">
                        {option.label}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {option.text}
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>
            </section>
          ) : null}

          {step === 1 ? (
            <section>
              <p className="text-sm font-bold text-accent">PASO 2 DE 5</p>
              <h1 className="mt-2 font-bold tracking-tight">
                Elige lo que verá tu cliente
              </h1>
              <p className="mt-3 text-muted-foreground">
                Conserva la base, oculta lo que no vendes o agrega productos
                directamente desde fotografías.
              </p>
              <PhotoProductDrafts
                drafts={photoDrafts}
                onFiles={addPhotoDrafts}
                onUpdate={updatePhotoDraft}
                onRemove={removePhotoDraft}
              />
              {items.length ? (
                <div className="mt-6">
                  <p className="text-sm font-semibold">
                    Productos del catálogo inicial
                  </p>
                  <div className="mt-3 max-h-[330px] space-y-2 overflow-y-auto pr-1">
                    {items.map((item) => (
                      <div
                        ref={(node) => {
                          if (node) itemRefs.current.set(item.id, node);
                          else itemRefs.current.delete(item.id);
                        }}
                        key={item.id}
                        className={`rounded-xl border transition ${highlightedItemId === item.id ? "border-red-500 bg-red-50 ring-2 ring-red-100" : item.isPublic ? "border-accent/50 bg-accent/5" : "border-border bg-white"}`}
                      >
                        <label className="flex min-h-16 cursor-pointer items-center gap-3 p-3">
                          <input
                            type="checkbox"
                            checked={item.isPublic}
                            onChange={(event) =>
                              updateItem(item.id, {
                                isPublic: event.target.checked,
                              })
                            }
                            className="h-5 w-5 accent-[#3483fa]"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold">
                              {item.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {item.type === "product"
                                ? "Producto"
                                : "Servicio"}{" "}
                              · ${item.price}
                            </span>
                          </span>
                          <span
                            className={`text-xs font-bold ${item.isPublic ? "text-accent" : "text-muted"}`}
                          >
                            {item.isPublic ? "Visible" : "Oculto"}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  <p className="text-sm font-semibold">
                    O captura tres productos
                  </p>
                  {customItems.map((item, index) => (
                    <div
                      key={index}
                      className="grid gap-2 rounded-2xl border border-border p-3 sm:grid-cols-[1fr_120px_100px]"
                    >
                      <input
                        value={item.name}
                        onChange={(event) =>
                          setCustomItems((current) =>
                            current.map((row, rowIndex) =>
                              rowIndex === index
                                ? { ...row, name: event.target.value }
                                : row,
                            ),
                          )
                        }
                        className="min-h-12 rounded-xl border border-border px-3"
                        placeholder={`Producto ${index + 1}`}
                      />
                      <input
                        value={item.price}
                        onChange={(event) =>
                          setCustomItems((current) =>
                            current.map((row, rowIndex) =>
                              rowIndex === index
                                ? { ...row, price: event.target.value }
                                : row,
                            ),
                          )
                        }
                        inputMode="decimal"
                        className="min-h-12 rounded-xl border border-border px-3"
                        placeholder="Precio"
                      />
                      <input
                        value={item.stock}
                        onChange={(event) =>
                          setCustomItems((current) =>
                            current.map((row, rowIndex) =>
                              rowIndex === index
                                ? { ...row, stock: event.target.value }
                                : row,
                            ),
                          )
                        }
                        inputMode="numeric"
                        className="min-h-12 rounded-xl border border-border px-3"
                        placeholder="Stock"
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {step === 2 ? (
            <section>
              <p className="text-sm font-bold text-accent">PASO 3 DE 5</p>
              <h1 className="mt-2 font-bold tracking-tight">
                Confirma precios y existencias
              </h1>
              <p className="mt-3 text-muted-foreground">
                Éstos serán los datos publicados. Si algo falta, Tlaco te
                llevará a la fila exacta.
              </p>
              <div className="mt-6 max-h-[500px] space-y-2 overflow-y-auto pr-1">
                {publicItems.map((item) => (
                  <div
                    ref={(node) => {
                      if (node) itemRefs.current.set(item.id, node);
                      else itemRefs.current.delete(item.id);
                    }}
                    key={item.id}
                    className={`grid gap-3 rounded-2xl border p-4 transition sm:grid-cols-[1fr_130px_165px] sm:items-end ${highlightedItemId === item.id ? "border-red-500 bg-red-50 ring-2 ring-red-100" : "border-border"}`}
                  >
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.type === "product"
                          ? "Producto físico"
                          : "Servicio"}
                      </p>
                    </div>
                    <label className="text-xs font-semibold text-muted-foreground">
                      Precio
                      <input
                        data-field="price"
                        value={item.price}
                        onChange={(event) =>
                          updateItem(item.id, { price: event.target.value })
                        }
                        inputMode="decimal"
                        className="mt-1 min-h-11 w-full rounded-xl border border-border px-3 text-base text-foreground"
                      />
                    </label>
                    {item.type === "product" ? (
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground">
                          Existencias
                          <input
                            value={item.stock}
                            onChange={(event) =>
                              updateItem(item.id, { stock: event.target.value })
                            }
                            inputMode="numeric"
                            disabled={!item.trackStock}
                            className="mt-1 min-h-11 w-full rounded-xl border border-border px-3 text-base text-foreground disabled:bg-border-soft"
                          />
                        </label>
                        <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={!item.trackStock}
                            onChange={(event) =>
                              updateItem(item.id, {
                                trackStock: !event.target.checked,
                              })
                            }
                          />
                          No controlar existencias
                        </label>
                      </div>
                    ) : (
                      <span className="flex min-h-11 items-center text-sm font-semibold text-emerald-700">
                        Disponible
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {step === 3 ? (
            <section>
              <p className="text-sm font-bold text-accent">PASO 4 DE 5</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                ¿Cómo comenzarás a cobrar?
              </h1>
              <p className="mt-3 text-muted-foreground">
                Puedes agregar más métodos después. Ningún mensaje de WhatsApp
                confirma dinero por sí solo.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {(
                  [
                    { id: "cash", label: "Efectivo", icon: WalletCards },
                    { id: "transfer", label: "Transferencia", icon: Send },
                    { id: "digital", label: "Pago digital", icon: ReceiptText },
                  ] as const
                ).map(({ id, label, icon: Icon }) => {
                  const unavailable = id === "cash" && !needsPickupAddress(fulfillment);
                  return (
                    <button
                      key={id}
                      type="button"
                      disabled={unavailable}
                      onClick={() => setPaymentMethod(id)}
                      className={`min-h-32 rounded-2xl border p-5 text-left disabled:cursor-not-allowed disabled:opacity-50 ${paymentMethod === id ? "border-foreground ring-1 ring-foreground" : "border-border"}`}
                    >
                      <Icon className="h-6 w-6 text-accent" />
                      <span className="mt-5 block font-semibold">{label}</span>
                      {unavailable ? (
                        <span className="mt-1 block text-xs text-muted-foreground">
                          Solo cuando recogen en tu negocio
                        </span>
                      ) : paymentMethod === id ? (
                        <span className="mt-1 block text-xs font-bold text-emerald-700">
                          Seleccionado
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
              <SetupPaymentDetails
                tenantId={tenant.id}
                method={paymentMethod}
                transfer={transfer}
                onTransferChange={setTransfer}
              />
            </section>
          ) : null}

          {step === 4 ? (
            <section>
              <p className="text-sm font-bold text-accent">PASO 5 DE 5</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Prueba el recorrido de tu cliente
              </h1>
              <p className="mt-3 text-muted-foreground">
                Avanza el pedido de práctica. No modifica ventas, pagos ni
                inventario real.
              </p>
              <div className="mt-8 overflow-hidden rounded-3xl border border-border bg-[#f6f8fb]">
                <div className="border-b border-border bg-white p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-white">
                      <TestIcon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-accent">
                        MOMENTO {testStage + 1} DE {TEST_STAGES.length}
                      </p>
                      <p className="font-bold">{test.title}</p>
                    </div>
                  </div>
                </div>
                <div className="grid gap-5 p-4 sm:grid-cols-[1fr_210px] sm:p-6">
                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold text-muted-foreground">
                      {testStage === 0
                        ? "LO QUE VE TU CLIENTE"
                        : "LO QUE VE TU NEGOCIO"}
                    </p>
                    <div className="mt-5 flex items-center gap-3">
                      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                        {testStage === 0 ? (
                          <ShoppingBag className="h-6 w-6" />
                        ) : testStage === 4 ? (
                          <CheckCircle2 className="h-6 w-6" />
                        ) : (
                          <Store className="h-6 w-6" />
                        )}
                      </span>
                      <div>
                        <p className="font-semibold">
                          {previewItem?.name ?? "Primer artículo"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {previewItem
                            ? `$${Number(previewItem.price).toFixed(0)} MXN`
                            : "Precio confirmado"}
                        </p>
                      </div>
                    </div>
                    <p className="mt-5 text-sm leading-6 text-muted-foreground">
                      {test.text}
                    </p>
                  </div>
                  <aside className="rounded-2xl bg-[#111827] p-5 text-white">
                    <p className="text-xs font-semibold text-white/60">
                      PEDIDO DE PRÁCTICA
                    </p>
                    <p className="mt-3 text-2xl font-bold">
                      #{108 + testStage}
                    </p>
                    <div className="mt-5 space-y-2">
                      {TEST_STAGES.map((stageItem, index) => (
                        <div
                          key={stageItem.title}
                          className={`flex items-center gap-2 text-xs ${index <= testStage ? "text-white" : "text-white/35"}`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${index <= testStage ? "bg-emerald-400" : "bg-white/20"}`}
                          />
                          {stageItem.title}
                        </div>
                      ))}
                    </div>
                  </aside>
                </div>
              </div>
            </section>
          ) : null}

          {error ? (
            <p
              className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          <div className="sticky bottom-0 z-20 -mx-4 mt-8 flex items-center justify-between gap-3 rounded-t-[28px] border-x border-t border-border bg-surface px-4 pb-[max(0.875rem,calc(0.875rem+env(safe-area-inset-bottom)))] pt-4 shadow-[0_-12px_32px_rgba(15,23,42,0.14)] sm:mx-0 sm:rounded-none sm:border-x-0 sm:border-border-soft sm:bg-white/95 sm:px-0 sm:pb-6 sm:shadow-none">
            <button
              type="button"
              onClick={() =>
                step > 0 ? setStep((current) => current - 1) : router.back()
              }
              disabled={busy}
              className="inline-flex min-h-12 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-muted-foreground hover:bg-border-soft"
            >
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </button>
            {step < 4 ? (
              <button
                type="button"
                onClick={() => void continueStep()}
                disabled={busy || (step === 0 && !normalizeMexicanPhone(phone))}
                className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-foreground px-5 text-sm font-bold text-white disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Guardar y continuar <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void advanceTest()}
                disabled={busy}
                className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-accent px-5 text-sm font-bold text-white disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {testStage === TEST_STAGES.length - 1
                  ? "Abrir pedidos"
                  : "Continuar prueba"}
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
