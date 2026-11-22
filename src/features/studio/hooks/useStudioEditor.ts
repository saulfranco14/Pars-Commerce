"use client";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  bindStudioScene,
  createStudioNode,
  createStudioScene,
  reflowStudioScene,
} from "../helpers/scene";
import { ApiFetchError } from "@/services/apiFetch";
import { duplicateDesign, saveDesign } from "../services/studioClientService";
import { useStudioContext } from "../components/StudioProvider";
import { studioSceneSchema } from "../validations/studioSchemas";
import type { StudioSource, StudioDesignDetail } from "../interfaces/studio";
import type {
  StudioFormat,
  StudioNode,
  StudioScene,
} from "../interfaces/scene";

interface EditorHistory {
  scene: StudioScene;
  past: StudioScene[];
  future: StudioScene[];
}
type EditorAction =
  | { type: "set"; scene: StudioScene }
  | { type: "undo"; source?: StudioSource }
  | { type: "redo"; source?: StudioSource };
function historyReducer(
  state: EditorHistory,
  action: EditorAction,
): EditorHistory {
  if (action.type === "undo")
    return state.past.length
      ? {
          scene: action.source
            ? bindStudioScene(state.past.at(-1)!, action.source)
            : state.past.at(-1)!,
          past: state.past.slice(0, -1),
          future: [state.scene, ...state.future].slice(0, 50),
        }
      : state;
  if (action.type === "redo")
    return state.future.length
      ? {
          scene: action.source
            ? bindStudioScene(state.future[0], action.source)
            : state.future[0],
          past: [...state.past, state.scene].slice(-50),
          future: state.future.slice(1),
        }
      : state;
  if (JSON.stringify(state.scene) === JSON.stringify(action.scene))
    return state;
  return {
    scene: action.scene,
    past: [...state.past, state.scene].slice(-50),
    future: [],
  };
}

