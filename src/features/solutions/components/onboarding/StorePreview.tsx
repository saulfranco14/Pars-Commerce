import Image from "next/image";
import { ShoppingBag } from "lucide-react";

/**
 * "Lo verás aplicado en la tienda" — y aquí lo ve: nombre y color se pintan
 * mientras escribe, antes de crear la cuenta.
 */
export function StorePreview({
  name,
  color,
  heroImage,
  fallbackName,
}: {
  name: string;
  color: string;
  heroImage: string;
  fallbackName: string;
}) {
  return (
    <div aria-label="Vista previa de tu tienda" className="rounded-[1.6rem] border border-border bg-surface-raised p-1.5 shadow-card">
      <div className="overflow-hidden rounded-[1.3rem] bg-surface">
        <div className="relative px-4 pb-4 pt-5 text-white transition-colors duration-300" style={{ background: color }}>
          <Image src={heroImage} alt="" fill sizes="320px" className="object-cover opacity-25 mix-blend-multiply" />
          <div className="relative">
            <p className="text-[10px] font-semibold text-white/80">Tienda abierta</p>
            <p className="mt-0.5 truncate text-lg font-bold">{name.trim() || fallbackName}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 p-3" aria-hidden>
          {[0, 1].map((i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-border">
              <div className="h-12 bg-border-soft dark:bg-border" />
              <div className="space-y-1 p-2">
                <span className="block h-2 w-3/4 rounded bg-border-soft dark:bg-border" />
                <span className="block h-2 w-1/3 rounded" style={{ background: color }} />
              </div>
            </div>
          ))}
        </div>
        <div className="px-3 pb-3" aria-hidden>
          <span className="flex min-h-9 items-center justify-center gap-1.5 rounded-xl text-xs font-bold text-white transition-colors duration-300" style={{ background: color }}>
            <ShoppingBag className="h-3.5 w-3.5" />
            Ver carrito
          </span>
        </div>
      </div>
    </div>
  );
}
