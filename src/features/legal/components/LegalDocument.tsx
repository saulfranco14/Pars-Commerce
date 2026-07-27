import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import type { LegalDoc } from "@/features/legal/interfaces/legal";

/**
 * Renderiza cualquier documento legal a partir de su estructura. Los términos
 * y el aviso de privacidad comparten esta cáscara para que el día que cambie
 * el formato no haya que tocar dos páginas.
 *
 * El índice lateral no es adorno: estos documentos se consultan buscando una
 * cláusula concreta, y cada sección tiene ancla propia para poder enlazarla
 * desde soporte.
 */

interface LegalDocumentProps {
  doc: LegalDoc;
}

export function LegalDocument({ doc }: LegalDocumentProps) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <Link
        href="/"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver al inicio
      </Link>

      <header className="mt-6 border-b border-border pb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {doc.title}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
          {doc.summary}
        </p>
        <p className="mt-4 text-sm text-muted">
          Última actualización: {doc.updatedAt}
        </p>
      </header>

      <div className="mt-10 gap-12 lg:flex lg:items-start">
        {/* Índice pegajoso — solo en pantallas donde sobra ancho. */}
        <nav
          aria-label="Índice del documento"
          className="hidden lg:sticky lg:top-24 lg:block lg:w-60 lg:shrink-0"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-muted">
            Contenido
          </p>
          <ul className="mt-3 space-y-1">
            {doc.sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="block rounded-md py-1.5 text-sm leading-snug text-muted-foreground transition-colors hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <article className="min-w-0 flex-1 space-y-10">
          {doc.sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                {s.title}
              </h2>

              {s.body?.map((p, i) => (
                <p
                  key={i}
                  className="mt-3 text-[15px] leading-relaxed text-muted-foreground"
                >
                  {p}
                </p>
              ))}

              {s.list && (
                <ul className="mt-4 space-y-2">
                  {s.list.map((item) => (
                    <li
                      key={item}
                      className="flex gap-3 text-[15px] leading-relaxed text-muted-foreground"
                    >
                      <span
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                        aria-hidden
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
