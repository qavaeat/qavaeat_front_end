
"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Bell,
  User,
  Settings,
  LogOut,
  ChefHat,
} from "lucide-react";
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
  chefName: string;
  chefAvatarUrl?: string | null;
}

export function DashboardNav({
  activeTab,
  onTabChange,
  chefName,
  chefAvatarUrl,
}: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
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

  return (
    <header className="w-full bg-background border-b border-border sticky top-0 z-40">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Logo */}
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

        {/* Right — notifications + avatar */}
        <div className="flex items-center gap-3" ref={dropdownRef}>
          {/* Notification bell */}
          <div className="relative">
            <button
              onClick={() => { setNotifOpen((p) => !p); setDropdownOpen(false); }}
              className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-foreground" />
              {/* Unread dot */}
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
            </button>

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
                    <p className="text-sm font-bold text-foreground">Notifications</p>
                  </div>
                  {[
                    { text: "New order from James Wafula", time: "2m ago" },
                    { text: "Sarah Kim subscribed to your plan", time: "1h ago" },
                    { text: "Your kitchen is live on Qavaeat", time: "2d ago" },
                  ].map((n, i) => (
                    <div key={i} className="px-4 py-3 hover:bg-muted transition-colors cursor-pointer border-b border-border/50 last:border-0">
                      <p className="text-xs text-foreground leading-relaxed">{n.text}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{n.time}</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Avatar + name + dropdown */}
          <div className="relative">
            <button
              onClick={() => { setDropdownOpen((p) => !p); setNotifOpen(false); }}
              className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-border hover:bg-muted transition-colors"
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full overflow-hidden bg-muted border-2 border-secondary flex items-center justify-center flex-shrink-0">
                {chefAvatarUrl ? (
                  <Image
                    src={chefAvatarUrl}
                    alt={chefName}
                    width={32}
                    height={32}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <ChefHat className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <span className="text-sm font-semibold text-foreground hidden sm:block">
                {chefName}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
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
                    <p className="text-xs font-bold text-foreground">{chefName}</p>
                    <p className="text-[10px] text-muted-foreground">Chef Account</p>
                  </div>
                  {[
                    { icon: User, label: "Update Profile", action: () => {} },
                    { icon: Settings, label: "Settings", action: () => {} },
                  ].map(({ icon: Icon, label, action }) => (
                    <button
                      key={label}
                      onClick={action}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      {label}
                    </button>
                  ))}
                  <div className="border-t border-border" />
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors">
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Tab bar */}
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