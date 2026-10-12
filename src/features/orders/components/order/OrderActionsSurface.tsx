"use client";

import type { ReactNode } from "react";

type OrderActionsSurfaceProps = {
  presentation: "inline" | "fixed";
  title: string;
  description: string;
  children: ReactNode;
};

/**
 * Única responsabilidad: componer y alinear las acciones de una orden.
 * La lógica de cobro, entrega o comprobantes vive en sus componentes propios.
 */
export function OrderActionsSurface({
  presentation,
  title,
  description,
  children,
}: OrderActionsSurfaceProps) {
  const fixed = presentation === "fixed";

  return (
    <section className="w-full min-w-0 max-w-full" aria-label="Acciones de la orden">
      {fixed ? (
        <header className="mb-3 border-b border-border-soft pb-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
            {title}
          </p>
          <p className="mt-1 text-xs leading-5 text-foreground">{description}</p>
        </header>
      ) : null}

      <div
        className={
          fixed
            ? "flex w-full flex-col gap-2.5"
            : "flex w-full flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end"
        }
      >
        {children}
      </div>
    </section>
  );
}
