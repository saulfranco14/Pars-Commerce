import { Trash2, Package } from "lucide-react";
import { TouchStepper } from "@/components/ui/TouchStepper";
import { btnIconDanger } from "@/components/ui/buttonClasses";
import { formatMXN } from "@/lib/loanUtils";
import type { LoanItemRowProps } from "@/features/prestamos/interfaces/loanForm";

export function LoanItemRow({ item, index, onQuantityChange, onRemove }: LoanItemRowProps) {
  const hasImage = !!item.product.image_url;

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      {/* Fila superior: imagen + nombre + subtotal + eliminar */}
      <div className="flex items-center gap-3 px-3 pt-3 pb-2 md:pb-3">
        {/* Imagen o placeholder */}
        <div className="h-10 w-10 shrink-0 rounded-lg border border-border overflow-hidden bg-surface-raised flex items-center justify-center">
          {hasImage ? (
            <img
              src={item.product.image_url!}
              alt={item.product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <Package className="h-4.5 w-4.5 text-muted-foreground/40" aria-hidden />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{item.product.name}</p>
          <p className="text-xs text-muted-foreground tabular-nums">{formatMXN(item.unitPrice)} c/u</p>
        </div>

        {/* Desktop: ± buttons inline */}
        <div className="hidden md:flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onQuantityChange(index, Math.max(1, item.quantity - 1))}
            disabled={item.quantity <= 1}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface-raised text-foreground hover:bg-border-soft disabled:opacity-40 transition-colors"
            aria-label="Disminuir"
          >
            −
          </button>
          <span className="w-7 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
          <button
            type="button"
            onClick={() => onQuantityChange(index, item.quantity + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface-raised text-foreground hover:bg-border-soft transition-colors"
            aria-label="Aumentar"
          >
            +
          </button>
        </div>

        <p className="shrink-0 text-sm font-bold text-foreground tabular-nums">
          {formatMXN(item.subtotal)}
        </p>

        <button
          type="button"
          onClick={() => onRemove(index)}
          className={`${btnIconDanger} shrink-0`}
          aria-label={`Eliminar ${item.product.name}`}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {/* Fila inferior mobile: stepper centrado */}
      <div className="flex items-center justify-center gap-3 border-t border-border/50 bg-surface-raised/50 px-3 py-2 md:hidden">
        <span className="text-xs text-muted-foreground">Cantidad</span>
        <TouchStepper value={item.quantity} onChange={(q) => onQuantityChange(index, q)} min={1} />
      </div>
    </div>
  );
}
