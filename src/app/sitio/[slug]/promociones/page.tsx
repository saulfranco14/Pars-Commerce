import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { Tag, Percent, DollarSign, Clock, Gift } from "lucide-react";

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

  const accentColor = tenant.theme_color?.trim() || "#6366f1";

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
          style={{ backgroundColor: accentColor }}
        >
          <Tag className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promociones</h1>
          <p className="text-sm text-gray-500">
            Aprovecha nuestras ofertas especiales
          </p>
        </div>
      </div>

      {active.length === 0 ? (
        <div className="rounded-2xl bg-white py-16 text-center shadow-sm">
          <Gift className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">
            No hay promociones vigentes en este momento.
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Vuelve pronto para nuevas ofertas
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {active.map((p) => {
            const val = Number(p.value);
            const isPercent = p.type === "percentage";

            return (
              <div
                key={p.id}
                className="group relative overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:shadow-lg"
              >
                {/* Accent stripe */}
                <div
                  className="absolute left-0 top-0 h-full w-1.5"
                  style={{ backgroundColor: accentColor }}
                />

                <div className="flex items-start gap-4 p-5 pl-6">
                  {/* Icon */}
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
                    style={{ backgroundColor: `${accentColor}15` }}
                  >
                    {isPercent ? (
                      <Percent className="h-6 w-6" style={{ color: accentColor }} />
                    ) : (
                      <DollarSign className="h-6 w-6" style={{ color: accentColor }} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{p.name}</h3>
                    <p
                      className="mt-1 text-lg font-bold"
                      style={{ color: accentColor }}
                    >
                      {isPercent
                        ? `${val}% de descuento`
                        : `$${val.toFixed(2)} de descuento`}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {p.min_amount && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
                          <DollarSign className="h-3 w-3" />
                          Mín. ${Number(p.min_amount).toFixed(2)}
                        </span>
                      )}
                      {p.valid_until && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs text-amber-700">
                          <Clock className="h-3 w-3" />
                          Hasta{" "}
                          {new Date(p.valid_until).toLocaleDateString("es-MX", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
