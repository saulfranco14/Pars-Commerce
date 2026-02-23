"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  Monitor,
  Smartphone,
} from "lucide-react";
import { SiteWebConfigSection } from "./SiteWebConfigSection";

function ScaledIframe({
  src,
  logicalWidth,
  logicalHeight,
  mobile,
}: {
  src: string;
  logicalWidth: number;
  logicalHeight: number;
  mobile: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function measure() {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      const sx = width / logicalWidth;
      const sy = height / logicalHeight;
      setScale(Math.min(sx, sy, 1));
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [logicalWidth, logicalHeight]);

  const scaledW = logicalWidth * scale;
  const scaledH = logicalHeight * scale;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex items-start justify-center overflow-hidden p-4"
    >
      {mobile ? (
        <div
          className="relative overflow-hidden rounded-[2.5rem] border-8 border-gray-800 shadow-2xl"
          style={{ width: scaledW + 16, height: scaledH - 56 }}
        >
          <div className="absolute left-1/2 top-1.5 h-1.5 w-10 -translate-x-1/2 rounded-full bg-gray-700" />
          <div
            className="overflow-hidden rounded-[1.8rem]"
            style={{ width: scaledW, height: scaledH }}
          >
            <iframe
              src={src}
              title="Vista previa"
              style={{
                width: logicalWidth,
                height: logicalHeight,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                border: "none",
              }}
            />
          </div>
        </div>
      ) : (
        <div style={{ width: scaledW, height: scaledH, overflow: "hidden" }}>
          <iframe
            src={src}
            title="Vista previa"
            style={{
              width: logicalWidth,
              height: logicalHeight,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              border: "none",
              pointerEvents: "none",
            }}
          />
        </div>
      )}
    </div>
  );
}

/** Mini browser preview panel */
function SitePreviewPanel({ tenantSlug }: { tenantSlug: string }) {
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [reloadKey, setReloadKey] = useState(0);
  const siteUrl = `/sitio/${tenantSlug}/inicio`;
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const logicalW = viewMode === "desktop" ? 1280 : 375;
  const logicalH = 900;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/80 bg-surface-raised shadow-sm">
      <div className="flex shrink-0 items-center gap-2 border-b border-border/60 bg-muted/30 px-3 py-2">
        <div className="flex gap-1.5 shrink-0">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
        </div>
        <div className="mx-2 flex flex-1 min-w-0 items-center rounded-md border border-border/50 bg-background/60 px-2.5 py-1">
          <span className="truncate font-mono text-[10px] text-muted-foreground">
            {origin}/sitio/{tenantSlug}
          </span>
        </div>
        {/* Desktop / Mobile toggle */}
        <div className="flex overflow-hidden rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setViewMode("desktop")}
            className={`flex h-7 w-8 items-center justify-center transition-colors ${viewMode === "desktop" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted/50"}`}
            aria-label="Vista escritorio"
          >
            <Monitor className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("mobile")}
            className={`flex h-7 w-8 items-center justify-center transition-colors ${viewMode === "mobile" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted/50"}`}
            aria-label="Vista móvil"
          >
            <Smartphone className="h-3.5 w-3.5" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          aria-label="Recargar"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
        <a
          href={siteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          aria-label="Abrir en nueva pestaña"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Preview */}
      <div className="relative min-h-0 flex-1 overflow-hidden bg-muted/20">
        <ScaledIframe
          key={`${reloadKey}-${viewMode}`}
          src={siteUrl}
          logicalWidth={logicalW}
          logicalHeight={logicalH}
          mobile={viewMode === "mobile"}
        />
      </div>

      <p className="shrink-0 px-3 py-1 text-center text-[10px] text-muted-foreground/80 border-t border-border/40">
        Vista previa · Guarda para actualizar
      </p>
    </div>
  );
}

export default function SitioWebPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1600px] overflow-x-hidden">
      <div className="mb-5 border-b border-border pb-3">
        <Link
          href="/dashboard"
          className="inline-flex min-h-[40px] items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-lg"
        >
          <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Volver al inicio
        </Link>
        <h1 className="mt-1.5 text-lg font-bold tracking-tight text-foreground sm:text-xl">
          Sitio web
        </h1>
        <p className="text-xs text-muted-foreground">
          Configura la apariencia, plantilla y contenido de tu sitio público.
        </p>
      </div>

      <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-stretch xl:gap-5">
        <div className="min-w-0 xl:flex-1 xl:h-[calc(100vh-220px)] xl:flex xl:flex-col xl:overflow-hidden">
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border/80 bg-surface-raised shadow-sm">
            <SiteWebConfigSection tenantSlug={tenantSlug} />
          </div>
        </div>

        <div className="hidden min-h-[400px] min-w-0 xl:flex-1 xl:block">
          <div className="sticky top-20 flex h-[calc(100vh-224px)] flex-col">
            <SitePreviewPanel tenantSlug={tenantSlug} />
          </div>
        </div>
      </div>
    </div>
  );
}
