import {
  Check,
  Clock,
  PackageCheck,
  Plus,
  QrCode,
  ScanLine,
  Search,
  Store,
} from "lucide-react";

import type { HeroBeat, HeroPhoneView } from "@/features/landing/constants/heroDemo";

/**
 * La mitad del cliente en la demo del hero. Refleja las pantallas reales de
 * `src/app/q/[token]/**` y del storefront: bloque magenta de marca arriba,
 * contenido abajo, barra de acción al pie. Solo presentación.
 *
 * Cada vista LLENA su alto (`flex-1` + contenido suficiente). Una pantalla con
 * un hueco vacío en medio se lee como algo roto, no como una demo.
 */

/** Bloque de marca — misma forma que el hero de <CustomerScreenLayout>. */
function PhoneHero({ title, kicker }: { title: string; kicker: string }) {
  return (
    <div className="shrink-0 rounded-b-2xl bg-accent px-3 pb-3 pt-3">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-foreground/20 text-accent-foreground">
          <Store className="h-3.5 w-3.5" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[9px] font-bold uppercase tracking-wider text-accent-foreground/75">
            {kicker}
          </p>
          <p className="truncate text-sm font-bold leading-tight text-accent-foreground">
            {title}
          </p>
        </div>
      </div>
    </div>
  );
}

/** Fila de producto reutilizable. */
function ItemRow({
  name,
  price,
  added = false,
}: {
  name: string;
  price: string;
  added?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl border bg-surface p-2 ${
        added ? "border-accent" : "border-border"
      }`}
    >
      {/* Miniatura con "contenido" — un bloque plano se ve sin terminar. */}
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/12"
        aria-hidden
      >
        <span className="h-3.5 w-3.5 rounded-sm bg-accent/35" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-bold leading-tight text-foreground">
          {name}
        </p>
        <p className="mt-0.5 text-[11px] font-bold text-accent">{price}</p>
      </div>
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          added ? "bg-accent text-accent-foreground" : "bg-accent/12 text-accent"
        }`}
      >
        {added ? (
          <Check className="h-3 w-3" aria-hidden strokeWidth={3} />
        ) : (
          <Plus className="h-3 w-3" aria-hidden />
        )}
      </span>
    </div>
  );
}

