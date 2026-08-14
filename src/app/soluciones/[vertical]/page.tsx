import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, MessageCircle, QrCode, ReceiptText, Store, WalletCards } from "lucide-react";

import { TlacoLogo } from "@/components/brand/TlacoLogo";
import { SOLUTIONS, getSolutionByVertical } from "@/features/solutions/solutionCatalog";

export function generateStaticParams() {
  return SOLUTIONS.map((solution) => ({ vertical: solution.path }));
}

export async function generateMetadata({ params }: { params: Promise<{ vertical: string }> }): Promise<Metadata> {
  const solution = getSolutionByVertical((await params).vertical);
  if (!solution) return {};
  const title = `${solution.eyebrow} | Catálogo, pedidos y cobros`;
  const description = `${solution.problem} Con Tlaco, ${solution.catalog.name.toLocaleLowerCase("es-MX")} conecta catálogo, pedidos, QR y WhatsApp.`;
  return {
    title,
    description,
    alternates: { canonical: `/soluciones/${solution.path}` },
    openGraph: { title, description, images: [{ url: solution.heroImage, width: 1448, height: 1086, alt: solution.eyebrow }] },
  };
}

export default async function SolutionLanding({ params }: { params: Promise<{ vertical: string }> }) {
  const solution = getSolutionByVertical((await params).vertical);
  if (!solution) notFound();

  const { demo, catalog } = solution;
  const createHref = `/dashboard/crear-negocio?giro=${encodeURIComponent(catalog.businessType)}&catalogo=${encodeURIComponent(catalog.key)}`;
  const demoHref = `/sitio/${demo.slug}`;
  const capabilities = [
    { icon: Store, title: "Catálogo de tu giro", text: `${catalog.products.length} productos y ${catalog.services.length} servicios que puedes editar desde el primer día.` },
    { icon: MessageCircle, title: "WhatsApp con orden", text: "El pedido se registra primero; abrir el chat no toca el dinero ni el inventario." },
    { icon: QrCode, title: "Todos los canales", text: "Tienda, kiosco, QR de mesa y mostrador trabajan sobre el mismo flujo." },
    { icon: WalletCards, title: "Cobro protegido", text: "Sólo un pago autorizado o un webhook válido cambia el estado financiero." },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b1730]/95 text-white backdrop-blur">
        <nav className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="rounded-lg text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"><TlacoLogo size="md" className="!text-white" /></Link>
          <div className="hidden items-center gap-6 text-sm text-white/75 md:flex"><a href="#flujo" className="hover:text-white">Cómo funciona</a><a href="#catalogo" className="hover:text-white">Catálogo</a><a href="#canales" className="hover:text-white">Canales</a></div>
          <Link href={createHref} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover">Crear gratis</Link>
        </nav>
      </header>

      <main>
        <section className="relative isolate overflow-hidden bg-[#07152b]">
          <Image src={solution.heroImage} alt={`Negocio de ejemplo para ${catalog.name}`} width={1448} height={1086} priority className="absolute inset-0 -z-20 h-full w-full scale-105 object-cover opacity-70 blur-[1px]" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#07152b] via-[#07152b]/90 to-[#07152b]/35" />
          <div className="mx-auto grid min-h-[590px] max-w-7xl items-center px-4 py-16 sm:px-6 sm:py-20 lg:min-h-[650px] lg:py-24">
            <div className="max-w-3xl">
              <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-100">{solution.eyebrow}</p>
              <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">{solution.headline}</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/85 sm:text-lg">{solution.problem}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href={createHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover">Crear mi cuenta gratis <ArrowRight className="h-4 w-4" /></Link>
                <Link href={demoHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/35 bg-white/10 px-5 text-sm font-bold text-white transition-colors hover:bg-white/20">Ver {demo.name}</Link>
              </div>
              <p className="mt-3 text-xs text-blue-100">Demo navegable · no acepta pedidos ni cobros reales.</p>
            </div>
          </div>
        </section>

        <section id="flujo" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20"><div className="max-w-2xl"><p className="text-sm font-bold text-accent">UNA OPERACIÓN, NO HERRAMIENTAS SUELTAS</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Así se mueve un pedido en tu negocio.</h2></div><ol className="mt-8 grid gap-4 md:grid-cols-3">{solution.workflow.map((step, index) => <li key={step} className="rounded-2xl border border-border bg-surface p-5 shadow-card"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-sm font-bold text-accent-foreground">0{index + 1}</span><p className="mt-5 text-lg font-bold text-foreground">{step}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{index === 0 ? "El cliente usa el canal que le resulte más cómodo." : index === 1 ? "Tlaco conserva productos, cliente y estado en una sola orden." : "Tu equipo actúa con información clara, sin confiar pagos a un mensaje."}</p></li>)}</ol></section>

        <section id="catalogo" className="border-y border-border bg-border-soft/45"><div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[.85fr_1.15fr] lg:items-center"><div><p className="text-sm font-bold text-accent">EMPIEZA CON CONTENIDO ÚTIL</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Un catálogo que ya habla el idioma de {catalog.name.toLocaleLowerCase("es-MX")}</h2><p className="mt-4 max-w-lg leading-7 text-muted-foreground">La plantilla se copia a tu negocio: puedes cambiar nombres, fotos, precios y existencias sin afectar a otros comercios.</p><ul className="mt-6 space-y-3 text-sm text-muted-foreground">{[`${catalog.products.length} productos con precio en MXN`, `${catalog.services.length} servicios configurables`, "Inventario inicial sólo para productos", "Tú decides si inicias con catálogo o vacío"].map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{item}</li>)}</ul></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{catalog.products.slice(0, 6).map((item, index) => <article key={item.name} className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card"><Image src={solution.heroImage} alt="" width={360} height={220} className={`h-28 w-full object-cover ${index % 2 === 0 ? "object-right" : "object-center"}`} /><div className="p-3"><h3 className="truncate text-sm font-bold text-foreground">{item.name}</h3><p className="mt-1 text-sm font-semibold text-accent">${item.price.toFixed(2)} MXN</p></div></article>)}</div></div></section>

        <section id="canales" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div className="max-w-2xl"><p className="text-sm font-bold text-accent">CONECTADO DE PRINCIPIO A FIN</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">No importa cómo llega la venta; importa que no se pierda.</h2></div><Link href={createHref} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-bold text-foreground hover:bg-border-soft">Configurar mi negocio <ArrowRight className="h-4 w-4" /></Link></div><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{capabilities.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-2xl border border-border bg-surface p-5 shadow-card"><Icon className="h-5 w-5 text-accent" aria-hidden /><h3 className="mt-4 font-bold text-foreground">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></article>)}</div></section>

        <section className="border-t border-border bg-accent px-4 py-16 text-center text-accent-foreground sm:px-6"><ReceiptText className="mx-auto h-7 w-7" /><h2 className="mx-auto mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">Tu negocio no necesita parecerse a otro para operar mejor.</h2><p className="mx-auto mt-4 max-w-2xl text-white/85">Elige {catalog.name.toLocaleLowerCase("es-MX")}, toma el catálogo inicial y personalízalo a tu ritmo.</p><Link href={createHref} className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-surface px-5 text-sm font-bold text-accent hover:bg-border-soft">Crear mi negocio <ArrowRight className="h-4 w-4" /></Link></section>
      </main>
    </div>
  );
}
