import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, Receipt, ShieldCheck, XCircle } from "lucide-react";

import { CustomerScreen } from "@/features/qr/components/customer/CustomerScreen";
import { formatCurrency } from "@/features/qr/helpers/format";
import { createAdminClient } from "@/lib/supabase/admin";

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{
    order_id?: string;
    status?: "success" | "failure" | "pending";
    payment_id?: string;
  }>;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-MX", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default async function QrPaymentSuccessPage({
  params,
  searchParams,
}: PageProps) {
  const { token } = await params;
  const { order_id, status } = await searchParams;

  const supabase = createAdminClient();

  const { data: qr } = await supabase
    .from("qr_codes")
    .select("id, label, tenant_id")
    .eq("token", token)
    .maybeSingle();

  if (!qr) notFound();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, name, slug")
    .eq("id", qr.tenant_id)
    .maybeSingle();

  if (!order_id) {
    return (
      <PaymentStatusShell
        tenantName={tenant?.name ?? ""}
        qrLabel={qr.label}
        token={token}
        variant="failure"
        title="Orden no encontrada"
        subtitle="No pudimos localizar tu pago. Si crees que se procesó correctamente, contacta al negocio."
      />
    );
  }

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, status, total, paid_total, balance_due, customer_name, customer_email, created_at, paid_at, payment_method",
    )
    .eq("id", order_id)
    .eq("tenant_id", qr.tenant_id)
    .maybeSingle();

  if (!order) {
    return (
      <PaymentStatusShell
        tenantName={tenant?.name ?? ""}
        qrLabel={qr.label}
        token={token}
        variant="failure"
        title="Orden no encontrada"
        subtitle="No pudimos localizar tu pago."
      />
    );
  }

  const { data: payment } = await supabase
    .from("payments")
    .select("id, provider, status, amount, metadata, created_at")
    .eq("order_id", order.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Resolve effective status: trust order.status first, then the redirect
  // query (Mercado Pago redirects can race the webhook on cold deployments).
  const variant: "success" | "pending" | "failure" =
    order.status === "paid" || order.status === "completed"
      ? "success"
      : status === "failure"
        ? "failure"
        : "pending";

  const meta = (payment?.metadata as Record<string, unknown> | null) ?? {};
  const mpPaymentId =
    (meta.mp_payment_id as string | undefined) ??
    (meta.payment_id as string | undefined) ??
    null;
  const mpReceiptUrl =
    (meta.receipt_url as string | undefined) ??
    (meta.mp_receipt_url as string | undefined) ??
    null;

  return (
    <PaymentStatusShell
      tenantName={tenant?.name ?? ""}
      qrLabel={qr.label}
      token={token}
      variant={variant}
      title={
        variant === "success"
          ? "¡Pago confirmado!"
          : variant === "pending"
            ? "Pago en proceso"
            : "El pago no se completó"
      }
      subtitle={
        variant === "success"
          ? `Gracias${order.customer_name && order.customer_name !== "Cliente" ? `, ${order.customer_name}` : ""}. Tu apoyo llega directo al equipo.`
          : variant === "pending"
            ? "Estamos verificando con Mercado Pago. Esto puede tardar unos segundos."
            : "No te preocupes — no se realizó ningún cargo. Puedes intentar de nuevo."
      }
      amount={Number(order.total)}
      rows={[
        { label: "Negocio", value: tenant?.name ?? "—" },
        { label: "Concepto", value: qr.label },
        order.customer_name && order.customer_name !== "Cliente"
          ? { label: "De parte de", value: order.customer_name }
          : null,
        order.customer_email && order.customer_email !== "anonimo@pars.com.mx"
          ? { label: "Correo", value: order.customer_email }
          : null,
        {
          label: "Método",
          value: order.payment_method
            ? prettyMethod(String(order.payment_method))
            : "Mercado Pago",
        },
        {
          label: "Fecha",
          value: formatDate(order.paid_at || order.created_at),
        },
        mpPaymentId
          ? { label: "ID de pago", value: mpPaymentId, mono: true }
          : null,
        {
          label: "Orden",
          value: order.id.slice(0, 8).toUpperCase(),
          mono: true,
        },
      ].filter(Boolean) as ReceiptRow[]}
      receiptUrl={mpReceiptUrl}
    />
  );
}

