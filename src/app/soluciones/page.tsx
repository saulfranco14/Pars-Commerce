import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

import { TlacoLogo } from "@/components/brand/TlacoLogo";
import { SolutionSelectorGrid } from "@/features/solutions/SolutionSelectorGrid";

export const metadata: Metadata = {
  title: "Elige una solución para tu negocio",
  description: "Elige el giro de tu negocio y conoce el catálogo, pedidos, cobros y herramientas con las que puedes comenzar en Tlaco.",
};

export default function SolutionsPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border bg-surface">
        <nav className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="Ir al inicio"><TlacoLogo size="md" /></Link>
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-muted-foreground hover:bg-border-soft"><ArrowLeft className="h-4 w-4" />Volver</Link>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="max-w-3xl">
          <p className="text-sm font-bold text-accent">PRIMERO, ELIGE TU NEGOCIO</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">¿Qué quieres poner en marcha?</h1>
          <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">Hay 12 puntos de partida, incluido uno flexible para cualquier negocio. Al elegir uno entrarás directamente a personalizarlo.</p>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">{["Sin tarjeta", "Catálogo inicial editable", "Sitio publicado automáticamente"].map((item) => <span key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" />{item}</span>)}</div>
        </div>
        <div className="mt-8"><SolutionSelectorGrid /></div>
        <div className="mt-6 rounded-2xl border border-border bg-surface p-5"><h2 className="font-bold">¿Tu giro todavía no aparece?</h2><p className="mt-1 text-sm text-muted-foreground">Elige “Otro negocio”. Te damos una base editable y durante la preparación decides qué vendes y cómo atiendes.</p></div>
      </main>
    </div>
  );
}
