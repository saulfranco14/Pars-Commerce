"use client";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Trash2,
  Unlock,
} from "lucide-react";
import { adminActionButtonIcon } from "@/components/admin/actionButtonClasses";
import type { StudioNode } from "../../interfaces/scene";

export function StudioLayerPanel({
  nodes,
  selectedId,
  readOnly,
  onSelect,
  onChange,
  onMove,
  onDelete,
  onDuplicate,
}: {
  nodes: StudioNode[];
  selectedId: string | null;
  readOnly: boolean;
  onSelect: (id: string) => void;
  onChange: (id: string, patch: Partial<StudioNode>) => void;
  onMove: (direction: number) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-bold">Capas</h3>
      <ol className="space-y-2">
        {nodes.toReversed().map((node) => (
          <li
            key={node.id}
            className={`flex items-center gap-1 rounded-xl border p-1 ${selectedId === node.id ? "border-accent bg-accent/5" : "border-border"}`}
          >
            <button
              className="min-h-11 min-w-0 flex-1 px-2 text-left text-xs font-medium"
              aria-pressed={selectedId === node.id}
              onClick={() => onSelect(node.id)}
            >
              <span className="block truncate">
                {node.content ||
                  (node.kind === "image"
                    ? "Fotografía"
                    : node.kind === "logo"
                      ? "Logo"
                      : node.kind === "shape"
                        ? "Figura"
                        : "Código QR")}
              </span>
            </button>
            <button
              className="flex h-11 w-9 shrink-0 items-center justify-center"
              aria-label={node.visible ? "Ocultar capa" : "Mostrar capa"}
              disabled={readOnly}
              onClick={() => onChange(node.id, { visible: !node.visible })}
            >
              {node.visible ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </button>
            <button
              className="flex h-11 w-9 shrink-0 items-center justify-center"
              aria-label={node.locked ? "Desbloquear capa" : "Bloquear capa"}
              disabled={readOnly}
              onClick={() => onChange(node.id, { locked: !node.locked })}
            >
              {node.locked ? (
                <Lock className="h-4 w-4" />
              ) : (
                <Unlock className="h-4 w-4" />
              )}
            </button>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Subir capa", Icon: ArrowUp, action: () => onMove(1) },
          { label: "Bajar capa", Icon: ArrowDown, action: () => onMove(-1) },
          { label: "Duplicar capa", Icon: Copy, action: onDuplicate },
          { label: "Eliminar capa", Icon: Trash2, action: onDelete },
        ].map(({ label, Icon, action }) => (
          <button
            key={label}
            className={adminActionButtonIcon}
            aria-label={label}
            onClick={action}
            disabled={readOnly || !selectedId}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
    </section>
  );
}