/** Chips de categoría — dan textura real al catálogo. */
function CategoryChips({ active }: { active: string }) {
  return (
    <div className="flex gap-1.5">
      {["Todo", "Servicios", "Bebidas"].map((c) => (
        <span
          key={c}
          className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
            c === active
              ? "bg-accent text-accent-foreground"
              : "bg-border-soft text-muted-foreground dark:bg-border"
          }`}
        >
          {c}
        </span>
      ))}
    </div>
  );
}

function ScanView() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
      <div className="relative flex h-26 w-26 items-center justify-center rounded-2xl border-2 border-accent/30 bg-surface-raised">
        <QrCode className="h-14 w-14 text-foreground" aria-hidden />
        <span
          className="absolute inset-x-3 top-1/2 h-0.5 rounded-full bg-accent"
          aria-hidden
        />
      </div>
      <div>
        <p className="flex items-center justify-center gap-1 text-sm font-bold text-foreground">
          <ScanLine className="h-3.5 w-3.5 text-accent" aria-hidden />
          Mesa 4
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Sin app · Sin registro
        </p>
      </div>
    </div>
  );
}

function MenuView() {
  return (
    <>
      <PhoneHero kicker="Tu mesa" title="¿Qué vas a pedir?" />
      <div className="flex flex-1 flex-col gap-2 p-2.5">
        <div className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-2.5 py-2">
          <Search className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
          <span className="text-[10px] text-muted-foreground">
            Buscar producto...
          </span>
        </div>
        <CategoryChips active="Servicios" />
        <ItemRow name="Lavado bronce" price="$100.00" />
        <ItemRow name="Encerado" price="$150.00" added />
        <ItemRow name="Bebida 473ml" price="$34.00" />
      </div>
    </>
  );
}

const TRACKER = [
  {
    key: "received",
    label: "Recibido",
    hint: "Tu pedido llegó al negocio",
    icon: Check,
  },
  {
    key: "in_progress",
    label: "En proceso",
    hint: "Lo están preparando",
    icon: Clock,
  },
  {
    key: "ready",
    label: "Listo",
    hint: "Ya puedes pagar",
    icon: PackageCheck,
  },
];

function TrackerView() {
  return (
    <>
      <PhoneHero kicker="Tu pedido" title="Mesa 4" />
      <div className="flex flex-1 flex-col justify-center gap-2 p-2.5">
        {TRACKER.map(({ key, label, hint, icon: Icon }, i) => {
          const current = i === 2;
          return (
            <div
              key={key}
              className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 ${
                current
                  ? "border-accent bg-accent/8"
                  : "border-border bg-surface"
              }`}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Icon className="h-3 w-3" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-bold leading-tight text-foreground">
                  {label}
                </p>
                <p className="truncate text-[10px] leading-tight text-muted-foreground">
                  {hint}
                </p>
              </div>
              {current && (
                <span className="shrink-0 text-[10px] font-bold text-accent">
                  Ahora
                </span>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

/** Cuotas — el cliente elige en cuántos pagos lo quiere. */
function SubscriptionView() {
  const plans = [
    { label: "1 pago", detail: "Hoy, completo", price: "$1,200", active: false },
    { label: "3 pagos", detail: "Cada 15 días", price: "$400", active: true },
    { label: "6 pagos", detail: "Cada mes", price: "$200", active: false },
  ];
  return (
    <>
      <PhoneHero kicker="Cómo quieres pagar" title="Elige tus pagos" />
      <div className="flex flex-1 flex-col justify-center gap-2 p-2.5">
        {plans.map((p) => (
          <div
            key={p.label}
            className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 ${
              p.active ? "border-accent bg-accent/8" : "border-border bg-surface"
            }`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                p.active ? "border-accent bg-accent" : "border-border"
              }`}
            >
              {p.active && (
                <Check
                  className="h-2 w-2 text-accent-foreground"
                  aria-hidden
                  strokeWidth={4}
                />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-bold leading-tight text-foreground">
                {p.label}
              </p>
              <p className="truncate text-[10px] leading-tight text-muted-foreground">
                {p.detail}
              </p>
            </div>
            <span className="shrink-0 text-[11px] font-bold text-foreground">
              {p.price}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

/** Préstamo — el cliente ve su plan y abona. */
function LoanView() {
  return (
    <>
      <PhoneHero kicker="Tu crédito" title="Abono 3 de 6" />
      <div className="flex flex-1 flex-col justify-center gap-3 p-3 text-center">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Tu abono de hoy
          </p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">
            $500
            <span className="text-lg">.00</span>
          </p>
        </div>
        <div>
          <div className="flex gap-1" aria-hidden>
            {[true, true, true, false, false, false].map((paid, i) => (
              <span
                key={i}
                className={`h-2 flex-1 rounded-full ${
                  paid ? "bg-accent" : "bg-border"
                }`}
              />
            ))}
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Te faltan 3 abonos · $1,500.00
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface px-2.5 py-2 text-left">
          <p className="text-[10px] text-muted-foreground">Próximo abono</p>
          <p className="text-[11px] font-bold text-foreground">
            8 de agosto · automático
          </p>
        </div>
      </div>
    </>
  );
}

/** Storefront — tu sitio web público. */
function StorefrontView() {
  return (
    <>
      <PhoneHero kicker="Tienda en línea" title="Mi Negocio" />
      <div className="flex flex-1 flex-col gap-2 p-2.5">
        <CategoryChips active="Todo" />
        <div className="grid grid-cols-2 gap-2">
          {[
            { price: "$320.00", name: "Paquete básico" },
            { price: "$180.00", name: "Servicio express" },
          ].map((p) => (
            <div
              key={p.name}
              className="overflow-hidden rounded-xl border border-border bg-surface"
            >
              <div
                className="flex h-12 items-center justify-center bg-accent/12"
                aria-hidden
              >
                <span className="h-5 w-5 rounded-md bg-accent/35" />
              </div>
              <div className="p-1.5">
                <p className="truncate text-[10px] font-bold leading-tight text-foreground">
                  {p.name}
                </p>
                <p className="mt-0.5 text-[11px] font-bold text-accent">
                  {p.price}
                </p>
              </div>
            </div>
          ))}
        </div>
        <ItemRow name="Paquete completo" price="$640.00" added />
      </div>
    </>
  );
}

function PaidView() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white">
        <Check className="h-8 w-8" aria-hidden strokeWidth={3} />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          Pago confirmado
        </p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">
          $284
          <span className="text-lg">.00</span>
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground">
          Mesa 4 · Mercado Pago
        </p>
      </div>
      <div className="rounded-full border border-border bg-surface px-3 py-1.5">
        <span className="text-[10px] font-semibold text-foreground">
          Tu comprobante ya está listo
        </span>
      </div>
    </div>
  );
}

const VIEWS: Record<HeroPhoneView, () => React.JSX.Element> = {
  scan: ScanView,
  menu: MenuView,
  tracker: TrackerView,
  subscription: SubscriptionView,
  loan: LoanView,
  storefront: StorefrontView,
  paid: PaidView,
};

/** Barra inferior — solo cuando el cliente tiene una acción siguiente. */
const FOOTER_LABEL: Partial<Record<HeroPhoneView, string>> = {
  menu: "Enviar pedido · $284.00",
  subscription: "Pagar en 3 · $400.00",
  loan: "Pagar mi abono",
  storefront: "Comprar · $640.00",
};

export function HeroPhone({ beat }: { beat: HeroBeat }) {
  const View = VIEWS[beat.phone.view];
  const footer = FOOTER_LABEL[beat.phone.view];

  return (
    <div className="relative">
      {/* Chrome del dispositivo. Alto fijo para que los beats no muevan el hero. */}
      {/* En móvil el celular va más compacto para que la demo entre en la
          primera pantalla; desde `lg` recupera tamaño completo. */}
      <div className="w-46.5 rounded-[1.6rem] border border-border bg-surface-raised p-1.5 shadow-card lg:w-54">
        <div className="relative overflow-hidden rounded-[1.3rem] bg-surface">
          <div
            key={beat.key}
            className="animate-fade-in-up flex h-74 flex-col lg:h-92"
          >
            {/* `flex-1 min-h-0` da base real a la vista — sin esto las vistas
                que usan `flex-1` colapsan a cero. */}
            <div className="flex min-h-0 flex-1 flex-col">
              <View />
            </div>
            {footer && (
              <div className="shrink-0 border-t border-border bg-surface p-2.5">
                <div className="flex items-center justify-center rounded-xl bg-accent px-3 py-2 text-[11px] font-bold text-accent-foreground">
                  {footer}
                </div>
              </div>
            )}
          </div>

          {/* Ripple del tap en el momento en que el cliente actúa. */}
          {beat.phone.tap && (
            <span
              key={`${beat.key}-tap`}
              className="animate-hero-tap pointer-events-none absolute bottom-10 left-1/2 h-14 w-14 -translate-x-1/2 rounded-full bg-accent"
              aria-hidden
            />
          )}
        </div>
      </div>
    </div>
  );
}
