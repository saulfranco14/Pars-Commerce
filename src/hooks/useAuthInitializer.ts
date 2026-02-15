"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { useTenantStore, type MembershipItem } from "@/stores/useTenantStore";
import { get as getProfile } from "@/services/profileService";
import { list as listTenants } from "@/services/tenantsService";

let authLoadInProgress = false;

export function useAuthInitializer() {
  const router = useRouter();
  const setProfile = useSessionStore((s) => s.setProfile);
  const clearProfile = useSessionStore((s) => s.clear);
  const setMemberships = useTenantStore((s) => s.setMemberships);
  const setTenantsLoaded = useTenantStore((s) => s.setTenantsLoaded);
  const setActiveTenantId = useTenantStore((s) => s.setActiveTenantId);
  const clearTenant = useTenantStore((s) => s.clear);
  const lastUserIdRef = useRef<string | null>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    const supabase = createClient();

    const loadUser = async () => {
      if (loadingRef.current || authLoadInProgress) return;
      loadingRef.current = true;
      authLoadInProgress = true;
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          lastUserIdRef.current = null;
          clearProfile();
          clearTenant();
          router.replace("/login?next=/dashboard");
          return;
        }

        const profile = await getProfile();
        if (profile) setProfile(profile as Parameters<typeof setProfile>[0]);

        let list: MembershipItem[] = [];
        try {
          list = (await listTenants()) as MembershipItem[];
          setMemberships(list);
        } catch {
          setMemberships([]);
        } finally {
          setTenantsLoaded(true);
        }
        if (list.length > 0) {
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
      } finally {
        loadingRef.current = false;
        authLoadInProgress = false;
      }
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
      if (loadingRef.current || authLoadInProgress) return;
      if (lastUserIdRef.current === session.user?.id) return;
      loadUser();
    });

    return () => subscription.unsubscribe();
  }, [
    router,
    setProfile,
    clearProfile,
    setMemberships,
    setTenantsLoaded,
    setActiveTenantId,
    clearTenant,
  ]);
}
