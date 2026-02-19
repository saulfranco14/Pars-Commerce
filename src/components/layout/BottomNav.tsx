"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTenantStore } from "@/stores/useTenantStore";
import {
  Home,
  ClipboardList,
  Package,
  Scissors,
  MoreHorizontal,
} from "lucide-react";

interface BottomNavProps {
  onMoreClick?: () => void;
  ordersBadgeCount?: number;
}

export function BottomNav({
  onMoreClick,
  ordersBadgeCount = 0,
}: BottomNavProps) {
  const pathname = usePathname();
  const activeTenant = useTenantStore((s) => s.activeTenant)();
  const slug = activeTenant?.slug ?? null;
  const base = slug ? `/dashboard/${slug}` : "/dashboard";

  const hasTenant = !!slug;

  const navItemClass = (active: boolean) =>
    `flex flex-1 min-w-0 flex-col items-center justify-center gap-2 py-3 px-2 transition-colors ${
      active ? "text-accent" : "text-muted-foreground"
    }`;

  const iconClass = (active: boolean) =>
    `shrink-0 transition-all duration-150 active:scale-90 ${active ? "text-accent" : "text-muted-foreground"}`;

  const iconWrapperClass = "inline-flex transition-transform duration-150 active:scale-90";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 flex rounded-t-2xl border-t border-border bg-surface shadow-[0_-2px_12px_rgba(0,0,0,0.06)] md:hidden"
      style={{
        paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
        paddingLeft: "max(1rem, env(safe-area-inset-left))",
        paddingRight: "max(1rem, env(safe-area-inset-right))",
      }}
      aria-label="Navegación principal"
    >
      <Link
        href="/dashboard"
        className={navItemClass(pathname === "/dashboard")}
        aria-current={pathname === "/dashboard" ? "page" : undefined}
      >
        <span className={iconWrapperClass}>
          <Home
            className={`h-6 w-6 ${iconClass(pathname === "/dashboard")}`}
            aria-hidden
          />
        </span>
        <span className="text-[11px] font-medium leading-tight">Inicio</span>
      </Link>

      {hasTenant && (
        <Link
          href={`${base}/productos`}
          className={navItemClass(
            pathname === `${base}/productos` ||
              pathname.startsWith(`${base}/productos/`)
          )}
          aria-current={
            pathname === `${base}/productos` ||
            pathname.startsWith(`${base}/productos/`)
              ? "page"
              : undefined
          }
        >
          <span className={iconWrapperClass}>
            <Package
              className={`h-6 w-6 ${iconClass(
                pathname === `${base}/productos` ||
                  pathname.startsWith(`${base}/productos/`)
              )}`}
              aria-hidden
            />
          </span>
          <span className="text-[11px] font-medium leading-tight">
            Productos
          </span>
        </Link>
      )}

      {hasTenant && (
        <Link
          href={`${base}/ordenes`}
          className={`${navItemClass(
            pathname === `${base}/ordenes` ||
              pathname.startsWith(`${base}/ordenes/`)
          )} relative`}
          aria-current={
            pathname === `${base}/ordenes` ||
            pathname.startsWith(`${base}/ordenes/`)
              ? "page"
              : undefined
          }
        >
          <span className={`relative inline-block ${iconWrapperClass}`}>
            <ClipboardList
              className={`h-6 w-6 ${iconClass(
                pathname === `${base}/ordenes` ||
                  pathname.startsWith(`${base}/ordenes/`)
              )}`}
              aria-hidden
            />
            {ordersBadgeCount > 0 && (
              <span
                className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground"
                aria-label={`${ordersBadgeCount} pendientes`}
              >
                {ordersBadgeCount > 99 ? "99+" : ordersBadgeCount}
              </span>
            )}
          </span>
          <span className="text-[11px] font-medium leading-tight">
            Órdenes
          </span>
        </Link>
      )}

      {hasTenant && (
        <Link
          href={`${base}/servicios`}
          className={navItemClass(
            pathname === `${base}/servicios` ||
              pathname.startsWith(`${base}/servicios/`)
          )}
          aria-current={
            pathname === `${base}/servicios` ||
            pathname.startsWith(`${base}/servicios/`)
              ? "page"
              : undefined
          }
        >
          <span className={iconWrapperClass}>
            <Scissors
              className={`h-6 w-6 ${iconClass(
                pathname === `${base}/servicios` ||
                  pathname.startsWith(`${base}/servicios/`)
              )}`}
              aria-hidden
            />
          </span>
          <span className="text-[11px] font-medium leading-tight">
            Servicios
          </span>
        </Link>
      )}

      <button
        type="button"
        onClick={onMoreClick}
        className={navItemClass(false)}
        aria-label="Más opciones"
      >
        <span className={iconWrapperClass}>
          <MoreHorizontal
            className={`h-6 w-6 ${iconClass(false)}`}
            aria-hidden
          />
        </span>
        <span className="text-[11px] font-medium leading-tight">Más</span>
      </button>
    </nav>
  );
}
