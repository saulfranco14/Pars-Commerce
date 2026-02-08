"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { useTenantStore, type MembershipItem } from "@/stores/useTenantStore";

export function useAuthInitializer() {
  const setProfile = useSessionStore((s) => s.setProfile);
  const clearProfile = useSessionStore((s) => s.clear);
  const setMemberships = useTenantStore((s) => s.setMemberships);
  const setActiveTenantId = useTenantStore((s) => s.setActiveTenantId);
  const clearTenant = useTenantStore((s) => s.clear);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        lastUserIdRef.current = null;
        clearProfile();
        clearTenant();
        return;
      }

      const res = await fetch("/api/profile");
      if (res.ok) {
        const profile = await res.json();
        setProfile(profile);
      }

      const tenantsRes = await fetch("/api/tenants");
      if (tenantsRes.ok) {
        const data = (await tenantsRes.json()) as MembershipItem[];
        const list = data ?? [];
        setMemberships(list);
        const stored =
          typeof window !== "undefined"
            ? localStorage.getItem("pars_activeTenantId")
            : null;
        if (stored && list.some((m) => m.tenant_id === stored)) {
          setActiveTenantId(stored);
        } else if (list.length === 1) {
          setActiveTenantId(list[0].tenant_id);
        }
      }
      lastUserIdRef.current = user.id;
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        lastUserIdRef.current = null;
        clearProfile();
        clearTenant();
        return;
      }
      if (lastUserIdRef.current === session.user?.id) return;
      loadUser();
    });

    return () => subscription.unsubscribe();
  }, []);
}
