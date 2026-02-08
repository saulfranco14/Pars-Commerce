import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 bg-zinc-50">
      <h1 className="text-2xl font-semibold text-zinc-900">Pars Commerce</h1>
      <p className="text-zinc-600 text-center max-w-md">
        Plataforma multi-tenant para negocios: productos, órdenes, sitio web y
        más.
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Iniciar sesión
        </Link>
        <Link
          href="/dashboard"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Ir al dashboard
        </Link>
      </div>
    </div>
  );
}
