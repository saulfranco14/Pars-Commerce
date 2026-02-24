"use client";

import Image from "next/image";
import { useRef } from "react";
import {
  ArrowRight,
  Store,
  Package,
  ShoppingCart,
  BarChart3,
} from "lucide-react";

// ─── Confetti ──────────────────────────────────────────────────
const CONFETTI_COLORS = [
  "#ec4899", "#f472b6", "#fb923c", "#fbbf24",
  "#34d399", "#60a5fa", "#a78bfa", "#f43f5e",
  "#10b981", "#38bdf8", "#c084fc",
];

interface ConfettiPiece {
  id: number;
  left: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
  isCircle: boolean;
  driftLeft: boolean;
}

function generateConfetti(): ConfettiPiece[] {
  return Array.from({ length: 80 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    // Negative delays pre-populate the screen for an instant burst
    delay: i < 40 ? -(Math.random() * 4) : Math.random() * 3,
    duration: 2.8 + Math.random() * 2.2,
    size: 5 + Math.floor(Math.random() * 8),
    isCircle: Math.random() > 0.38,
    driftLeft: Math.random() > 0.5,
  }));
}

// ─── Feature cards ─────────────────────────────────────────────
const FEATURES = [
  {
    Icon: Package,
    label: "Productos",
    sub: "Crea tu catálogo",
    colorClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  {
    Icon: ShoppingCart,
    label: "Órdenes",
    sub: "Genera tickets",
    colorClass: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  },
  {
    Icon: BarChart3,
    label: "Ventas",
    sub: "Analiza datos",
    colorClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
] as const;

// ─── Component ─────────────────────────────────────────────────
interface BusinessCreatedSuccessProps {
  businessName: string;
  onGoToDashboard: () => void;
}

export function BusinessCreatedSuccess({
  businessName,
  onGoToDashboard,
}: BusinessCreatedSuccessProps) {
  const confettiRef = useRef<ConfettiPiece[]>(generateConfetti());

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-background">
      {/* ── Subtle top glow — matches landing hero ──────────── */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-linear-to-b from-accent/[0.07] to-transparent"
        aria-hidden
      />

      {/* ── Confetti rain ───────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {confettiRef.current.map((p) => (
          <div
            key={p.id}
            className="confetti-piece absolute top-0"
            style={{
              left: `${p.left}%`,
              width: p.isCircle ? p.size : Math.round(p.size * 1.5),
              height: p.isCircle ? p.size : Math.round(p.size * 0.45),
              borderRadius: p.isCircle ? "50%" : 2,
              backgroundColor: p.color,
              animation: `${p.driftLeft ? "confetti-fall-l" : "confetti-fall-r"} ${p.duration}s ${p.delay}s infinite linear`,
            }}
          />
        ))}
      </div>

      {/* ── Centered content ────────────────────────────────── */}
      <div className="relative flex h-full flex-col items-center justify-center px-4 py-10">

        {/* Card */}
        <div
          className="w-full max-w-sm rounded-xl border border-border bg-surface shadow-card"
          style={{
            animation:
              "success-bounce-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both",
          }}
        >
          {/* ── Logo + headline ─────────────────────────────── */}
          <div className="flex flex-col items-center px-6 pb-6 pt-8 text-center">

            {/* App logo */}
            <div
              className="mb-5"
              style={{ animation: "float-up 0.4s 0.3s both" }}
            >
              <Image
                src="/android-chrome-192x192.png"
                alt="Pars Commerce"
                width={72}
                height={72}
                className="rounded-2xl shadow-card"
                priority
              />
            </div>

            {/* Pink accent divider — matches LandingHowItWorks */}
            <div
              className="mb-4 h-1 w-8 rounded-full bg-accent"
              style={{ animation: "float-up 0.4s 0.35s both" }}
              aria-hidden
            />

            {/* Title */}
            <h1
              className="text-2xl font-bold tracking-tight text-foreground"
              style={{ animation: "float-up 0.4s 0.4s both" }}
            >
              ¡Negocio creado!
            </h1>

            {/* Business name badge — matches LandingHero pill */}
            <div
              className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3.5 py-1.5 text-sm font-medium text-accent"
              style={{ animation: "float-up 0.4s 0.45s both" }}
            >
              <Store className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">{businessName}</span>
            </div>

            {/* Description */}
            <p
              className="mt-3 text-sm leading-relaxed text-muted-foreground"
              style={{ animation: "float-up 0.4s 0.5s both" }}
            >
              Tu negocio está listo. Empieza a gestionarlo todo desde el
              dashboard.
            </p>
          </div>

          {/* ── Divider ─────────────────────────────────────── */}
          <div className="border-t border-border" />

          {/* ── Feature cards — matches LandingHowItWorks ───── */}
          <div
            className="grid grid-cols-3 gap-3 p-5"
            style={{ animation: "float-up 0.4s 0.55s both" }}
          >
            {FEATURES.map(({ Icon, label, sub, colorClass }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface-raised p-3 text-center"
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${colorClass}`}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </div>
                <p className="text-[11px] font-semibold leading-tight text-foreground">
                  {label}
                </p>
                <p className="text-[10px] leading-tight text-muted-foreground">
                  {sub}
                </p>
              </div>
            ))}
          </div>

          {/* ── CTA ─────────────────────────────────────────── */}
          <div
            className="px-5 pb-6"
            style={{ animation: "float-up 0.4s 0.65s both" }}
          >
            <button
              onClick={onGoToDashboard}
              className="group inline-flex w-full min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-8 py-3 text-base font-semibold text-accent-foreground transition-colors duration-200 hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
            >
              Ir al Dashboard
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden
              />
            </button>
          </div>
        </div>

        {/* Tagline below card */}
        <p
          className="mt-5 text-sm text-muted-foreground"
          style={{ animation: "float-up 0.4s 0.75s both" }}
        >
          Bienvenido a Pars Commerce
        </p>
      </div>
    </div>
  );
}
