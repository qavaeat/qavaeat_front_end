
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, ChevronDown, Wallet, User, Settings,
  LogOut, ShoppingCart, ChefHat,
} from "lucide-react";
import { useCart } from "@/context/CartContext";

const NAV_LINKS = [
  { href: "/my-table", label: "MY TABLE" },
  { href: "/my-orders", label: "MY ORDERS" },
  { href: "/meal-plan", label: "MEAL PLAN" },
];

interface Props {
  userName?: string;
  avatarUrl?: string | null;
  walletBalance?: number;
  notificationCount?: number;
}

export function UserNav({
  userName = "Jimmy James",
  avatarUrl = null,
  walletBalance = 12350,
  notificationCount = 3,
}: Props) {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <header className="w-full bg-background border-b border-border sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Logo */}
        <Link href="/discover" className="flex-shrink-0">
          <Image src="/logo.png" alt="QavaEat" width={110} height={40}
            className="h-9 w-auto object-contain" style={{ width: "auto" }} />
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link key={link.href} href={link.href}
                className={`relative px-3 py-2 text-xs font-bold tracking-wide transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}>
                {link.label}
                {link.label === "MY ORDERS" && itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-black flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
                {active && (
                  <motion.div layoutId="user-nav-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Cart */}
          <Link href="/cart" className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
            <ShoppingCart className="w-4.5 h-4.5 text-foreground" />
            {itemCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-black flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>

          {/* Notifications */}
          <button className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
            <Bell className="w-4.5 h-4.5 text-foreground" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-black flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </button>

          {/* Avatar + dropdown */}
          <div ref={dropRef} className="relative">
            <div className="flex flex-col items-end">
              <button
                onClick={() => setDropdownOpen((p) => !p)}
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-border hover:bg-muted transition-colors"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-muted border-2 border-secondary flex-shrink-0">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt={userName} width={32} height={32} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10">
                      <ChefHat className="w-4 h-4 text-primary" />
                    </div>
                  )}
                </div>
                <span className="text-sm font-semibold text-foreground hidden sm:block">{userName}</span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {/* Wallet balance */}
              <span className="text-[10px] font-black text-[#007606] pr-3 -mt-0.5 hidden sm:block">
                WALLET : KES {walletBalance.toLocaleString()}
              </span>
            </div>

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
                    <p className="text-xs font-black text-foreground">{userName}</p>
                    <p className="text-[10px] text-[#007606] font-bold">KES {walletBalance.toLocaleString()} wallet</p>
                  </div>
                  {[
                    { icon: User, label: "My Profile", href: "/profile" },
                    { icon: Wallet, label: "Wallet & Payments", href: "/wallet" },
                    { icon: Settings, label: "Settings", href: "/settings" },
                  ].map(({ icon: Icon, label, href }) => (
                    <Link key={label} href={href}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      {label}
                    </Link>
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
    </header>
  );
}