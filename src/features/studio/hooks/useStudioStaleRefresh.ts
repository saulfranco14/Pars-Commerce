"use client";
import { useEffect, useRef, useState } from "react";
import {
  refreshStudioAd,
  revalidateStudioAds,
} from "../services/studioAutoRefresh";
import { loadStaleAds } from "../services/studioClientService";
import type { StudioDesignDetail } from "../interfaces/studio";
import type { StudioEditorState } from "../interfaces/ui";

/**
 * An ad opened after its product changed takes the new name and price on its
 * own and goes back to the places it was published. Its image stays.
 */
export function useStudioStaleRefresh(
  detail: StudioDesignDetail,
  editor: StudioEditorState,
  tenantId: string,
  onRefresh: () => Promise<unknown>,
) {
  const [updating, setUpdating] = useState(detail.stale && editor.canEdit),
    started = useRef(false);
  useEffect(() => {
    if (!updating || started.current) return;
    started.current = true;
    const id = detail.design.id;
    void (async () => {
      try {
        await editor.refreshSource();
        const stale = await loadStaleAds(tenantId).catch(() => []),
          mine = stale.find((ad) => ad.design_id === id);
        if (mine) await refreshStudioAd(tenantId, id, mine.surfaces);
        revalidateStudioAds(tenantId);
        await onRefresh();
      } catch {
        // The «El catálogo cambió» notice stays, with its manual Actualizar.
      } finally {
        setUpdating(false);
      }
    })();
    // Once per opened ad.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updating]);
  return { updating };
}
