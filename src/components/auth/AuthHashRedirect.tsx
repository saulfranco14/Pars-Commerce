"use client";

import { useEffect } from "react";

export function AuthHashRedirect() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const path = window.location.pathname;
    if (path !== "/" && path !== "") return;

    const hash = window.location.hash?.slice(1) ?? "";
    if (!hash) return;

    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const type = params.get("type");

    if (accessToken && (type === "recovery" || type === "invite")) {
      window.location.replace(`/login${window.location.hash}`);
    }
  }, []);

  return null;
}
