"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  X,
  ChevronDown,
  Bike,
  ShoppingBag,
  UtensilsCrossed,
  Wallet,
  Trash2,
  CalendarDays,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePlan } from "@/context/PlanContext";
import { toast } from "sonner";
import type { MealTime } from "@/types/user-section";

// ─────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────
interface ScheduledMeal {
  id: string;
  plannedMealId: string;
  name: string;
  emoji: string;
  kitchenName: string;
  price: number;
  mealTime: MealTime;
  time: string;
  prepTimeMin: number;
}

// schedule[dayIndex][mealTime] = ScheduledMeal | undefined
type WeekSchedule = Record<number, Partial<Record<MealTime, ScheduledMeal>>>;
type WeekKey = string; // "2026-05-25"

interface SavedSchedule {
  weekKey: WeekKey;
  mondayISO: string;
  days: WeekSchedule;
  savedAt: string;
}

// ─────────────────────────────────────────────────────
// Dummy wallet data (will replace with real API)
// ─────────────────────────────────────────────────────
const DUMMY_WALLET = {
  balance: 15000,
  escrow: 12350,
  status: "Actively Moving",
  fulfillmentPct: 35,
};
const DUMMY_TXS = [
  {
    date: "26 May",
    desc: "Funds deposited to wallet",
    amount: 15000,
    type: "credit" as const,
  },
  {
    date: "24 May",
    desc: "Dinner with chef Maria",
    amount: -450,
    type: "debit" as const,
  },
  {
    date: "25 May",
    desc: "Breakfast with chef Halima",
    amount: -245,
    type: "debit" as const,
  },
  {
    date: "25 May",
    desc: "Lunch with chef Maria",
    amount: -250,
    type: "debit" as const,
  },
  {
    date: "26 May",
    desc: "Roasted coffee with bacon",
    amount: -210,
    type: "debit" as const,
  },
];

// ─────────────────────────────────────────────────────
// Date helpers
// ─────────────────────────────────────────────────────
function midnight(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}
function getMondayOf(d: Date): Date {
  const c = midnight(d);
  const day = c.getDay();
  c.setDate(c.getDate() + (day === 0 ? -6 : 1 - day));
  return c;
}
function buildWeek(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}
function weekKey(monday: Date): WeekKey {
  return monday.toISOString().split("T")[0];
}

// ─────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────
const SCHEDULE_KEY = "qavaeat_schedule_v1";
const DAY_SHORT = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MEAL_TIMES: MealTime[] = ["BREAKFAST", "LUNCH", "DINNER"];
const MEAL_META: Record<
  MealTime,
  {
    icon: string;
    label: string;
    bg: string;
    text: string;
    border: string;
    pill: string;
  }
> = {
  BREAKFAST: {
    icon: "☕",
    label: "Breakfast",
    bg: "bg-secondary/20",
    text: "text-secondary-foreground",
    border: "border-secondary/30",
    pill: "bg-secondary/20 text-secondary-foreground",
  },
  LUNCH: {
    icon: "🍽️",
    label: "Lunch",
    bg: "bg-primary/10",
    text: "text-primary",
    border: "border-primary/20",
    pill: "bg-primary/10 text-primary",
  },
  DINNER: {
    icon: "🌙",
    label: "Dinner",
    bg: "bg-[#007606]/10",
    text: "text-[#007606]",
    border: "border-[#007606]/20",
    pill: "bg-[#007606]/10 text-[#007606]",
  },
};
const DEFAULT_TIMES: Record<MealTime, string> = {
  BREAKFAST: "8:00 AM",
  LUNCH: "1:00 PM",
  DINNER: "8:00 PM",
};
const TIME_OPTIONS = [
  "6:00 AM",
  "6:30 AM",
  "7:00 AM",
  "7:30 AM",
  "8:00 AM",
  "8:30 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "12:30 PM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
  "6:30 PM",
  "7:00 PM",
  "7:30 PM",
  "8:00 PM",
  "8:30 PM",
  "9:00 PM",
  "10:00 PM",
];

// ─────────────────────────────────────────────────────
// localStorage
// ─────────────────────────────────────────────────────
function loadSchedules(): Record<WeekKey, SavedSchedule> {
  if (typeof window === "undefined") return {};
  try {
    const r = localStorage.getItem(SCHEDULE_KEY);
    return r ? JSON.parse(r) : {};
  } catch {
    return {};
  }
}
function saveSchedules(data: Record<WeekKey, SavedSchedule>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(data));
  } catch {
    /* quota */
  }
}

