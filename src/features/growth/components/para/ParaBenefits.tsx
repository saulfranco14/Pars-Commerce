import { CreditCard, PackageCheck, Smartphone } from "lucide-react";

const BENEFITS = [
  { icon: Smartphone, title: "Le piden desde el celular", detail: "Sus clientes eligen y mandan el pedido sin llamarle." },
  { icon: PackageCheck, title: "Le llega completo", detail: "Qué quieren, cuánto y a dónde, en un solo mensaje." },
  { icon: CreditCard, title: "Cobra con tarjeta", detail: "Sin terminal y sin costo para empezar." },
];

/** Three things the owner gets, in the storefront's look; shared by the «Para ti» designs. */
export function ParaBenefits() {
  return (
    <section data-para-section="productos" aria-label="Qué gana" className="grid gap-3 sm:grid-cols-3">
      {BENEFITS.map(({ icon: Icon, title, detail }) => (
        <div key={title} className="grid content-start gap-2 rounded-(--store-radius) bg-(--store-surface) p-5 ring-1 ring-(--store-hairline)">
          <Icon className="h-6 w-6 text-accent" aria-hidden />
          <p className="text-base font-bold text-(--store-ink)">{title}</p>
          <p className="text-sm text-(--store-ink-2)">{detail}</p>
        </div>
      ))}
    </section>
  );
}
