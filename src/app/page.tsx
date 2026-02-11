import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import logo from "@/assets/logo.png";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-background">
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.15) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
        aria-hidden
      />
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-xl border border-border bg-surface-raised p-8 shadow-card sm:p-10">
          <div className="flex justify-center">
            <Image
              src={logo}
              alt="Pars Commerce"
              width={120}
              height={120}
              className="h-auto w-[100px] sm:w-[120px]"
              priority
            />
          </div>
          <h1 className="mt-6 text-center text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Pars Commerce
          </h1>
          <p className="mt-2 text-center text-[15px] leading-relaxed text-muted-foreground">
            Plataforma multi-tenant para negocios: productos, órdenes, sitio web
            y más.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="min-h-[44px] inline-flex items-center justify-center rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-border-soft/50 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface-raised"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/dashboard"
              className="min-h-[44px] inline-flex items-center justify-center rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface-raised disabled:opacity-50"
            >
              Ir al dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
