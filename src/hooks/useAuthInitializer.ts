"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { safeNextPath } from "@/lib/auth/safeNextPath";
import { useSessionStore } from "@/stores/useSessionStore";
import { useTenantStore } from "@/stores/useTenantStore";

export function useAuthInitializer() {
  const router = useRouter();
  const setAuthUserId = useSessionStore((s) => s.setAuthUserId);
  const setMustChangePassword = useSessionStore((s) => s.setMustChangePassword);
  const clearProfile = useSessionStore((s) => s.clear);
  const clearTenant = useTenantStore((s) => s.clear);
  const setTenantsLoaded = useTenantStore((s) => s.setTenantsLoaded);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const syncAuthState = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        lastUserIdRef.current = null;
        setAuthUserId(null);
        clearProfile();
        clearTenant();
        setTenantsLoaded(false);
        const here =
          typeof window !== "undefined"
            ? window.location.pathname + window.location.search
            : "/dashboard";
        router.replace(`/login?next=${encodeURIComponent(safeNextPath(here))}`);
        return;
      }

      setMustChangePassword(user.user_metadata?.must_change_password === true);
      if (lastUserIdRef.current === user.id) return;
      lastUserIdRef.current = user.id;
      setAuthUserId(user.id);
    };

    syncAuthState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        lastUserIdRef.current = null;
        setAuthUserId(null);
        clearProfile();
        clearTenant();
        setTenantsLoaded(false);
        return;
      }
      setMustChangePassword(session.user?.user_metadata?.must_change_password === true);
      if (lastUserIdRef.current === session.user?.id) return;
      lastUserIdRef.current = session.user?.id ?? null;
      setAuthUserId(session.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, [router, setAuthUserId, setMustChangePassword, clearProfile, clearTenant, setTenantsLoaded]);
}
