"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  CheckCircle,
  MapPin,
  Phone,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";

// ─── Confetti ──────────────────────────────────────────────────
const CONFETTI_COLORS = [
  "#ec4899",
  "#f472b6",
  "#fb923c",
  "#fbbf24",
  "#34d399",
  "#60a5fa",
  "#a78bfa",
  "#f43f5e",
  "#10b981",
  "#38bdf8",
  "#c084fc",
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
  return Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    // Negative delays pre-populate the screen for an instant burst
    delay: i < 30 ? -(Math.random() * 4) : Math.random() * 3,
    duration: 2.8 + Math.random() * 2.2,
    size: 5 + Math.floor(Math.random() * 8),
    isCircle: Math.random() > 0.38,
    driftLeft: Math.random() > 0.5,
  }));
}

// ─── Props ─────────────────────────────────────────────────────
interface Props {
  slug: string;
  accentColor: string;
  orderId: string;
  customerName: string;
  formattedAddress: string;
  phone?: string | null;
}

// ─── Component ─────────────────────────────────────────────────
export function PaymentSuccessFullScreen({
  slug,
  accentColor,
  orderId,
  customerName,
  formattedAddress,
  phone,
}: Props) {
  const confettiRef = useRef<ConfettiPiece[]>(generateConfetti());

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-background">
      {/* Subtle top glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-linear-to-b to-transparent"
        aria-hidden
      />

      {/* Confetti rain */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
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

      {/* Centered content */}
      <div className="relative flex min-h-full flex-col items-center justify-center px-4 py-10">
        <div
          className="w-full max-w-sm rounded-xl border border-border bg-surface shadow-card"
          style={{
            animation:
              "success-bounce-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both",
          }}
        >
          {/* Icon + headline */}
          <div className="flex flex-col items-center px-6 pb-6 pt-8 text-center">
            <div
              className="mb-5 flex h-16 w-16 items-center justify-center rounded-full"
              style={{
                backgroundColor: `${accentColor}20`,
                animation:
                  "icon-pop 0.5s 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both",
              }}
            >
              <CheckCircle className="h-9 w-9" style={{ color: accentColor }} />
            </div>

            {/* Pink accent bar — matches landing style */}
            <div
              className="mb-4 h-1 w-8 rounded-full bg-emerald-400"
              style={{ animation: "float-up 0.4s 0.35s both" }}
              aria-hidden
            />

            <h1
              className="text-2xl font-bold tracking-tight text-foreground"
              style={{ animation: "float-up 0.4s 0.4s both" }}
            >
              ¡Pago exitoso!
            </h1>

            {/* Order badge */}
            <div
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-sm font-medium text-emerald-700"
              style={{ animation: "float-up 0.4s 0.45s both" }}
            >
              <ShoppingBag className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Orden #{orderId.slice(0, 8).toUpperCase()}
            </div>

            <p
              className="mt-3 text-sm leading-relaxed text-muted-foreground"
              style={{ animation: "float-up 0.4s 0.5s both" }}
            >
              Hola{" "}
              <span className="font-semibold text-foreground">
                {customerName}
              </span>
              , tu pedido fue confirmado. Puedes pasar a recogerlo en:
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Pickup address */}
          <div
            className="p-5"
            style={{ animation: "float-up 0.4s 0.55s both" }}
          >
            <div className="rounded-xl border border-border bg-surface-raised p-4">
              <div className="flex items-start gap-3">
                <MapPin
                  className="mt-0.5 h-5 w-5 shrink-0"
                  style={{ color: accentColor }}
                />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Dirección de recolección
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formattedAddress}
                  </p>
                </div>
              </div>
              {phone && (
                <div className="mt-3 flex items-center gap-3">
                  <Phone
                    className="h-4 w-4 shrink-0"
                    style={{ color: accentColor }}
                  />
                  <a
                    href={`tel:${phone}`}
                    className="text-sm text-muted-foreground hover:underline"
                  >
                    {phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* CTAs */}
          <div
            className="px-5 pb-6 pt-4"
            style={{ animation: "float-up 0.4s 0.65s both" }}
          >
            <Link
              href={`/sitio/${slug}/productos`}
              className="group inline-flex w-full min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl px-8 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ backgroundColor: accentColor }}
            >
              Seguir comprando
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
            <Link
              href={`/sitio/${slug}/inicio`}
              className="mt-3 inline-flex w-full min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl border-2 px-8 py-3 text-base font-semibold transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ borderColor: accentColor, color: accentColor }}
            >
              Volver al inicio
            </Link>
          </div>
        </div>

        <p
          className="mt-5 text-sm text-muted-foreground"
          style={{ animation: "float-up 0.4s 0.75s both" }}
        >
          Gracias por tu compra
        </p>
      </div>
    </div>
  );
}
