"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { AD_KINDS } from "@/features/growth/constants/prospectAds";
import { fetchAdFiles, saveFiles, shareFiles } from "@/features/growth/helpers/adFiles";
import { adFieldValues, buildLeadAds, sanitizeAdEdits } from "@/features/growth/helpers/prospectAds";
import { paraAdImageUrl, removeParaData, saveParaAdEdit } from "@/features/growth/services/adsClient";
import { sendParaEvent } from "@/features/growth/services/paraClient";

import type { AdEdit, AdField, AdKind } from "@/features/growth/interfaces/prospectAds";
import type { ParaAdsPageData } from "@/features/growth/interfaces/paraAds";

const SAVE_DELAY_MS = 700;
type Drafts = Record<AdKind, Required<AdEdit>>;
type Notice = { tone: "success" | "info" | "error"; message: string } | null;

/** The four ads of the page: typing redraws them at once and saves after a pause; files come from the server. */
export function useParaAds(token: string, data: ParaAdsPageData) {
  const [drafts, setDrafts] = useState<Drafts>(() => adFieldValues(data.source));
  const [selected, setSelected] = useState<AdKind>("prod");
  const [busy, setBusy] = useState<"download" | "share" | "remove" | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [downloaded, setDownloaded] = useState(false);
  const [removed, setRemoved] = useState(false);
  const pending = useRef<Partial<Record<AdKind, ReturnType<typeof setTimeout>>>>({});
  const saving = useRef<Promise<unknown>>(Promise.resolve());
  const edited = useRef(new Set<AdKind>());

  const edits = useMemo(() => sanitizeAdEdits(drafts), [drafts]);
  const ads = useMemo(() => buildLeadAds({ ...data.source, edits }), [data.source, edits]);

  useEffect(() => () => Object.values(pending.current).forEach((timer) => timer && clearTimeout(timer)), []);

  function flush(kind: AdKind, next: Required<AdEdit>) {
    const edit = sanitizeAdEdits({ [kind]: next })[kind] ?? {};
    saving.current = saving.current.then(() => saveParaAdEdit(token, kind, edit)).catch(() => undefined);
  }

  function setField(field: AdField, value: string) {
    const kind = selected;
    const next = { ...drafts[kind], [field]: field === "price" ? value.replace(/\D/g, "") : value };
    setDrafts((current) => ({ ...current, [kind]: next }));
    if (!edited.current.has(kind)) {
      edited.current.add(kind);
      sendParaEvent(token, "ad_edited", { payload: { kind, field } });
    }
    const timer = pending.current[kind];
    if (timer) clearTimeout(timer);
    pending.current[kind] = setTimeout(() => {
      delete pending.current[kind];
      flush(kind, next);
    }, SAVE_DELAY_MS);
  }

  /** Waits for typed changes to reach the server, so the files match the screen. */
  async function settle() {
    for (const kind of AD_KINDS) {
      const timer = pending.current[kind];
      if (!timer) continue;
      clearTimeout(timer);
      delete pending.current[kind];
      flush(kind, drafts[kind]);
    }
    await saving.current;
  }

  async function adFiles(): Promise<File[]> {
    await settle();
    return fetchAdFiles((kind) => paraAdImageUrl(token, kind));
  }

  async function download() {
    setBusy("download");
    setNotice(null);
    try {
      const files = await adFiles();
      await saveFiles(files);
      sendParaEvent(token, "ads_downloaded", { payload: { count: files.length } });
      setDownloaded(true);
      setNotice({ tone: "success", message: "Listo, sus 4 anuncios se guardaron en su celular." });
    } catch {
      setNotice({ tone: "error", message: "No se pudieron descargar. Revise su conexión e intente de nuevo." });
    } finally {
      setBusy(null);
    }
  }

  async function share() {
    setBusy("share");
    setNotice(null);
    try {
      const files = await adFiles();
      const outcome = await shareFiles(files);
      if (outcome === "unsupported") setNotice({ tone: "info", message: "Su teléfono no deja compartir desde aquí. Descárguelos y súbalos a su Estado." });
      if (outcome === "shared") sendParaEvent(token, "ads_shared", { payload: { count: files.length } });
    } catch {
      setNotice({ tone: "error", message: "No se pudieron compartir. Intente con Descargar." });
    } finally {
      setBusy(null);
    }
  }

  async function removeData() {
    setBusy("remove");
    try {
      await removeParaData(token);
      setRemoved(true);
    } catch (err) {
      setNotice({ tone: "error", message: err instanceof Error ? err.message : "No pudimos quitar sus datos." });
    } finally {
      setBusy(null);
    }
  }

  return {
    ads,
    selected,
    select: setSelected,
    selectedAd: ads.find((ad) => ad.kind === selected) ?? ads[0],
    values: drafts[selected],
    setField,
    download,
    share,
    removeData,
    busy,
    notice,
    clearNotice: () => setNotice(null),
    downloaded,
    removed,
  };
}
