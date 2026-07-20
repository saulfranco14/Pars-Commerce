"use client";

import { useState } from "react";
import { Landmark, Plus } from "lucide-react";

import { useActiveTenant } from "@/stores/useTenantStore";
import { useBankAccounts } from "@/features/configuracion/hooks/useBankAccounts";
import { BankAccountCard } from "@/features/configuracion/components/bank-account/BankAccountCard";
import { BankAccountFormSheet } from "@/features/configuracion/components/bank-account/BankAccountForm";
import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { Toast } from "@/components/ui/Toast";

import type { TenantPaymentMethod } from "@/features/configuracion/interfaces/bankAccount";
import type { BankAccountFieldValues } from "@/features/configuracion/validations/bankAccountFieldSchema";

const primaryCta =
  "inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-2xl bg-accent px-4 py-2 text-sm font-bold text-accent-foreground shadow-md shadow-accent/20 hover:bg-accent/90 active:scale-[0.99] transition-all";

export default function BankAccountsPage() {
  const activeTenant = useActiveTenant();
  const {
    accounts,
    activeAccount,
    isLoading,
    handleCreate,
    handleUpdate,
    handleSetActive,
    handleDelete,
  } = useBankAccounts(activeTenant?.id ?? null);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TenantPaymentMethod | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    tone: "success" | "error";
  } | null>(null);

  if (!activeTenant) {
    return (
      <div className="text-sm text-muted-foreground">
        Selecciona un negocio para continuar.
      </div>
    );
  }

  function openCreate() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(account: TenantPaymentMethod) {
    setEditing(account);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  async function onSubmit(values: BankAccountFieldValues) {
    if (editing) {
      await handleUpdate(editing.id, values);
      setToast({
        message: "Cuenta actualizada correctamente.",
        tone: "success",
      });
    } else {
      await handleCreate(values);
      setToast({ message: "Cuenta agregada correctamente.", tone: "success" });
    }
    closeForm();
  }

  async function onSelect(id: string) {
    setActivatingId(id);
    try {
      await handleSetActive(id);
      const selected = accounts.find((a) => a.id === id);
      setToast({
        message: `"${selected?.label ?? "Cuenta"}" es ahora la cuenta principal.`,
        tone: "success",
      });
    } catch {
      setToast({
        message: "No se pudo cambiar la cuenta principal.",
        tone: "error",
      });
    } finally {
      setActivatingId(null);
    }
  }

  async function onDelete(id: string) {
    setDeletingId(id);
    try {
      await handleDelete(id);
      setToast({ message: "Cuenta eliminada.", tone: "success" });
    } catch {
      setToast({ message: "No se pudo eliminar la cuenta.", tone: "error" });
    } finally {
      setDeletingId(null);
    }
  }

  const hasAccounts = accounts.length > 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Cuentas bancarias"
        description="Selecciona la cuenta principal que se mostrará al cliente."
        action={
          <button type="button" onClick={openCreate} className={primaryCta}>
            <Plus className="h-4 w-4" />
            Agregar cuenta
          </button>
        }
      />

      <BankAccountFormSheet
        isOpen={showForm}
        initial={editing}
        onSubmit={onSubmit}
        onCancel={closeForm}
      />

      {isLoading && (
        <p className="text-sm text-muted-foreground">Cargando cuentas...</p>
      )}

      {!isLoading && accounts.length > 1 && (
        <p className="text-xs text-muted-foreground">
          Toca el círculo para cambiar la cuenta principal.
        </p>
      )}

      {!isLoading && !hasAccounts ? (
        <EmptyState
          icon={Landmark}
          title="Aún no tienes cuentas bancarias"
          description="Agrega una cuenta para que tus clientes puedan transferirte directamente desde el QR."
          action={
            <button type="button" onClick={openCreate} className={primaryCta}>
              <Plus className="h-4 w-4" />
              Agregar primera cuenta
            </button>
          }
        />
      ) : (
        <div
          role="radiogroup"
          aria-label="Cuenta bancaria principal"
          className="space-y-3"
        >
          {accounts.map((account) => (
            <BankAccountCard
              key={account.id}
              account={account}
              isSelected={activeAccount?.id === account.id}
              onSelect={onSelect}
              onEdit={openEdit}
              onDelete={onDelete}
              activating={activatingId === account.id}
              deleting={deletingId === account.id}
            />
          ))}
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          tone={toast.tone}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  );
}
