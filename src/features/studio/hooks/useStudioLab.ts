"use client";
import { useState } from "react";
import { studioLabScene } from "../helpers/lab";
import { createStudioNode, reflowStudioScene } from "../helpers/scene";
import type {
  StudioFormat,
  StudioNode,
  StudioScene,
} from "../interfaces/scene";

export function useStudioLab() {
  const [history, setHistory] = useState<{
    scenes: StudioScene[];
    index: number;
  }>(() => ({
    scenes: [studioLabScene()],
    index: 0,
  }));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [example, setExample] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scene = history.scenes[history.index];
  const selected = scene.nodes.find((node) => node.id === selectedId) ?? null;
  function edit(update: (current: StudioScene) => StudioScene) {
    if (busy) return;
    setHistory((current) => {
      const next = update(current.scenes[current.index]);
      if (next === current.scenes[current.index]) return current;
      const scenes = [
        ...current.scenes.slice(0, current.index + 1),
        next,
      ].slice(-31);
      return { scenes, index: scenes.length - 1 };
    });
  }
  function updateNode(id: string, patch: Partial<StudioNode>) {
    edit((current) => ({
      ...current,
      nodes: current.nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              ...patch,
              id: node.id,
              kind: node.kind,
              binding: node.binding,
              ...(node.binding ? { content: node.content } : {}),
            }
          : node,
      ),
    }));
  }
  function add(kind: StudioNode["kind"]) {
    const node = createStudioNode(
      kind,
      kind === "text"
        ? "Tu mensaje"
        : kind === "qr"
          ? "https://tlaco.app/studio"
          : "",
    );
    edit((current) => ({ ...current, nodes: [...current.nodes, node] }));
    setSelectedId(node.id);
  }
  function duplicate() {
    if (!selected || selected.locked || busy) return;
    const node = {
      ...selected,
      id: crypto.randomUUID(),
      x: Math.min(0.9, selected.x + 0.02),
      y: Math.min(0.9, selected.y + 0.02),
    };
    edit((current) => ({ ...current, nodes: [...current.nodes, node] }));
    setSelectedId(node.id);
  }
  function move(direction: number) {
    if (!selected || selected.locked) return;
    edit((current) => {
      const nodes = [...current.nodes],
        from = nodes.findIndex((node) => node.id === selectedId);
      const to = Math.max(0, Math.min(nodes.length - 1, from + direction));
      if (from >= 0) [nodes[from], nodes[to]] = [nodes[to], nodes[from]];
      return { ...current, nodes };
    });
  }
  async function download() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const { exportStudioScene } = await import("../helpers/canvas");
      // All lab images are static local assets; there are no tenant assets or API calls.
      const blob = await exportStudioScene(scene, [], "", true);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `tlaco-studio-prueba-${scene.format}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos exportar la composición.",
      );
    } finally {
      setBusy(false);
    }
  }
  return {
    scene,
    selected,
    selectedId,
    setSelectedId,
    example,
    busy,
    error,
    updateNode,
    add,
    duplicate,
    move,
    download,
    canUndo: history.index > 0,
    canRedo: history.index < history.scenes.length - 1,
    undo: () => {
      if (!busy)
        setHistory((current) => ({
          ...current,
          index: Math.max(0, current.index - 1),
        }));
    },
    redo: () => {
      if (!busy)
        setHistory((current) => ({
          ...current,
          index: Math.min(current.scenes.length - 1, current.index + 1),
        }));
    },
    remove: () => {
      if (selected && !selected.locked)
        edit((current) => ({
          ...current,
          nodes: current.nodes.filter((node) => node.id !== selectedId),
        }));
    },
    format: (value: StudioFormat) =>
      edit((current) => reflowStudioScene(current, value)),
    chooseExample: (value: number) => {
      if (!busy) {
        setExample(value);
        setSelectedId(null);
        edit((current) => studioLabScene(value, "clean", current.format));
      }
    },
    template: (value: string) => {
      setSelectedId(null);
      edit((current) => studioLabScene(example, value, current.format));
    },
  };
}
