import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SolutionClosing({ name, onStart }: { name: string; onStart: () => void }) {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-5 rounded-3xl bg-foreground p-6 text-background sm:flex-row sm:items-center sm:p-8">
          <div>
            <h3 className="text-2xl font-bold">Tu sitio nace publicado y los pedidos se abren al terminar la preparación.</h3>
            <p className="mt-2 text-sm opacity-70">Plan Gratis, sin tarjeta y sin activar una membresía pagada automáticamente.</p>
          </div>
          <button
            type="button"
            onClick={onStart}
            className="inline-flex min-h-12 w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover sm:w-auto"
          >
            <span className="max-w-56 truncate">Preparar {name}</span>
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
          </button>
        </div>
      </section>

      <footer className="border-t border-border px-4 py-7 text-center text-sm text-muted-foreground">
        <p>Tlaco conecta tienda, pedidos, clientes y caja en una sola operación.</p>
        <nav className="mt-3 flex justify-center gap-5" aria-label="Más de Tlaco">
          <Link href="/" className="hover:text-foreground">Inicio</Link>
          <Link href="/soluciones" className="hover:text-foreground">Otros giros</Link>
          <Link href="/#precios" className="hover:text-foreground">Precios</Link>
        </nav>
      </footer>
    </>
  );
}
