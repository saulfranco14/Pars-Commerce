"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowRight,
  BadgePercent,
  BellRing,
  CalendarClock,
  Check,
  CheckCircle2,
  CreditCard,
  HandCoins,
  Minus,
  MonitorSmartphone,
  Plus,
  Search,
  ShoppingBag,
  Store,
  UsersRound,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { TlacoLogo } from "@/components/brand/TlacoLogo";
import type { CatalogItemDefinition } from "@/features/catalog/catalogDefinitions";
import type { SolutionDefinition } from "@/features/solutions/solutionCatalog";
import { SolutionOnboarding } from "@/features/solutions/SolutionOnboarding";

type Journey = "customer" | "orders" | "checkout";
type OrderStage = "shopping" | "received" | "preparing" | "ready" | "paid";
type CapabilityKey = "store" | "payments" | "schedule" | "promotions" | "memberships" | "credit" | "kiosk";

interface Capability {
  key: CapabilityKey;
  title: string;
  short: string;
  promise: string;
  benefits: [string, string, string];
  action: string;
  completed: string;
  icon: LucideIcon;
}

const THEMES = ["#3483fa", "#18243a", "#b45309"];

const CAPABILITIES: Capability[] = [
  {
    key: "store",
    title: "Tienda en línea",
    short: "Vende con un enlace",
    promise: "Tus clientes ven productos, promociones y disponibilidad sin preguntarte todo por WhatsApp.",
    benefits: ["Catálogo siempre accesible", "Carrito y pedido ordenado", "Enlace y QR para compartir"],
    action: "Publicar catálogo",
    completed: "Catálogo publicado y listo para compartir",
    icon: Store,
  },
  {
    key: "payments",
    title: "Pagos en línea",
    short: "Cobra sin perseguir",
    promise: "Genera el cobro desde el pedido y distingue claramente entre pendiente, confirmado y pagado.",
    benefits: ["Efectivo, transferencia o pago digital", "Enlace de pago por pedido", "Confirmación financiera visible"],
    action: "Crear enlace de pago",
    completed: "Enlace creado; el pedido sigue pendiente hasta confirmar el pago",
    icon: CreditCard,
  },
  {
    key: "schedule",
    title: "Pedidos y agenda",
    short: "Piden ahora, pasan después",
    promise: "El cliente elige cuándo recoge, recibe o toma el servicio; tu equipo ve la hora prometida.",
    benefits: ["Entrega o recolección", "Fecha y horario acordados", "Cola de trabajo por atender"],
    action: "Confirmar para las 18:30",
    completed: "Pedido reservado para hoy a las 18:30",
    icon: CalendarClock,
  },
  {
    key: "promotions",
    title: "Promociones",
    short: "Haz visible una oferta",
    promise: "Arma descuentos y combos que el cliente realmente puede ver y usar desde la tienda.",
    benefits: ["Descuento o precio especial", "Vigencia y condiciones", "Resultado medible por promoción"],
    action: "Publicar 2 × $55",
    completed: "Promoción visible en la tienda y en el carrito",
    icon: BadgePercent,
  },
  {
    key: "memberships",
    title: "Membresías de clientes",
    short: "Haz que regresen",
    promise: "Ofrece beneficios recurrentes y registra cada visita, consumo o renovación desde el negocio.",
    benefits: ["Beneficio claro para el cliente", "Visitas y vigencia", "Renovación y seguimiento"],
    action: "Registrar visita",
    completed: "Visita 8 de 10 registrada; beneficio próximo",
    icon: UsersRound,
  },
  {
    key: "credit",
    title: "Crédito y préstamos",
    short: "Controla quién debe",
    promise: "Registra saldos, abonos y fechas sin depender de una libreta o conversaciones perdidas.",
    benefits: ["Saldo por cliente", "Historial de abonos", "Recordatorios con evidencia"],
    action: "Registrar abono de $200",
    completed: "Abono registrado; nuevo saldo $380",
    icon: HandCoins,
  },
  {
    key: "kiosk",
    title: "Kiosco de autoservicio",
    short: "El cliente arma su orden",
    promise: "Convierte una pantalla en un punto de pedido tipo restaurante de autoservicio, conectado a la misma operación.",
    benefits: ["Menú táctil y visual", "Pedido directo a la cola", "Mismos productos, precios y estados"],
    action: "Enviar pedido a preparación",
    completed: "Pedido K-014 enviado a la misma bandeja del negocio",
    icon: MonitorSmartphone,
  },
];

