"use client";

/**
 * Órdenes' date filter is now the shared DateFilterSheet (homologated across
 * time-based pages). Kept as a thin re-export so the Órdenes page import stays
 * unchanged and its behavior is identical.
 */
export { DateFilterSheet as OrdersFilterSheet } from "@/components/ui/DateFilterSheet";
