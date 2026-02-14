"use client";

import { useState, useEffect } from "react";
import { useOrder } from "../hooks/useOrder";
import { User, Mail, Phone, X, Check, Pencil } from "lucide-react";

export function CustomerCard() {
  const { order, actionLoading, handleSaveCustomer } = useOrder();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (order) {
      setName(order.customer_name ?? "");
      setEmail(order.customer_email ?? "");
      setPhone(order.customer_phone ?? "");
    }
  }, [order]);

  if (!order) return null;

  const canEdit = ["draft", "assigned", "in_progress"].includes(order.status);

  const onSave = async () => {
    await handleSaveCustomer({ name, email, phone });
    setEditing(false);
  };

  const onCancel = () => {
    setEditing(false);
    setName(order.customer_name ?? "");
    setEmail(order.customer_email ?? "");
    setPhone(order.customer_phone ?? "");
  };

  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden text-left">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted" />
          <h2 className="text-sm font-semibold text-foreground">Información del Cliente</h2>
        </div>
        {canEdit && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-accent transition-colors duration-200 hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Editar
          </button>
        )}
      </div>

      <div className="p-4">
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
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-muted uppercase">Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-border px-3 py-1.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted uppercase">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-border px-3 py-1.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted uppercase">Teléfono</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-border px-3 py-1.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={actionLoading}
                className="inline-flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-border-soft/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-4 w-4 shrink-0" aria-hidden />
                Cancelar
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={actionLoading}
                className="inline-flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors duration-200 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Check className="h-4 w-4 shrink-0" aria-hidden />
                {actionLoading ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
