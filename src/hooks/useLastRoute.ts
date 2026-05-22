"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Routes we never save — no point sending the user back to auth or errors
const SKIP_ROUTES = new Set(["/auth", "/sign-in", "/sign-out", "/404", "/500"]);

export function useLastRoute() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!pathname) return;
    if (SKIP_ROUTES.has(pathname)) return;
    // Only save protected-ish routes (not the root landing page)
    if (pathname === "/") return;

    sessionStorage.setItem("lastRoute", pathname);
  }, [pathname]);
}