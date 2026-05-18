"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

import { useActiveTenant } from "@/stores/useTenantStore";
import { useBankAccounts } from "@/features/configuracion/hooks/useBankAccounts";
import { BankAccountCard } from "@/features/configuracion/components/BankAccountCard";
import { BankAccountForm } from "@/features/configuracion/components/BankAccountForm";
import { BottomSheet } from "@/components/ui/BottomSheet";

import type { TenantPaymentMethod } from "@/features/configuracion/interfaces/bankAccount";
import type { BankAccountFormValues } from "@/features/configuracion/validations/bankAccountSchema";

// Simple inline toast — no external lib needed.
function Toast({
  message,
  type,
  onDone,
}: {
  message: string;
  type: "success" | "error";
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg transition-all
        ${type === "success" ? "bg-accent text-accent-foreground" : "bg-red-600 text-white"}`}
    >
      {message}
    </div>,
    document.body,
  );
}

// Desktop modal overlay for the form.
function FormModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 hidden items-center justify-center md:flex">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-xl">
        <h2 className="mb-5 text-base font-semibold text-foreground">
          {title}
        </h2>
        {children}
      </div>
    </div>,
    document.body,
  );
}

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
    type: "success" | "error";
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!activeTenant) {
    return (
      <div className="text-sm text-muted-foreground">
        Selecciona un negocio para continuar.
      </div>
    );
  }

  const formTitle = editing
    ? "Editar cuenta bancaria"
    : "Nueva cuenta bancaria";

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
          type: "success",
        });
      } else {
        await handleCreate(values);
        setToast({
          message: "Cuenta agregada correctamente.",
          type: "success",
        });
      }
      closeForm();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo guardar";
      setError(msg);
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
        type: "success",
      });
    } catch {
      setToast({
        message: "No se pudo cambiar la cuenta principal.",
        type: "error",
      });
    } finally {
      setActivatingId(null);
    }
  }

  async function onDelete(id: string) {
    setDeletingId(id);
    try {
      await handleDelete(id);
      setToast({ message: "Cuenta eliminada.", type: "success" });
    } catch {
      setToast({ message: "No se pudo eliminar la cuenta.", type: "error" });
    } finally {
      setDeletingId(null);
    }
  }

  const formContent = (
    <BankAccountForm
      initial={editing}
      onSubmit={onSubmit}
      onCancel={closeForm}
      submitting={submitting}
      error={error}
    />
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
            Cuentas bancarias
          </h1>
          <p className="text-sm text-muted-foreground">
            Selecciona la cuenta principal que se mostrará al cliente.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="min-h-[44px] cursor-pointer rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90"
        >
          Agregar cuenta
        </button>
      </div>

      {/* Form — desktop modal */}
      {mounted && showForm && (
        <>
          <FormModal title={formTitle} onClose={closeForm}>
            {formContent}
          </FormModal>
          {/* Mobile bottom sheet */}
          <BottomSheet isOpen={showForm} onClose={closeForm} title={formTitle}>
            {formContent}
          </BottomSheet>
        </>
      )}

      {/* Loading */}
      {isLoading && (
        <p className="text-sm text-muted-foreground">Cargando cuentas...</p>
      )}

      {/* Hint */}
      {!isLoading && accounts.length > 1 && (
        <p className="text-xs text-muted-foreground">
          Toca el círculo para cambiar la cuenta principal.
        </p>
      )}

      {/* Cards */}
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
        {!isLoading && accounts.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Aún no tienes cuentas bancarias registradas.
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-3 min-h-[44px] cursor-pointer rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90"
            >
              Agregar primera cuenta
            </button>
          </div>
        )}
      </div>

      {/* Toast */}
      {mounted && toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  );
}
