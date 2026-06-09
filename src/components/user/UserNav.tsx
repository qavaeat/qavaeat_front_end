"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  ChevronDown,
  Wallet,
  Settings,
  LogOut,
  ChefHat,
  Compass,
  Menu,
  X,
  UtensilsCrossed,
  ShoppingBag,
  CalendarDays,
  Home,
} from "lucide-react";
import { toast } from "sonner";
import { usePlan } from "@/context/PlanContext";

// ── Types ──────────────────────────────────────────────────────────────────
interface UserData {
  email: string;
  profile: {
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  } | null;
}

// ── Hook ───────────────────────────────────────────────────────────────────
function useUserProfile() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/profile", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      const p = json?.data?.profile;
      if (!p) return;
      setUser({
        email: p.user?.email ?? "",
        profile: {
          firstName: p.firstName ?? null,
          lastName: p.lastName ?? null,
          avatarUrl: p.avatarUrl ?? null,
        },
      });
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener("profile-updated", handler);
    return () => window.removeEventListener("profile-updated", handler);
  }, [refresh]);

  const displayName = loading
    ? ""
    : user?.profile?.firstName
      ? `${user.profile.firstName} ${user.profile.lastName ?? ""}`.trim()
      : (user?.email?.split("@")[0] ?? "Guest");

  return {
    user,
    loading,
    displayName,
    avatarUrl: user?.profile?.avatarUrl ?? null,
  };
}

// ── Nav links ──────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/my-table", label: "My Table", icon: UtensilsCrossed },
  { href: "/orders", label: "Order History", icon: ShoppingBag },
  { href: "/meal-plan", label: "Meal Plan", icon: CalendarDays },
];

