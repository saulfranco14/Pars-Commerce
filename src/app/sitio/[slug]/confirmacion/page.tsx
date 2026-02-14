import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string; order_id?: string }>;
}

export default async function ConfirmacionPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const { status, order_id } = await searchParams;

  const supabase = createAdminClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, name, theme_color")
    .eq("slug", slug)
    .single();

  if (!tenant) {
    notFound();
  }

  const accentColor = tenant.theme_color?.trim() || "#18181b";

  if (status === "success") {
    return (
      <div className="mx-auto max-w-md space-y-6 text-center">
        <h2
          className="text-xl font-semibold"
          style={{ color: accentColor }}
        >
          ¡Gracias por tu compra!
        </h2>
        <p className="text-muted-foreground">
          Tu pago se ha procesado correctamente. Te hemos enviado un correo de
          confirmación.
        </p>
        <Link
          href={`/sitio/${slug}/productos`}
          className="inline-block rounded-md px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
          style={{ backgroundColor: accentColor }}
        >
          Seguir comprando
        </Link>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="mx-auto max-w-md space-y-6 text-center">
        <h2
          className="text-xl font-semibold"
          style={{ color: accentColor }}
        >
          Pago pendiente
        </h2>
        <p className="text-muted-foreground">
          Tu pago está siendo procesado. Te notificaremos cuando se confirme.
        </p>
        <Link
          href={`/sitio/${slug}/productos`}
          className="inline-block rounded-md px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
          style={{ backgroundColor: accentColor }}
        >
          Volver al sitio
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6 text-center">
      <h2 className="text-xl font-semibold text-foreground">
        Hubo un problema
      </h2>
      <p className="text-muted-foreground">
        No se pudo completar tu pago. Puedes intentar de nuevo desde el carrito.
      </p>
      <Link
        href={`/sitio/${slug}/carrito`}
        className="inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
      >
        Volver al carrito
      </Link>
    </div>
  );
}
