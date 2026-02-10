"use client";

type TabView = "resumen" | "por-persona" | "por-orden" | "pagos";

interface TeamMemberOption {
  id: string;
  display_name: string | null;
  email: string | null;
}

interface VentasFiltersProps {
  activeTab: TabView;
  filtersOpen: boolean;
  setFiltersOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  userFilter: string;
  setUserFilter: (v: string) => void;
  paidFilter: string;
  setPaidFilter: (v: string) => void;
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
  periodType: "day" | "week" | "month";
  setPeriodType: (v: "day" | "week" | "month") => void;
  selectedUser: string;
  setSelectedUser: (v: string) => void;
  paymentStatus: string;
  setPaymentStatus: (v: string) => void;
  teamMembers: TeamMemberOption[];
}

export function VentasFilters({
  activeTab,
  filtersOpen,
  setFiltersOpen,
  userFilter,
  setUserFilter,
  paidFilter,
  setPaidFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  periodType,
  setPeriodType,
  selectedUser,
  setSelectedUser,
  paymentStatus,
  setPaymentStatus,
  teamMembers,
}: VentasFiltersProps) {
  const summaryLine =
    activeTab !== "pagos"
      ? `${userFilter ? teamMembers.find((m) => m.id === userFilter)?.display_name || teamMembers.find((m) => m.id === userFilter)?.email || "—" : "Todas"} · ${paidFilter === "true" ? "Pagadas" : paidFilter === "false" ? "Pendientes" : "Todas"}${dateFrom || dateTo ? ` · ${dateFrom || "—"} a ${dateTo || "—"}` : ""}`
      : `Período: ${periodType === "day" ? "Día" : periodType === "week" ? "Semana" : "Mes"} · ${selectedUser ? teamMembers.find((m) => m.id === selectedUser)?.display_name || teamMembers.find((m) => m.id === selectedUser)?.email || "—" : "Todas"} · ${paymentStatus === "paid" ? "Pagados" : paymentStatus === "pending" ? "Pendientes" : "Todos"}`;

  return (
    <div className="rounded-xl border border-border bg-border-soft/80 overflow-hidden">
      <button
        type="button"
        onClick={() => setFiltersOpen((o) => !o)}
        className="flex min-h-[44px] w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-border-soft/60"
        aria-expanded={filtersOpen}
        aria-controls="ventas-filters-content"
        id="ventas-filters-trigger"
      >
        <span>Filtros</span>
        <span
          className={`shrink-0 text-muted transition-transform duration-200 ${filtersOpen ? "rotate-180" : ""}`}
          aria-hidden
        >
          ▼
        </span>
      </button>
      {filtersOpen && (
        <div
          id="ventas-filters-content"
          role="region"
          aria-labelledby="ventas-filters-trigger"
          className="border-t border-border px-4 pb-4 pt-3"
        >
          {activeTab !== "pagos" ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              <label className="flex w-full flex-col gap-1.5 sm:min-w-[120px] sm:flex-1 sm:flex-row sm:items-center sm:gap-1.5">
                <span className="text-sm font-medium text-muted-foreground sm:shrink-0">Persona</span>
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="input-form select-custom min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:min-h-0 sm:flex-1 sm:py-1.5"
                >
                  <option value="">Todas</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.display_name || m.email}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex w-full flex-col gap-1.5 sm:min-w-[120px] sm:flex-1 sm:flex-row sm:items-center sm:gap-1.5">
                <span className="text-sm font-medium text-muted-foreground sm:shrink-0">Estado</span>
                <select
                  value={paidFilter}
                  onChange={(e) => setPaidFilter(e.target.value)}
                  className="input-form select-custom min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:min-h-0 sm:flex-1 sm:py-1.5"
                >
                  <option value="">Todas</option>
                  <option value="false">Pendientes</option>
                  <option value="true">Pagadas</option>
                </select>
              </label>
              <label className="flex w-full flex-col gap-1.5 sm:min-w-[120px] sm:flex-1 sm:flex-row sm:items-center sm:gap-1.5">
                <span className="text-sm font-medium text-muted-foreground sm:shrink-0">Desde</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="input-form min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:min-h-0 sm:flex-1 sm:py-1.5"
                />
              </label>
              <label className="flex w-full flex-col gap-1.5 sm:min-w-[120px] sm:flex-1 sm:flex-row sm:items-center sm:gap-1.5">
                <span className="text-sm font-medium text-muted-foreground sm:shrink-0">Hasta</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="input-form min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:min-h-0 sm:flex-1 sm:py-1.5"
                />
              </label>
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              <label className="flex w-full flex-col gap-1.5 sm:min-w-[120px] sm:flex-1 sm:flex-row sm:items-center sm:gap-1.5">
                <span className="text-sm font-medium text-muted-foreground sm:shrink-0">Período</span>
                <select
                  value={periodType}
                  onChange={(e) =>
                    setPeriodType(e.target.value as "day" | "week" | "month")
                  }
                  className="input-form select-custom min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:min-h-0 sm:flex-1 sm:py-1.5"
                >
                  <option value="day">Día</option>
                  <option value="week">Semana</option>
                  <option value="month">Mes</option>
                </select>
              </label>
              <label className="flex w-full flex-col gap-1.5 sm:min-w-[120px] sm:flex-1 sm:flex-row sm:items-center sm:gap-1.5">
                <span className="text-sm font-medium text-muted-foreground sm:shrink-0">Persona</span>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="input-form select-custom min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:min-h-0 sm:flex-1 sm:py-1.5"
                >
                  <option value="">Todas</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.display_name || m.email}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex w-full flex-col gap-1.5 sm:min-w-[120px] sm:flex-1 sm:flex-row sm:items-center sm:gap-1.5">
                <span className="text-sm font-medium text-muted-foreground sm:shrink-0">Estado</span>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="input-form select-custom min-h-[44px] w-full rounded-xl border px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:min-h-0 sm:flex-1 sm:py-1.5"
                >
                  <option value="">Todos</option>
                  <option value="pending">Pendientes</option>
                  <option value="paid">Pagados</option>
                </select>
              </label>
            </div>
          )}
        </div>
      )}
      {!filtersOpen && (
        <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground" aria-hidden>
          {summaryLine}
        </p>
      )}
    </div>
  );
}