// ── Avatar bubble ──────────────────────────────────────────────────────────
function Avatar({
  avatarUrl,
  displayName,
  size = 8,
}: {
  avatarUrl: string | null;
  displayName: string;
  size?: number;
}) {
  return (
    <div
      className={`w-${size} h-${size} rounded-full overflow-hidden bg-muted border-2 border-secondary flex-shrink-0 flex items-center justify-center`}
    >
      {avatarUrl ? (
        // <Image
        //   src={avatarUrl}
        //   alt={displayName}
        //   width={32}
        //   height={32}
        //   className="object-cover w-full h-full"
        // />
        <img
          src={avatarUrl}
          alt={displayName}
          className="object-cover w-full h-full"
        />
      ) : (
        <ChefHat className="w-4 h-4 text-primary" />
      )}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────
export function UserNav({
  notificationCount = 3,
}: {
  notificationCount?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { displayName, avatarUrl, loading, user } = useUserProfile();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const desktopRef = useRef<HTMLDivElement>(null);
  const { clearPlan } = usePlan();

  // Close dropdowns on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (
        desktopRef.current &&
        !desktopRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      // clearPlan();

      sessionStorage.removeItem("returnTo");
      sessionStorage.removeItem("lastRoute");

      toast.success("Logged out successfully.");
      router.replace("/auth");
    } catch {
      toast.error("Logout failed. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  const notifications = [
    { text: "Your breakfast order is being prepared", time: "5m ago" },
    { text: "Chef Peninah confirmed your schedule", time: "1h ago" },
    { text: "Your meal plan subscription renewed", time: "2d ago" },
  ];

  return (
    <>
      <header className="w-full bg-background border-b border-border sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          {/* Logo */}
          <Link href="/discover" className="flex-shrink-0">
            <Image
              src="/logo.png"
              alt="QavaEat"
              width={110}
              height={40}
              className="h-8 w-auto object-contain"
              style={{ width: "auto" }}
            />
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {/* Home button */}
            <Link
              href="/discover"
              className={`relative px-3 py-2 text-xs font-bold tracking-wide transition-colors flex items-center gap-1.5 rounded-lg ${
                pathname === "/discover"
                  ? "text-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              HOME
              {pathname === "/discover" && (
                <motion.div
                  layoutId="user-nav-indicator"
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
                />
              )}
            </Link>

            {/* Divider */}
            <div className="w-px h-4 bg-border mx-1 flex-shrink-0" />

            {NAV_LINKS.filter((l) => l.href !== "/discover").map((link) => {
              const active =
                pathname === link.href || pathname.startsWith(link.href + "/");
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3 py-2 text-xs font-bold tracking-wide transition-colors flex items-center gap-1.5 rounded-lg ${
                    active
                      ? "text-primary bg-primary/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {link.label.toUpperCase()}
                  {active && (
                    <motion.div
                      layoutId="user-nav-indicator"
                      className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-1 sm:gap-2" ref={desktopRef}>
            {/* Notifications */}
            <div className="relative">
              {/* <button
                onClick={() => {
                  setNotifOpen((p) => !p);
                  setDropdownOpen(false);
                }}
                className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4 text-foreground" />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-black flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </button> */}

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-72 bg-background border border-border rounded-2xl shadow-xl overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                      <p className="text-sm font-bold text-foreground">
                        Notifications
                      </p>
                      <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {notificationCount} new
                      </span>
                    </div>
                    {notifications.map((n, i) => (
                      <div
                        key={i}
                        className="px-4 py-3 hover:bg-muted transition-colors cursor-pointer border-b border-border/50 last:border-0"
                      >
                        <p className="text-xs text-foreground leading-relaxed">
                          {n.text}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {n.time}
                        </p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Avatar + dropdown */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => {
                  setDropdownOpen((p) => !p);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-border hover:bg-muted transition-colors"
              >
                <Avatar avatarUrl={avatarUrl} displayName={displayName} />
                {loading ? (
                  <span className="hidden lg:block w-20 h-3 bg-muted rounded-full animate-pulse" />
                ) : (
                  <span className="text-sm font-semibold text-foreground hidden lg:block max-w-[120px] truncate">
                    {displayName}
                  </span>
                )}
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-52 bg-background border border-border rounded-2xl shadow-xl overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-xs font-black text-foreground truncate">
                        {displayName}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {user?.email}
                      </p>
                    </div>
                    {/* <Link
                      href="/wallet"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <Wallet className="w-4 h-4 text-muted-foreground" />
                      Wallet &amp; Payments
                    </Link> */}
                    <Link
                      href="/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      Settings
                    </Link>
                    <div className="border-t border-border" />
                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
                    >
                      <LogOut className="w-4 h-4" />
                      {loggingOut ? "Logging out..." : "Log Out"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((p) => !p)}
              className="sm:hidden w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
              aria-label="Open menu"
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 sm:hidden"
              onClick={() => setMobileOpen(false)}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed top-0 right-0 bottom-0 w-72 bg-background border-l border-border z-50 flex flex-col sm:hidden shadow-2xl"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 h-16 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-3">
                  <Avatar avatarUrl={avatarUrl} displayName={displayName} />
                  <div className="min-w-0">
                    <p className="text-sm font-black text-foreground truncate">
                      {displayName}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Nav links */}
              <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-3 mb-2">
                  Navigation
                </p>

                {/* Home — mobile */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0 }}
                >
                  <Link
                    href="/discover"
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-colors ${
                      pathname === "/discover"
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        pathname === "/discover"
                          ? "bg-primary text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Home className="w-4 h-4" />
                    </div>
                    Home
                    {pathname === "/discover" && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </Link>
                </motion.div>

                <div className="border-t border-border/50 my-1" />

                {NAV_LINKS.filter((l) => l.href !== "/discover").map(
                  (link, i) => {
                    const active =
                      pathname === link.href ||
                      pathname.startsWith(link.href + "/");
                    const Icon = link.icon;
                    return (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (i + 1) * 0.05 }}
                      >
                        <Link
                          href={link.href}
                          className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-colors ${
                            active
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-muted"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              active
                                ? "bg-primary text-white"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          {link.label}
                          {active && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                          )}
                        </Link>
                      </motion.div>
                    );
                  },
                )}

                <div className="border-t border-border my-3" />

                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-3 mb-2">
                  Account
                </p>

                {[
                  // { href: "/wallet", label: "Wallet & Payments", icon: Wallet },
                  { href: "/settings", label: "Settings", icon: Settings },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (NAV_LINKS.length + i) * 0.05 }}
                    >
                      <Link
                        href={item.href}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold text-foreground hover:bg-muted transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        {item.label}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              {/* Logout pinned at bottom */}
              <div className="border-t border-border p-4 flex-shrink-0">
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <LogOut className="w-4 h-4 text-primary" />
                  </div>
                  {loggingOut ? "Logging out..." : "Log Out"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
