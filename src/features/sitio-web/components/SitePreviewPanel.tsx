"use client";

import { useEffect, useState } from "react";
import { RefreshCw, ExternalLink, Monitor, Smartphone } from "lucide-react";
import { ScaledIframe } from "./ScaledIframe";

interface SitePreviewPanelProps {
  tenantSlug: string;
}

export function SitePreviewPanel({ tenantSlug }: SitePreviewPanelProps) {
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