function money(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

function itemKey(item: CatalogItemDefinition) {
  return `${item.type}:${item.name}`;
}

function measure(name: string, properties: Record<string, string | number | boolean>) {
  try {
    track(name, properties);
  } catch {
    // La medición nunca bloquea una interacción.
  }
}

function ProductCard({
  item,
  fallback,
  quantity,
  onChange,
}: {
  item: CatalogItemDefinition;
  fallback: string;
  quantity: number;
  onChange: (delta: number) => void;
}) {
  const imageSource =
    item.imageUrl && !item.imageUrl.includes("starter-product.svg")
      ? item.imageUrl
      : fallback;

  return (
    <article className="grid min-w-0 grid-cols-[96px_1fr] overflow-hidden rounded-2xl border border-[#e1e5ea] bg-white shadow-sm sm:block">
      <div className="relative min-h-28 bg-[#eef2f7] sm:aspect-[16/9] sm:min-h-0">
        <Image src={imageSource} alt={item.imageAlt ?? item.name} fill sizes="220px" className="object-cover" />
        <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-[#596273] shadow-sm">
          {item.category}
        </span>
      </div>
      <div className="flex min-w-0 flex-col justify-between p-3">
        <p className="line-clamp-2 text-sm font-semibold text-[#172033]">{item.name}</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-sm font-bold">{money(item.price)}</span>
          {quantity > 0 ? (
            <div className="flex items-center rounded-xl bg-[#f0f3f7]">
              <button type="button" onClick={() => onChange(-1)} aria-label={`Quitar ${item.name}`} className="h-10 w-10"><Minus className="mx-auto h-4 w-4" /></button>
              <span className="min-w-4 text-center text-sm font-semibold">{quantity}</span>
              <button type="button" onClick={() => onChange(1)} aria-label={`Agregar otro ${item.name}`} className="h-10 w-10"><Plus className="mx-auto h-4 w-4" /></button>
            </div>
          ) : (
            <button type="button" onClick={() => onChange(1)} aria-label={`Agregar ${item.name}`} className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#3483fa] text-white"><Plus className="h-5 w-5" /></button>
          )}
        </div>
      </div>
    </article>
  );
}

function CapabilityPreview({
  capability,
  done,
  onAction,
  name,
  previewUrl,
}: {
  capability: Capability;
  done: boolean;
  onAction: () => void;
  name: string;
  previewUrl: string;
}) {
  return (
    <div className="min-h-[330px] rounded-3xl border border-[#dfe3e8] bg-[#f6f8fb] p-3 sm:p-5">
      <div className="overflow-hidden rounded-2xl border border-[#dfe3e8] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#eceef1] px-4 py-3">
          <div><p className="text-xs font-semibold text-[#7a8494]">{name}</p><p className="text-sm font-bold text-[#172033]">{capability.title}</p></div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#e9f8f0] px-2.5 py-1 text-[11px] font-bold text-[#087443]"><span className="h-2 w-2 rounded-full bg-[#10a568]" />Conectado</span>
        </div>

        <div className="p-4 sm:p-5">
          {capability.key === "store" ? (
            <div className="grid gap-4 sm:grid-cols-[1fr_132px] sm:items-center">
              <div className="space-y-2">
                {["Catálogo público", "Carrito y pedido", "Promociones visibles"].map((label, index) => <div key={label} className="flex items-center justify-between rounded-xl border border-[#e7eaf0] px-3 py-2.5"><span className="text-sm font-semibold">{label}</span><span className={`text-xs font-bold ${index === 2 && !done ? "text-[#7a8494]" : "text-[#087443]"}`}>{index === 2 && !done ? "Por publicar" : "Listo"}</span></div>)}
              </div>
              <div className="mx-auto rounded-2xl bg-[#f1f4f8] p-3 text-center"><QRCodeSVG value={previewUrl} size={104} bgColor="#f1f4f8" fgColor="#111318" level="M" /><p className="mt-2 text-[10px] font-semibold text-[#596273]">Abre este recorrido</p></div>
            </div>
          ) : null}

          {capability.key === "payments" ? (
            <div><div className="flex items-end justify-between gap-3"><div><p className="text-xs font-semibold text-[#7a8494]">PEDIDO #108</p><p className="mt-1 text-3xl font-bold">$129</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${done ? "bg-[#e9f8f0] text-[#087443]" : "bg-[#fff4dd] text-[#8a5a00]"}`}>{done ? "Enlace enviado" : "Pago pendiente"}</span></div><div className="mt-5 grid grid-cols-3 gap-2">{["Efectivo", "Transferencia", "En línea"].map((method) => <div key={method} className={`rounded-xl border px-2 py-3 text-center text-xs font-semibold ${method === "En línea" ? "border-[#172033] bg-[#f3f5f8]" : "border-[#e1e5ea]"}`}>{method}</div>)}</div></div>
          ) : null}

          {capability.key === "schedule" ? (
            <div><p className="text-xs font-semibold text-[#7a8494]">¿CUÁNDO LO NECESITAS?</p><div className="mt-3 grid grid-cols-3 gap-2">{["Hoy", "Mañana", "Sábado"].map((day, index) => <div key={day} className={`rounded-xl border px-3 py-3 text-center text-sm font-semibold ${index === 0 ? "border-[#172033] bg-[#f3f5f8]" : "border-[#e1e5ea]"}`}>{day}</div>)}</div><div className="mt-3 flex items-center justify-between rounded-xl bg-[#eef3ff] px-4 py-3"><span className="text-sm font-semibold">Recoger a las 18:30</span><CalendarClock className="h-5 w-5 text-[#3483fa]" /></div></div>
          ) : null}

          {capability.key === "promotions" ? (
            <div className="rounded-2xl bg-[#fff5df] p-5"><p className="text-xs font-bold text-[#8a5a00]">PROMOCIÓN DE HOY</p><div className="mt-2 flex items-end justify-between gap-4"><div><p className="text-3xl font-black text-[#6d4300]">2 × $55</p><p className="mt-1 text-sm text-[#8a5a00]">En productos seleccionados · hasta las 20:00</p></div><BadgePercent className="h-10 w-10 text-[#b77900]" /></div></div>
          ) : null}

          {capability.key === "memberships" ? (
            <div className="rounded-2xl bg-[#172033] p-5 text-white"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold text-white/55">CLIENTE FRECUENTE</p><p className="mt-1 text-xl font-bold">Ana Martínez</p></div><UsersRound className="h-6 w-6 text-[#72a8ff]" /></div><div className="mt-6 flex gap-1.5">{Array.from({ length: 10 }, (_, index) => <span key={index} className={`h-2 flex-1 rounded-full ${index < (done ? 8 : 7) ? "bg-[#72a8ff]" : "bg-white/15"}`} />)}</div><p className="mt-3 text-sm text-white/70">{done ? "2 visitas para desbloquear su beneficio" : "3 visitas para desbloquear su beneficio"}</p></div>
          ) : null}

          {capability.key === "credit" ? (
            <div><div className="flex items-center justify-between rounded-2xl border border-[#e1e5ea] p-4"><div><p className="text-xs font-semibold text-[#7a8494]">CRÉDITO DE CLIENTE</p><p className="mt-1 font-bold">Carlos Hernández</p></div><div className="text-right"><p className="text-xs text-[#7a8494]">Saldo</p><p className="text-2xl font-bold">{done ? "$380" : "$580"}</p></div></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl bg-[#f3f5f8] p-3"><p className="text-[#7a8494]">Último abono</p><p className="mt-1 font-bold">{done ? "$200 · hoy" : "$150 · 2 oct"}</p></div><div className="rounded-xl bg-[#f3f5f8] p-3"><p className="text-[#7a8494]">Próximo acuerdo</p><p className="mt-1 font-bold">16 de octubre</p></div></div></div>
          ) : null}

          {capability.key === "kiosk" ? (
            <div className="grid grid-cols-[1fr_120px] gap-3"><div className="grid grid-cols-2 gap-2">{["Combo 1", "Combo 2", "Bebidas", "Extras"].map((item, index) => <div key={item} className={`rounded-xl p-3 text-sm font-semibold ${index === 0 ? "bg-[#3483fa] text-white" : "bg-[#eef1f5] text-[#172033]"}`}>{item}<span className="mt-3 block text-xs opacity-70">Tocar para elegir</span></div>)}</div><div className="rounded-xl bg-[#172033] p-3 text-white"><p className="text-[10px] font-bold text-white/55">MI PEDIDO</p><p className="mt-3 text-sm font-semibold">1 × Combo 1</p><p className="mt-1 text-xs text-white/60">Para llevar</p><p className="mt-8 text-xl font-bold">$149</p></div></div>
          ) : null}

          <button type="button" onClick={onAction} className={`mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold ${done ? "bg-[#e9f8f0] text-[#087443]" : "bg-[#111318] text-white"}`}>{done ? <CheckCircle2 className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}{done ? capability.completed : capability.action}</button>
          <p className="mt-3 text-center text-[11px] text-[#7a8494]">Interacción ilustrativa: no escribe ventas, pagos ni inventario real.</p>
        </div>
      </div>
    </div>
  );
}

export function FocusedSolutionExperience({
  solution,
  startOnboarding = false,
}: {
  solution: SolutionDefinition;
  startOnboarding?: boolean;
}) {
  const router = useRouter();
  const allItems = useMemo(() => [...solution.catalog.products, ...solution.catalog.services], [solution.catalog.products, solution.catalog.services]);
  const featuredItems = allItems.slice(0, 2);
  const firstItem = featuredItems[0];
  const [name, setName] = useState(solution.preset.defaultName);
  const [selectedTheme, setSelectedTheme] = useState(0);
  const [journey, setJourney] = useState<Journey>("customer");
  const [stage, setStage] = useState<OrderStage>("shopping");
  const [paymentMethod, setPaymentMethod] = useState("En línea");
  const [cart, setCart] = useState<Record<string, number>>(() => firstItem ? { [itemKey(firstItem)]: 1 } : {});
  const [onboardingOpen, setOnboardingOpen] = useState(startOnboarding);
  const [activeCapability, setActiveCapability] = useState<CapabilityKey>("store");
  const [completedCapabilities, setCompletedCapabilities] = useState<Partial<Record<CapabilityKey, boolean>>>({});
  const themeColor = THEMES[selectedTheme];

  const cartLines = allItems.flatMap((item) => {
    const quantity = cart[itemKey(item)] ?? 0;
    return quantity > 0 ? [{ item, quantity }] : [];
  });
  const cartCount = cartLines.reduce((sum, line) => sum + line.quantity, 0);
  const total = cartLines.reduce((sum, line) => sum + line.item.price * line.quantity, 0);
  const capability = CAPABILITIES.find((item) => item.key === activeCapability) ?? CAPABILITIES[0];
  const CapabilityIcon = capability.icon;
  const previewUrl = `https://tlaco.app/soluciones/${solution.path}?probar=cliente#recorrido`;

  function changeQuantity(item: CatalogItemDefinition, delta: number) {
    const key = itemKey(item);
    setCart((current) => ({ ...current, [key]: Math.max(0, (current[key] ?? 0) + delta) }));
    if (delta > 0) measure("solution_catalog_item_added", { solution: solution.path, item: item.name });
  }

  function goToJourney(next: Journey) {
    // Mantener un artículo de ejemplo permite explorar cualquier paso sin
    // terminar en un cobro vacío de $0.
    if (next !== "customer" && cartCount === 0 && firstItem) {
      setCart({ [itemKey(firstItem)]: 1 });
    }
    setJourney(next);
    if (next === "orders" && stage === "shopping") setStage("received");
    if (next === "checkout" && stage !== "paid") setStage("ready");
    measure("solution_journey_viewed", { solution: solution.path, view: next });
  }

  function submitOrder() {
    if (!cartCount) return;
    setStage("received");
    setJourney("orders");
    measure("solution_order_submitted", { solution: solution.path, items: cartCount, total });
  }

  function advanceOrder() {
    if (stage === "received") setStage("preparing");
    if (stage === "preparing") setStage("ready");
    if (stage === "ready") setJourney("checkout");
    measure("solution_order_progressed", { solution: solution.path, from: stage });
  }

  function chargeOrder() {
    setStage("paid");
    measure("solution_checkout_completed", { solution: solution.path, payment_method: paymentMethod, total });
  }

  function resetJourney() {
    setCart(firstItem ? { [itemKey(firstItem)]: 1 } : {});
    setStage("shopping");
    setJourney("customer");
  }

  function openOnboarding() {
    setOnboardingOpen(true);
    router.replace(`/soluciones/${solution.path}?iniciar=1`, { scroll: false });
    measure("solution_onboarding_started", { solution: solution.path });
  }

  function closeOnboarding() {
    setOnboardingOpen(false);
    router.replace(`/soluciones/${solution.path}`, { scroll: false });
  }

  function runCapabilityAction() {
    setCompletedCapabilities((current) => ({ ...current, [capability.key]: true }));
    measure("solution_capability_tried", { solution: solution.path, capability: capability.key });
  }

  return (
    <div className="solution-experience min-h-screen overflow-x-clip bg-white text-[#111318]">
      {onboardingOpen ? <SolutionOnboarding solution={solution} name={name} setName={setName} selectedTheme={selectedTheme} setSelectedTheme={setSelectedTheme} onClose={closeOnboarding} /> : null}

      <header className="sticky top-0 z-40 border-b border-[#eceef1] bg-white/95 backdrop-blur">
        <nav className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="inline-flex min-h-12 items-center"><TlacoLogo size="md" /></Link>
          <div className="hidden items-center gap-7 text-sm font-medium text-[#596273] md:flex"><a href="#recorrido" className="hover:text-[#111318]">Recorrido de venta</a><a href="#capacidades" className="hover:text-[#111318]">Todo lo que incluye</a></div>
          <button type="button" onClick={openOnboarding} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#111318] px-4 text-sm font-semibold text-white hover:bg-[#2b3240]">Preparar mi {solution.path === "tienda" ? "tienda" : "negocio"}</button>
        </nav>
      </header>

      <main>
        <section className="border-b border-[#eceef1]">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-9 sm:px-6 sm:py-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:py-14">
            <div>
              <p className="text-sm font-semibold text-[#3483fa]">{solution.eyebrow}</p>
              <h1 className="mt-3 max-w-xl text-4xl font-semibold leading-[1.06] tracking-[-0.04em] sm:text-[2.9rem]">Recibe pedidos, cobra y controla cada venta.</h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-[#596273]">{solution.problem} Tu cliente compra o agenda y tu equipo continúa la misma operación sin volver a capturarla.</p>
              <div className="mt-6 grid gap-2 text-sm text-[#364052]">
                {["Tienda y pedidos listos para compartir", "Pago, preparación y entrega con estado claro", "Promociones, membresías, crédito y kiosco cuando los necesites"].map((text) => <p key={text} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#10a568]" />{text}</p>)}
              </div>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row"><button type="button" onClick={openOnboarding} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#3483fa] px-5 text-sm font-semibold text-white">Preparar mi negocio <ArrowRight className="h-4 w-4" /></button><a href="#recorrido" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#dfe3e8] px-5 text-sm font-semibold">Ver una venta completa</a></div>
              <p className="mt-3 text-xs text-[#7a8494]">Sin tarjeta. Lo que hagas aquí es una simulación segura.</p>
            </div>

            <div id="recorrido" className="min-w-0 rounded-[1.75rem] border border-[#dfe3e8] bg-[#f5f7fa] p-2 shadow-[0_20px_60px_rgba(25,38,61,0.11)] sm:p-3">
              <div className="overflow-hidden rounded-[1.35rem] border border-[#dfe3e8] bg-white">
                <div className="flex flex-col gap-3 border-b border-[#eceef1] p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-3"><div className="min-w-0 flex-1"><label htmlFor="focused-store-name" className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7a8494]">Personaliza el recorrido</label><input id="focused-store-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} className="mt-0.5 h-8 w-full max-w-xs rounded-lg border border-transparent bg-transparent px-1 text-sm font-semibold outline-none hover:border-[#dfe3e8] focus:border-[#3483fa]" /></div><span className="hidden rounded-full bg-[#e9f8f0] px-3 py-1 text-xs font-bold text-[#087443] sm:inline-flex">Operación conectada</span></div>
                  <div className="grid grid-cols-3 gap-1 rounded-xl bg-[#eef1f5] p-1">
                    {[{ id: "customer" as const, n: "1", label: "Cliente compra" }, { id: "orders" as const, n: "2", label: "Negocio atiende" }, { id: "checkout" as const, n: "3", label: "Cobra y actualiza" }].map((item) => <button key={item.id} type="button" onClick={() => goToJourney(item.id)} className={`min-h-12 rounded-lg px-1 text-[10px] font-bold leading-tight sm:px-3 sm:text-xs ${journey === item.id ? "bg-white text-[#111318] shadow-sm" : "text-[#687181]"}`}><span className={`mr-1 inline-flex h-5 w-5 items-center justify-center rounded-full ${journey === item.id ? "bg-[#3483fa] text-white" : "bg-[#dce1e8]"}`}>{item.n}</span>{item.label}</button>)}
                  </div>
                </div>

                <div className="min-h-[390px] sm:min-h-[410px]">
                {journey === "customer" ? (
                  <div className="grid min-h-[390px] md:grid-cols-[1fr_220px]">
                    <div className="p-3 sm:p-4">
                      <div className="relative min-h-28 overflow-hidden rounded-2xl p-4 text-white" style={{ background: themeColor }}>
                        <Image src={solution.heroImage} alt="" fill sizes="560px" className="object-cover opacity-35 mix-blend-multiply" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/45 to-transparent" />
                        <div className="relative">
                          <p className="text-[10px] font-bold text-white/80">TIENDA ABIERTA · COMPRA SEGURA</p>
                          <h2 className="mt-1 text-xl font-bold">{name}</h2>
                          <p className="mt-1 text-xs text-white/85">Compra ahora o agenda para cuándo lo necesitas.</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex min-h-10 flex-1 items-center gap-2 rounded-xl border border-[#dfe3e8] bg-white px-3 text-xs text-[#7a8494]"><Search className="h-4 w-4" />Buscar en la tienda</div>
                        <span className="rounded-xl bg-[#eef3ff] px-3 py-2.5 text-xs font-bold text-[#245faf]">Promociones</span>
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">{featuredItems.map((item) => <ProductCard key={itemKey(item)} item={item} fallback={solution.heroImage} quantity={cart[itemKey(item)] ?? 0} onChange={(delta) => changeQuantity(item, delta)} />)}</div>
                    </div>
                    <aside className="border-t border-[#eceef1] bg-[#fafbfc] p-4 md:border-l md:border-t-0"><div className="flex items-center justify-between"><h3 className="font-bold">Pedido del cliente</h3><ShoppingBag className="h-5 w-5 text-[#687181]" /></div><div className="mt-4 space-y-2">{cartLines.map(({ item, quantity }) => <div key={itemKey(item)} className="flex justify-between gap-2 text-xs"><span className="min-w-0 truncate text-[#596273]">{quantity} × {item.name}</span><span className="font-bold">{money(item.price * quantity)}</span></div>)}</div><div className="mt-4 flex items-center justify-between border-t border-[#dfe3e8] pt-3"><span className="text-sm text-[#596273]">Total</span><span className="text-lg font-bold">{money(total)}</span></div><div className="mt-3 rounded-xl bg-[#eef3ff] px-3 py-2 text-xs font-semibold text-[#245faf]">Recoger hoy · 18:30</div><button type="button" onClick={submitOrder} disabled={!cartCount} className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#111318] px-4 text-sm font-bold text-white disabled:opacity-40">Enviar pedido <ArrowRight className="h-4 w-4" /></button></aside>
                  </div>
                ) : null}

                {journey === "orders" ? (
                  <div className="min-h-[390px] bg-[#f6f7f9] p-3 sm:p-5">
                    <div className="grid gap-2 sm:grid-cols-3">{[{ id: "#106", customer: "María · 18:00", status: "Preparando" }, { id: "#107", customer: "Luis · domicilio", status: "Listo" }, { id: "#108", customer: "Cliente en línea", status: stage === "received" ? "Nuevo" : stage === "preparing" ? "Preparando" : "Listo" }].map((order, index) => <div key={order.id} className={`rounded-2xl border bg-white p-3 ${index === 2 ? "border-[#72cda7] ring-2 ring-[#10a568]/10" : "border-[#e1e5ea]"}`}><div className="flex items-center justify-between"><span className="text-xs font-bold text-[#7a8494]">{order.id}</span>{index === 2 ? <BellRing className="h-4 w-4 text-[#10a568]" /> : null}</div><p className="mt-2 truncate text-sm font-bold">{order.customer}</p><p className="mt-1 text-xs text-[#596273]">{order.status}</p></div>)}</div>
                    <div className="mt-3 rounded-2xl border border-[#dfe3e8] bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-[#3483fa]">PEDIDO #108</p><p className="mt-1 font-bold">{cartCount} {cartCount === 1 ? "artículo" : "artículos"} · recoger a las 18:30</p></div><span className="text-xl font-bold">{money(total)}</span></div><div className="mt-3 space-y-1">{cartLines.map(({ item, quantity }) => <p key={itemKey(item)} className="text-sm text-[#596273]">{quantity} × {item.name}</p>)}</div><button type="button" onClick={advanceOrder} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#3483fa] px-4 text-sm font-bold text-white">{stage === "received" ? "Aceptar pedido" : stage === "preparing" ? "Marcar como listo" : "Ir a cobrar"}<ArrowRight className="h-4 w-4" /></button></div>
                  </div>
                ) : null}

                {journey === "checkout" ? (
                  <div className="bg-[#f6f7f9] p-3 sm:p-5"><div className="rounded-2xl border border-[#dfe3e8] bg-white p-4 sm:p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold text-[#7a8494]">COBRO · PEDIDO #108</p><p className="mt-1 text-3xl font-bold">{money(total)}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${stage === "paid" ? "bg-[#e9f8f0] text-[#087443]" : "bg-[#eef3ff] text-[#245faf]"}`}>{stage === "paid" ? "Pagado" : "Listo para cobrar"}</span></div><div className="mt-4 grid grid-cols-3 gap-2">{["Efectivo", "Transferencia", "En línea"].map((method) => <button key={method} type="button" onClick={() => setPaymentMethod(method)} className={`min-h-14 rounded-xl border px-1 text-xs font-semibold ${paymentMethod === method ? "border-[#172033] bg-[#f3f5f8] ring-1 ring-[#172033]" : "border-[#dfe3e8]"}`}>{method}</button>)}</div>{stage !== "paid" ? <button type="button" onClick={chargeOrder} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#111318] px-4 text-sm font-bold text-white"><WalletCards className="h-4 w-4" />Confirmar cobro de {money(total)}</button> : <div className="mt-4"><div className="rounded-xl border border-[#a9dfc8] bg-[#f0fbf6] p-3"><p className="flex items-center gap-2 font-bold text-[#075d3a]"><CheckCircle2 className="h-5 w-5" />La operación quedó cerrada</p></div><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{[{ label: "Ticket", value: "#108" }, { label: "Venta", value: money(total) }, { label: "Cliente", value: "Guardado" }, { label: "Stock", value: `−${cartCount}` }].map((result) => <div key={result.label} className="rounded-xl bg-[#f3f5f8] p-3"><p className="text-[10px] font-bold text-[#7a8494]">{result.label.toUpperCase()}</p><p className="mt-1 text-sm font-bold">{result.value}</p></div>)}</div><button type="button" onClick={resetJourney} className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-[#dfe3e8] text-sm font-semibold">Repetir recorrido</button></div>}</div></div>
                ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="capacidades" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18">
          <div className="max-w-3xl"><p className="text-sm font-semibold text-[#3483fa]">NO ES SÓLO UNA TIENDA</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">Elige qué quieres resolver y mira qué hará Tlaco.</h2><p className="mt-4 leading-7 text-[#596273]">Empiezas con lo esencial. Estas capacidades trabajan sobre el mismo catálogo, clientes, pedidos y caja; no son sistemas separados.</p></div>
          <div className="-mx-4 mt-7 flex snap-x gap-2 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 xl:grid-cols-7">{CAPABILITIES.map(({ key, title, short, icon: Icon }) => <button key={key} type="button" onClick={() => { setActiveCapability(key); measure("solution_capability_viewed", { solution: solution.path, capability: key }); }} className={`min-h-28 w-40 shrink-0 snap-start rounded-2xl border p-3 text-left transition md:w-auto ${activeCapability === key ? "border-[#172033] bg-[#172033] text-white ring-1 ring-[#172033]" : "border-[#dfe3e8] bg-white hover:border-[#aeb7c4]"}`}><Icon className={`h-5 w-5 ${activeCapability === key ? "text-[#72a8ff]" : "text-[#3483fa]"}`} /><span className="mt-3 block text-sm font-bold leading-tight">{title}</span><span className={`mt-1 block text-[11px] leading-4 ${activeCapability === key ? "text-white/60" : "text-[#7a8494]"}`}>{short}</span></button>)}</div>

          <div className="mt-5 grid min-h-[390px] gap-7 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
            <div><span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef3ff] text-[#3483fa]"><CapabilityIcon className="h-5 w-5" /></span><h3 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">{capability.promise}</h3><ul className="mt-5 space-y-3">{capability.benefits.map((benefit) => <li key={benefit} className="flex items-start gap-3 text-sm text-[#596273]"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#10a568]" />{benefit}</li>)}</ul><p className="mt-5 rounded-xl bg-[#f6f8fb] px-4 py-3 text-sm text-[#596273]"><strong className="text-[#172033]">Ventaja para tu negocio:</strong> toda esta información termina en la misma operación y en el historial del cliente.</p></div>
            <CapabilityPreview capability={capability} done={completedCapabilities[capability.key] === true} onAction={runCapabilityAction} name={name} previewUrl={previewUrl} />
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-5 rounded-3xl bg-[#111318] p-6 text-white sm:flex-row sm:p-8"><div><p className="text-xs font-bold text-[#72a8ff]">EMPIEZA CON LO QUE YA ELEGISTE</p><h3 className="mt-2 text-2xl font-bold">Tu sitio nace publicado y los pedidos se abren al terminar la preparación.</h3><p className="mt-2 text-sm text-white/65">Plan Gratis, sin tarjeta y sin activar una membresía pagada automáticamente.</p></div><button type="button" onClick={openOnboarding} className="inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-[#111318] sm:w-auto">Preparar {name}<ArrowRight className="h-4 w-4" /></button></div>
        </section>
      </main>

      <footer className="border-t border-[#eceef1] px-4 py-7 text-center text-sm text-[#7a8494]">Tlaco conecta tienda, pedidos, clientes y caja en una sola operación.</footer>
    </div>
  );
}
