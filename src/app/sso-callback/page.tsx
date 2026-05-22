"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useClerk, useSignIn, useSignUp } from "@clerk/nextjs";
import { toastSuccess, toastError } from "@/lib/toast";

export default function SSOCallbackClient() {
  const router = useRouter();
  const clerk = useClerk();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const called = useRef(false);

  const syncWithBackend = async (): Promise<string> => {
    console.log("[sync] starting");
    let res: Response | null = null;
    for (let i = 0; i < 5; i++) {
      console.log(`[sync] attempt ${i + 1}`);
      res = await fetch("/api/auth/social", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      console.log(`[sync] attempt ${i + 1} status:`, res.status);
      if (res.status !== 401) break;
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }

    const data = await res!.json();

    if (!res!.ok) {
      throw new Error(data?.message ?? "Social login failed.");
    }

    toastSuccess(
      data.isNewUser ? "Account created!" : "Welcome back!",
      "You have been signed in.",
    );

    const returnTo = sessionStorage.getItem("returnTo");
    sessionStorage.removeItem("returnTo");
    if (returnTo) return decodeURIComponent(returnTo);

    const role = data.user?.role ?? "USER";
    switch (role) {
      case "CHEF":
        return "/chef/dashboard";
      case "ADMIN":
        return "/admin/dashboard";
      default:
        return "/discover";
    }
  };

  const navigate = async ({
    decorateUrl,
  }: {
    session?: unknown;
    decorateUrl: (url: string) => string;
  }) => {
    console.log("[navigate] called");
    try {
      console.log("[navigate] calling syncWithBackend");
      const destination = await syncWithBackend();
      console.log("[navigate] destination:", destination);
      const url = decorateUrl(destination);
      console.log("[navigate] final url:", url);
      window.location.href = url;
    } catch (err) {
      console.error("[navigate] error:", err);
      toastError(err instanceof Error ? err.message : "Sign in failed.");
      router.replace("/auth");
    }
  };

  useEffect(() => {
    console.log(
      "[SSO] effect fired, clerk.loaded:",
      clerk.loaded,
      "called:",
      called.current,
    );

    if (!clerk.loaded) return;
    if (called.current) return;
    called.current = true;

    (async () => {
      try {
        const signInStatus = signIn?.status as string | undefined;
        const signUpStatus = signUp?.status as string | undefined;

        console.log("[SSO] statuses:", { signInStatus, signUpStatus });
        console.log("[SSO] isTransferable:", {
          signIn: signIn?.isTransferable,
          signUp: signUp?.isTransferable,
        });

        // Case 1: returning user — sign-in complete
        if (signInStatus === "complete") {
          await signIn!.finalize({ navigate });
          return;
        }

        // Case 2: signed up with existing account → transfer to sign-in
        if (signUp?.isTransferable) {
          await signIn?.create({ transfer: true });
          if ((signIn?.status as string) === "complete") {
            await signIn!.finalize({ navigate });
            return;
          }
          router.replace("/auth");
          return;
        }

        // Case 3: signed in but no account → transfer to sign-up
        if (signIn?.isTransferable) {
          await signUp?.create({ transfer: true });
          if ((signUp?.status as string) === "complete") {
            await signUp!.finalize({ navigate });
            return;
          }
          // Falls into missing_requirements below if not complete
        }

        // Case 4: direct sign-up complete
        if (signUpStatus === "complete") {
          await signUp!.finalize({ navigate });
          return;
        }

        // Case 5: sign-up missing requirements — common with Google OAuth when
        // Clerk dashboard has extra required fields (username, phone etc.)
        // Try to complete the sign-up with whatever Clerk already has
        // Case 5: sign-up missing requirements
        // Case 5: sign-up missing requirements
        // Case 5: sign-up missing requirements with empty missingFields
        // Clerk has completed OAuth but sign-up object is in intermediate state
        // Use setActive with the created session instead of finalize
        if (signUpStatus === "missing_requirements") {
          console.log(
            "[SSO] missing_requirements, missingFields:",
            signUp?.missingFields,
          );

          // Try to activate the session Clerk already created
          const createdSessionId = signUp?.createdSessionId;
          console.log("[SSO] createdSessionId:", createdSessionId);

          if (createdSessionId) {
            await clerk.setActive({ session: createdSessionId });
            const destination = await syncWithBackend();
            window.location.href = destination;
            return;
          }

          // No session yet — try update to nudge Clerk to complete
          await signUp?.update({});
          await new Promise((r) => setTimeout(r, 200));

          const sessionIdAfterUpdate = signUp?.createdSessionId;
          console.log("[SSO] sessionIdAfterUpdate:", sessionIdAfterUpdate);

          if (sessionIdAfterUpdate) {
            await clerk.setActive({ session: sessionIdAfterUpdate });
            const destination = await syncWithBackend();
            window.location.href = destination;
            return;
          }

          console.error(
            "[SSO] could not resolve session from missing_requirements",
          );
          toastError("Could not complete sign up. Please try again.");
          router.replace("/auth");
          return;
        }

        // Case 6: existing active session
        if (signIn?.existingSession || signUp?.existingSession) {
          const sessionId =
            signIn?.existingSession?.sessionId ||
            signUp?.existingSession?.sessionId;
          if (sessionId) {
            await clerk.setActive({ session: sessionId });
            const destination = await syncWithBackend();
            window.location.href = destination;
            return;
          }
        }

        console.warn("[SSO] no case matched", { signInStatus, signUpStatus });
        router.replace("/auth");
      } catch (err) {
        console.error("[SSO] callback error:", err);
        toastError("Sign in failed. Please try again.");
        router.replace("/auth");
      }
    })();
  }, [clerk.loaded]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div id="clerk-captcha" />
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Finishing sign in...</p>
      </div>
    </div>
  );
}
