import { FileText, MapPin, Bike, Check } from "lucide-react";

/**
 * Mockups de preview para cada novedad — al nivel visual de la landing
 * (tarjeta con contenido de ejemplo dentro, no solo icono + texto). Hacen que
 * cada card se sienta parte del producto, mostrando cómo se verá la feature.
 */

/** Mini-factura de ejemplo para "Facturación al SAT". */
export function FacturacionMockup() {
  return (
    <div className="rounded-lg border border-border bg-background p-3.5">
      <div className="flex items-center justify-between border-b border-border pb-2.5">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-accent" aria-hidden />
          <span className="text-xs font-bold text-foreground">Factura</span>
        </div>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
          Timbrada
        </span>
      </div>
      <div className="mt-2.5 space-y-1.5">
        <div className="flex justify-between text-[11px]">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium text-foreground tabular-nums">$500.00</span>
        </div>
        <div className="flex justify-between text-[11px]">
          <span className="text-muted-foreground">IVA (16%)</span>
          <span className="font-medium text-foreground tabular-nums">$80.00</span>
        </div>
        <div className="flex justify-between border-t border-border pt-1.5 text-xs">
          <span className="font-semibold text-foreground">Total</span>
          <span className="font-bold text-foreground tabular-nums">$580.00</span>
        </div>
      </div>
      <p className="mt-2.5 truncate rounded bg-surface-raised px-2 py-1 font-mono text-[9px] text-muted-foreground">
        UUID a1b2c3d4-e5f6-7890-abcd-ef1234567890
      </p>
    </div>
  );
}

/** Mini-mapa de zonas de entrega para "Entrega a domicilio". */
export function DomicilioMockup() {
  const zones = [
    { name: "Centro", price: "$25", eta: "20 min", color: "bg-emerald-400" },
    { name: "Norte", price: "$40", eta: "35 min", color: "bg-amber-400" },
    { name: "Sur", price: "$40", eta: "40 min", color: "bg-blue-400" },
  ];
  return (
    <div className="rounded-lg border border-border bg-background p-3.5">
      <div className="flex items-center justify-between border-b border-border pb-2.5">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-accent" aria-hidden />
          <span className="text-xs font-bold text-foreground">Zonas de entrega</span>
        </div>
        <Bike className="h-4 w-4 text-muted-foreground" aria-hidden />
      </div>
      <div className="mt-2.5 space-y-1.5">
        {zones.map((z) => (
          <div
            key={z.name}
            className="flex items-center gap-2 rounded-md bg-surface-raised px-2 py-1.5"
          >
            <span className={`h-2 w-2 shrink-0 rounded-full ${z.color}`} aria-hidden />
            <span className="text-[11px] font-medium text-foreground">{z.name}</span>
            <span className="ml-auto text-[10px] text-muted-foreground">{z.eta}</span>
            <span className="text-[11px] font-bold text-foreground tabular-nums">{z.price}</span>
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600">
        <Check className="h-3 w-3" aria-hidden />
        Reparto agrupado por zona
      </div>
    </div>
  );
}