function prettyMethod(value: string) {
  const map: Record<string, string> = {
    mercadopago: "Mercado Pago",
    manual: "Pago manual",
    transferencia: "Transferencia",
    tarjeta: "Tarjeta",
    efectivo: "Efectivo",
  };
  return map[value] ?? value;
}

interface ReceiptRow {
  label: string;
  value: string;
  mono?: boolean;
}

interface PaymentStatusShellProps {
  tenantName: string;
  qrLabel: string;
  token: string;
  variant: "success" | "pending" | "failure";
  title: string;
  subtitle: string;
  amount?: number;
  rows?: ReceiptRow[];
  receiptUrl?: string | null;
}

function PaymentStatusShell({
  tenantName,
  qrLabel,
  token,
  variant,
  title,
  subtitle,
  amount,
  rows = [],
  receiptUrl,
}: PaymentStatusShellProps) {
  const tone =
    variant === "success"
      ? "success"
      : variant === "pending"
        ? "pending"
        : "danger";

  const HeroIcon =
    variant === "success" ? CheckCircle2 : variant === "pending" ? Clock : XCircle;

  const hero = (
    <div className="text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-md">
          <HeroIcon className="h-6 w-6 text-accent" strokeWidth={2.5} />
        </div>
      </div>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mx-auto mt-1 max-w-xs text-sm opacity-90">{subtitle}</p>

      {amount !== undefined && (
        <div className="mt-5 inline-flex items-baseline gap-1 rounded-2xl bg-white/15 px-5 py-2.5 backdrop-blur-sm">
          <span className="text-3xl font-bold tracking-tight">
            {formatCurrency(amount)}
          </span>
        </div>
      )}
    </div>
  );

  const footer = (
    <div className="space-y-2">
      {variant === "success" && receiptUrl && (
        <a
          href={receiptUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 text-sm font-bold text-foreground transition-all hover:bg-border-soft/40 active:scale-[0.99]"
        >
          <Receipt className="h-4 w-4" />
          Ver comprobante de Mercado Pago
        </a>
      )}

      {variant !== "success" && (
        <Link
          href={`/q/${token}`}
          className="flex min-h-[54px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-accent px-4 text-base font-bold text-accent-foreground shadow-md shadow-accent/20 transition-all hover:bg-accent/90 active:scale-[0.99]"
        >
          Intentar de nuevo
        </Link>
      )}

      <Link
        href={`/q/${token}`}
        className={`flex min-h-[52px] w-full cursor-pointer items-center justify-center rounded-2xl px-4 text-sm font-bold transition-all active:scale-[0.99] ${
          variant === "success"
            ? "bg-accent text-accent-foreground shadow-md shadow-accent/20 hover:bg-accent/90"
            : "border border-border bg-surface text-foreground hover:bg-border-soft/40"
        }`}
      >
        {variant === "success" ? "Listo" : "Volver al inicio"}
      </Link>
    </div>
  );

  return (
    <CustomerScreen
      header={hero}
      tone={tone}
      backHref={`/q/${token}`}
      tenantName={tenantName}
      footer={footer}
    >
      <div className="space-y-4">
        {rows.length > 0 && (
          <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Detalles del pago
            </p>
            <dl className="space-y-2.5">
              {rows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-start justify-between gap-3 border-b border-border-soft/60 pb-2.5 last:border-0 last:pb-0"
                >
                  <dt className="text-xs font-medium text-muted-foreground">
                    {row.label}
                  </dt>
                  <dd
                    className={`text-right text-sm font-semibold text-foreground ${
                      row.mono ? "font-mono text-[11px]" : ""
                    }`}
                  >
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <div className="flex flex-col items-center gap-1.5 pt-2 text-center">
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              Pago seguro
            </span>
            <span className="text-border">·</span>
            <span>Mercado Pago</span>
          </div>
          <p className="text-[11px] text-muted-foreground/80">
            Guarda esta página como comprobante.
          </p>
        </div>

        <div className="text-center text-[10px] uppercase tracking-wider text-muted-foreground/60">
          {qrLabel}
        </div>
      </div>
    </CustomerScreen>
  );
}
