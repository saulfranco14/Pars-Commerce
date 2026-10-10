import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { SOLUTIONS } from "@/features/solutions/solutionCatalog";

export function SolutionSelectorGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {SOLUTIONS.map((solution) => (
        <article
          key={solution.path}
          className="group overflow-hidden rounded-2xl border border-[#dfe3e8] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#aeb7c4] hover:shadow-lg"
        >
          <div className="relative aspect-[16/10] overflow-hidden bg-[#e9eef5]">
            {solution.path === "otro" ? (
              <div className="absolute inset-0 grid grid-cols-2">
                {["/landing/tienda-hero.png", "/landing/moda-hero.png", "/landing/comida-hero.png", "/landing/autolavado-hero.png"].map((src) => (
                  <div key={src} className="relative overflow-hidden"><Image src={src} alt="" fill sizes="25vw" className="object-cover transition duration-500 group-hover:scale-105" /></div>
                ))}
              </div>
            ) : (
              <Image
                src={solution.heroImage}
                alt={`Ejemplo de ${solution.catalog.name.toLocaleLowerCase("es-MX")}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition duration-500 group-hover:scale-[1.04]"
              />
            )}
          </div>
          <div className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#3483fa]">
              {solution.eyebrow}
            </p>
            <h3 className="mt-1.5 text-lg font-bold tracking-tight text-[#111318]">
              {solution.path === "otro" ? "Otro negocio" : solution.catalog.name}
            </h3>
            <Link href={`/soluciones/${solution.path}?iniciar=1`} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#111318] px-4 text-sm font-bold text-white transition-colors hover:bg-[#2b3240] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3483fa] focus-visible:ring-offset-2">Preparar este negocio <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </article>
      ))}
    </div>
  );
}
