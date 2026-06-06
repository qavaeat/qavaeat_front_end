"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Bell, Settings, LogOut, ChefHat } from "lucide-react";
import { useProfile } from "./ProfileContext";
import { toast } from "sonner";
import type { DashboardTab } from "./types";

const TABS: { id: DashboardTab; label: string }[] = [
  { id: "dashboard", label: "DASHBOARD" },
  { id: "orders", label: "ORDERS" },
  { id: "customers", label: "CUSTOMERS" },
  { id: "menus", label: "MEAL PLAN & MENUS" },
  { id: "reports", label: "REPORTS" },
];

interface Props {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

export function DashboardNav({ activeTab, onTabChange }: Props) {
  const { user, loading } = useProfile();
  const router = useRouter();
  const profile = user?.profile;

  const displayName = loading
    ? "..."
    : profile?.firstName
      ? `${profile.firstName} ${profile.lastName ?? ""}`.trim()
      : (user?.email?.split("@")[0] ?? "Chef");

  const avatarUrl = profile?.avatarUrl ?? null;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Logged out successfully.");
      router.replace("/auth"); // ← adjust to your login route
    } catch {
      toast.error("Logout failed. Please try again.");
    } finally {
      setLoggingOut(false);
      setDropdownOpen(false);
    }
  };

  return (
    <header className="w-full bg-background border-b border-border sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        <Link href="/" className="flex-shrink-0">
          <Image
            src="/logo.png"
            alt="QavaEat"
            width={110}
            height={40}
            className="h-9 w-auto object-contain"
            style={{ width: "auto" }}
          />
        </Link>

        <div className="flex items-center gap-3" ref={dropdownRef}>
          {/* Bell */}
          <div className="relative">
            {/* <button
              onClick={() => {
                setNotifOpen((p) => !p);
                setDropdownOpen(false);
              }}
              className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
            >
              <Bell className="w-5 h-5 text-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
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
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-bold text-foreground">
                      Notifications
                    </p>
                  </div>
                  {[
                    { text: "New order from James Wafula", time: "2m ago" },
                    {
                      text: "Sarah Kim subscribed to your plan",
                      time: "1h ago",
                    },
                    { text: "Your kitchen is live on Qavaeat", time: "2d ago" },
                  ].map((n, i) => (
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
          <div className="relative">
            <button
              onClick={() => {
                setDropdownOpen((p) => !p);
                setNotifOpen(false);
              }}
              className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-border hover:bg-muted transition-colors"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-muted border-2 border-secondary flex items-center justify-center flex-shrink-0">
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
                  <ChefHat className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <span className="text-sm font-semibold text-foreground hidden sm:block">
                Chef {displayName}
              </span>
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
                  {/* Identity */}
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-xs font-bold text-foreground">
                      Chef {displayName}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>

                  {/* Settings — opens settings tab */}
                  <button
                    onClick={() => {
                      onTabChange("settings");
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    Settings
                  </button>

                  <div className="border-t border-border" />

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors disabled:opacity-50"
                  >
                    <LogOut className="w-4 h-4" />
                    {loggingOut ? "Logging out..." : "Log Out"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Tab bar — settings intentionally excluded */}
      <nav className="flex items-center gap-1 px-4 sm:px-6 lg:px-8 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex-shrink-0 px-4 sm:px-5 py-3 text-xs sm:text-sm font-bold tracking-wide transition-all duration-200 rounded-t-xl ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-border rounded-xl mb-1"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
