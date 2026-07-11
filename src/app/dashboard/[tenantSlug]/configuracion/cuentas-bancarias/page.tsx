"use client";

import { useState } from "react";
import { Landmark, Plus } from "lucide-react";

import { useActiveTenant } from "@/stores/useTenantStore";
import { useBankAccounts } from "@/features/configuracion/hooks/useBankAccounts";
import { BankAccountCard } from "@/features/configuracion/components/BankAccountCard";
import { BankAccountForm } from "@/features/configuracion/components/BankAccountForm";
import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { FormSheet } from "@/components/ui/FormSheet";
import { Toast } from "@/components/ui/Toast";

import type { TenantPaymentMethod } from "@/features/configuracion/interfaces/bankAccount";
import type { BankAccountFormValues } from "@/features/configuracion/validations/bankAccountSchema";

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
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  const formTitle = editing ? "Editar cuenta bancaria" : "Nueva cuenta bancaria";

  function openCreate() {
    setEditing(null);
    setError(null);
    setShowForm(true);
  }

  function openEdit(account: TenantPaymentMethod) {
    setEditing(account);
    setError(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setError(null);
  }

  async function onSubmit(values: BankAccountFormValues) {
    setSubmitting(true);
    setError(null);
    try {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSubmitting(false);
    }
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

      <FormSheet isOpen={showForm} onClose={closeForm} title={formTitle}>
        <BankAccountForm
          initial={editing}
          onSubmit={onSubmit}
          onCancel={closeForm}
          submitting={submitting}
          error={error}
        />
      </FormSheet>

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
