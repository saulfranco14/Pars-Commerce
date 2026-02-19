"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, X } from "lucide-react";

const STORAGE_KEY = "pars_onboarding_v1";

// ─── Shared mini card ─────────────────────────────────────────
function MiniCard({
  children,
  className = "",
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-2xl bg-white shadow-lg ${className}`}
      style={{ border: "1px solid #ede9e4", ...style }}
    >
      {children}
    </div>
  );
}

// ─── Slide mockup components ──────────────────────────────────

function WelcomeMockup() {
  const bars = [30, 55, 40, 70, 50, 85, 60];
  return (
    <div className="relative mx-auto h-52 w-72">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-40 rounded-full bg-gradient-to-br from-pink-400 to-orange-300 opacity-20 blur-3xl" />
      </div>

      {/* Revenue card – main focus */}
      <MiniCard
        className="absolute"
        style={{ top: 8, left: 16, width: 162, transform: "rotate(-2deg)" }}
      >
        <div className="p-3">
          <p className="text-[9px]" style={{ color: "#a8a29e" }}>
            Ventas hoy
          </p>
          <p
            className="text-[22px] font-bold leading-tight"
            style={{ color: "#ec4899" }}
          >
            $4,250
          </p>
          <p className="text-[8px]" style={{ color: "#10b981" }}>
            ↑ +8% vs ayer
          </p>
          <div className="mt-2 flex h-8 items-end gap-0.5">
            {bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  height: `${h}%`,
                  background: i === 5 ? "#ec4899" : "#fce7f3",
                }}
              />
            ))}
          </div>
        </div>
      </MiniCard>

      {/* Orders badge */}
      <MiniCard
        className="absolute"
        style={{ top: 62, right: 12, width: 112, transform: "rotate(3.5deg)" }}
      >
        <div className="p-3">
          <p className="text-[9px]" style={{ color: "#a8a29e" }}>
            Órdenes
          </p>
          <p
            className="text-[24px] font-bold leading-none"
            style={{ color: "#292524" }}
          >
            12
          </p>
          <p className="text-[8px]" style={{ color: "#a8a29e" }}>
            esta semana
          </p>
        </div>
      </MiniCard>

      {/* Recent sale strip */}
      <MiniCard
        className="absolute"
        style={{ bottom: 6, left: 24, right: 16, transform: "rotate(1deg)" }}
      >
        <div className="flex items-center justify-between p-2.5">
          <div>
            <p
              className="text-[9px] font-semibold"
              style={{ color: "#292524" }}
            >
              Juan García
            </p>
            <p className="text-[8px]" style={{ color: "#a8a29e" }}>
              Hace 5 min
            </p>
          </div>
          <p className="text-[11px] font-bold" style={{ color: "#ec4899" }}>
            $350
          </p>
        </div>
      </MiniCard>
    </div>
  );
}

function ProductosMockup() {
  const products = [
    { name: "Camisa clásica", price: "$450", bg: "#fef3c7", dot: "#fbbf24" },
    { name: "Pantalón slim", price: "$680", bg: "#dbeafe", dot: "#60a5fa" },
    { name: "Zapatos derby", price: "$890", bg: "#d1fae5", dot: "#34d399" },
    { name: "Bolsa tote", price: "$320", bg: "#fce7f3", dot: "#f472b6" },
  ];
  return (
    <div className="relative mx-auto h-52 w-72">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-40 rounded-full bg-gradient-to-br from-orange-300 to-yellow-300 opacity-20 blur-3xl" />
      </div>

      {/* Product grid card */}
      <MiniCard
        className="absolute"
        style={{ top: 4, left: 14, right: 14, transform: "rotate(-1deg)" }}
      >
        <div className="p-2.5">
          <div className="mb-2 flex items-center justify-between">
            <p
              className="text-[9px] font-semibold"
              style={{ color: "#292524" }}
            >
              Productos
            </p>
            <div
              className="flex h-4 w-4 items-center justify-center rounded-full"
              style={{ background: "#ec4899" }}
            >
              <span className="text-[8px] font-bold text-white">+</span>
            </div>
          </div>
          {/* Filter tabs */}
          <div className="mb-2 flex gap-1">
            {["Todos", "Ropa", "Calzado"].map((t, i) => (
              <span
                key={t}
                className="rounded-full px-2 py-0.5 text-[7px] font-medium"
                style={
                  i === 0
                    ? { background: "#ec4899", color: "white" }
                    : { background: "#f5f5f4", color: "#78716c" }
                }
              >
                {t}
              </span>
            ))}
          </div>
          {/* 2×2 product grid */}
          <div className="grid grid-cols-2 gap-1.5">
            {products.map((p) => (
              <div
                key={p.name}
                className="overflow-hidden rounded-xl"
                style={{ border: "1px solid #ede9e4" }}
              >
                <div
                  className="flex h-12 items-center justify-center"
                  style={{ background: p.bg }}
                >
                  <div
                    className="h-6 w-6 rounded-lg"
                    style={{ background: p.dot }}
                  />
                </div>
                <div className="p-1.5">
                  <p
                    className="text-[7px] font-medium leading-tight"
                    style={{ color: "#292524" }}
                  >
                    {p.name}
                  </p>
                  <p
                    className="text-[9px] font-bold"
                    style={{ color: "#ec4899" }}
                  >
                    {p.price}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </MiniCard>
    </div>
  );
}

function ServiciosMockup() {
  const services = [
    {
      name: "Corte de cabello",
      time: "1h",
      price: "$250",
      bg: "#ede9fe",
      dot: "#a78bfa",
    },
    {
      name: "Masaje relajante",
      time: "1.5h",
      price: "$450",
      bg: "#d1fae5",
      dot: "#34d399",
    },
    {
      name: "Manicure completo",
      time: "45min",
      price: "$180",
      bg: "#fce7f3",
      dot: "#f472b6",
    },
  ];
  return (
    <div className="relative mx-auto h-52 w-72">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-40 rounded-full bg-gradient-to-br from-violet-400 to-indigo-300 opacity-20 blur-3xl" />
      </div>

      <MiniCard
        className="absolute"
        style={{ top: -30, left: 14, right: 14, transform: "rotate(1.5deg)" }}
      >
        <div className="p-2.5">
          <div className="mb-2.5 flex items-center justify-between">
            <p
              className="text-[9px] font-semibold"
              style={{ color: "#292524" }}
            >
              Servicios
            </p>
            <div
              className="flex h-4 w-4 items-center justify-center rounded-full"
              style={{ background: "#ec4899" }}
            >
              <span className="text-[8px] font-bold text-white">+</span>
            </div>
          </div>
          <div className="space-y-1.5">
            {services.map((s) => (
              <div
                key={s.name}
                className="flex items-center gap-2 rounded-xl p-2"
                style={{ background: "#faf9f7", border: "1px solid #ede9e4" }}
              >
                <div
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
                  style={{ background: s.bg }}
                >
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ background: s.dot }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[8px] font-semibold truncate"
                    style={{ color: "#292524" }}
                  >
                    {s.name}
                  </p>
                  <p className="text-[7px]" style={{ color: "#a8a29e" }}>
                    {s.time}
                  </p>
                </div>
                <p
                  className="text-[9px] font-bold flex-shrink-0"
                  style={{ color: "#ec4899" }}
                >
                  {s.price}
                </p>
              </div>
            ))}
          </div>
        </div>
      </MiniCard>

      {/* Floating add hint */}
      <MiniCard
        className="absolute"
        style={{ bottom: 8, right: 10, transform: "rotate(-3deg)" }}
      >
        <div className="flex items-center gap-1.5 px-3 py-2">
          <div
            className="h-5 w-5 rounded-full flex items-center justify-center"
            style={{ background: "#ec4899" }}
          >
            <span className="text-[8px] font-bold text-white">+</span>
          </div>
          <span className="text-[8px] font-medium" style={{ color: "#292524" }}>
            Nuevo servicio
          </span>
        </div>
      </MiniCard>
    </div>
  );
}

function OrdenesMockup() {
  const orders = [
    {
      id: "001",
      name: "Juan García",
      amount: "$350",
      status: "En proceso",
      statusBg: "#fce7f3",
      statusColor: "#ec4899",
    },
    {
      id: "002",
      name: "Ana López",
      amount: "$120",
      status: "Pendiente",
      statusBg: "#fef3c7",
      statusColor: "#d97706",
    },
    {
      id: "003",
      name: "María Torres",
      amount: "$680",
      status: "Completado",
      statusBg: "#d1fae5",
      statusColor: "#059669",
    },
  ];
  return (
    <div className="relative mx-auto h-52 w-72">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-40 rounded-full bg-gradient-to-br from-sky-300 to-blue-400 opacity-20 blur-3xl" />
      </div>

      {/* Stacked order cards */}
      {orders.map((o, i) => (
        <MiniCard
          key={o.id}
          className="absolute"
          style={{
            top: 4 + i * 52,
            left: 14,
            right: 14,
            transform: `rotate(${[-1.5, 0.5, -0.5][i]}deg)`,
            zIndex: 3 - i,
          }}
        >
          <div className="p-2.5">
            <div className="flex items-center justify-between">
              <span
                className="text-[8px] font-medium"
                style={{ color: "#a8a29e" }}
              >
                #{o.id}
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-[7px] font-semibold"
                style={{ background: o.statusBg, color: o.statusColor }}
              >
                {o.status}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <p
                className="text-[10px] font-semibold"
                style={{ color: "#292524" }}
              >
                {o.name}
              </p>
              <p className="text-[11px] font-bold" style={{ color: "#ec4899" }}>
                {o.amount}
              </p>
            </div>
          </div>
        </MiniCard>
      ))}

      {/* FAB */}
      <div
        className="absolute flex items-center gap-1.5 rounded-2xl px-3 py-2 shadow-lg"
        style={{ bottom: 4, right: 12, background: "#ec4899" }}
      >
        <span className="text-[8px] font-bold text-white">+ Nueva orden</span>
      </div>
    </div>
  );
}

function VentasMockup() {
  // SVG line chart
  const pts = [20, 38, 28, 58, 44, 72, 58, 82];
  const W = 156;
  const H = 36;
  const d = pts
    .map(
      (v, i) =>
        `${i === 0 ? "M" : "L"}${(i / (pts.length - 1)) * W},${H - (v / 100) * H}`,
    )
    .join(" ");
  const area = d + ` L${W},${H} L0,${H} Z`;

  const team = [
    { name: "Mario R.", pct: 42, bar: 42 },
    { name: "Ana M.", pct: 31, bar: 31 },
  ];

  return (
    <div className="relative mx-auto h-52 w-72">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-40 rounded-full bg-gradient-to-br from-emerald-300 to-cyan-400 opacity-20 blur-3xl" />
      </div>

      {/* Revenue card */}
      <MiniCard
        className="absolute"
        style={{ top: 6, left: 14, width: 168, transform: "rotate(-2deg)" }}
      >
        <div className="p-3">
          <p className="text-[8px]" style={{ color: "#a8a29e" }}>
            Ventas del mes
          </p>
          <p
            className="text-[20px] font-bold leading-tight"
            style={{ color: "#ec4899" }}
          >
            $24,500
          </p>
          <p className="text-[8px]" style={{ color: "#10b981" }}>
            ↑ +12% vs mes anterior
          </p>
          <svg
            width={W}
            height={H + 4}
            viewBox={`0 0 ${W} ${H + 4}`}
            className="mt-2"
          >
            <defs>
              <linearGradient id="vg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ec4899" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <path d={area} fill="url(#vg)" />
            <path
              d={d}
              fill="none"
              stroke="#ec4899"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </MiniCard>

      {/* Commission card */}
      <MiniCard
        className="absolute"
        style={{
          bottom: 4,
          right: 10,
          width: 134,
          transform: "rotate(2.5deg)",
        }}
      >
        <div className="p-2.5">
          <p
            className="text-[8px] font-semibold mb-2"
            style={{ color: "#292524" }}
          >
            Por persona
          </p>
          {team.map((m) => (
            <div key={m.name} className="mb-1.5 last:mb-0">
              <div className="mb-0.5 flex justify-between">
                <span className="text-[7px]" style={{ color: "#78716c" }}>
                  {m.name}
                </span>
                <span
                  className="text-[7px] font-medium"
                  style={{ color: "#292524" }}
                >
                  {m.pct}%
                </span>
              </div>
              <div
                className="h-1.5 rounded-full"
                style={{ background: "#f5f5f4" }}
              >
                <div
                  className="h-1.5 rounded-full"
                  style={{ width: `${m.bar}%`, background: "#ec4899" }}
                />
              </div>
            </div>
          ))}
        </div>
      </MiniCard>
    </div>
  );
}

function EquipoMockup() {
  const members = [
    {
      initials: "CA",
      name: "Carlos Aguilar",
      role: "Admin",
      pct: "10%",
      bg: "#ec4899",
    },
    {
      initials: "ML",
      name: "María López",
      role: "Vendedor",
      pct: "8%",
      bg: "#a78bfa",
    },
    {
      initials: "JS",
      name: "Jorge Santos",
      role: "Vendedor",
      pct: "8%",
      bg: "#60a5fa",
    },
  ];
  return (
    <div className="relative mx-auto h-52 w-72">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-40 rounded-full bg-gradient-to-br from-rose-400 to-fuchsia-400 opacity-20 blur-3xl" />
      </div>

      <MiniCard
        className="absolute"
        style={{ top: 4, left: 14, right: 14, transform: "rotate(-1deg)" }}
      >
        <div className="p-2.5">
          <div className="mb-2.5 flex items-center justify-between">
            <p
              className="text-[9px] font-semibold"
              style={{ color: "#292524" }}
            >
              Equipo
            </p>
            <div
              className="flex h-4 w-4 items-center justify-center rounded-full"
              style={{ background: "#ec4899" }}
            >
              <span className="text-[8px] font-bold text-white">+</span>
            </div>
          </div>
          <div className="space-y-1.5">
            {members.map((m) => (
              <div
                key={m.name}
                className="flex items-center gap-2 rounded-xl p-2"
                style={{ background: "#faf9f7", border: "1px solid #ede9e4" }}
              >
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
                  style={{ background: m.bg }}
                >
                  <span className="text-[8px] font-bold text-white">
                    {m.initials}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[8px] font-semibold"
                    style={{ color: "#292524" }}
                  >
                    {m.name}
                  </p>
                  <div className="flex items-center gap-1">
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[6px] font-medium"
                      style={{ background: "#fce7f3", color: "#ec4899" }}
                    >
                      {m.role}
                    </span>
                    <span className="text-[7px]" style={{ color: "#a8a29e" }}>
                      Comisión {m.pct}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </MiniCard>
    </div>
  );
}

function SitioMockup() {
  const products = [
    { name: "Camisa", price: "$450", bg: "#fef3c7", dot: "#fbbf24" },
    { name: "Zapatos", price: "$890", bg: "#dbeafe", dot: "#60a5fa" },
  ];
  return (
    <div className="relative mx-auto h-52 w-72">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-40 rounded-full bg-gradient-to-br from-blue-400 to-violet-400 opacity-20 blur-3xl" />
      </div>

      {/* Browser card */}
      <MiniCard
        className="absolute"
        style={{ top: 4, left: 12, right: 12, transform: "rotate(-1.5deg)" }}
      >
        {/* Browser chrome */}
        <div
          className="flex items-center gap-1.5 rounded-t-2xl px-3 py-2"
          style={{ background: "#f5f5f4", borderBottom: "1px solid #ede9e4" }}
        >
          <div className="flex gap-1">
            {["#ef4444", "#f59e0b", "#10b981"].map((c) => (
              <div
                key={c}
                className="rounded-full"
                style={{ width: 6, height: 6, background: c }}
              />
            ))}
          </div>
          <div
            className="flex flex-1 items-center justify-center rounded-md"
            style={{ background: "white", height: 14 }}
          >
            <span className="text-[7px]" style={{ color: "#78716c" }}>
              🌐 pars.co/mi-negocio
            </span>
          </div>
        </div>
        {/* Site content */}
        <div
          className="overflow-hidden rounded-b-2xl"
          style={{ background: "#faf9f7" }}
        >
          {/* Hero */}
          <div
            className="px-3 py-3"
            style={{ background: "linear-gradient(135deg,#fce7f3,#fdf2f8)" }}
          >
            <div className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-xl"
                style={{ background: "#ec4899" }}
              >
                <span className="text-[8px] font-bold text-white">M</span>
              </div>
              <div>
                <p
                  className="text-[9px] font-bold"
                  style={{ color: "#292524" }}
                >
                  Mi Negocio
                </p>
                <p className="text-[7px]" style={{ color: "#a8a29e" }}>
                  ★★★★★ · WhatsApp
                </p>
              </div>
              <div
                className="ml-auto rounded-lg px-2 py-1"
                style={{ background: "#ec4899" }}
              >
                <span className="text-[7px] font-bold text-white">Comprar</span>
              </div>
            </div>
          </div>
          {/* Products */}
          <div className="p-2.5">
            <p
              className="mb-1.5 text-[8px] font-semibold"
              style={{ color: "#292524" }}
            >
              Destacados
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {products.map((p) => (
                <div
                  key={p.name}
                  className="overflow-hidden rounded-xl"
                  style={{ background: "white", border: "1px solid #ede9e4" }}
                >
                  <div
                    className="flex h-9 items-center justify-center"
                    style={{ background: p.bg }}
                  >
                    <div
                      className="h-4 w-4 rounded-md"
                      style={{ background: p.dot }}
                    />
                  </div>
                  <div className="p-1">
                    <p className="text-[7px]" style={{ color: "#292524" }}>
                      {p.name}
                    </p>
                    <p
                      className="text-[8px] font-bold"
                      style={{ color: "#ec4899" }}
                    >
                      {p.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </MiniCard>
    </div>
  );
}

function FinishMockup() {
  const modules = [
    { emoji: "📦", name: "Productos", color: "#fbbf24", bg: "#fef3c7" },
    { emoji: "✂️", name: "Servicios", color: "#a78bfa", bg: "#ede9fe" },
    { emoji: "🧾", name: "Órdenes", color: "#60a5fa", bg: "#dbeafe" },
    { emoji: "📈", name: "Ventas", color: "#34d399", bg: "#d1fae5" },
    { emoji: "👥", name: "Equipo", color: "#f472b6", bg: "#fce7f3" },
    { emoji: "🌐", name: "Sitio web", color: "#818cf8", bg: "#e0e7ff" },
  ];
  return (
    <div className="relative mx-auto h-52 w-72">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-40 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 opacity-20 blur-3xl" />
      </div>

      <MiniCard
        className="absolute"
        style={{ top: -30, left: 14, right: 14, transform: "rotate(-0.5deg)" }}
      >
        <div className="p-3">
          <div className="grid grid-cols-3 gap-2">
            {modules.map((m) => (
              <div
                key={m.name}
                className="flex flex-col items-center gap-1 rounded-xl py-2"
                style={{ background: m.bg }}
              >
                <span className="text-lg">{m.emoji}</span>
                <span
                  className="text-center text-[7px] font-medium leading-tight"
                  style={{ color: "#292524" }}
                >
                  {m.name}
                </span>
                <div
                  className="flex h-3.5 w-3.5 items-center justify-center rounded-full"
                  style={{ background: "#10b981" }}
                >
                  <span className="text-[7px] font-bold text-white">✓</span>
                </div>
              </div>
            ))}
          </div>
          <div
            className="mt-2.5 rounded-xl py-2 text-center"
            style={{ background: "linear-gradient(135deg,#fce7f3,#fdf2f8)" }}
          >
            <span
              className="text-[9px] font-semibold"
              style={{ color: "#ec4899" }}
            >
              ¡Todo listo para empezar! 🎉
            </span>
          </div>
        </div>
      </MiniCard>
    </div>
  );
}

// ─── Slides configuration ─────────────────────────────────────
const slides = [
  {
    id: "welcome",
    gradient: "from-pink-500 via-rose-400 to-orange-400",
    title: "Bienvenido a\nPars Commerce",
    description:
      "Tu plataforma todo en uno para gestionar tu negocio, equipo y ventas desde cualquier lugar.",
    Mockup: WelcomeMockup,
  },
  {
    id: "productos",
    gradient: "from-orange-400 via-amber-400 to-yellow-300",
    title: "Productos y catálogo",
    description:
      "Crea tu catálogo con fotos, precios y subcategorías. Tu inventario siempre al día.",
    Mockup: ProductosMockup,
  },
  {
    id: "servicios",
    gradient: "from-violet-500 via-purple-500 to-indigo-500",
    title: "Servicios profesionales",
    description:
      "Gestiona los servicios que ofreces con precios y duraciones claras para tus clientes.",
    Mockup: ServiciosMockup,
  },
  {
    id: "ordenes",
    gradient: "from-sky-400 via-blue-500 to-indigo-500",
    title: "Órdenes y tickets",
    description:
      "Crea tickets de venta en segundos, asígnalos a tu equipo y síguelos en tiempo real.",
    Mockup: OrdenesMockup,
  },
  {
    id: "ventas",
    gradient: "from-emerald-400 via-teal-500 to-cyan-500",
    title: "Ventas y comisiones",
    description:
      "Analiza el rendimiento de tu negocio y calcula las comisiones de tu equipo automáticamente.",
    Mockup: VentasMockup,
  },
  {
    id: "equipo",
    gradient: "from-rose-400 via-pink-400 to-fuchsia-500",
    title: "Tu equipo unido",
    description:
      "Agrega miembros, asigna roles y controla el acceso de cada persona a tu negocio.",
    Mockup: EquipoMockup,
  },
  {
    id: "sitio",
    gradient: "from-blue-500 via-indigo-500 to-violet-500",
    title: "Tu presencia digital",
    description:
      "Comparte tu catálogo con clientes a través de tu propio sitio web personalizado.",
    Mockup: SitioMockup,
  },
  {
    id: "listo",
    gradient: "from-pink-500 via-rose-500 to-pink-600",
    title: "¡Todo listo\npara empezar!",
    description:
      "Explora cada sección y descubre todo lo que Pars Commerce puede hacer por tu negocio.",
    Mockup: FinishMockup,
  },
] as const;

// ─── Main overlay ─────────────────────────────────────────────
export function OnboardingOverlay() {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(0);
  const navigating = useRef(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Show only if user has never completed onboarding
  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      /* storage blocked */
    }
  }, []);

  // Lock body scroll while overlay is open
  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }, []);

  // Navigate with debounce to prevent rapid tapping artifacts
  const navigate = useCallback((index: number) => {
    if (navigating.current) return;
    if (index < 0 || index >= slides.length) return;
    navigating.current = true;
    setCurrent(index);
    setTimeout(() => {
      navigating.current = false;
    }, 420);
  }, []);

  const next = useCallback(() => {
    if (current === slides.length - 1) {
      dismiss();
      return;
    }
    navigate(current + 1);
  }, [current, dismiss, navigate]);

  const prev = useCallback(() => {
    navigate(current - 1);
  }, [current, navigate]);

  // Touch swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = e.changedTouches[0].clientY - touchStartY.current;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 48) {
        if (dx < 0) next();
        else prev();
      }
      touchStartX.current = null;
      touchStartY.current = null;
    },
    [next, prev],
  );

  // Keyboard nav for desktop / tablet with keyboard
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, next, prev, dismiss]);

  if (!visible) return null;

  const isLast = current === slides.length - 1;

  return (
    <div
      className="fixed inset-0 z-[9999] flex select-none flex-col overflow-hidden bg-background"
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial de Pars Commerce"
    >
      {/* Skip button */}
      {!isLast && (
        <button
          onClick={dismiss}
          className="absolute right-4 z-10 flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-surface-raised hover:text-foreground active:scale-95"
          style={{ top: "max(1rem, env(safe-area-inset-top, 1rem))" }}
          aria-label="Saltar tutorial"
        >
          Saltar <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      )}

      {/* Slides track */}
      <div
        className="flex-1 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/*
          The track is slides.length × 100% wide.
          translateX(-(current/slides.length) × 100%) moves exactly 1 viewport per step.
        */}
        <div
          className="flex h-full"
          style={{
            width: `${slides.length * 100}%`,
            transform: `translateX(-${(current / slides.length) * 100}%)`,
            transition: "transform 380ms cubic-bezier(0.4, 0, 0.2, 1)",
            willChange: "transform",
          }}
        >
          {slides.map((slide) => {
            const { Mockup } = slide;
            return (
              <div
                key={slide.id}
                className="flex h-full flex-col items-center justify-center overflow-y-auto px-6 py-10"
                style={{ width: `${100 / slides.length}%` }}
              >
                {/* Visual mockup */}
                <Mockup />

                {/* Text */}
                <div className="mt-7 max-w-xs text-center">
                  <h1 className="whitespace-pre-line text-[1.75rem] font-bold leading-tight tracking-tight text-foreground">
                    {slide.title}
                  </h1>
                  <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground">
                    {slide.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom navigation */}
      <div
        className="flex flex-col items-center gap-4 px-6 pt-4"
        style={{
          paddingBottom: "max(1.75rem, env(safe-area-inset-bottom, 1.75rem))",
        }}
      >
        {/* Progress dots */}
        <div
          className="flex items-center gap-2"
          role="tablist"
          aria-label="Progreso del tutorial"
        >
          {slides.map((s, i) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={i === current}
              aria-label={`Paso ${i + 1} de ${slides.length}`}
              onClick={() => navigate(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? "w-6 bg-accent" : "w-2 bg-border hover:bg-muted"
              }`}
            />
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={next}
          className="flex w-full max-w-sm items-center justify-center gap-2.5 rounded-2xl bg-accent px-8 py-4 text-base font-semibold text-white shadow-lg transition-all active:scale-[0.97] active:shadow-sm"
          style={{ minHeight: "var(--touch-target, 48px)" }}
        >
          {isLast ? "¡Comenzar ahora!" : "Siguiente"}
          <ArrowRight className="h-5 w-5" aria-hidden />
        </button>

        {/* Step counter */}
        <span className="pb-1 text-xs text-muted-foreground" aria-live="polite">
          {current + 1} de {slides.length}
        </span>
      </div>
    </div>
  );
}
