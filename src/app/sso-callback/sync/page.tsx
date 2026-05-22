"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { toastSuccess, toastError } from "@/lib/toast";

export default function SSOSyncPage() {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();
  const called = useRef(false);

  useEffect(() => {
    // Wait for Clerk session to be fully loaded
    if (!isLoaded || !userId) return;
    if (called.current) return;
    called.current = true;

    syncWithBackend();
  }, [isLoaded, userId]);

  const syncWithBackend = async () => {
    try {
      let res: Response | null = null;

      // Retry on 401 — session token may not be ready on the very first tick
      for (let i = 0; i < 5; i++) {
        res = await fetch("/api/auth/social", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (res.status !== 401) break;
        await new Promise((r) => setTimeout(r, 400 * (i + 1)));
      }

      const data = await res!.json();

      if (!res!.ok) {
        toastError(data?.message ?? "Social login failed.");
        router.replace("/auth");
        return;
      }

      toastSuccess(
        data.isNewUser ? "Account created!" : "Welcome back!",
        "You have been signed in."
      );

      // Respect returnTo if set before OAuth redirect
      const returnTo = sessionStorage.getItem("returnTo");
      sessionStorage.removeItem("returnTo");
      if (returnTo) {
        window.location.href = decodeURIComponent(returnTo);
        return;
      }

      const role = data.user?.role ?? "USER";
      switch (role) {
        case "CHEF":  window.location.href = "/chef/dashboard"; break;
        case "ADMIN": window.location.href = "/admin/dashboard"; break;
        default:      window.location.href = "/discover";
      }
    } catch (err) {
      console.error("[SSO sync] error:", err);
      toastError("Sign in failed. Please try again.");
      router.replace("/auth");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Setting up your account...</p>
      </div>
    </div>
  );
}