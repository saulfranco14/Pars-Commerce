import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PromocionesPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, name, theme_color")
    .eq("slug", slug)
    .single();

  if (tenantError || !tenant) {
    notFound();
  }

  const { data: promotions } = await supabase
    .from("promotions")
    .select("id, name, type, value, min_amount, valid_until")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  const now = new Date();
  const active = (promotions ?? []).filter((p) => {
    if (p.valid_until) {
      const until = new Date(p.valid_until);
      if (until < now) return false;
    }
    return true;
  });

  const accentColor = tenant.theme_color?.trim() || "#18181b";

  function formatPromo(p: {
    type: string;
    value: number;
    min_amount: number | null;
    valid_until: string | null;
  }): string {
    const val = Number(p.value);
    const desc =
      p.type === "percentage"
        ? `${val}% de descuento`
        : `$${val.toFixed(2)} de descuento`;
    const min = p.min_amount
      ? ` Compra mínima $${Number(p.min_amount).toFixed(2)}.`
      : "";
    const until = p.valid_until
      ? ` Válida hasta ${new Date(p.valid_until).toLocaleDateString("es-MX")}.`
      : "";
    return `${desc}.${min}${until}`;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold" style={{ color: accentColor }}>
        Promociones
      </h2>

      {active.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay promociones vigentes en este momento.
        </p>
      ) : (
        <ul className="space-y-3">
          {active.map((p) => (
            <li
              key={p.id}
              className="rounded-lg border border-border bg-surface-raised p-4"
            >
              <p className="font-medium text-foreground">{p.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatPromo(p)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