// ─────────────────────────────────────────────────────
// TimePicker — portal never clipped
// ─────────────────────────────────────────────────────
function TimePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const ref = useRef<HTMLButtonElement>(null);
  const justOpened = useRef(false);
  const isBrowser = typeof window !== "undefined";

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (justOpened.current) {
        justOpened.current = false;
        return;
      }
      if (ref.current && ref.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const open_ = () => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({
      top: r.bottom + window.scrollY + 2,
      right: window.innerWidth - r.right,
    });
    justOpened.current = true;
    setOpen((p) => !p);
  };

  return (
    <>
      <button
        ref={ref}
        onClick={open_}
        className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground border border-border rounded-lg px-2 py-0.5 bg-background hover:bg-muted transition-colors whitespace-nowrap flex-shrink-0"
      >
        {value}{" "}
        <ChevronDown
          className={`w-2.5 h-2.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {isBrowser &&
        open &&
        ReactDOM.createPortal(
          <div
            style={{
              position: "absolute",
              top: pos.top,
              right: pos.right,
              zIndex: 99999,
              width: 112,
            }}
            className="bg-background border border-border rounded-xl shadow-xl overflow-y-auto max-h-52"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {TIME_OPTIONS.map((t) => (
              <button
                key={t}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => {
                  onChange(t);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${t === value ? "text-primary font-bold bg-primary/5" : "text-foreground hover:bg-muted"}`}
              >
                {t}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}

