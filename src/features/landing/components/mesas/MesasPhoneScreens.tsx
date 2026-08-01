import {
  Check,
  Clock,
  PackageCheck,
  QrCode,
  ScanLine,
  ShieldCheck,
  Store,
  Users,
  Wallet,
} from "lucide-react";

/**
 * Static mockups of the real customer screens (`src/app/q/[token]/table/**`),
 * one per step of the interactive demo. Presentational only — no state, no
 * fetching. Copy neutral/multinegocio (CLAUDE.md §6).
 *
 * They are intentionally simplified: the goal is that a prospect recognizes the
 * flow in two seconds, not a pixel-perfect replica.
 */

const DEMO_ITEMS = [
  { name: "Servicio básico", qty: 1, price: 120 },
  { name: "Extra premium", qty: 2, price: 82 },
];

function PhoneHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-border bg-surface-raised px-4 py-3">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
        <Store className="h-4 w-4" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-bold text-foreground">
          Mi Negocio
        </p>
        <p className="truncate text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

/** Step 1 — scanning the QR with the phone camera. */
export function ScanScreen() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 bg-foreground/[0.04] px-6 text-center">
      <div className="relative flex h-36 w-36 items-center justify-center rounded-2xl border-2 border-accent/30 bg-surface">
        <QrCode className="h-20 w-20 text-foreground" aria-hidden />
        <span
          className="absolute inset-x-4 top-1/2 h-0.5 animate-pulse rounded-full bg-accent"
          aria-hidden
        />
      </div>
      <div>
        <p className="flex items-center justify-center gap-1.5 text-sm font-bold text-foreground">
          <ScanLine className="h-4 w-4 text-accent" aria-hidden />
          Mesa 4
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Sin app. Sin registro.
        </p>
      </div>
    </div>
  );
}

/** Step 2 — building the order from the catalog. */
export function OrderScreen() {
  return (
    <div className="flex h-full flex-col">
      <PhoneHeader label="Mesa 4 · Arma tu pedido" />
      <div className="flex-1 space-y-2 overflow-hidden p-3">
        {DEMO_ITEMS.map((item, i) => (
          <div
            key={item.name}
            className="flex items-center gap-2.5 rounded-xl border border-border bg-surface p-2.5"
          >
            <div className="h-10 w-10 shrink-0 rounded-lg bg-accent/10" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-bold text-foreground">
                {item.name}
              </p>
              <p className="text-[10px] text-muted-foreground">
                ${item.price}.00
              </p>
            </div>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent text-[11px] font-bold text-accent-foreground">
              {i === 0 ? 1 : 2}
            </span>
          </div>
        ))}
        <div className="rounded-xl border border-dashed border-border p-2.5">
          <div className="h-2 w-20 rounded-full bg-border" aria-hidden />
          <div className="mt-2 h-2 w-14 rounded-full bg-border/60" aria-hidden />
        </div>
      </div>
      <div className="border-t border-border bg-surface p-3">
        <div className="flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-accent-foreground">
          Enviar pedido · $284.00
        </div>
      </div>
    </div>
  );
}

const TIMELINE = [
  { key: "received", label: "Recibido", icon: Check },
  { key: "in_progress", label: "En proceso", icon: Clock },
  { key: "ready", label: "Listo", icon: PackageCheck },
];

/** Steps 3 & 4 — the fulfillment tracker. `activeIndex` marks current stage. */
function TrackerScreen({
  activeIndex,
  headline,
  caption,
}: {
  activeIndex: number;
  headline: string;
  caption: string;
}) {
  return (
    <div className="flex h-full flex-col">
      <PhoneHeader label="Mesa 4 · Tu pedido" />
      <div className="flex flex-1 flex-col justify-center gap-5 p-4">
        <div className="text-center">
          <p className="text-sm font-bold text-foreground">{headline}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{caption}</p>
        </div>
        <ol className="space-y-2.5">
          {TIMELINE.map(({ key, label, icon: Icon }, i) => {
            const done = i <= activeIndex;
            const current = i === activeIndex;
            return (
              <li
                key={key}
                className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-colors ${
                  current
                    ? "border-accent bg-accent/5"
                    : done
                      ? "border-border bg-surface"
                      : "border-border bg-surface opacity-45"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    done
                      ? "bg-accent text-accent-foreground"
                      : "bg-border text-muted-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                </span>
                <span className="text-[11px] font-bold text-foreground">
                  {label}
                </span>
                {current && (
                  <span className="ml-auto text-[10px] font-semibold text-accent">
                    Ahora
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

export function InProgressScreen() {
  return (
    <TrackerScreen
      activeIndex={1}
      headline="Tu pedido va en camino"
      caption="No tienes que preguntarle a nadie."
    />
  );
}

export function ReadyScreen() {
  return (
    <TrackerScreen
      activeIndex={2}
      headline="¡Tu pedido está listo!"
      caption="Ya puedes pagar desde aquí."
    />
  );
}

/** Step 5 — splitting the bill between the people at the table. */
export function SplitScreen() {
  const people = [
    { name: "Tú", amount: 202, active: true },
    { name: "Ana", amount: 82, active: false },
  ];
  return (
    <div className="flex h-full flex-col">
      <PhoneHeader label="Mesa 4 · Dividir la cuenta" />
      <div className="flex-1 space-y-3 p-3">
        <div className="rounded-xl border-2 border-accent bg-accent/5 px-3 py-2.5">
          <p className="text-[11px] font-bold text-foreground">
            Lo que pidió cada quien
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Cada persona paga sus propios productos.
          </p>
        </div>
        {["Partes iguales", "Elegir quién paga qué"].map((label) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-surface px-3 py-2.5"
          >
            <p className="text-[11px] font-bold text-foreground">{label}</p>
          </div>
        ))}
        <div className="space-y-2 rounded-xl border border-border bg-surface p-3">
          {people.map((p) => (
            <div key={p.name} className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                  p.active
                    ? "bg-accent text-accent-foreground"
                    : "bg-border text-muted-foreground"
                }`}
              >
                {p.name.charAt(0)}
              </span>
              <span className="text-[11px] font-medium text-foreground">
                {p.name}
              </span>
              <span className="ml-auto text-[11px] font-bold text-foreground">
                ${p.amount}.00
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-border bg-surface p-3">
        <div className="flex items-center justify-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-accent-foreground">
          <Users className="h-3.5 w-3.5" aria-hidden />
          Pagar mi parte · $202.00
        </div>
      </div>
    </div>
  );
}

/** Step 6 — payment confirmed. The amount is the visual protagonist. */
export function PaidScreen() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-emerald-500/[0.06] px-5 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white">
        <Check className="h-8 w-8" aria-hidden strokeWidth={3} />
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
          Pago confirmado
        </p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">
          $284.00
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Mesa 4 · Mercado Pago
        </p>
      </div>
      <div className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5">
        <Wallet className="h-3.5 w-3.5 text-accent" aria-hidden />
        <span className="text-[10px] font-medium text-foreground">
          Ya está en tu panel
        </span>
      </div>
      <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <ShieldCheck className="h-3 w-3" aria-hidden />
        Pago protegido por Mercado Pago
      </p>
    </div>
  );
}

/** Screen component per demo step key — consumed by the simulator. */
export const MESAS_DEMO_SCREENS: Record<string, () => React.JSX.Element> = {
  scan: ScanScreen,
  order: OrderScreen,
  progress: InProgressScreen,
  ready: ReadyScreen,
  split: SplitScreen,
  pay: PaidScreen,
};
