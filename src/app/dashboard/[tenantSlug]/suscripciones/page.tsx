"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { Repeat, CalendarCheck, ChevronRight } from "lucide-react";

import { useActiveTenant } from "@/stores/useTenantStore";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { SubscriptionsOnboardingOverlay } from "@/components/onboarding/SubscriptionsOnboardingOverlay";
import {
  TableWrapper,
  tableHeaderRowClass,
  tableHeaderCellClass,
  tableHeaderCellRightClass,
  tableBodyCellClass,
  tableBodyCellMutedClass,
  tableBodyCellRightClass,
} from "@/components/ui/TableWrapper";
import { formatOrderDate } from "@/lib/formatDate";
import { swrFetcher } from "@/lib/swrFetcher";

import { SUBSCRIPTION_STATUS_TABS, SUBSCRIPTION_TYPE_TABS } from "@/features/suscripciones/constants/statusTabs";
import { buildSubscriptionsKey } from "@/features/suscripciones/helpers/buildSubscriptionsKey";
import {
  subscriptionStatusLabel,
  subscriptionStatusColor,
  subscriptionTypeLabel,
  freqLabel,
} from "@/features/suscripciones/helpers/subscriptionLabels";

import type { SubscriptionStatus, SubscriptionType } from "@/types/subscriptions";

interface SubscriptionRow {
  id: string;
  type: SubscriptionType;
  status: SubscriptionStatus;
  concept: string | null;
  customer_name: string;
  customer_email: string;
  charge_amount: number;
  frequency: number;
  frequency_type: "weeks" | "months";
  total_installments: number | null;
  completed_installments: number;
  discount_percent: number;
  original_amount: number;
  discounted_amount: number;
  created_at: string;
  cancelled_at: string | null;
  start_date: string | null;
}

export default function SuscripcionesPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useActiveTenant();

  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const key = buildSubscriptionsKey(activeTenant?.id, statusFilter, typeFilter);
  const { data: subscriptions = [], isLoading } = useSWR<SubscriptionRow[]>(
    key,
    swrFetcher,
    { fallbackData: [], revalidateOnFocus: false },
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Suscripciones</h1>
      </div>

      <div className="space-y-2">
        <FilterTabs
          tabs={SUBSCRIPTION_STATUS_TABS}
          activeValue={statusFilter}
          onTabChange={setStatusFilter}
          ariaLabel="Filtrar por estado"
        />
        <FilterTabs
          tabs={SUBSCRIPTION_TYPE_TABS}
          activeValue={typeFilter}
          onTabChange={setTypeFilter}
          ariaLabel="Filtrar por tipo"
        />
      </div>

      {isLoading ? (
        <LoadingBlock variant="skeleton" skeletonRows={5} />
      ) : subscriptions.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface-raised py-12 text-center">
          <Repeat className="mx-auto h-8 w-8 text-muted" />
          <p className="mt-2 text-sm text-muted">No hay suscripciones</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <TableWrapper>
              <table className="w-full">
                <thead>
                  <tr className={tableHeaderRowClass}>
                    <th className={tableHeaderCellClass}>Cliente</th>
                    <th className={tableHeaderCellClass}>Concepto</th>
                    <th className={tableHeaderCellClass}>Tipo</th>
                    <th className={tableHeaderCellClass}>Frecuencia</th>
                    <th className={tableHeaderCellClass}>Estado</th>
                    <th className={tableHeaderCellClass}>Progreso</th>
                    <th className={tableHeaderCellRightClass}>Monto/cobro</th>
                    <th className={tableHeaderCellClass}>Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft">
                  {subscriptions.map((sub) => (
                    <tr
                      key={sub.id}
                      className="hover:bg-border-soft/40 transition-colors"
                    >
                      <td className={tableBodyCellClass}>
                        <Link
                          href={`/dashboard/${tenantSlug}/suscripciones/${sub.id}`}
                          className="font-medium hover:underline"
                        >
                          {sub.customer_name}
                        </Link>
                      </td>
                      <td className={tableBodyCellMutedClass}>
                        <span className="line-clamp-1 max-w-[200px]">
                          {sub.concept || "—"}
                        </span>
                      </td>
                      <td className={tableBodyCellClass}>
                        <span className="inline-flex items-center gap-1 text-xs">
                          {sub.type === "installments" ? (
                            <CalendarCheck className="h-3.5 w-3.5" />
                          ) : (
                            <Repeat className="h-3.5 w-3.5" />
                          )}
                          {subscriptionTypeLabel(sub.type)}
                        </span>
                      </td>
                      <td className={tableBodyCellMutedClass}>
                        {freqLabel(sub.frequency, sub.frequency_type)}
                      </td>
                      <td className={tableBodyCellClass}>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${subscriptionStatusColor(sub.status)}`}
                        >
                          {subscriptionStatusLabel(sub.status)}
                        </span>
                      </td>
                      <td className={tableBodyCellMutedClass}>
                        {sub.type === "installments" && sub.total_installments
                          ? `${sub.completed_installments}/${sub.total_installments}`
                          : sub.type === "recurring"
                            ? `${sub.completed_installments} cobros`
                            : "—"}
                      </td>
                      <td className={tableBodyCellRightClass}>
                        ${sub.charge_amount.toFixed(2)}
                      </td>
                      <td className={tableBodyCellMutedClass}>
                        {formatOrderDate(sub.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrapper>
          </div>

          {/* Mobile cards */}
          <div className="space-y-2 md:hidden">
            {subscriptions.map((sub) => (
              <Link
                key={sub.id}
                href={`/dashboard/${tenantSlug}/suscripciones/${sub.id}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface-raised p-4 transition-colors active:bg-border-soft/40"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10">
                  {sub.type === "installments" ? (
                    <CalendarCheck className="h-5 w-5 text-accent" />
                  ) : (
                    <Repeat className="h-5 w-5 text-accent" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {sub.customer_name}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {sub.concept || subscriptionTypeLabel(sub.type)}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${subscriptionStatusColor(sub.status)}`}
                    >
                      {subscriptionStatusLabel(sub.status)}
                    </span>
                    {sub.type === "installments" && sub.total_installments && (
                      <span className="text-[10px] text-muted">
                        {sub.completed_installments}/{sub.total_installments}
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-foreground">
                    ${sub.charge_amount.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-muted">
                    {freqLabel(sub.frequency, sub.frequency_type)}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
              </Link>
            ))}
          </div>
        </>
      )}

      <SubscriptionsOnboardingOverlay />
    </div>
  );
}