// ─────────────────────────────────────────────────────
// MealCell — portal dropdown, never clipped
// ─────────────────────────────────────────────────────
function MealCell({
  mealTime,
  scheduled,
  onAssign,
  onRemove,
  time,
  onTimeChange,
}: {
  mealTime: MealTime;
  scheduled?: ScheduledMeal;
  onAssign: (id: string) => void;
  onRemove: () => void;
  time: string;
  onTimeChange: (v: string) => void;
}) {
  const { plannedMeals } = usePlan();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const trigRef = useRef<HTMLButtonElement>(null);
  const m = MEAL_META[mealTime];

  // Close on outside click — use mousedown on document
  // Use a ref flag to avoid closing on the same click that opened
  const justOpened = useRef(false);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (justOpened.current) {
        justOpened.current = false;
        return;
      }
      if (trigRef.current && trigRef.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const openDrop = () => {
    if (!trigRef.current) return;
    const r = trigRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const dropH = 280;
    setPos({
      top:
        spaceBelow > dropH
          ? r.bottom + window.scrollY + 4
          : r.top + window.scrollY - dropH - 4,
      left: Math.min(r.left + window.scrollX, window.innerWidth - 264),
    });
    setSearch("");
    justOpened.current = true;
    setOpen((p) => !p);
  };

  const filtered = plannedMeals.filter(
    (meal) =>
      !search.trim() ||
      meal.name.toLowerCase().includes(search.toLowerCase()) ||
      meal.kitchenName.toLowerCase().includes(search.toLowerCase()),
  );

  const isBrowser = typeof window !== "undefined";

  // ── Assigned card ──
  if (scheduled) {
    return (
      <div
        className={`relative group rounded-xl border p-2.5 bg-background shadow-sm ${m.border}`}
      >
        <div className="flex items-start gap-2">
          <span className="text-lg flex-shrink-0 mt-0.5">
            {scheduled.emoji}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-foreground leading-tight truncate">
              {scheduled.name}
            </p>
            <p className="text-[9px] text-muted-foreground truncate">
              {scheduled.kitchenName}
            </p>
            <div className="flex items-center justify-between mt-1.5 gap-1">
              <span className="text-[10px] font-black text-primary truncate">
                KES {scheduled.price}
              </span>
              <TimePicker value={time} onChange={onTimeChange} />
            </div>
          </div>
        </div>
        <button
          onClick={onRemove}
          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 w-5 h-5 rounded-full bg-destructive/10 text-destructive flex items-center justify-center transition-all"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  // ── Empty cell ──
  return (
    <>
      <button
        ref={trigRef}
        onClick={openDrop}
        className={`w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 py-4 transition-all ${
          open
            ? "border-primary bg-primary/5"
            : "border-border/40 hover:border-primary/50 hover:bg-primary/5 active:bg-primary/10"
        }`}
      >
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
            open
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
        </div>
        <span
          className={`text-[9px] font-bold ${open ? "text-primary" : "text-muted-foreground/70"}`}
        >
          {m.icon} {m.label}
        </span>
      </button>

      {isBrowser &&
        open &&
        ReactDOM.createPortal(
          <div
            style={{
              position: "absolute",
              top: pos.top,
              left: pos.left,
              width: 260,
              zIndex: 99999,
            }}
            className="bg-background border border-border rounded-2xl shadow-2xl overflow-hidden"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className={`px-3 py-2.5 border-b border-border ${m.bg}`}>
              <p
                className={`text-[10px] font-black uppercase tracking-wide ${m.text}`}
              >
                {m.icon} {m.label}
              </p>
            </div>
            {plannedMeals.length >= 5 && (
              <div className="px-2.5 py-2 border-b border-border/50">
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search dishes..."
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-muted border border-border outline-none focus:border-primary transition-colors"
                />
              </div>
            )}
            {filtered.length === 0 ? (
              <div className="px-4 py-5 text-center">
                {plannedMeals.length === 0 ? (
                  <>
                    <p className="text-xl mb-1">🍽️</p>
                    <p className="text-[11px] font-semibold text-foreground">
                      No meals in plan yet
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      <Link
                        href="/discover"
                        className="text-primary font-bold underline"
                      >
                        Browse kitchens
                      </Link>{" "}
                      first
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">No matches</p>
                )}
              </div>
            ) : (
              <div className="max-h-52 overflow-y-auto divide-y divide-border/40">
                {filtered.map((meal) => (
                  <button
                    key={meal.id}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => {
                      onAssign(meal.id);
                      setOpen(false);
                      setSearch("");
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-muted/60 transition-colors"
                  >
                    <span className="text-lg flex-shrink-0">{meal.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        {meal.name}
                      </p>
                      <p className="text-[9px] text-muted-foreground truncate">
                        {meal.kitchenName}
                      </p>
                    </div>
                    <span className="text-[11px] font-black text-primary flex-shrink-0">
                      KES {meal.price}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

// ─────────────────────────────────────────────────────
// Checkout modal
// ─────────────────────────────────────────────────────
function CheckoutModal({
  meals,
  subtotal,
  onClose,
  onConfirm,
}: {
  meals: ScheduledMeal[];
  subtotal: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [serviceType, setServiceType] = useState<
    "PICKUP" | "DELIVERY" | "DINE_IN"
  >("DELIVERY");
  const [address, setAddress] = useState("");
  const [placing, setPlacing] = useState(false);
  const deliveryFee = serviceType === "DELIVERY" ? 150 : 0;
  const canPlace = serviceType !== "DELIVERY" || address.trim().length > 0;

  return (
    <div
      className="fixed inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.3 }}
        className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-base font-black text-foreground">
              Review &amp; Pay
            </h2>
            <p className="text-xs text-muted-foreground">
              {meals.length} meals across your week
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Scheduled Meals
            </p>
            {meals.map((meal) => (
              <div
                key={meal.id}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 border border-border/50"
              >
                <span className="text-lg flex-shrink-0">{meal.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">
                    {meal.name}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span
                      className={`${MEAL_META[meal.mealTime].text} font-semibold`}
                    >
                      {MEAL_META[meal.mealTime].icon}{" "}
                      {MEAL_META[meal.mealTime].label}
                    </span>
                    <span>· {meal.time}</span>
                  </div>
                </div>
                <span className="text-xs font-black text-primary flex-shrink-0">
                  KES {meal.price}
                </span>
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Service Type *
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  {
                    v: "DELIVERY",
                    l: "Delivery",
                    icon: <Bike className="w-3.5 h-3.5" />,
                  },
                  {
                    v: "PICKUP",
                    l: "Pickup",
                    icon: <ShoppingBag className="w-3.5 h-3.5" />,
                  },
                  {
                    v: "DINE_IN",
                    l: "Dine In",
                    icon: <UtensilsCrossed className="w-3.5 h-3.5" />,
                  },
                ] as const
              ).map(({ v, l, icon }) => (
                <button
                  key={v}
                  onClick={() => setServiceType(v)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-[10px] font-bold border transition-all ${serviceType === v ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
                >
                  {icon}
                  {l}
                </button>
              ))}
            </div>
          </div>
          {serviceType === "DELIVERY" && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Delivery Address *
              </label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Your delivery address"
                className="rounded-xl border-border"
              />
            </div>
          )}
          <div className="border border-border rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Meals ({meals.length})
              </span>
              <span className="font-semibold">
                KES {subtotal.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery Fee</span>
              <span className="font-semibold">KES {deliveryFee}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-border pt-2">
              <span className="font-black text-foreground">Total</span>
              <span className="font-black text-primary">
                KES {(subtotal + deliveryFee).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 px-6 py-4 border-t border-border flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 rounded-full border-border"
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (!canPlace) return;
              setPlacing(true);
              await new Promise((r) => setTimeout(r, 900));
              setPlacing(false);
              onConfirm();
              onClose();
            }}
            disabled={!canPlace || placing}
            className="flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-full font-black disabled:opacity-40"
          >
            {placing ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              `Pay KES ${(subtotal + deliveryFee).toLocaleString()}`
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Wallet panel
// ─────────────────────────────────────────────────────
function WalletPanel() {
  const totalSpend = DUMMY_TXS.filter((t) => t.type === "debit").reduce(
    (s, t) => s + Math.abs(t.amount),
    0,
  );
  return (
    <div className="bg-background rounded-2xl border border-border shadow-lg overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <div className="w-9 h-9 rounded-xl bg-secondary/20 flex items-center justify-center flex-shrink-0">
          <Wallet className="w-4 h-4 text-secondary-foreground" />
        </div>
        <h3 className="text-sm font-black text-foreground uppercase tracking-wide">
          Wallet &amp; Activity
        </h3>
      </div>
      <div className="flex divide-x divide-border px-5 py-4">
        <div className="flex-1 pr-4">
          <p className="text-[10px] text-muted-foreground uppercase">Balance</p>
          <p className="text-xl font-black text-foreground">
            KES {DUMMY_WALLET.balance.toLocaleString()}
          </p>
        </div>
        <div className="flex-1 pl-4">
          <p className="text-[10px] text-muted-foreground uppercase">Status</p>
          <p className="text-sm font-bold text-[#007606]">
            {DUMMY_WALLET.status}
          </p>
        </div>
      </div>
      <div className="px-5 pb-4">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs text-muted-foreground">
            Order fulfillment Progress
          </p>
          <p className="text-xs font-black text-[#007606]">
            {DUMMY_WALLET.fulfillmentPct}%
          </p>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${DUMMY_WALLET.fulfillmentPct}%` }}
            transition={{ duration: 0.8, delay: 0.3 }}
          />
        </div>
      </div>
      <div className="mx-5 mb-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center gap-3 p-4">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Wallet className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">
            Available Funds in Wallet / Escrow
          </p>
          <p className="text-xl font-black text-[#007606]">
            KES {DUMMY_WALLET.escrow.toLocaleString()}
          </p>
        </div>
      </div>
      <div className="px-5 pb-3">
        <p className="text-[10px] font-black text-foreground tracking-widest uppercase mb-2">
          Recent Transactions
        </p>
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-3 py-2 text-[10px] font-bold text-muted-foreground">
                  Date
                </th>
                <th className="text-left px-3 py-2 text-[10px] font-bold text-muted-foreground">
                  Description
                </th>
                <th className="text-right px-3 py-2 text-[10px] font-bold text-muted-foreground">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {DUMMY_TXS.map((t, i) => (
                <tr key={i} className="hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                    {t.date}
                  </td>
                  <td className="px-3 py-2 text-foreground">{t.desc}</td>
                  <td
                    className={`px-3 py-2 text-right font-bold whitespace-nowrap ${t.type === "credit" ? "text-[#007606]" : "text-foreground"}`}
                  >
                    {t.type === "credit" ? "+" : ""}KES{" "}
                    {Math.abs(t.amount).toLocaleString()}
                  </td>
                </tr>
              ))}
              <tr className="bg-muted/20 border-t border-border">
                <td
                  colSpan={2}
                  className="px-3 py-2 text-xs font-black text-foreground"
                >
                  Total Recent Spend
                </td>
                <td className="px-3 py-2 text-right text-xs font-black text-[#007606]">
                  KES {totalSpend.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="px-5 pb-5">
        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-black">
          Deposit Funds
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// My Table viewer (saved schedules)
// ─────────────────────────────────────────────────────
function MyTableViewer({
  savedSchedules,
  setSavedSchedules,
}: {
  savedSchedules: Record<WeekKey, SavedSchedule>;
  setSavedSchedules: React.Dispatch<
    React.SetStateAction<Record<WeekKey, SavedSchedule>>
  >;
}) {
  const TODAY = midnight(new Date());
  const thisMonday = getMondayOf(TODAY);
  const [baseMonday, setBaseMonday] = useState<Date>(thisMonday);
  const weekDates = buildWeek(baseMonday);
  const isCurrentWeek = baseMonday.getTime() === thisMonday.getTime();
  const [selIdx, setSelIdx] = useState(() => {
    const d = TODAY.getDay();
    return d === 0 ? 6 : d - 1;
  });

  const wk = weekKey(baseMonday);
  const currentSaved = savedSchedules[wk];
  const dayMeals = currentSaved?.days[selIdx] ?? {};
  const allThisWeek = Object.values(currentSaved?.days ?? {}).flatMap(
    (d) => Object.values(d).filter(Boolean) as ScheduledMeal[],
  );

  const prevWeek = () => {
    if (isCurrentWeek) return;
    const d = new Date(baseMonday);
    d.setDate(d.getDate() - 7);
    setBaseMonday(d);
    setSelIdx(0);
  };
  const nextWeek = () => {
    const d = new Date(baseMonday);
    d.setDate(d.getDate() + 7);
    setBaseMonday(d);
    setSelIdx(0);
  };

  const deleteMeal = (dayIdx: number, mt: MealTime) => {
    setSavedSchedules((prev) => {
      const wkData = prev[wk];
      if (!wkData) return prev;
      const updated = {
        ...prev,
        [wk]: {
          ...wkData,
          days: {
            ...wkData.days,
            [dayIdx]: { ...wkData.days[dayIdx], [mt]: undefined },
          },
        },
      };
      saveSchedules(updated);
      return updated;
    });
    toast.success("Meal removed from schedule");
  };

  const weekLabel = (() => {
    const s = weekDates[0];
    const e = weekDates[6];
    return `${s.getDate()} ${MONTHS[s.getMonth()].slice(0, 3)} – ${e.getDate()} ${MONTHS[e.getMonth()].slice(0, 3)}, ${e.getFullYear()}`;
  })();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
      <div className="bg-background rounded-2xl border border-border shadow-lg overflow-hidden">
        <div className="px-5 pt-5 pb-4 border-b border-border space-y-4">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-black text-foreground uppercase">
                My Table
              </h2>
              <p className="text-xs text-muted-foreground">
                Weekly Meal Schedule &amp; Wallet Activity
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={prevWeek}
                disabled={isCurrentWeek}
                className="w-8 h-8 rounded-full border border-border bg-muted hover:bg-background flex items-center justify-center disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 bg-secondary text-secondary-foreground rounded-xl px-4 py-2 text-xs font-black shadow-sm">
                <CalendarDays className="w-3.5 h-3.5" />
                Week of {weekLabel}
              </div>
              <button
                onClick={nextWeek}
                className="w-8 h-8 rounded-full border border-border bg-muted hover:bg-background flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {weekDates.map((date, i) => {
              const isPast = date.getTime() < TODAY.getTime();
              const isSel = i === selIdx;
              const isToday = date.getTime() === TODAY.getTime();
              const hasMeals = Object.values(currentSaved?.days[i] ?? {}).some(
                Boolean,
              );
              return (
                <button
                  key={i}
                  onClick={() => !isPast && setSelIdx(i)}
                  disabled={isPast}
                  className={`relative flex flex-col items-center px-4 py-3 rounded-xl min-w-[58px] border transition-all flex-shrink-0 ${
                    isPast
                      ? "opacity-30 cursor-not-allowed bg-muted/30 border-border/20"
                      : isSel
                        ? "bg-secondary text-secondary-foreground border-secondary shadow-sm"
                        : "bg-background border-border hover:bg-muted cursor-pointer"
                  }`}
                >
                  <span
                    className={`text-[10px] font-black tracking-widest ${isSel ? "text-secondary-foreground" : "text-muted-foreground"}`}
                  >
                    {DAY_SHORT[i]}
                  </span>
                  <span
                    className={`text-xl font-black ${isToday && !isSel ? "text-primary" : ""}`}
                  >
                    {date.getDate()}
                  </span>
                  {hasMeals && !isPast && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <div className="p-5 min-h-[300px]">
          {Object.values(dayMeals).filter(Boolean).length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <p className="text-5xl">📅</p>
              <p className="text-sm font-semibold text-foreground">
                No meals scheduled for this day
              </p>
              <p className="text-xs text-muted-foreground">
                Use the <span className="text-primary font-bold">Schedule</span>{" "}
                tab to plan your meals
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {MEAL_TIMES.map((mt) => {
                const meal = dayMeals[mt];
                if (!meal) return null;
                const c = MEAL_META[mt];
                return (
                  <motion.div
                    key={mt}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 py-4 border-b border-border/40 last:border-0 group"
                  >
                    <div className="w-20 h-16 sm:w-24 sm:h-20 rounded-xl bg-muted flex items-center justify-center text-3xl sm:text-4xl flex-shrink-0 border border-border">
                      {meal.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm sm:text-base font-black text-foreground">
                          {meal.name}
                        </p>
                        <span className="text-sm font-black text-primary flex-shrink-0">
                          KES {meal.price}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {meal.kitchenName}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                        <div>
                          <p className="text-[10px] uppercase tracking-wide">
                            Time
                          </p>
                          <p className="font-bold text-foreground">
                            {meal.time}
                          </p>
                        </div>
                        <div className="h-5 w-px bg-border" />
                        <div>
                          <p className="text-[10px] uppercase tracking-wide">
                            Prep
                          </p>
                          <p className="font-bold text-foreground">
                            {meal.prepTimeMin} Mins
                          </p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${c.pill}`}
                      >
                        {c.icon} {c.label}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <Button
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-bold h-7 px-3"
                      >
                        Adjust Prep
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-primary text-primary hover:bg-primary/5 rounded-lg text-xs font-bold h-7 px-3"
                      >
                        View Recipe
                      </Button>
                    </div>
                    <button
                      onClick={() => deleteMeal(selIdx, mt)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1.5 transition-all flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
        {allThisWeek.length > 0 && (
          <div className="px-5 pb-4 pt-2 border-t border-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {allThisWeek.length} meals this week
            </span>
            <span className="font-black text-primary">
              KES{" "}
              {allThisWeek.reduce((s, m) => s + m.price, 0).toLocaleString()}
            </span>
          </div>
        )}
      </div>
      <WalletPanel />
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Week scheduler — all days at once, data persists per week
// ─────────────────────────────────────────────────────
function WeekScheduler({
  onSave,
  baseMonday,
  setBaseMonday,
  isCurrentWeek,
}: {
  onSave: (schedule: WeekSchedule) => void;
  baseMonday: Date;
  setBaseMonday: (d: Date) => void;
  isCurrentWeek: boolean;
}) {
  const TODAY = midnight(new Date());
  const weekDates = buildWeek(baseMonday);
  const wk = weekKey(baseMonday);

  // Per-week schedule storage — navigating to another week never loses current week data
  const [allWeekSchedules, setAllWeekSchedules] = useState<
    Record<WeekKey, WeekSchedule>
  >({});
  const [allSlotTimes, setAllSlotTimes] = useState<
    Record<WeekKey, Record<number, Record<MealTime, string>>>
  >({});

  const schedule = allWeekSchedules[wk] ?? {};
  const slotTimes =
    allSlotTimes[wk] ??
    Object.fromEntries(
      Array.from({ length: 7 }, (_, i) => [i, { ...DEFAULT_TIMES }]),
    );

  const [showCheckout, setShowCheckout] = useState(false);
  const [mobileDayIdx, setMobileDayIdx] = useState(() => {
    const d = TODAY.getDay();
    return d === 0 ? 6 : d - 1;
  });
  const { plannedMeals, removeFromPlan, clearPlan } = usePlan();

  const setSchedule = useCallback(
    (updater: (prev: WeekSchedule) => WeekSchedule) => {
      setAllWeekSchedules((prev) => ({
        ...prev,
        [wk]: updater(prev[wk] ?? {}),
      }));
    },
    [wk],
  );

  const setSlotTime = (dayIdx: number, mt: MealTime, time: string) => {
    setAllSlotTimes((prev) => ({
      ...prev,
      [wk]: {
        ...(prev[wk] ?? {}),
        [dayIdx]: { ...(prev[wk]?.[dayIdx] ?? DEFAULT_TIMES), [mt]: time },
      },
    }));
  };

  const prevWeek = () => {
    if (isCurrentWeek) return;
    const d = new Date(baseMonday);
    d.setDate(d.getDate() - 7);
    setBaseMonday(d);
  };
  const nextWeek = () => {
    const d = new Date(baseMonday);
    d.setDate(d.getDate() + 7);
    setBaseMonday(d);
  };

  const assignMeal = (
    dayIdx: number,
    mealTime: MealTime,
    plannedMealId: string,
  ) => {
    const meal = plannedMeals.find((m) => m.id === plannedMealId);
    if (!meal) return;
    setSchedule((prev) => ({
      ...prev,
      [dayIdx]: {
        ...prev[dayIdx],
        [mealTime]: {
          id: `s-${dayIdx}-${mealTime}-${Date.now()}`,
          plannedMealId: meal.id,
          name: meal.name,
          emoji: meal.emoji,
          kitchenName: meal.kitchenName,
          price: meal.price,
          mealTime,
          time: slotTimes[dayIdx]?.[mealTime] ?? DEFAULT_TIMES[mealTime],
          prepTimeMin: 20,
        },
      },
    }));
  };

  const removeMeal = (dayIdx: number, mealTime: MealTime) => {
    setSchedule((prev) => {
      const day = { ...prev[dayIdx] };
      delete day[mealTime];
      return { ...prev, [dayIdx]: day };
    });
  };

  const updateTime = (dayIdx: number, mt: MealTime, time: string) => {
    setSlotTime(dayIdx, mt, time);
    setSchedule((prev) => {
      if (!prev[dayIdx]?.[mt]) return prev;
      return {
        ...prev,
        [dayIdx]: { ...prev[dayIdx], [mt]: { ...prev[dayIdx][mt]!, time } },
      };
    });
  };

  const allMeals = Object.values(schedule).flatMap((d) =>
    Object.values(d).filter((m): m is ScheduledMeal => !!m),
  );
  const subtotal = allMeals.reduce((s, m) => s + m.price, 0);
  const totalCount = allMeals.length;

  const weekLabel = (() => {
    const f = weekDates[0];
    return `Week of ${MONTHS[f.getMonth()]} ${f.getDate()}, ${f.getFullYear()}`;
  })();

  return (
    <div className="space-y-4">
      {/* Week nav + pay button */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-background/80 backdrop-blur-sm rounded-2xl border border-border px-5 py-3.5 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={prevWeek}
            disabled={isCurrentWeek}
            className="w-8 h-8 rounded-full border border-border bg-muted hover:bg-background flex items-center justify-center disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-black text-foreground">
            {weekLabel}
          </span>
          <button
            onClick={nextWeek}
            className="w-8 h-8 rounded-full border border-border bg-muted hover:bg-background flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          {totalCount > 0 && (
            <p className="text-xs text-muted-foreground hidden sm:block">
              <span className="font-black text-foreground">
                {totalCount} meals
              </span>
              {" · "}
              <span className="font-black text-primary">
                KES {subtotal.toLocaleString()}
              </span>
            </p>
          )}
          <Button
            onClick={() => setShowCheckout(true)}
            disabled={totalCount === 0}
            className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-black rounded-xl px-5 text-xs sm:text-sm disabled:opacity-40"
          >
            {totalCount === 0
              ? "Add meals first"
              : `Pay · KES ${(subtotal + 150).toLocaleString()}`}
          </Button>
        </div>
      </div>

      {/* Two-panel: plan list + grid/day-view */}
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-4">
        {/* Plan list sidebar */}
        <div className="bg-background/95 backdrop-blur-sm rounded-2xl border border-border shadow-lg p-4 flex flex-col h-fit lg:sticky lg:top-4">
          <div className="flex items-center justify-between border-b border-border pb-2 mb-3 flex-shrink-0">
            <h3 className="text-xs font-black text-foreground tracking-widest uppercase">
              Your Plan
            </h3>
            {plannedMeals.length > 0 && (
              <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {plannedMeals.length}
              </span>
            )}
          </div>
          {plannedMeals.length === 0 ? (
            <div className="py-6 text-center space-y-2">
              <p className="text-3xl">🍽️</p>
              <p className="text-xs font-semibold text-foreground">
                No meals planned
              </p>
              <p className="text-[10px] text-muted-foreground">
                Visit a kitchen and click{" "}
                <span className="text-primary font-bold">
                  &ldquo;Add to Plan&rdquo;
                </span>
              </p>
              <Link
                href="/discover"
                className="inline-block mt-2 text-xs text-primary font-bold border border-primary/30 rounded-full px-4 py-1.5 hover:bg-primary/5 transition-colors"
              >
                Browse Kitchens →
              </Link>
            </div>
          ) : (
            <>
              <div
                className="overflow-y-auto space-y-1.5 flex-1 pr-0.5"
                style={{ maxHeight: 380 }}
              >
                {plannedMeals.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 p-2 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors group"
                  >
                    <span className="text-base flex-shrink-0">{m.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-foreground truncate">
                        {m.name}
                      </p>
                      <p className="text-[9px] font-black text-primary">
                        KES {m.price}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromPlan(m.id)}
                      className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 rounded text-muted-foreground hover:text-destructive transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              {plannedMeals.length > 3 && (
                <button
                  onClick={() => {
                    if (confirm("Clear all planned dishes?")) clearPlan();
                  }}
                  className="text-[10px] text-muted-foreground hover:text-destructive font-semibold text-center w-full pt-2 flex-shrink-0 border-t border-border mt-2"
                >
                  Clear all ({plannedMeals.length})
                </button>
              )}
            </>
          )}
          <p className="text-[9px] text-muted-foreground text-center pt-2 flex-shrink-0 border-t border-border mt-2">
            Tap any + cell to assign →
          </p>
        </div>

        {/* Grid / mobile day view */}
        <div>
          {/* MOBILE: day scroller + single-day slots */}
          <div className="lg:hidden space-y-3">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {weekDates.map((date, i) => {
                const isPast = date.getTime() < TODAY.getTime();
                const isSel = i === mobileDayIdx;
                const isToday = date.getTime() === TODAY.getTime();
                const count = Object.values(schedule[i] ?? {}).filter(
                  Boolean,
                ).length;
                return (
                  <button
                    key={i}
                    onClick={() => !isPast && setMobileDayIdx(i)}
                    disabled={isPast}
                    className={`relative flex flex-col items-center px-3 py-2.5 rounded-xl min-w-[52px] border flex-shrink-0 transition-all ${
                      isPast
                        ? "opacity-25 cursor-not-allowed bg-background/20 border-border/20"
                        : isSel
                          ? "bg-secondary text-secondary-foreground border-secondary shadow-sm"
                          : "bg-background/80 border-border hover:bg-background"
                    }`}
                  >
                    <span
                      className={`text-[9px] font-black tracking-widest ${isSel ? "text-secondary-foreground" : "text-muted-foreground"}`}
                    >
                      {DAY_SHORT[i]}
                    </span>
                    <span
                      className={`text-lg font-black ${isToday && !isSel ? "text-primary" : ""}`}
                    >
                      {date.getDate()}
                    </span>
                    {count > 0 && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="bg-background/95 backdrop-blur-sm rounded-2xl border border-border shadow-lg overflow-visible">
              <div className="px-4 py-3 border-b border-border bg-muted/30">
                <p className="text-xs font-black text-foreground uppercase tracking-wider">
                  {DAY_SHORT[mobileDayIdx]} ·{" "}
                  {MONTHS[weekDates[mobileDayIdx].getMonth()]}{" "}
                  {weekDates[mobileDayIdx].getDate()}
                </p>
              </div>
              <div className="p-3 space-y-3">
                {MEAL_TIMES.map((mt) => {
                  const c = MEAL_META[mt];
                  return (
                    <div key={mt}>
                      <p
                        className={`text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full border inline-block mb-1.5 ${c.bg} ${c.text} ${c.border}`}
                      >
                        {c.icon} {c.label}
                      </p>
                      <MealCell
                        mealTime={mt}
                        scheduled={schedule[mobileDayIdx]?.[mt]}
                        onAssign={(id) => assignMeal(mobileDayIdx, mt, id)}
                        onRemove={() => removeMeal(mobileDayIdx, mt)}
                        time={
                          slotTimes[mobileDayIdx]?.[mt] ?? DEFAULT_TIMES[mt]
                        }
                        onTimeChange={(v) => updateTime(mobileDayIdx, mt, v)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* DESKTOP: 7-column grid */}
          <div className="hidden lg:block bg-background/95 backdrop-blur-sm rounded-2xl border border-border shadow-lg overflow-visible">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-border bg-muted/30">
              {weekDates.map((date, i) => {
                const isPast = date.getTime() < TODAY.getTime();
                const isToday = date.getTime() === TODAY.getTime();
                const dayCount = Object.values(schedule[i] ?? {}).filter(
                  Boolean,
                ).length;
                return (
                  <div
                    key={i}
                    className={`px-2 py-3 text-center border-r border-border/50 last:border-0 ${isPast ? "opacity-30" : ""}`}
                  >
                    <p className="text-[10px] font-black tracking-widest text-muted-foreground">
                      {DAY_SHORT[i]}
                    </p>
                    <p
                      className={`text-lg font-black ${isToday ? "text-primary" : "text-foreground"}`}
                    >
                      {date.getDate()}
                    </p>
                    {dayCount > 0 && (
                      <span className="inline-block text-[9px] font-black text-primary bg-primary/10 rounded-full px-1.5 py-0.5">
                        {dayCount}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Meal rows */}
            {MEAL_TIMES.map((mt) => (
              <div
                key={mt}
                className="grid grid-cols-7 border-b border-border/50 last:border-0"
              >
                {weekDates.map((date, dayIdx) => {
                  const isPast = date.getTime() < TODAY.getTime();
                  return (
                    <div
                      key={dayIdx}
                      className={`p-2 border-r border-border/30 last:border-0 ${isPast ? "opacity-25 pointer-events-none bg-muted/10" : ""}`}
                      style={{ minHeight: 100 }}
                    >
                      <MealCell
                        mealTime={mt}
                        scheduled={schedule[dayIdx]?.[mt]}
                        onAssign={(id) => assignMeal(dayIdx, mt, id)}
                        onRemove={() => removeMeal(dayIdx, mt)}
                        time={slotTimes[dayIdx]?.[mt] ?? DEFAULT_TIMES[mt]}
                        onTimeChange={(v) => updateTime(dayIdx, mt, v)}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
            {/* Footer row */}
            <div className="grid grid-cols-3 divide-x divide-border border-t border-border bg-muted/20">
              {MEAL_TIMES.map((mt) => {
                const c = MEAL_META[mt];
                const count = Object.values(schedule).reduce(
                  (s, d) => s + (d[mt] ? 1 : 0),
                  0,
                );
                return (
                  <div
                    key={mt}
                    className="px-3 py-2 flex items-center justify-between"
                  >
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider ${c.text}`}
                    >
                      {c.icon} {c.label}
                    </span>
                    {count > 0 && (
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${c.bg} ${c.text}`}
                      >
                        {count} set
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-md border-t border-border shadow-2xl px-4 py-3">
        <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              Week Total
            </p>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-black text-foreground">
                {totalCount} meal{totalCount !== 1 ? "s" : ""}
              </span>
              <span className="text-border">·</span>
              <span className="font-black text-primary">
                KES {subtotal.toLocaleString()}
              </span>
            </div>
          </div>
          <Button
            onClick={() => setShowCheckout(true)}
            disabled={totalCount === 0}
            className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-black rounded-xl px-5 py-2.5 text-xs shadow-lg disabled:opacity-40 flex-shrink-0"
          >
            Pay · KES {(subtotal + 150).toLocaleString()}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showCheckout && (
          <CheckoutModal
            meals={allMeals}
            subtotal={subtotal}
            onClose={() => setShowCheckout(false)}
            onConfirm={() => onSave(schedule)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────
export default function MyTablePage() {
  const TODAY = midnight(new Date());
  const thisMonday = getMondayOf(TODAY);

  const [activeTab, setActiveTab] = useState<"mytable" | "schedule">("mytable");
  const [baseMonday, setBaseMonday] = useState<Date>(thisMonday);
  const [savedSchedules, setSavedSchedules] =
    useState<Record<WeekKey, SavedSchedule>>(loadSchedules);
  const isCurrentWeek = baseMonday.getTime() === thisMonday.getTime();

  const handleSave = useCallback(
    (schedule: WeekSchedule) => {
      const wk = weekKey(baseMonday);
      const entry: SavedSchedule = {
        weekKey: wk,
        mondayISO: baseMonday.toISOString(),
        days: schedule,
        savedAt: new Date().toISOString(),
      };
      setSavedSchedules((prev) => {
        const updated = { ...prev, [wk]: entry };
        saveSchedules(updated);
        return updated;
      });
      toast.success("Schedule saved! View it in My Table →", {
        duration: 3000,
      });
      setActiveTab("mytable");
    },
    [baseMonday],
  );

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-10">
        <Image
          src="/bg-chefs.png"
          alt=""
          fill
          className="object-cover brightness-[0.4]"
          priority
        />
        <div className="absolute inset-0 bg-black/25" />
      </div>

      <div
        className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6"
        style={{ zIndex: 2 }}
      >
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-5xl font-black uppercase tracking-tight"
          >
            <span className="text-secondary">My </span>
            <span className="text-primary">Table</span>
          </motion.h1>
          <p className="text-sm text-white/70 mt-1">
            Plan your week, pay once, eat well every day
          </p>
        </div>

        <div className="flex justify-center">
          <div className="flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-2xl p-1 border border-border shadow-lg">
            {(
              [
                {
                  id: "mytable",
                  label: "My Table",
                  icon: <CalendarDays className="w-4 h-4" />,
                },
                {
                  id: "schedule",
                  label: "Schedule Meals",
                  icon: <Plus className="w-4 h-4" />,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "mytable" && (
            <motion.div
              key="mytable"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MyTableViewer
                savedSchedules={savedSchedules}
                setSavedSchedules={setSavedSchedules}
              />
            </motion.div>
          )}
          {activeTab === "schedule" && (
            <motion.div
              key="schedule"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <WeekScheduler
                onSave={handleSave}
                baseMonday={baseMonday}
                setBaseMonday={setBaseMonday}
                isCurrentWeek={isCurrentWeek}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="h-24" />
    </div>
  );
}
