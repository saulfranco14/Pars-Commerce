"use client";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmDanger?: boolean;
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirmar",
  confirmDanger = true,
  loading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          id="confirm-modal-title"
          className="text-lg font-semibold text-zinc-900"
        >
          {title}
        </h3>
        <p className="mt-2 text-sm text-zinc-600">{message}</p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={
              confirmDanger
                ? "flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                : "flex-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            }
          >
            {loading ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
