import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { SOLUTIONS } from "@/features/solutions/solutionCatalog";

const OTHER_COLLAGE = [
  "/landing/tienda-hero.png",
  "/landing/moda-hero.png",
  "/landing/comida-hero.png",
  "/landing/autolavado-hero.png",
];

/**
 * Cada tarjeta es el enlace completo: 12 botones negros iguales competían
 * entre sí. En móvil van 2 por fila para que elegir giro no cueste 5 pantallas.
 */
export function SolutionSelectorGrid() {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {SOLUTIONS.map((solution) => {
        const name = solution.path === "otro" ? "Otro negocio" : solution.catalog.name;
        return (
          <li key={solution.path}>
            <Link
              href={`/soluciones/${solution.path}?iniciar=1`}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-colors hover:border-accent/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="relative aspect-4/3 overflow-hidden bg-border-soft">
                {solution.path === "otro" ? (
                  <div className="absolute inset-0 grid grid-cols-2">
                    {OTHER_COLLAGE.map((src) => (
                      <div key={src} className="relative overflow-hidden">
                        <Image src={src} alt="" fill sizes="(max-width: 640px) 25vw, 12vw" className="object-cover" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <Image
                    src={solution.heroImage}
                    alt={`Ejemplo de ${solution.catalog.name.toLocaleLowerCase("es-MX")}`}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                )}
              </div>
              <div className="flex flex-1 flex-col justify-between gap-2 p-3 sm:p-4">
                <h3 className="text-sm font-bold leading-tight tracking-tight text-foreground sm:text-base">
                  {name}
                </h3>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent sm:text-sm">
                  Preparar mi negocio
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
