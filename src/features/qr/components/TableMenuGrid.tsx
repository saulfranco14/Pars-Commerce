interface TableMenuProduct {
  id: string;
  name: string;
  price: number;
}

interface TableMenuGridProps {
  products: TableMenuProduct[];
  onAdd: (productId: string) => void;
}

export function TableMenuGrid({ products, onAdd }: TableMenuGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {products.map((item) => (
        <article key={item.id} className="rounded-xl border border-border p-3">
          <h3 className="text-sm font-medium text-foreground">{item.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            ${Number(item.price).toFixed(2)}
          </p>
          <button
            type="button"
            className="mt-3 min-h-[44px] rounded-lg bg-accent px-3 py-2 text-sm font-medium text-foreground"
            onClick={() => onAdd(item.id)}
          >
            Agregar
          </button>
        </article>
      ))}
    </div>
  );
}
