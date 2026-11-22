import { HeroLiveDemo } from "@/features/landing/components/hero/HeroLiveDemo";

export function LandingTryIt() {
  return (
    <section id="demo" className="scroll-mt-20 border-b border-border py-14 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-accent">Pruébalo tú</p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Toca el celular de tu cliente y mira tu panel.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Agrega productos, envía el pedido y paga como lo haría tu cliente.
          </p>
        </div>
        <div className="mt-8">
          <HeroLiveDemo />
        </div>
      </div>
    </section>
  );
}
