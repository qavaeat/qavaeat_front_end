"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type ThemeOption = "light" | "dark" | "system";

function useTheme() {
  const [theme, setTheme] = useState<ThemeOption>(() => {
    if (typeof window === "undefined") return "system";
    return (localStorage.getItem("theme") as ThemeOption) ?? "system";
  });

  const toggle = () => {
    const next: ThemeOption = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    const root = document.documentElement;
    if (next === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  };

  return { theme, toggle };
}

// ── Settings drawer content ────────────────────────────────────────────────
function SettingsDrawerContent({ onClose }: { onClose: () => void }) {
  const { theme, toggle } = useTheme();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const isDark = theme === "dark";

 async function handleLogout() {
  setLoggingOut(true);
  try {
    await fetch("/api/auth/logout", { method: "POST" });

    sessionStorage.removeItem("returnTo");
    sessionStorage.removeItem("lastRoute");

    router.replace("/auth"); 
  } catch {
    toast.error("Logout failed. Please try again.");
  } finally {
    setLoggingOut(false);
  }
}

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Drawer header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] flex-shrink-0">
        <div>
          <h2 className="text-sm font-bold text-[var(--foreground)] tracking-tight">
            Settings
          </h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Admin preferences
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close settings"
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--muted)] transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-3">
        {/* ── Theme toggle ── */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 flex-shrink-0 ${
                isDark
                  ? "bg-indigo-950 text-indigo-300"
                  : "bg-amber-50 text-amber-500"
              }`}
            >
              {isDark ? (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="5" />
                  <path
                    strokeLinecap="round"
                    d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                  />
                </svg>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {isDark ? "Dark mode" : "Light mode"}
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {isDark ? "Switch to light theme" : "Switch to dark theme"}
              </p>
            </div>
          </div>

          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className={`relative w-12 h-6 rounded-full flex-shrink-0 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 focus:ring-offset-[var(--background)] ${
              isDark ? "bg-[var(--primary)]" : "bg-[var(--muted)]"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                isDark ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* ── Logout ── */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
          {!showLogoutConfirm ? (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center gap-3 p-4 hover:bg-[var(--muted)] transition-colors text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0 group-hover:bg-red-100 transition-colors">
                <svg
                  className="w-5 h-5 text-[var(--primary)]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--primary)]">
                  Sign out
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  End your admin session
                </p>
              </div>
            </button>
          ) : (
            <div className="p-4 space-y-3">
              <p className="text-sm font-semibold text-[var(--foreground)]">
                Sign out of the admin panel?
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                You&apos;ll need to log back in to access the dashboard.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex-1 py-2 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loggingOut ? (
                    <>
                      <svg
                        className="w-3.5 h-3.5 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Signing out…
                    </>
                  ) : (
                    "Yes, sign out"
                  )}
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  disabled={loggingOut}
                  className="flex-1 py-2 rounded-xl border border-[var(--border)] text-[var(--foreground)] text-sm font-medium hover:bg-[var(--muted)] transition-colors disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Version stamp */}
        <p className="text-center text-xs text-[var(--muted-foreground)] pt-2">
          Qavaeat Admin · v1.0
        </p>
      </div>
    </div>
  );
}

// ── Root admin layout ──────────────────────────────────────────────────────
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Trap body scroll when drawer is open on mobile
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <div className="relative min-h-screen bg-[var(--background)]">
      {/* Floating gear trigger — fixed top-right */}
      <button
        onClick={() => setDrawerOpen(true)}
        aria-label="Open settings"
        className="fixed top-4 right-4 z-30 w-9 h-9 rounded-xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-center shadow-sm hover:bg-[var(--muted)] transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {/* Page content */}
      <main>{children}</main>

      {/* Backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      {/* Settings drawer — slides in from the right */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Admin settings"
        className={`
          fixed top-0 right-0 z-50 h-full
          w-full sm:w-80
          bg-[var(--background)] border-l border-[var(--border)] shadow-2xl
          transition-transform duration-300 ease-in-out
          ${drawerOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <SettingsDrawerContent onClose={closeDrawer} />
      </div>
    </div>
  );
}
