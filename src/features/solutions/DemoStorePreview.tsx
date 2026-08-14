import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  Eye,
  MessageCircle,
  MonitorSmartphone,
  QrCode,
  ReceiptText,
  ShoppingBag,
  Store,
  WalletCards,
} from "lucide-react";

import type { SolutionDefinition } from "@/features/solutions/solutionCatalog";

const DEMO_CAPABILITIES = [
  {
    icon: Store,
    title: "Catálogo y tienda pública",
    text: "Productos, servicios, precios e imágenes listos para editar y mostrar.",
  },
  {
    icon: ReceiptText,
    title: "Una orden para cada canal",
    text: "Mostrador, kiosco, QR de mesa, tienda y WhatsApp terminan en la misma operación.",
  },
  {
    icon: QrCode,
    title: "Kiosco y mesas QR",
    text: "El cliente puede iniciar desde una mesa o pantalla sin duplicar tickets.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp conectado",
    text: "Comparte un resumen o seguimiento sin que un mensaje confirme dinero por sí solo.",
  },
  {
    icon: WalletCards,
    title: "Cobros protegidos",
    text: "Sólo un pago autorizado o un webhook validado cambia el saldo de una orden.",
  },
  {
    icon: BarChart3,
    title: "Operación visible",
    text: "El equipo ve estados, canales y ventas para decidir con información clara.",
  },
];

const EXAMPLE_ORDERS = [
  { source: "Mesa 04 · QR", detail: "3 tacos al pastor", state: "En preparación", tone: "bg-amber-100 text-amber-900" },
  { source: "Kiosco", detail: "Gringa + refresco", state: "Por cobrar", tone: "bg-blue-100 text-blue-900" },
  { source: "WhatsApp", detail: "Orden para llevar", state: "Asignada", tone: "bg-emerald-100 text-emerald-900" },
];

export function DemoStorePreview({ solution }: { solution: SolutionDefinition }) {
  const { demo, catalog } = solution;

  return (
    <main className="min-h-screen bg-background pb-12 text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href={`/soluciones/${solution.path}`} className="flex min-h-11 items-center gap-2 rounded-lg font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground"><Store className="h-4 w-4" /></span>
            <span className="truncate">{demo.name}</span>
          </Link>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent"><Eye className="h-3.5 w-3.5" />Demo Tlaco</span>
        </div>
      </header>

      <section className="relative isolate overflow-hidden bg-[#0b1730]">
        <Image src={solution.heroImage} alt={`Interior de ejemplo para ${catalog.name}`} width={1448} height={1086} priority className="absolute inset-0 -z-20 h-full w-full scale-105 object-cover opacity-65 blur-[1px]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#07152b] via-[#07152b]/90 to-[#07152b]/35" />
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
          <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.13em] text-blue-100">Así se vería Tlaco para {catalog.name}</p>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl">{demo.name}: una operación completa, no sólo un catálogo.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/85 sm:text-lg">{demo.description} Esta tienda muestra el punto de partida: catálogo, servicios y las herramientas que el negocio activaría dentro de Tlaco.</p>
          <div className="mt-7 flex flex-wrap gap-2 text-sm font-semibold text-white">
            {[`${catalog.products.length} productos`, `${catalog.services.length} servicios`, "Tienda pública", "Orden centralizada"].map((item) => <span key={item} className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">{item}</span>)}
          </div>
          <p className="mt-6 flex items-center gap-2 text-sm text-blue-100"><CheckCircle2 className="h-4 w-4" />Modo demostración: exploras la experiencia; no se crean pedidos ni cobros reales.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="max-w-2xl">
          <p className="text-sm font-bold text-accent">QUÉ DEMUESTRA ESTA TIENDA</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Lo que este negocio tendría dentro de la plataforma.</h2>
          <p className="mt-3 leading-7 text-muted-foreground">La demo no intenta venderte un escaparate vacío: conecta las herramientas que el equipo usaría antes, durante y después de cada venta.</p>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DEMO_CAPABILITIES.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-2xl border border-border bg-surface p-5 shadow-card">
              <Icon className="h-5 w-5 text-accent" aria-hidden />
              <h3 className="mt-4 font-bold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-border-soft/45">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.25fr_.75fr]">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-bold text-accent">EJEMPLO VISUAL DEL PANEL</p><h2 className="mt-1 text-2xl font-bold text-foreground">Las ventas llegan al mismo lugar.</h2></div><MonitorSmartphone className="h-6 w-6 text-accent" aria-hidden /></div>
            <div className="mt-6 space-y-3">
              {EXAMPLE_ORDERS.map((order) => <div key={order.source} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-soft p-3"><div><p className="text-sm font-bold text-foreground">{order.source}</p><p className="mt-0.5 text-sm text-muted-foreground">{order.detail}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${order.tone}`}>{order.state}</span></div>)}
            </div>
          </div>
          <aside className="rounded-2xl bg-accent p-6 text-accent-foreground shadow-card"><p className="text-xs font-bold uppercase tracking-[0.13em] text-white/80">Ejemplo de lectura rápida</p><p className="mt-7 text-4xl font-bold">$2,840</p><p className="mt-1 text-sm text-white/85">Ventas del día</p><div className="mt-8 border-t border-white/25 pt-4 text-sm"><p className="font-bold">3 canales activos</p><p className="mt-1 text-white/85">Mesa QR · kiosco · WhatsApp</p></div></aside>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-bold text-accent">CATÁLOGO DE MUESTRA</p><h2 className="mt-1 text-2xl font-bold text-foreground">Productos destacados</h2></div><p className="text-sm text-muted-foreground">Los precios son de referencia en MXN.</p></div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {catalog.products.slice(0, 5).map((item) => <article key={item.name} className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card"><Image src={solution.heroImage} alt="" width={320} height={220} className="h-28 w-full object-cover" /><div className="p-3"><h3 className="truncate text-sm font-bold text-foreground">{item.name}</h3><p className="mt-1 text-sm font-semibold text-accent">${item.price.toFixed(2)} MXN</p></div></article>)}
        </div>
        <div className="mt-10 rounded-2xl border border-border bg-surface p-5 shadow-card"><h2 className="text-lg font-bold text-foreground">También puedes ofrecer</h2><div className="mt-3 flex flex-wrap gap-2">{catalog.services.map((service) => <span key={service.name} className="rounded-full bg-border-soft px-3 py-1.5 text-sm text-muted-foreground">{service.name}</span>)}</div></div>
      </section>
    </main>
  );
}
