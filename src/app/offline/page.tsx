"use client";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-foreground">
          Sin conexión
        </h1>
        <p className="mt-2 text-sm text-muted">
          No hay conexión a internet. Revisa tu conexión e intenta de nuevo.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 min-h-[44px] rounded-xl bg-accent px-6 py-3 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
