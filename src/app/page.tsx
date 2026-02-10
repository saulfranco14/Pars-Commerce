import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 bg-background">
      <h1 className="text-2xl font-semibold text-foreground">Pars Commerce</h1>
      <p className="text-muted-foreground text-center max-w-md">
        Plataforma multi-tenant para negocios: productos, órdenes, sitio web y
        más.
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-border-soft/60"
        >
          Iniciar sesión
        </Link>
        <Link
          href="/dashboard"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
        >
          Ir al dashboard
        </Link>
      </div>
    </div>
  );
}
