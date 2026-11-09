import { ExternalLink } from "lucide-react";
import { studioValidity } from "../../helpers/scene";
import type { StudioSource } from "../../interfaces/studio";

export function StudioSourceSummary({
  source,
  tenantSlug,
}: {
  source: StudioSource;
  tenantSlug: string;
}) {
  const href = source.id
    ? `/dashboard/${encodeURIComponent(tenantSlug)}/${source.type === "product" ? `productos/${source.id}` : "promociones"}`
    : null;
  return (
    <details className="rounded-2xl border border-border bg-surface p-4">
      <summary className="min-h-11 cursor-pointer text-sm font-semibold">
        Contenido del anuncio: {source.name}
      </summary>
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">
            Precio o beneficio del catálogo
          </dt>
          <dd className="mt-1 font-semibold">
            {source.priceLabel ||
              source.badge ||
              "Campaña sin precio vinculado"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">
            Vigencia y condiciones
          </dt>
          <dd className="mt-1 leading-6">
            {[source.conditions, studioValidity(source), source.period]
              .filter(Boolean)
              .join(" · ") ||
              "Revisa las condiciones de tu mensaje antes de compartir."}
          </dd>
        </div>
      </dl>
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-accent"
        >
          <ExternalLink className="h-4 w-4" />
          Consultar fuente del catálogo
        </a>
      )}
    </details>
  );
}
