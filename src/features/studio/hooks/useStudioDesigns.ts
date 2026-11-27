"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useStudioContext } from "../components/StudioProvider";
import { suggestCopy } from "../services/studioClientService";
import { STUDIO_DESIGNS, STUDIO_MORE_PHRASES_MAX } from "../constants/designs";
import { sampleStudioPalette } from "../helpers/canvas";
import { isStudioDesign } from "../helpers/layout";
import {
  applyStudioDesign,
  applyStudioPalette,
  setStudioPhrase,
  setStudioTagline,
  studioPhotoKey,
  studioPhrase,
  studioTagline,
} from "../helpers/sceneStyle";
import type { StudioCopyIdeas } from "../helpers/aiPrompt";
import type { StudioPhotoPalette, StudioScene } from "../interfaces/scene";
import type { StudioDesignOption, StudioEditorState } from "../interfaces/ui";

/**
 * The six designs of the open ad: colors from its photo, one AI phrase per
 * design, and the scene each option would become. Drawing them costs nothing;
 * only the phrases call the AI, once on open and on "Otras frases".
 */
export function useStudioDesigns(
  editor: StudioEditorState,
  designId: string,
  photoUrl: string | null,
) {
  const { tenantId } = useStudioContext(),
    scene = editor.scene,
    source = editor.source.current,
    latest = useRef(scene),
    [palette, setPalette] = useState<StudioPhotoPalette | null>(null),
    [ideas, setIdeas] = useState<StudioCopyIdeas | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null),
    [asked, setAsked] = useState(0);
  latest.current = scene;
  const photoKey = studioPhotoKey(scene);

  useEffect(() => {
    if (!photoUrl || !photoKey) return;
    let active = true;
    void sampleStudioPalette(photoUrl, photoKey).then((found) => {
      if (!active || !found) return;
      setPalette(found);
      const current = latest.current;
      if (
        editor.canEdit &&
        isStudioDesign(current.template) &&
        studioPhotoKey(current) === found.photo &&
        current.palette?.photo !== found.photo
      )
        editor.setScene(applyStudioPalette(current, found));
    });
    return () => {
      active = false;
    };
    // The editor object changes every render; the photo is what matters here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoUrl, photoKey]);

  async function ask(): Promise<StudioCopyIdeas | null> {
    setBusy(true);
    setError(null);
    try {
      const found = await suggestCopy(tenantId, designId);
      setIdeas(found);
      return found;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No pudimos escribir frases ahora.",
      );
      return null;
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!editor.canEdit) return;
    let active = true;
    void ask().then((found) => {
      const current = latest.current;
      if (!active || !found || !isStudioDesign(current.template)) return;
      if (studioPhrase(current) !== source.name) return;
      const index = STUDIO_DESIGNS.findIndex((d) => d.id === current.template);
      let next = setStudioPhrase(
        current,
        source,
        found.phrases[index] ?? found.phrases[0],
      );
      const dated = current.nodes.some((n) => n.binding === "validity");
      if (!studioTagline(next) && !dated && found.notes[0])
        next = setStudioTagline(next, found.notes[0]);
      editor.setScene(next);
    });
    return () => {
      active = false;
    };
    // Asks once per open design; "Otras frases" asks again on demand.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [designId, editor.canEdit]);

  const phrases = useMemo(() => ideas?.phrases ?? [], [ideas]),
    current = studioPhrase(scene),
    custom = current !== source.name && !phrases.includes(current),
    activeIndex = STUDIO_DESIGNS.findIndex((d) => d.id === scene.template);

  const options: StudioDesignOption[] = useMemo(() => {
    const base: StudioScene =
      palette && studioPhotoKey(scene) === palette.photo && !scene.palette
        ? { ...scene, palette }
        : scene;
    return STUDIO_DESIGNS.map((design, i) => ({
      id: design.id,
      name: design.name,
      scene:
        i === activeIndex
          ? scene
          : applyStudioDesign(
              base,
              source,
              design.id,
              custom ? undefined : phrases[i],
            ),
    }));
  }, [scene, source, palette, phrases, custom, activeIndex]);

  /** New phrases for the design on the ad; `counted` spends one of the free asks. */
  async function more(counted = true) {
    if (busy || (counted && asked >= STUDIO_MORE_PHRASES_MAX)) return;
    if (counted) setAsked((n) => n + 1);
    const found = await ask();
    const now = latest.current,
      index = STUDIO_DESIGNS.findIndex((d) => d.id === now.template);
    if (found && index >= 0 && found.phrases[index])
      editor.setScene(setStudioPhrase(now, source, found.phrases[index]));
  }

  return {
    options,
    activeIndex,
    pick: (index: number) => editor.setScene(options[index].scene),
    more: () => more(true),
    /** After the merchant tells what the item includes: free, it is a better brief. */
    rewrite: () => more(false),
    phrases,
    current,
    choosePhrase: (text: string) =>
      editor.setScene(setStudioPhrase(latest.current, source, text)),
    moreLeft: STUDIO_MORE_PHRASES_MAX - asked,
    busy,
    error,
    clearError: () => setError(null),
  };
}
