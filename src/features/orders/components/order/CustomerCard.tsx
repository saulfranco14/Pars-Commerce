"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useOrder } from "@/features/orders/hooks/useOrder";
import { User, Mail, Phone, X, Check, Pencil, ChevronDown, Loader2 } from "lucide-react";
import { orderCustomerSchema } from "@/features/prestamos/validations/loanForm";
import { CustomerFields, type CustomerFieldValues } from "@/features/prestamos/components/customer/CustomerFields";
import { btnPrimary, btnSecondary } from "@/components/ui/buttonClasses";

export function CustomerCard() {
  const { order, actionLoading, handleSaveCustomer } = useOrder();
  const [editing, setEditing] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFieldValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: yupResolver(orderCustomerSchema) as any,
    mode: "onChange",
    defaultValues: { name: "", email: "", phone: "" },
  });

  useEffect(() => {
    if (order) {
      reset({
        name: order.customer_name ?? "",
        email: order.customer_email ?? "",
        phone: order.customer_phone ?? "",
      });
    }
  }, [order, reset]);

  if (!order) return null;

  const canEdit = ["draft", "assigned", "in_progress", "completed", "pending_payment"].includes(
    order.status
  );

  const onSave = handleSubmit(async (values) => {
    await handleSaveCustomer({
      name: values.name ?? "",
      email: values.email ?? "",
      phone: values.phone ?? "",
    });
    setEditing(false);
  });

  const onCancel = () => {
    setEditing(false);
    reset({
      name: order.customer_name ?? "",
      email: order.customer_email ?? "",
      phone: order.customer_phone ?? "",
    });
  };

  const customerSummary = order.customer_name || order.customer_email || order.customer_phone || "—";

  const customerContent = (compact?: boolean) => (
    <div className={compact ? "p-3" : "p-4"}>
        {!editing ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Nombre</span>
              <p className="text-sm font-medium text-foreground">{order.customer_name || "—"}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Email</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Mail className="h-3 w-3 text-muted-foreground/60" />
                <p className="text-sm text-muted-foreground">{order.customer_email || "—"}</p>
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Teléfono</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Phone className="h-3 w-3 text-muted-foreground/60" />
                <p className="text-sm text-muted-foreground">{order.customer_phone || "—"}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <CustomerFields
              register={register}
              errors={errors}
              compact
              idPrefix="order-customer"
              disabled={actionLoading}
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={actionLoading}
                className={`${btnSecondary} min-h-12 flex-1 rounded-xl`}
              >
                <X className="h-4 w-4 shrink-0" aria-hidden />
                Cancelar
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={actionLoading}
                className={`${btnPrimary} min-h-12 flex-1 rounded-xl`}
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                ) : (
                  <Check className="h-4 w-4 shrink-0" aria-hidden />
                )}
                {actionLoading ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </div>
        )}
    </div>
  );

  const desktopSummary = (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <User className="h-4 w-4 shrink-0 text-muted" />
        <span className="text-sm font-semibold text-foreground">Cliente</span>
        <span className="truncate text-sm text-muted">{customerSummary}</span>
      </div>
      {canEdit && !desktopOpen && (
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); setDesktopOpen(true); setEditing(true); }}
          className="shrink-0 rounded px-2 py-1 text-sm font-medium text-accent hover:bg-accent/10"
        >
          Editar
        </button>
      )}
    </div>
  );

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-surface-raised text-left shadow-sm">
      <details
        open={desktopOpen}
        onToggle={(e) => setDesktopOpen((e.target as HTMLDetailsElement).open)}
        className="group hidden md:block [&>summary::-webkit-details-marker]:hidden"
      >
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-4 py-2">
          {desktopSummary}
          <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-border/50 px-4 py-3">
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-xs font-semibold text-muted uppercase tracking-wider">Información del Cliente</h2>
            {canEdit && !editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex min-h-9 min-w-9 cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-accent hover:bg-accent/10"
              >
                <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Editar
              </button>
            )}
          </div>
          {customerContent()}
        </div>
      </details>
      <details
        open={mobileOpen}
        onToggle={(e) => setMobileOpen((e.target as HTMLDetailsElement).open)}
        className="group md:hidden [&>summary::-webkit-details-marker]:hidden"
      >
        <summary className="flex min-h-[4.5rem] cursor-pointer list-none items-center gap-3 px-3 py-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent"><User className="h-4 w-4" aria-hidden /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-bold uppercase tracking-[0.11em] text-muted">Cliente</span>
            <span className="mt-0.5 block truncate text-sm font-semibold text-foreground">{customerSummary}</span>
            {(order.customer_phone || order.customer_email) ? <span className="mt-0.5 block truncate text-xs text-muted">{order.customer_phone || order.customer_email}</span> : <span className="mt-0.5 block text-xs text-muted">Sin datos de contacto</span>}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-border/50 bg-surface-raised">
          <div className="flex min-h-12 items-center justify-between gap-3 px-3 pt-2">
            <h2 className="text-sm font-semibold text-foreground">Datos del cliente</h2>
            {canEdit && !editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Editar
              </button>
            )}
          </div>
          {customerContent(true)}
        </div>
      </details>
    </div>
  );
}
