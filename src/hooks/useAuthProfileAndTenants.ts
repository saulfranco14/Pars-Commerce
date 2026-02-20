"use client";

import { useEffect } from "react";
import useSWR from "swr";
import { swrFetcher } from "@/lib/swrFetcher";
import { useSessionStore } from "@/stores/useSessionStore";
import {
  useTenantStore,
  type MembershipItem,
} from "@/stores/useTenantStore";

const PROFILE_KEY = "/api/profile";
const TENANTS_KEY = "/api/tenants";

export function useAuthProfileAndTenants() {
  const authUserId = useSessionStore((s) => s.authUserId);
  const setProfile = useSessionStore((s) => s.setProfile);
  const setMemberships = useTenantStore((s) => s.setMemberships);
  const setTenantsLoaded = useTenantStore((s) => s.setTenantsLoaded);
  const setActiveTenantId = useTenantStore((s) => s.setActiveTenantId);

  const profileKey = authUserId ? PROFILE_KEY : null;
  const tenantsKey = authUserId ? TENANTS_KEY : null;

  const { data: profileData } = useSWR(profileKey, swrFetcher);
  const { data: tenantsData } = useSWR(tenantsKey, swrFetcher);

  useEffect(() => {
    if (!profileKey || !profileData) return;
    setProfile(profileData as Parameters<typeof setProfile>[0]);
  }, [profileKey, profileData, setProfile]);

  useEffect(() => {
    if (!tenantsKey) return;
    if (tenantsData === undefined) return;
    const list = Array.isArray(tenantsData) ? tenantsData : [];
    setMemberships(list as MembershipItem[]);
    setTenantsLoaded(true);

    if (list.length > 0) {
      let stored: string | null = null;
      if (typeof window !== "undefined") {
        try {
          stored = localStorage.getItem("pars_activeTenantId");
        } catch {
          /* incognito, quota, disabled */
        }
      }
      const items = list as MembershipItem[];
      if (stored && items.some((m) => m.tenant_id === stored)) {
        setActiveTenantId(stored);
      } else if (list.length === 1) {
        setActiveTenantId((items[0] as MembershipItem).tenant_id);
      }
    }
  }, [
    tenantsKey,
    tenantsData,
    setMemberships,
    setTenantsLoaded,
    setActiveTenantId,
  ]);
}