export function useStudioEditor(detail: StudioDesignDetail) {
  const { tenantId, userId, summary } = useStudioContext(),
    design = detail.design;
  const cacheKey = `tlaco:studio:v1:${userId}:${tenantId}:${design.id}`;
  const [history, dispatch] = useReducer(historyReducer, {
    scene: design.draft_scene,
    past: [],
    future: [],
  });
  const [title, setTitle] = useState(design.title),
    [copy, setCopy] = useState(design.copy),
    [destination, setDestination] = useState(design.destination_url),
    [selectedId, setSelectedId] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false),
    [copying, setCopying] = useState(false),
    [saveState, setSaveState] = useState<
      "saved" | "saving" | "error" | "local"
    >("saved"),
    [error, setError] = useState<string | null>(null),
    [recovery, setRecovery] = useState<{
      scene: StudioScene;
      title: string;
      copy: string;
      destination: string;
    } | null>(null);
  const revision = useRef(design.revision),
    source = useRef(design.source_snapshot),
    interactionLock = useRef(false),
    saving = useRef<Promise<void> | null>(null),
    copyRequest = useRef<{ key: string; fingerprint: string } | null>(null);
  const current = useRef({ scene: history.scene, title, copy, destination });
  current.current = { scene: history.scene, title, copy, destination };
  const serialize = (value: typeof current.current) => JSON.stringify(value);
  const saved = useRef(serialize(current.current));
  const canEdit = Boolean(
    summary?.enabled && summary.permissions.includes("studio.create"),
  );
  const setScene = useCallback(
    (scene: StudioScene) =>
      dispatch({ type: "set", scene: bindStudioScene(scene, source.current) }),
    [],
  );
  useEffect(() => {
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const cached = JSON.parse(raw),
          parsed = studioSceneSchema.safeParse(cached.scene);
        if (parsed.success) {
          const restored = {
            scene: parsed.data,
            title:
              typeof cached.title === "string" ? cached.title : design.title,
            copy: typeof cached.copy === "string" ? cached.copy : design.copy,
            destination:
              typeof cached.destination === "string"
                ? cached.destination
                : design.destination_url,
          };
          if (JSON.stringify(restored) !== saved.current) setRecovery(restored);
        }
      }
    } catch {
      /* Recovery is best-effort. */
    }
  }, [
    cacheKey,
    design.draft_scene,
    design.title,
    design.copy,
    design.destination_url,
  ]);

  const saveNow = useCallback(async (): Promise<void> => {
    if (saving.current) {
      await saving.current;
      if (saved.current !== JSON.stringify(current.current)) return saveNow();
      return;
    }
    const payload = current.current,
      fingerprint = JSON.stringify(payload);
    if (fingerprint === saved.current) return;
    if (!canEdit)
      throw new Error(
        "Reactiva Studio para guardar esta composición. Tus cambios locales se conservan.",
      );
    setSaveState("saving");
    setError(null);
    const task = (async () => {
      try {
        const updated = await saveDesign(design.id, {
          tenant_id: tenantId,
          revision: revision.current,
          scene: payload.scene,
          title: payload.title,
          copy: payload.copy,
          destination_url: payload.destination,
        });
        revision.current = updated.revision;
        saved.current = fingerprint;
        setSaveState("saved");
        setConflict(false);
        try {
          localStorage.removeItem(cacheKey);
        } catch {
          /* Storage can be unavailable. */
        }
      } catch (e) {
        if (e instanceof ApiFetchError && e.code === "REVISION_CONFLICT")
          setConflict(true);
        setSaveState("error");
        setError(
          e instanceof Error ? e.message : "No pudimos guardar el diseño.",
        );
        throw e;
      }
    })();
    saving.current = task;
    try {
      await task;
    } finally {
      saving.current = null;
    }
  }, [cacheKey, canEdit, design.id, tenantId]);

  useEffect(() => {
    const value = current.current;
    if (JSON.stringify(value) === saved.current) return;
    try {
      localStorage.setItem(
        cacheKey,
        JSON.stringify({ ...value, baseRevision: revision.current }),
      );
    } catch {
      /* Autosave still works when local storage is unavailable. */
    }
    setSaveState("local");
    if (!canEdit) return;
    const timer = setTimeout(() => {
      void saveNow().catch(() => {});
    }, 1000);
    return () => clearTimeout(timer);
  }, [history.scene, title, copy, destination, canEdit, cacheKey, saveNow]);

  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => {
      if (JSON.stringify(current.current) !== saved.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    const online = () => {
      if (canEdit) void saveNow().catch(() => {});
    };
    window.addEventListener("beforeunload", before);
    window.addEventListener("online", online);
    return () => {
      window.removeEventListener("beforeunload", before);
      window.removeEventListener("online", online);
    };
  }, [canEdit, saveNow]);

  function updateNode(id: string, patch: Partial<StudioNode>) {
    if (!canEdit) return;
    setScene({
      ...history.scene,
      nodes: history.scene.nodes.map((n) =>
        n.id === id ? { ...n, ...patch } : n,
      ),
    });
  }
  function addNode(kind: StudioNode["kind"]) {
    if (!canEdit) return;
    const node = createStudioNode(
      kind,
      kind === "text" ? "Escribe tu mensaje" : kind === "qr" ? destination : "",
    );
    setScene({ ...history.scene, nodes: [...history.scene.nodes, node] });
    setSelectedId(node.id);
  }
  function deleteNode() {
    if (!canEdit) return;
    setScene({
      ...history.scene,
      nodes: history.scene.nodes.filter((n) => n.id !== selectedId),
    });
    setSelectedId(null);
  }
  function duplicateNode() {
    const node = history.scene.nodes.find((n) => n.id === selectedId);
    if (!node || !canEdit) return;
    const clone = {
      ...node,
      id: crypto.randomUUID(),
      x: Math.min(node.x + 0.03, 0.8),
      y: Math.min(node.y + 0.03, 0.8),
    };
    setScene({ ...history.scene, nodes: [...history.scene.nodes, clone] });
    setSelectedId(clone.id);
  }
  function moveLayer(direction: number) {
    const nodes = [...history.scene.nodes],
      index = nodes.findIndex((n) => n.id === selectedId),
      target = index + direction;
    if (index < 0 || target < 0 || target >= nodes.length || !canEdit) return;
    [nodes[index], nodes[target]] = [nodes[target], nodes[index]];
    setScene({ ...history.scene, nodes });
  }
  async function refreshSource() {
    if (!canEdit) return;
    await saveNow();
    const updated = await saveDesign(design.id, {
      tenant_id: tenantId,
      revision: revision.current,
      scene: history.scene,
      title,
      copy,
      destination_url: destination,
      refresh_source: true,
    });
    revision.current = updated.revision;
    source.current = updated.source_snapshot;
    const scene = bindStudioScene(updated.draft_scene, updated.source_snapshot);
    setScene(scene);
    current.current = { scene, title, copy, destination };
    saved.current = JSON.stringify(current.current);
    setError(null);
  }
  const selected = history.scene.nodes.find((n) => n.id === selectedId) ?? null;
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (
        !canEdit ||
        interactionLock.current ||
        (e.target instanceof HTMLElement &&
          (e.target.isContentEditable ||
            ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)))
      )
        return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        dispatch({
          type: e.shiftKey ? "redo" : "undo",
          source: source.current,
        });
      }
      if (e.key === "Escape") setSelectedId(null);
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [canEdit]);
  async function saveAsCopy(): Promise<string | null> {
    if (!canEdit || copying) return null;
    setCopying(true);
    setError(null);
    const payload = current.current,
      fingerprint = JSON.stringify(payload);
    if (copyRequest.current?.fingerprint !== fingerprint)
      copyRequest.current = { key: crypto.randomUUID(), fingerprint };
    try {
      const copied = await duplicateDesign(
        tenantId,
        design.id,
        {
          scene: payload.scene,
          title: payload.title,
          copy: payload.copy,
          destination_url: payload.destination,
        },
        copyRequest.current.key,
      );
      saved.current = fingerprint;
      setSaveState("saved");
      try {
        localStorage.removeItem(cacheKey);
      } catch {
        /* Browser storage may be unavailable. */
      }
      return copied.id;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No pudimos conservar la copia.",
      );
      return null;
    } finally {
      setCopying(false);
    }
  }
  function reloadFromServer() {
    saved.current = JSON.stringify(current.current);
    window.location.reload();
  }
  return {
    scene: history.scene,
    setScene,
    title,
    setTitle,
    copy,
    setCopy,
    destination,
    setDestination,
    selectedId,
    setSelectedId,
    selected,
    canEdit,
    interactionLock,
    conflict,
    copying,
    saveAsCopy,
    reloadFromServer,
    saveState,
    error,
    setError,
    saveNow,
    revision,
    source,
    updateNode,
    addNode,
    deleteNode,
    duplicateNode,
    moveLayer,
    undo: () => canEdit && dispatch({ type: "undo", source: source.current }),
    redo: () => canEdit && dispatch({ type: "redo", source: source.current }),
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    setFormat: (format: StudioFormat) =>
      canEdit && setScene(reflowStudioScene(history.scene, format)),
    template: (id: string) =>
      canEdit &&
      setScene(createStudioScene(source.current, id, history.scene.format)),
    refreshSource,
    recovery,
    recover: () => {
      if (recovery && canEdit) {
        setScene(recovery.scene);
        setTitle(recovery.title);
        setCopy(recovery.copy);
        setDestination(recovery.destination);
      }
      setRecovery(null);
    },
    dismissRecovery: () => setRecovery(null),
  };
}
