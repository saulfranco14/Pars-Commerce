"use client";
import { useCallback, useEffect, useState } from "react";
import { exportStudioScene } from "../helpers/canvas";
import { reflowStudioScene } from "../helpers/scene";
import { studioGroupMessage } from "../helpers/adState";
import {
  downloadStudioBlob,
  loadDesign,
  loadRenders,
  recordShare,
} from "../services/studioClientService";
import type { StudioDesign, StudioDesignDetail } from "../interfaces/studio";

export type StudioShareKind = "chats" | "status";
interface Prepared {
  versionId: string;
  chats: Blob;
  status: Blob;
}

/* Kept for the whole visit: back on «Anuncios», sending more is instant. */
const prepared = new Map<string, Promise<Prepared>>(),
  ready = new Map<string, Prepared>(),
  sent = new Set<string>(),
  failures = new Set<string>(),
  listeners = new Set<() => void>();
let queue: Promise<unknown> = Promise.resolve();
const notify = () => listeners.forEach((l) => l());

async function draw(tenantId: string, designId: string): Promise<Prepared> {
  const detail: StudioDesignDetail = await loadDesign(tenantId, designId),
    version = detail.versions.find(
      (v) => v.id === detail.design.active_version_id,
    );
  if (!version) throw new Error("Este anuncio no está terminado.");
  const scene = version.scene_json,
    stored = (await loadRenders(tenantId, designId)).find(
      (r) =>
        r.design_version_id === version.id &&
        r.surface === "social" &&
        r.format === scene.format,
    ),
    chats = stored
      ? await downloadStudioBlob(stored.url)
      : await exportStudioScene(
          scene,
          detail.assets,
          tenantId,
          version.is_preparation,
        ),
    status = await exportStudioScene(
      reflowStudioScene(scene, "story"),
      detail.assets,
      tenantId,
      version.is_preparation,
    );
  return { versionId: version.id, chats, status };
}

/** One ad at a time, so picking many never freezes the phone. */
function prepare(tenantId: string, designId: string) {
  const known = prepared.get(designId);
  if (known) return known;
  failures.delete(designId);
  const task = queue.then(() => draw(tenantId, designId));
  queue = task.catch(() => {});
  prepared.set(designId, task);
  task
    .then((p) => {
      ready.set(designId, p);
      notify();
    })
    .catch(() => {
      prepared.delete(designId);
      failures.add(designId);
      notify();
    });
  return task;
}

function download(file: File) {
  const url = URL.createObjectURL(file),
    a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/**
 * Several ads in one share: each image is made when the ad is picked, because
 * the phone only opens its share menu right after a tap. Without a share menu
 * (a computer) the images download one by one.
 */
export function useStudioMultiShare(tenantId: string, picked: string[]) {
  const [, setTick] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  useEffect(() => {
    for (const id of picked) void prepare(tenantId, id).catch(() => {});
  }, [tenantId, picked]);

  const done = picked.filter((id) => ready.has(id)).length,
    allReady = picked.length > 0 && done === picked.length,
    canShareFiles =
      typeof navigator !== "undefined" &&
      "share" in navigator &&
      typeof navigator.canShare === "function";

  const share = useCallback(
    async (designs: StudioDesign[], kind: StudioShareKind, storeUrl: string) => {
      const files = designs.flatMap((d) => {
        const p = ready.get(d.id);
        return p
          ? [
              new File([p[kind]], `${d.title || "anuncio"}.png`, {
                type: "image/png",
              }),
            ]
          : [];
      });
      if (files.length !== designs.length) return false;
      setError(null);
      setBusy(true);
      const target = kind === "chats" ? "group_chats" : "group_status";
      try {
        if (canShareFiles && navigator.canShare({ files })) {
          await navigator.share({
            files,
            text: studioGroupMessage(
              designs.map((d) => d.title),
              storeUrl,
            ),
          });
        } else {
          files.forEach((file, i) => setTimeout(() => download(file), i * 400));
        }
        for (const d of designs) {
          sent.add(d.id);
          void recordShare(
            tenantId,
            ready.get(d.id)!.versionId,
            canShareFiles ? "share_sheet_completed" : "exported",
            target,
          ).catch(() => {});
        }
        notify();
        return true;
      } catch (e) {
        if (!(e instanceof DOMException && e.name === "AbortError"))
          setError(
            "No pudimos abrir el menú de compartir. Intenta con menos anuncios.",
          );
        return false;
      } finally {
        setBusy(false);
      }
    },
    [canShareFiles, tenantId],
  );

  return {
    done,
    allReady,
    busy,
    error,
    clearError: () => setError(null),
    canShareFiles,
    failed: picked.filter((id) => failures.has(id)),
    wasSent: (id: string) => sent.has(id),
    share,
  };
}
