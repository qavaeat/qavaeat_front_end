"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  startTransition,
} from "react";
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
  Minus,
  CheckCircle2,
  Pencil,
  AlertTriangle,
  ShieldCheck,
  BadgeDollarSign,
  Receipt,
  Clock,
  Ban,
  History,
  Loader2,
  XCircle,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlan } from "@/context/PlanContext";
import { toast } from "sonner";
import type { MealTime } from "@/types/user-section";
import {
  useSchedules,
  type ScheduledMeal,
  type WeekSchedule,
  type SavedSchedule,
} from "../../../hooks/useSchedule";
import {
  getUserTimezone,
  buildScheduledAtISO,
  localDayYMD,
  utcToLocalDisplayTime,
} from "@/lib/tzUtils";
import { LocationPicker } from "@/lib/locationPicker";
import { PickedLocation } from "@/lib/maps";
import { usePaymentStatus } from "../../../hooks/usePaymentStatus";
import { useRouter } from "next/navigation";

// ─────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────
type WeekKey = string;
type DayMap = Record<string, Record<MealTime, ScheduledMeal | undefined>>;

// ─────────────────────────────────────────────────────
// Date utils
// ─────────────────────────────────────────────────────
function localDate(y: number, m: number, d: number): Date {
  return new Date(y, m, d);
}

const _today = (() => {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
})();
function getToday(): Date {
  return _today;
}

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fromYMD(s: string | null | undefined): Date {
  if (!s || typeof s !== "string") return new Date();
  const [ys, ms, ds] = s.split("-");
  return localDate(
    parseInt(ys ?? "1970", 10),
    parseInt(ms ?? "1", 10) - 1,
    parseInt(ds ?? "1", 10),
  );
}
function mondayFromWeekKey(weekKey: string): Date {
  const d = fromYMD(weekKey);
  // Old schedules sent Sunday as weekStartDate → Monday is +1
  // New schedules send Monday as weekStartDate → it's already Monday
  return d.getDay() === 0
    ? localDate(d.getFullYear(), d.getMonth(), d.getDate() + 1)
    : d;
}
function weekStartOf(d: Date): Date {
  const day = d.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  const monday = localDate(
    d.getFullYear(),
    d.getMonth(),
    d.getDate() - daysSinceMonday,
  );
  return localDate(
    monday.getFullYear(),
    monday.getMonth(),
    monday.getDate() - 1,
  );
}
function buildWeek(weekStartSunday: Date): Date[] {
  const monday = localDate(
    weekStartSunday.getFullYear(),
    weekStartSunday.getMonth(),
    weekStartSunday.getDate() + 1,
  );
  return Array.from({ length: 7 }, (_, i) =>
    localDate(monday.getFullYear(), monday.getMonth(), monday.getDate() + i),
  );
}
function wkOf(weekStartSunday: Date): WeekKey {
  return toYMD(weekStartSunday);
}
function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function isBefore(a: Date, b: Date): boolean {
  if (a.getFullYear() !== b.getFullYear())
    return a.getFullYear() < b.getFullYear();
  if (a.getMonth() !== b.getMonth()) return a.getMonth() < b.getMonth();
  return a.getDate() < b.getDate();
}

// ─────────────────────────────────────────────────────
// Normalize DayMap — preserves ALL fields including paid / itemStatus
// ─────────────────────────────────────────────────────
function normalizeDays(days: WeekSchedule | DayMap | null | undefined): DayMap {
  if (!days || typeof days !== "object") return {};
  const out: DayMap = {};
  for (const [k, v] of Object.entries(days)) {
    if (v != null) {
      // Ensure every meal entry has the required boolean/string fields that
      // may be missing from older API payloads after the type migration.
      const normalized: Record<MealTime, ScheduledMeal | undefined> =
        {} as Record<MealTime, ScheduledMeal | undefined>;
      for (const [mt, meal] of Object.entries(v as Record<string, unknown>)) {
        if (meal && typeof meal === "object") {
          const m = meal as Partial<ScheduledMeal>;
          normalized[mt as MealTime] = {
            ...m,
            paid: m.paid === true,
            itemStatus: m.itemStatus ?? "PENDING",
          } as ScheduledMeal;
        } else {
          normalized[mt as MealTime] = undefined;
        }
      }
      out[String(k)] = normalized;
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────
const DAY_SHORT = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const DAY_FULL = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
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
    bg: "bg-amber-500/15",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-400/40",
    pill: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  },
  LUNCH: {
    icon: "🍽️",
    label: "Lunch",
    bg: "bg-primary/10",
    text: "text-primary",
    border: "border-primary/25",
    pill: "bg-primary/10 text-primary",
  },
  DINNER: {
    icon: "🌙",
    label: "Dinner",
    bg: "bg-violet-500/10",
    text: "text-violet-700 dark:text-violet-400",
    border: "border-violet-400/25",
    pill: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
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
// Phone utils
// ─────────────────────────────────────────────────────
function normalizeKEPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (/^0[17]\d{8}$/.test(digits)) return `+254${digits.slice(1)}`;
  if (/^254[17]\d{8}$/.test(digits)) return `+${digits}`;
  return null;
}

function formatKEPhoneDisplay(raw: string): string {
  const normalized = normalizeKEPhone(raw);
  if (!normalized) return raw;
  return normalized.replace(/^\+254(\d{3})(\d{3})(\d{3})$/, "+254 $1 $2 $3");
}

// ─────────────────────────────────────────────────────
// Meal helpers
// ─────────────────────────────────────────────────────
function mealsInDayMap(dm: DayMap | null | undefined): ScheduledMeal[] {
  if (!dm) return [];
  const r: ScheduledMeal[] = [];
  for (const ds of Object.values(dm)) {
    if (!ds) continue;
    for (const m of Object.values(ds)) {
      if (m) r.push(m);
    }
  }
  return r;
}
function allMealsInSchedules(
  s: Record<WeekKey, SavedSchedule>,
): ScheduledMeal[] {
  const r: ScheduledMeal[] = [];
  for (const w of Object.values(s)) {
    if (!w?.days) continue;
    r.push(...mealsInDayMap(normalizeDays(w.days)));
  }
  return r;
}
function unpaidMeals(s: Record<WeekKey, SavedSchedule>): ScheduledMeal[] {
  return allMealsInSchedules(s).filter((m) => m.paid !== true);
}

// FIX: buildDayMealMap — correctly maps day-index (0=Mon…6=Sun) to calendar dates
function buildDayMealMap(
  saved: Record<WeekKey, SavedSchedule>,
): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const week of Object.values(saved)) {
    if (!week?.weekKey) continue;
    const monday = mondayFromWeekKey(week.weekKey);
    const dm = normalizeDays(week.days);
    for (const [di, dd] of Object.entries(dm)) {
      if (dd && Object.values(dd).some((m) => m != null)) {
        // di is 0=Monday … 6=Sunday
        const date = localDate(
          monday.getFullYear(),
          monday.getMonth(),
          monday.getDate() + Number(di),
        );
        map[toYMD(date)] = true;
      }
    }
  }
  return map;
}

function earliestSavedWeekStart(
  saved: Record<WeekKey, SavedSchedule>,
  thisWeekStart: Date,
): Date {
  const keys = Object.keys(saved)
    .filter((k) => k?.length === 10)
    .sort();
  return keys.length ? fromYMD(keys[0]) : thisWeekStart;
}

// ─────────────────────────────────────────────────────
// TimePicker — portal dropdown
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
  const skip = useRef(false);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (skip.current) {
        skip.current = false;
        return;
      }
      if (ref.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <>
      <button
        ref={ref}
        onClick={() => {
          if (!ref.current) return;
          const r = ref.current.getBoundingClientRect();
          setPos({
            top: r.bottom + window.scrollY + 2,
            right: window.innerWidth - r.right,
          });
          skip.current = true;
          setOpen((p) => !p);
        }}
        className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground border border-border rounded-lg px-2 py-0.5 bg-background hover:bg-muted transition-colors whitespace-nowrap flex-shrink-0"
      >
        {value}
        <ChevronDown
          className={`w-2.5 h-2.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {typeof window !== "undefined" &&
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
                className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                  t === value
                    ? "text-primary font-bold bg-primary/5"
                    : "text-foreground hover:bg-muted"
                }`}
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
// MealCell
// ─────────────────────────────────────────────────────
function MealCell({
  mealTime,
  scheduled,
  onAssign,
  onRemove,
  onQuantityChange,
  time,
  onTimeChange,
  readonly = false,
}: {
  mealTime: MealTime;
  scheduled?: ScheduledMeal;
  onAssign: (id: string) => void;
  onRemove: () => void;
  onQuantityChange: (qty: number) => void;
  time: string;
  onTimeChange: (v: string) => void;
  readonly?: boolean;
}) {
  const { plannedMeals } = usePlan();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const trigRef = useRef<HTMLButtonElement>(null);
  const skip = useRef(false);
  const m = MEAL_META[mealTime];

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (skip.current) {
        skip.current = false;
        return;
      }
      if (trigRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const filtered = useMemo(
    () =>
      !search.trim()
        ? plannedMeals
        : plannedMeals.filter(
            (p) =>
              p.name.toLowerCase().includes(search.toLowerCase()) ||
              p.kitchenName.toLowerCase().includes(search.toLowerCase()),
          ),
    [plannedMeals, search],
  );

  // ── Assigned meal ──────────────────────────────────
  if (scheduled) {
    const ip = scheduled.paid === true;
    const qty = scheduled.quantity ?? 1;

    return (
      <div
        className={`relative group rounded-xl border shadow-sm transition-all flex flex-col gap-0 ${
          ip
            ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700"
            : `bg-background ${m.border} border`
        }`}
      >
        {/* Paid badge */}
        {ip && (
          <span className="absolute top-1.5 right-1.5 z-10 flex items-center gap-0.5 text-[8px] font-black px-1.5 py-0.5 rounded-full bg-emerald-500 text-white shadow-sm pointer-events-none">
            <ShieldCheck className="w-2.5 h-2.5" />
            PAID
          </span>
        )}

        {!ip && !readonly && (
          <button
            onClick={onRemove}
            className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center transition-all shadow-sm"
            aria-label="Remove meal"
          >
            <X className="w-3 h-3" />
          </button>
        )}

        {/* Top section: emoji + name + kitchen */}
        <div className="flex items-start gap-2 p-2.5 pb-2">
          <span className="text-xl flex-shrink-0 leading-none mt-0.5">
            {scheduled.emoji}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-foreground leading-tight line-clamp-2 pr-6">
              {scheduled.name}
            </p>
            <p className="text-[9px] text-muted-foreground truncate mt-0.5">
              {scheduled.kitchenName}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full border-t border-border/40" />

        {/* Price + Time row */}
        <div className="flex items-center justify-between gap-1 px-2.5 py-1.5">
          <span
            className={`text-[11px] font-black leading-none ${
              ip ? "text-emerald-600 dark:text-emerald-400" : "text-primary"
            }`}
          >
            KES {(scheduled.price * qty).toLocaleString()}
            {qty > 1 && (
              <span className="font-normal text-muted-foreground ml-0.5 text-[9px]">
                ×{qty}
              </span>
            )}
          </span>
          {/* Paid meals show static time; unpaid get the picker */}
          {ip ? (
            <span className="text-[10px] text-muted-foreground flex-shrink-0">
              {time}
            </span>
          ) : (
            <TimePicker value={time} onChange={onTimeChange} />
          )}
        </div>

        {/* Quantity controls — only for unpaid editable meals */}
        {!ip && !readonly && (
          <>
            <div className="w-full border-t border-border/40" />
            <div className="flex items-center justify-center gap-3 px-2.5 py-2">
              <button
                onClick={() => onQuantityChange(Math.max(1, qty - 1))}
                disabled={qty <= 1}
                className="w-6 h-6 rounded-md border border-border bg-muted flex items-center justify-center disabled:opacity-30 hover:bg-muted/80 active:scale-95 transition-all flex-shrink-0"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-[12px] font-bold text-foreground tabular-nums w-5 text-center select-none">
                {qty}
              </span>
              <button
                onClick={() => onQuantityChange(Math.min(10, qty + 1))}
                disabled={qty >= 10}
                className="w-6 h-6 rounded-md border border-border bg-muted flex items-center justify-center disabled:opacity-30 hover:bg-muted/80 active:scale-95 transition-all flex-shrink-0"
                aria-label="Increase quantity"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Empty cell (readonly) ──────────────────────────
  if (readonly) {
    return (
      <div className="w-full h-full min-h-[80px] rounded-xl border-2 border-dashed border-border/20 flex items-center justify-center opacity-30">
        <span className="text-[9px] font-bold text-muted-foreground">—</span>
      </div>
    );
  }

  // ── Empty cell (assignable) ────────────────────────
  return (
    <>
      <button
        ref={trigRef}
        onClick={() => {
          if (!trigRef.current) return;
          const r = trigRef.current.getBoundingClientRect();
          const sb = window.innerHeight - r.bottom;
          setPos({
            top:
              sb > 280
                ? r.bottom + window.scrollY + 4
                : r.top + window.scrollY - 284,
            left: Math.min(r.left + window.scrollX, window.innerWidth - 264),
          });
          setSearch("");
          skip.current = true;
          setOpen((p) => !p);
        }}
        className={`w-full min-h-[80px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 py-4 transition-all ${
          open
            ? "border-primary bg-primary/5"
            : "border-border/40 hover:border-primary/50 hover:bg-primary/5"
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
          className={`text-[9px] font-bold transition-colors ${
            open ? "text-primary" : "text-muted-foreground/70"
          }`}
        >
          {m.icon} {m.label}
        </span>
      </button>

      {typeof window !== "undefined" &&
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
            {/* Dropdown header */}
            <div className={`px-3 py-2.5 border-b border-border ${m.bg}`}>
              <p
                className={`text-[10px] font-black uppercase tracking-wide ${m.text}`}
              >
                {m.icon} {m.label}
              </p>
            </div>

            {/* Search */}
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

            {/* Options */}
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
// PhoneInput — alternate payment number picker
// ─────────────────────────────────────────────────────
function PhoneInput({
  systemPhone,
  value,
  onChange,
  onValidChange,
}: {
  systemPhone: string;
  value: string;
  onChange: (v: string) => void;
  onValidChange: (normalized: string | null) => void;
}) {
  const [useAlt, setUseAlt] = useState(false);
  const [error, setError] = useState("");
  const normalized = normalizeKEPhone(value);

  const handleToggle = () => {
    setUseAlt((p) => !p);
    onChange("");
    setError("");
    onValidChange(null);
  };

  const handleChange = (raw: string) => {
    const filtered = raw.replace(/[^\d\s+\-()]/g, "");
    onChange(filtered);
    setError("");
    onValidChange(normalizeKEPhone(filtered));
  };

  const handleBlur = () => {
    if (!value.trim()) {
      setError("");
      return;
    }
    if (!normalizeKEPhone(value)) {
      setError("Enter a valid Safaricom or Airtel number (e.g. 0712 345 678)");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2.5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Phone className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              M-Pesa Prompt
            </p>
            <p
              className={`text-xs font-bold truncate ${systemPhone ? "text-foreground" : "text-muted-foreground italic"}`}
            >
              {useAlt && normalized
                ? formatKEPhoneDisplay(value)
                : systemPhone || "No number saved"}
            </p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          className={`text-[10px] font-black border rounded-lg px-2.5 py-1 transition-colors flex-shrink-0 whitespace-nowrap ${
            useAlt
              ? "text-muted-foreground border-border hover:bg-muted"
              : "text-primary border-primary/30 hover:bg-primary/5"
          }`}
        >
          {useAlt ? "← Use my number" : "Someone else is paying"}
        </button>
      </div>

      {!useAlt && (
        <p className="text-[10px] text-muted-foreground">
          The M-Pesa prompt will go to your registered number. Tap above if a
          friend or family member is covering this.
        </p>
      )}

      <AnimatePresence>
        {useAlt && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-1 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">
                  Payer&apos;s M-Pesa Number
                </label>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  They&apos;ll get the prompt
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm select-none">
                  🇰🇪
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={value}
                  onChange={(e) => handleChange(e.target.value)}
                  onBlur={handleBlur}
                  placeholder="0712 345 678"
                  maxLength={15}
                  autoFocus
                  className={`w-full pl-9 pr-9 py-2.5 text-sm rounded-lg border bg-background outline-none transition-colors font-medium ${
                    error
                      ? "border-destructive focus:border-destructive"
                      : normalized
                        ? "border-emerald-400 focus:border-emerald-500"
                        : "border-border focus:border-primary"
                  }`}
                />
                {normalized && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                )}
              </div>
              {error && (
                <p className="text-[10px] text-destructive font-semibold">
                  {error}
                </p>
              )}
              {normalized && !error && (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  ✓ Prompt goes to {formatKEPhoneDisplay(value)} — your profile
                  number stays unchanged
                </p>
              )}
              <p className="text-[9px] text-muted-foreground leading-relaxed">
                Their number is only used for this payment. Your profile phone (
                {systemPhone}) remains your default.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// PaymentWaitingOverlay
// ─────────────────────────────────────────────────────
function PaymentWaitingOverlay({
  grandTotal,
  phoneNumber,
  secondsLeft,
  pollStatus,
  onCancel,
}: {
  grandTotal: number;
  phoneNumber: string;
  secondsLeft: number;
  pollStatus: "polling" | "complete" | "failed" | "timeout";
  onCancel: () => void;
}) {
  const isComplete = pollStatus === "complete";
  const isFailed = pollStatus === "failed" || pollStatus === "timeout";

  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center space-y-5 min-h-[340px]">
      {!isComplete && !isFailed && (
        <>
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <span className="text-4xl relative z-10">📱</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-base font-black text-foreground">
              Check your phone
            </p>
            <p className="text-sm text-muted-foreground">
              M-Pesa prompt sent to{" "}
              <span className="font-bold text-foreground">{phoneNumber}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Enter your PIN to confirm
            </p>
          </div>
          <div className="bg-muted/40 rounded-xl px-6 py-3">
            <p className="text-xs text-muted-foreground">Amount</p>
            <p className="text-2xl font-black text-primary">
              KES {grandTotal.toLocaleString()}
            </p>
          </div>
          <div className="w-full max-w-xs">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Waiting for payment confirmation…</span>
              <span
                className={`font-bold ${secondsLeft <= 15 ? "text-destructive" : ""}`}
              >
                {secondsLeft}s
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: "100%" }}
                animate={{ width: `${(secondsLeft / 90) * 100}%` }}
                transition={{ duration: 1, ease: "linear" }}
              />
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
          >
            Cancel payment
          </button>
        </>
      )}

      {isComplete && (
        <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="flex flex-col items-center gap-5"
        >
          {/* Animated ring that shrinks as the modal auto-closes */}
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg
              className="absolute inset-0 w-24 h-24 -rotate-90"
              viewBox="0 0 96 96"
            >
              <circle
                cx="48"
                cy="48"
                r="44"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-emerald-200 dark:text-emerald-900"
              />
              <motion.circle
                cx="48"
                cy="48"
                r="44"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 44}`}
                className="text-emerald-500"
                initial={{ strokeDashoffset: 0 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 44 }}
                transition={{ duration: 1.8, ease: "linear" }}
              />
            </svg>
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 18,
                  delay: 0.1,
                }}
              >
                <CheckCircle2 className="w-9 h-9 text-emerald-500" />
              </motion.div>
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-lg font-black text-foreground">
              Payment confirmed! 🎉
            </p>
            <p className="text-sm text-muted-foreground">
              Your meals are locked in. Closing now…
            </p>
          </div>
        </motion.div>
      )}

      {isFailed && (
        <>
          <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
            <XCircle className="w-10 h-10 text-destructive" />
          </div>
          <div>
            <p className="text-lg font-black text-foreground">
              {pollStatus === "timeout"
                ? "Payment timed out"
                : "Payment failed"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {pollStatus === "timeout"
                ? "No confirmation received. Your meals have NOT been charged."
                : "The payment was not completed. No money was taken."}
            </p>
          </div>
          <Button onClick={onCancel} variant="outline" className="rounded-xl">
            Close and try again
          </Button>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// CheckoutModal
// ─────────────────────────────────────────────────────
type CoWeekGroup = {
  label: string;
  weekStartSunday: Date;
  weekKey: string;
  days: Array<{
    dayLabel: string;
    date: Date;
    meals: Array<{
      meal: ScheduledMeal;
      displayTime: string;
      isDraft: boolean;
    }>;
  }>;
  weekTotal: number;
  isDraft?: boolean;
};

function CheckoutModal({
  savedSchedules,
  draftSchedule,
  customerPhone,
  onClose,
  onConfirm,
  onPaymentComplete,
  onCancelPayment,
}: {
  savedSchedules: Record<WeekKey, SavedSchedule>;
  draftSchedule: {
    weekKey: string;
    weekMondayYMD: string;
    schedule: WeekSchedule;
  } | null;
  customerPhone: string;
  onClose: () => void;
  onPaymentComplete: () => void;
  onCancelPayment: (apiRef: string) => Promise<void>;
  onConfirm: (
    serviceType: string,
    deliveryAddress?: string,
    deliveryLocation?: PickedLocation,
    phoneOverride?: string,
  ) => Promise<{ apiRef: string; grandTotal: number }>;
}) {
  const [serviceType, setServiceType] = useState<
    "PICKUP" | "DELIVERY" | "DINE_IN"
  >("DELIVERY");
  const [confirmedTotal, setConfirmedTotal] = useState<number | null>(null);
  const waitingApiRefSnapshot = useRef<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [deliveryLocation, setDeliveryLocation] =
    useState<PickedLocation | null>(null);
  const router = useRouter();

  const [altPhoneRaw, setAltPhoneRaw] = useState("");
  const [altPhoneNormalized, setAltPhoneNormalized] = useState<string | null>(
    null,
  );

  const [waitingApiRef, setWaitingApiRef] = useState<string | null>(null);

  const handleCancelWaiting = async () => {
    const ref = waitingApiRef ?? waitingApiRefSnapshot.current;
    if (ref) {
      await onCancelPayment(ref);
    }
    setWaitingApiRef(null);
    waitingApiRefSnapshot.current = null;
    setConfirmedTotal(null);
    reset();
    setAltPhoneRaw("");
    setAltPhoneNormalized(null);
    onClose();
  };

  const onPaymentCompleteRef = useRef(onPaymentComplete);
  useEffect(() => {
    onPaymentCompleteRef.current = onPaymentComplete;
  }, [onPaymentComplete]);

  const { pollStatus, secondsLeft, startPolling, reset } = usePaymentStatus(
    useCallback(() => {
      onPaymentCompleteRef.current();
    }, []),
    useCallback(() => {}, []),
  );

  // Auto-dismiss after a brief success flash so the modal never gets stuck
  useEffect(() => {
    if (pollStatus !== "complete") return;
    const t = setTimeout(() => {
      setWaitingApiRef(null);
      waitingApiRefSnapshot.current = null;
      setConfirmedTotal(null);
      reset();
      onPaymentCompleteRef.current();
    }, 1800);
    return () => clearTimeout(t);
  }, [pollStatus, reset]);

  useEffect(() => {
    if (pollStatus !== "timeout") return;
    const ref = waitingApiRef ?? waitingApiRefSnapshot.current;
    if (!ref) return;
    onCancelPayment(ref).catch(() => {});
  }, [pollStatus, waitingApiRef, onCancelPayment]);

  const tz = getUserTimezone();
  const weekGroups = useMemo((): CoWeekGroup[] => {
    const groups: CoWeekGroup[] = [];
    const seenMealIds = new Set<string>();

    const sorted = Object.values(savedSchedules)
      .filter(
        (w): w is SavedSchedule =>
          typeof w?.weekKey === "string" && w.weekKey.length > 0,
      )
      .sort((a, b) => a.weekKey.localeCompare(b.weekKey));

    for (const week of sorted) {
      const mon = mondayFromWeekKey(week.weekKey);
      const wSun = localDate(
        mon.getFullYear(),
        mon.getMonth(),
        mon.getDate() + 6,
      );
      const dm = normalizeDays(week.days);
      const days: CoWeekGroup["days"] = [];

      for (const [di, dd] of Object.entries(dm)) {
        if (!dd) continue;
        const date = localDate(
          mon.getFullYear(),
          mon.getMonth(),
          mon.getDate() + Number(di),
        );
        const ord = MEAL_TIMES.map((mt) => dd[mt])
          .filter((m): m is ScheduledMeal => !!m && m.paid !== true)
          .map((m) => {
            seenMealIds.add(m.id);
            return {
              meal: m,
              displayTime: m.time.includes("T")
                ? utcToLocalDisplayTime(m.time, tz)
                : m.time,
              isDraft: false,
            };
          });
        if (!ord.length) continue;
        days.push({
          dayLabel: `${DAY_FULL[Number(di)] ?? ""}, ${date.getDate()} ${(MONTHS[date.getMonth()] ?? "").slice(0, 3)}`,
          date,
          meals: ord,
        });
      }
      if (!days.length) continue;
      const wt = days
        .flatMap((d) => d.meals)
        .reduce((s, { meal }) => s + meal.price * (meal.quantity ?? 1), 0);
      groups.push({
        label: `${mon.getDate()} ${(MONTHS[mon.getMonth()] ?? "").slice(0, 3)} – ${wSun.getDate()} ${(MONTHS[wSun.getMonth()] ?? "").slice(0, 3)}, ${wSun.getFullYear()}`,
        weekStartSunday: mon,
        weekKey: week.weekKey,
        days,
        weekTotal: wt,
      });
    }

    if (draftSchedule) {
      const dmon = mondayFromWeekKey(draftSchedule.weekKey);
      const dwSun = localDate(
        dmon.getFullYear(),
        dmon.getMonth(),
        dmon.getDate() + 6,
      );
      const already = groups.find((g) => sameDay(g.weekStartSunday, dmon));
      const draftDm = normalizeDays(draftSchedule.schedule);
      const days: CoWeekGroup["days"] = [];

      for (const [di, dd] of Object.entries(draftDm)) {
        if (!dd) continue;
        const date = localDate(
          dmon.getFullYear(),
          dmon.getMonth(),
          dmon.getDate() + Number(di),
        );
        const ord = MEAL_TIMES.map((mt) => dd[mt])
          .filter(
            (m): m is ScheduledMeal =>
              !!m && m.paid !== true && !seenMealIds.has(m.id),
          )
          .map((m) => ({
            meal: m,
            displayTime: m.time.includes("T")
              ? utcToLocalDisplayTime(m.time, tz)
              : m.time,
            isDraft: true,
          }));
        if (!ord.length) continue;
        days.push({
          dayLabel: `${DAY_FULL[Number(di)] ?? ""}, ${date.getDate()} ${(MONTHS[date.getMonth()] ?? "").slice(0, 3)}`,
          date,
          meals: ord,
        });
      }

      if (days.length) {
        const dwt = days
          .flatMap((d) => d.meals)
          .reduce((s, { meal }) => s + meal.price * (meal.quantity ?? 1), 0);
        if (already) {
          for (const dd of days) {
            const ex = already.days.find((d) => sameDay(d.date, dd.date));
            if (ex) {
              ex.meals.push(...dd.meals);
            } else {
              already.days.push(dd);
              already.days.sort((a, b) => a.date.getTime() - b.date.getTime());
            }
          }
          already.weekTotal += dwt;
        } else {
          groups.push({
            label: `${dmon.getDate()} ${(MONTHS[dmon.getMonth()] ?? "").slice(0, 3)} – ${dwSun.getDate()} ${(MONTHS[dwSun.getMonth()] ?? "").slice(0, 3)}, ${dwSun.getFullYear()} (new)`,
            weekStartSunday: dmon,
            weekKey: draftSchedule.weekKey,
            days,
            weekTotal: dwt,
            isDraft: true,
          });
        }
      }
    }

    return groups;
  }, [savedSchedules, draftSchedule, tz]);

  const allMeals = useMemo(
    () =>
      weekGroups.flatMap((g) =>
        g.days.flatMap((d) => d.meals.map(({ meal }) => meal)),
      ),
    [weekGroups],
  );
  const grandTotal = useMemo(
    () => allMeals.reduce((s, m) => s + m.price * (m.quantity ?? 1), 0),
    [allMeals],
  );
  const mealCount = allMeals.length;

  const kitchenSummary = useMemo(() => {
    const map: Record<string, { name: string; count: number; total: number }> =
      {};
    for (const meal of allMeals) {
      const qty = meal.quantity ?? 1;
      if (!map[meal.kitchenName])
        map[meal.kitchenName] = { name: meal.kitchenName, count: 0, total: 0 };
      map[meal.kitchenName]!.count += qty;
      map[meal.kitchenName]!.total += meal.price * qty;
    }
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [allMeals]);

  const effectivePhone = altPhoneNormalized ?? customerPhone;
  void effectivePhone; // used in STK push via onConfirm

  const canPlace =
    (serviceType !== "DELIVERY" ||
      !!deliveryLocation?.formatted_address?.trim()) &&
    (altPhoneRaw.trim() === "" || altPhoneNormalized !== null);

  const handlePlace = async () => {
    if (!customerPhone?.trim() && !altPhoneNormalized) {
      toast.error("Add a phone number to your profile before paying.", {
        description: "You'll be redirected to your profile.",
        duration: 4000,
      });
      onClose();
      window.location.href = "/profile?section=personal&highlight=phone";
      return;
    }
    if (!canPlace || mealCount === 0) return;
    setPlacing(true);
    try {
      const result = await onConfirm(
        serviceType,
        deliveryLocation?.formatted_address?.trim() ?? undefined,
        deliveryLocation ?? undefined,
        altPhoneNormalized ?? undefined,
      );
      setWaitingApiRef(result.apiRef);
      waitingApiRefSnapshot.current = result.apiRef;
      setConfirmedTotal(result.grandTotal);
      startPolling(result.apiRef);
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message ?? "Failed to initiate payment");
    } finally {
      setPlacing(false);
    }
  };

  const isWaiting = waitingApiRef !== null;
  const displayPhone = altPhoneNormalized
    ? formatKEPhoneDisplay(altPhoneRaw)
    : customerPhone;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-3 py-4 sm:px-4 sm:py-6"
      onClick={(e) => {
        if (isWaiting && pollStatus === "polling") return;
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.25 }}
        className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-xl flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Receipt className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-black text-foreground">
                {isWaiting ? "Awaiting Payment" : "Order Summary"}
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {isWaiting
                  ? "Do not close this window"
                  : `${mealCount} meal${mealCount !== 1 ? "s" : ""} · saved only after payment`}
              </p>
            </div>
          </div>
          {(!isWaiting || pollStatus !== "polling") && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center mt-0.5"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {isWaiting ? (
              <motion.div
                key="waiting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <PaymentWaitingOverlay
                  grandTotal={confirmedTotal ?? grandTotal}
                  phoneNumber={displayPhone}
                  secondsLeft={secondsLeft}
                  pollStatus={pollStatus === "idle" ? "polling" : pollStatus}
                  onCancel={handleCancelWaiting}
                />
              </motion.div>
            ) : weekGroups.length === 0 ? (
              <motion.div
                key="empty"
                className="text-center py-14 space-y-3 px-6"
              >
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <p className="text-sm font-black text-foreground">
                  All meals are paid!
                </p>
                <p className="text-xs text-muted-foreground">
                  Schedule new meals to place another order.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="summary"
                className="p-4 sm:p-5 space-y-4 sm:space-y-5"
              >
                {kitchenSummary.length > 0 && (
                  <div className="rounded-xl border border-border bg-muted/30 p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                      Ordering from
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {kitchenSummary.map((k) => (
                        <div
                          key={k.name}
                          className="flex items-center gap-1.5 bg-background border border-border rounded-lg px-2 py-1.5 min-w-0 max-w-full"
                        >
                          <UtensilsCrossed className="w-3 h-3 text-primary flex-shrink-0" />
                          <span className="text-[11px] font-bold text-foreground truncate">
                            {k.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">
                            ·
                          </span>
                          <span className="text-[11px] font-black text-primary flex-shrink-0">
                            KES {k.total.toLocaleString()}
                          </span>
                          <span className="text-[9px] text-muted-foreground flex-shrink-0">
                            ({k.count})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {weekGroups.map((group, gi) => (
                  <div
                    key={gi}
                    className={`rounded-xl border overflow-hidden ${group.isDraft ? "border-primary/40" : "border-border"}`}
                  >
                    <div
                      className={`flex items-center justify-between px-3 sm:px-4 py-2.5 border-b border-border ${group.isDraft ? "bg-primary/5" : "bg-muted/40"}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <CalendarDays className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-[11px] font-black text-foreground truncate">
                          Week of {group.label}
                        </span>
                        {group.isDraft && (
                          <span className="text-[9px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                            Unsaved
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-black text-primary flex-shrink-0 ml-2">
                        KES {group.weekTotal.toLocaleString()}
                      </span>
                    </div>
                    {group.days.map((day, di) => (
                      <div
                        key={di}
                        className="border-b border-border/50 last:border-0"
                      >
                        <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-muted/20">
                          <p className="text-[10px] font-black text-foreground uppercase tracking-wide">
                            {day.dayLabel}
                          </p>
                          <p className="text-[10px] font-semibold text-muted-foreground">
                            {day.meals.length} meal
                            {day.meals.length !== 1 ? "s" : ""} · KES{" "}
                            {day.meals
                              .reduce(
                                (s, { meal }) =>
                                  s + meal.price * (meal.quantity ?? 1),
                                0,
                              )
                              .toLocaleString()}
                          </p>
                        </div>
                        <div className="divide-y divide-border/30">
                          {day.meals.map(
                            ({ meal, displayTime, isDraft }, mi) => {
                              const meta = MEAL_META[meal.mealTime];
                              const qty = meal.quantity ?? 1;
                              return (
                                <div
                                  key={mi}
                                  className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3"
                                >
                                  <div
                                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-lg sm:text-xl flex-shrink-0 border ${meta.bg} ${meta.border}`}
                                  >
                                    {meal.emoji}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start gap-1.5 flex-wrap">
                                      <p className="text-[12px] font-bold text-foreground leading-tight">
                                        {meal.name}
                                      </p>
                                      {isDraft && (
                                        <span className="text-[8px] font-black text-primary bg-primary/10 px-1 py-0.5 rounded-full flex-shrink-0">
                                          NEW
                                        </span>
                                      )}
                                      {qty > 1 && (
                                        <span className="text-[9px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full flex-shrink-0">
                                          ×{qty}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                                      {meal.kitchenName}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                      <span
                                        className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${meta.pill}`}
                                      >
                                        {meta.icon} {meta.label}
                                      </span>
                                      <span className="inline-flex items-center gap-0.5 text-[9px] text-muted-foreground">
                                        <Clock className="w-2.5 h-2.5" />
                                        {displayTime}
                                      </span>
                                    </div>
                                  </div>
                                  <p className="text-[13px] font-black text-primary flex-shrink-0">
                                    KES {(meal.price * qty).toLocaleString()}
                                  </p>
                                </div>
                              );
                            },
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

                {/* Service type */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-foreground">
                    Service Type *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        {
                          v: "DELIVERY",
                          l: "Delivery",
                          icon: <Bike className="w-4 h-4" />,
                        },
                        {
                          v: "PICKUP",
                          l: "Pickup",
                          icon: <ShoppingBag className="w-4 h-4" />,
                        },
                        {
                          v: "DINE_IN",
                          l: "Dine In",
                          icon: <UtensilsCrossed className="w-4 h-4" />,
                        },
                      ] as const
                    ).map(({ v, l, icon }) => (
                      <button
                        key={v}
                        onClick={() => setServiceType(v)}
                        className={`flex flex-col items-center gap-1 py-2.5 sm:py-3 rounded-xl text-[11px] font-bold border transition-all ${
                          serviceType === v
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "border-border text-muted-foreground hover:border-primary/40 hover:bg-muted/30"
                        }`}
                      >
                        {icon} {l}
                      </button>
                    ))}
                  </div>
                </div>

                {serviceType === "DELIVERY" && (
                  <LocationPicker
                    value={deliveryLocation}
                    onChange={(loc) => setDeliveryLocation(loc)}
                    label="Delivery Address"
                    confirmLabel="Delivering here"
                    hint="Use GPS or tap the map to set your delivery location"
                    required
                  />
                )}

                <PhoneInput
                  systemPhone={customerPhone}
                  value={altPhoneRaw}
                  onChange={setAltPhoneRaw}
                  onValidChange={setAltPhoneNormalized}
                />

                {/* Payment breakdown */}
                <div className="rounded-xl border-2 border-emerald-400/50 bg-emerald-50 dark:bg-emerald-950/30 overflow-hidden">
                  <div className="px-4 py-3 border-b border-emerald-200 dark:border-emerald-800/50">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                      Payment Breakdown
                    </p>
                  </div>
                  <div className="px-4 py-3 space-y-1.5">
                    {weekGroups.map((g, i) => {
                      const mon = g.weekStartSunday;
                      return (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            {g.isDraft
                              ? "New week"
                              : `Week of ${mon.getDate()} ${(MONTHS[mon.getMonth()] ?? "").slice(0, 3)}`}
                            <span className="text-[10px] ml-1 text-muted-foreground/70">
                              ({g.days.reduce((s, d) => s + d.meals.length, 0)}{" "}
                              meals)
                            </span>
                          </span>
                          <span className="font-bold text-foreground">
                            KES {g.weekTotal.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                    <div className="pt-2 mt-1 border-t border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-sm font-black text-foreground">
                          Total Due Now
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {mealCount} meal{mealCount !== 1 ? "s" : ""} · food
                          cost only
                        </p>
                      </div>
                      <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        KES {grandTotal.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {!isWaiting && (
          <div className="flex gap-3 px-4 sm:px-5 py-4 border-t border-border flex-shrink-0">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-full"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePlace}
              disabled={!canPlace || placing || mealCount === 0}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-black disabled:opacity-40"
            >
              {placing ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending prompt…
                </span>
              ) : mealCount === 0 ? (
                "Nothing to pay"
              ) : (
                `Pay KES ${grandTotal.toLocaleString()}`
              )}
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// ScheduleManagerModal
// ─────────────────────────────────────────────────────
function ScheduleManagerModal({
  savedSchedules,
  onClose,
  onEdit,
  onDelete,
  onCancelWeek,
}: {
  savedSchedules: Record<WeekKey, SavedSchedule>;
  onClose: () => void;
  onEdit: (wk: WeekKey) => void;
  onDelete: (wk: WeekKey) => Promise<void>;
  onCancelWeek: (wk: WeekKey) => Promise<void>;
}) {
  const [confirmDelete, setConfirmDelete] = useState<WeekKey | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<WeekKey | null>(null);
  const [working, setWorking] = useState<WeekKey | null>(null);
  const tz = getUserTimezone();

  const weeks = useMemo(() => {
    return Object.entries(savedSchedules)
      .filter((entry): entry is [string, SavedSchedule] => {
        const [wk, week] = entry;
        return (
          typeof wk === "string" &&
          wk.length > 0 &&
          week != null &&
          typeof week.weekKey === "string" &&
          week.weekKey.length > 0
        );
      })
      .sort(([a], [b]) => b.localeCompare(a));
  }, [savedSchedules]);

  const doDelete = async (wk: string) => {
    setWorking(wk);
    try {
      await onDelete(wk);
      toast.success("Schedule deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setWorking(null);
      setConfirmDelete(null);
    }
  };

  const doCancel = async (wk: string) => {
    setWorking(wk);
    try {
      await onCancelWeek(wk);
      toast.success("Schedule cancelled");
    } catch {
      toast.error("Failed to cancel");
    } finally {
      setWorking(null);
      setConfirmCancel(null);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.25 }}
        className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-lg flex flex-col max-h-[88vh]"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-base font-black text-foreground">
              Manage Schedules
            </h2>
            <p className="text-xs text-muted-foreground">
              {weeks.length} week{weeks.length !== 1 ? "s" : ""} saved
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {weeks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">📅</p>
              <p className="text-sm font-semibold text-foreground">
                No schedules yet
              </p>
            </div>
          ) : (
            weeks.map(([wk, week]) => {
              if (!week?.weekKey) return null;
              const monday = mondayFromWeekKey(week.weekKey);
              const weekSun = localDate(
                monday.getFullYear(),
                monday.getMonth(),
                monday.getDate() + 6,
              );
              const dm = normalizeDays(week.days);
              const meals = mealsInDayMap(dm);
              const paidCount = meals.filter((m) => m.paid === true).length;
              const unpaid = meals.length - paidCount;
              const isFullyPaid =
                meals.length > 0 && paidCount === meals.length;
              const isCancelled = week.status === "CANCELLED";
              const isDeleting = confirmDelete === wk;
              const isCancelling = confirmCancel === wk;
              const isBusy = working === wk;

              return (
                <div
                  key={wk}
                  className={`rounded-xl border overflow-hidden transition-opacity ${
                    isBusy ? "opacity-60 pointer-events-none" : ""
                  } ${
                    isFullyPaid
                      ? "border-emerald-300 dark:border-emerald-700"
                      : isCancelled
                        ? "border-border/40"
                        : "border-border"
                  }`}
                >
                  <div
                    className={`px-4 py-3 flex items-center justify-between gap-3 flex-wrap ${
                      isFullyPaid
                        ? "bg-emerald-50 dark:bg-emerald-950/30"
                        : isCancelled
                          ? "bg-muted/20"
                          : "bg-background"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p
                          className={`text-sm font-black ${
                            isCancelled
                              ? "text-muted-foreground line-through"
                              : "text-foreground"
                          }`}
                        >
                          {monday.getDate()}{" "}
                          {(MONTHS[monday.getMonth()] ?? "").slice(0, 3)} –{" "}
                          {weekSun.getDate()}{" "}
                          {(MONTHS[weekSun.getMonth()] ?? "").slice(0, 3)},{" "}
                          {weekSun.getFullYear()}
                        </p>
                        {isFullyPaid && (
                          <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            Paid
                          </span>
                        )}
                        {isCancelled && (
                          <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            <Ban className="w-2.5 h-2.5" />
                            Cancelled
                          </span>
                        )}
                        {!isFullyPaid && !isCancelled && paidCount > 0 && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            {paidCount} paid · {unpaid} due
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {meals.length} meal{meals.length !== 1 ? "s" : ""} · KES{" "}
                        {meals
                          .reduce((s, m) => s + m.price * (m.quantity ?? 1), 0)
                          .toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap">
                      {!isCancelled && (
                        <button
                          onClick={() => {
                            onEdit(wk);
                            onClose();
                          }}
                          className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-foreground"
                        >
                          <Pencil className="w-3 h-3" />
                          Edit
                        </button>
                      )}
                      {!isFullyPaid && !isCancelled && (
                        <button
                          onClick={() => {
                            setConfirmCancel(isCancelling ? null : wk);
                            setConfirmDelete(null);
                          }}
                          className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors text-amber-700 dark:text-amber-400"
                        >
                          <Ban className="w-3 h-3" />
                          Cancel
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setConfirmDelete(isDeleting ? null : wk);
                          setConfirmCancel(null);
                        }}
                        className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30 transition-colors text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-border/50 divide-y divide-border/30">
                    {meals.slice(0, 3).map((meal) => (
                      <div
                        key={meal.id}
                        className="flex items-center gap-2.5 px-4 py-2"
                      >
                        <span className="text-sm flex-shrink-0">
                          {meal.emoji}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold text-foreground truncate">
                            {meal.name}
                          </p>
                          <p className="text-[9px] text-muted-foreground">
                            {MEAL_META[meal.mealTime].icon}{" "}
                            {MEAL_META[meal.mealTime].label} ·{" "}
                            {meal.time.includes("T")
                              ? utcToLocalDisplayTime(meal.time, tz)
                              : meal.time}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[11px] font-black text-primary">
                            KES {meal.price * (meal.quantity ?? 1)}
                          </span>
                          {meal.paid === true && (
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          )}
                        </div>
                      </div>
                    ))}
                    {meals.length > 3 && (
                      <div className="px-4 py-2">
                        <p className="text-[10px] text-muted-foreground">
                          +{meals.length - 3} more meal
                          {meals.length - 3 !== 1 ? "s" : ""}
                        </p>
                      </div>
                    )}
                  </div>

                  <AnimatePresence>
                    {isCancelling && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 overflow-hidden"
                      >
                        <div className="px-4 py-3 flex items-start gap-3">
                          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs font-bold text-foreground">
                              Cancel this week&apos;s schedule?
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Unpaid meals will be removed. Paid meals remain
                              confirmed.
                            </p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => setConfirmCancel(null)}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
                            >
                              No
                            </button>
                            <button
                              onClick={() => doCancel(wk)}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors flex items-center gap-1.5"
                            >
                              {isBusy && (
                                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              )}
                              Yes, cancel
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {isDeleting && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 overflow-hidden"
                      >
                        <div className="px-4 py-3 flex items-start gap-3">
                          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs font-bold text-foreground">
                              Permanently delete this schedule?
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              This cannot be undone. All meal data will be
                              removed.
                            </p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
                            >
                              No
                            </button>
                            <button
                              onClick={() => doDelete(wk)}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-1.5"
                            >
                              {isBusy && (
                                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              )}
                              Yes, delete
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// WalletPanel
// ─────────────────────────────────────────────────────
function WalletPanel({
  savedSchedules,
}: {
  savedSchedules: Record<WeekKey, SavedSchedule>;
}) {
  const allMeals = useMemo(
    () => allMealsInSchedules(savedSchedules),
    [savedSchedules],
  );
  const paidMeals = useMemo(
    () => allMeals.filter((m) => m.paid === true),
    [allMeals],
  );
  const dueMeals = useMemo(
    () => allMeals.filter((m) => m.paid !== true),
    [allMeals],
  );

  const totalScheduled = useMemo(
    () => allMeals.reduce((s, m) => s + m.price * (m.quantity ?? 1), 0),
    [allMeals],
  );
  const totalPaid = useMemo(
    () => paidMeals.reduce((s, m) => s + m.price * (m.quantity ?? 1), 0),
    [paidMeals],
  );
  const totalDue = useMemo(
    () => dueMeals.reduce((s, m) => s + m.price * (m.quantity ?? 1), 0),
    [dueMeals],
  );
  const pct =
    totalScheduled > 0 ? Math.round((totalPaid / totalScheduled) * 100) : 0;
  const tz = getUserTimezone();

  const rows = useMemo(() => {
    type Row = {
      date: string;
      desc: string;
      kitchen: string;
      amount: number;
      scheduledAt: string;
      mealTime: MealTime;
    };
    const result: Row[] = [];
    const sorted = Object.values(savedSchedules)
      .filter((w) => !!w?.weekKey)
      .sort((a, b) => b.weekKey.localeCompare(a.weekKey));
    outer: for (const week of sorted) {
      const monday = mondayFromWeekKey(week.weekKey);
      const dm = normalizeDays(week.days);
      for (const [di, dm2] of Object.entries(dm)) {
        if (!dm2) continue;
        for (const meal of Object.values(dm2)) {
          if (!meal || meal.paid !== true) continue;
          const date = localDate(
            monday.getFullYear(),
            monday.getMonth(),
            monday.getDate() + Number(di),
          );
          result.push({
            date: date.toLocaleDateString("en-KE", {
              day: "numeric",
              month: "short",
            }),
            desc: `${meal.mealTime.charAt(0) + meal.mealTime.slice(1).toLowerCase()} · ${meal.name}`,
            kitchen: meal.kitchenName,
            amount: meal.price * (meal.quantity ?? 1),
            scheduledAt: meal.time.includes("T")
              ? utcToLocalDisplayTime(meal.time, tz)
              : meal.time,
            mealTime: meal.mealTime,
          });
          if (result.length >= 10) break outer;
        }
      }
    }
    return result;
  }, [savedSchedules, tz]);

  return (
    <div className="bg-background rounded-2xl border border-border shadow-lg overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Wallet className="w-4 h-4 text-primary" />
        </div>
        <h3 className="text-sm font-black text-foreground uppercase tracking-wide">
          Wallet &amp; Activity
        </h3>
      </div>

      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        {[
          {
            label: "Scheduled",
            val: totalScheduled,
            count: `${allMeals.length} meal${allMeals.length !== 1 ? "s" : ""}`,
            color: "text-foreground",
          },
          {
            label: "Paid",
            val: totalPaid,
            count: `${paidMeals.length} settled`,
            color: "text-emerald-600 dark:text-emerald-400",
          },
          {
            label: "Due",
            val: totalDue,
            count: `${dueMeals.length} pending`,
            color: totalDue > 0 ? "text-primary" : "text-muted-foreground",
          },
        ].map(({ label, val, count, color }) => (
          <div key={label} className="px-3 sm:px-4 py-3">
            <p className="text-[9px] text-muted-foreground uppercase tracking-wide">
              {label}
            </p>
            <p className={`text-sm sm:text-base font-black ${color}`}>
              {val > 0 ? `KES ${val.toLocaleString()}` : "—"}
            </p>
            <p className="text-[9px] text-muted-foreground">{count}</p>
          </div>
        ))}
      </div>

      <div className="px-5 py-3 border-b border-border">
        <div className="flex justify-between mb-1.5">
          <p className="text-xs text-muted-foreground">Payment progress</p>
          <p
            className={`text-xs font-black ${
              pct === 100
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-primary"
            }`}
          >
            {pct}%
          </p>
        </div>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${pct === 100 ? "bg-emerald-500" : "bg-primary"}`}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
        </div>
      </div>

      <div className="px-5 py-3">
        <p className="text-[10px] font-black text-foreground tracking-widest uppercase mb-2">
          Recently Paid
        </p>
        {rows.length === 0 ? (
          <div className="rounded-xl border border-border bg-muted/20 px-4 py-6 text-center">
            <p className="text-xs text-muted-foreground">No paid meals yet.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden overflow-x-auto">
            <table className="w-full text-xs min-w-[280px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-3 py-2 text-[10px] font-bold text-muted-foreground whitespace-nowrap">
                    Date
                  </th>
                  <th className="text-left px-3 py-2 text-[10px] font-bold text-muted-foreground">
                    Meal
                  </th>
                  <th className="text-right px-3 py-2 text-[10px] font-bold text-muted-foreground whitespace-nowrap">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {rows.map((t, i) => (
                  <tr key={i} className="hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                      <p>{t.date}</p>
                      <p className="text-[9px]">{t.scheduledAt}</p>
                    </td>
                    <td className="px-3 py-2">
                      <p className="font-semibold truncate max-w-[100px] sm:max-w-[120px]">
                        {t.desc}
                      </p>
                      <p className="text-[9px] text-muted-foreground truncate max-w-[100px] sm:max-w-[120px]">
                        {t.kitchen}
                      </p>
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                        KES {t.amount.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              {totalPaid > 0 && (
                <tfoot>
                  <tr className="bg-muted/20 border-t border-border">
                    <td
                      colSpan={2}
                      className="px-3 py-2 text-xs font-black text-foreground"
                    >
                      Total Paid
                    </td>
                    <td className="px-3 py-2 text-right text-xs font-black text-emerald-600 dark:text-emerald-400">
                      KES {totalPaid.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* <div className="px-5 pb-5 pt-2">
        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-black">
          <BadgeDollarSign className="w-4 h-4 mr-2" />
          Deposit Funds
        </Button>
      </div> */}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// EAT helper & schedule item actions hook
// ─────────────────────────────────────────────────────
function todayEAT(): string {
  return new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().split("T")[0]!;
}

function useScheduleItemActions(
  onOptimisticUpdate: (itemId: string, status: string) => void,
) {
  const [actioning, setActioning] = useState<string | null>(null);
  const [reportingId, setReportingId] = useState<string | null>(null);

  const confirmDelivered = async (itemId: string) => {
    setActioning(itemId);
    try {
      const res = await fetch(`/api/schedules/items/${itemId}/delivered`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      const json: { success: boolean; message?: string } = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.message ?? "Failed to confirm");
      onOptimisticUpdate(itemId, "DELIVERED");
      toast.success("Confirmed! Chef will be paid at 8 PM EAT.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setActioning(null);
    }
  };

  const confirmMissed = async (itemId: string) => {
    setActioning(itemId);
    try {
      const res = await fetch(`/api/schedules/items/${itemId}/missed`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      const json: { success: boolean; message?: string } = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.message ?? "Failed to report");
      onOptimisticUpdate(itemId, "MISSED");
      setReportingId(null);
      toast.success("Reported. Chef will not be paid for this meal.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setActioning(null);
    }
  };

  return {
    actioning,
    reportingId,
    setReportingId,
    confirmDelivered,
    confirmMissed,
  };
}

// ─────────────────────────────────────────────────────
// MyTableViewer
// ─────────────────────────────────────────────────────
function MyTableViewer({
  savedSchedules,
  onRemoveItem,
  onGoSchedule,
  onPay,
  onManage,
}: {
  savedSchedules: Record<WeekKey, SavedSchedule>;
  onRemoveItem: (weekKey: string, itemId: string) => Promise<void>;
  onGoSchedule: (weekStart: Date) => void;
  onPay: () => void;
  onManage: () => void;
}) {
  const TODAY = getToday();

  const thisWeekStart = useMemo(() => weekStartOf(TODAY), [TODAY]);
  const earliestWeekStart = useMemo(
    () => earliestSavedWeekStart(savedSchedules, thisWeekStart),
    [savedSchedules, thisWeekStart],
  );

  const [baseWeekStart, setBaseWeekStart] = useState<Date>(thisWeekStart);
  const weekDates = useMemo(() => buildWeek(baseWeekStart), [baseWeekStart]);
  const isCurrentWeek = sameDay(baseWeekStart, thisWeekStart);
  const isPastWeek = isBefore(baseWeekStart, thisWeekStart);

  // Optimistic item status overrides
  const [itemStatusOverrides, setItemStatusOverrides] = useState<
    Record<string, string>
  >({});
  const handleOptimisticUpdate = useCallback(
    (itemId: string, status: string) => {
      setItemStatusOverrides((prev) => ({ ...prev, [itemId]: status }));
    },
    [],
  );

  const {
    actioning,
    reportingId,
    setReportingId,
    confirmDelivered,
    confirmMissed,
  } = useScheduleItemActions(handleOptimisticUpdate);

  // Stable EAT today
  const eatToday = useMemo(() => todayEAT(), []);

  // ── Derived schedule data ──────────────────────────────────────────────────
  const due = useMemo(
    () =>
      unpaidMeals(savedSchedules).reduce(
        (s, m) => s + m.price * (m.quantity ?? 1),
        0,
      ),
    [savedSchedules],
  );
  const dueMealCount = useMemo(
    () => unpaidMeals(savedSchedules).length,
    [savedSchedules],
  );
  const totalMealCount = useMemo(
    () => allMealsInSchedules(savedSchedules).length,
    [savedSchedules],
  );
  const allSettled = useMemo(
    () => totalMealCount > 0 && dueMealCount === 0,
    [totalMealCount, dueMealCount],
  );
  const dayMealMap = useMemo(
    () => buildDayMealMap(savedSchedules),
    [savedSchedules],
  );

  const todaySelIdx = useMemo(() => {
    const d = TODAY.getDay();
    return d === 0 ? 6 : d - 1;
  }, [TODAY]);
  const prevBaseWeekStartRef = useRef(toYMD(thisWeekStart));
  const [selIdx, setSelIdx] = useState(todaySelIdx);

  const goToWeek = useCallback(
    (d: Date) => {
      const newWk = toYMD(d);
      setBaseWeekStart(d);
      if (newWk !== prevBaseWeekStartRef.current) {
        prevBaseWeekStartRef.current = newWk;
        setSelIdx(sameDay(d, thisWeekStart) ? todaySelIdx : 0);
      }
    },
    [thisWeekStart, todaySelIdx],
  );

  const wk = useMemo(() => {
    const sunKey = wkOf(baseWeekStart); // "2026-05-31"
    if (savedSchedules[sunKey]) return sunKey;
    // Fall back to Monday key for schedules created by current client code
    return toYMD(
      localDate(
        baseWeekStart.getFullYear(),
        baseWeekStart.getMonth(),
        baseWeekStart.getDate() + 1,
      ),
    );
  }, [baseWeekStart, savedSchedules]);
  const currentSaved = savedSchedules[wk];
  const currentDayMap = useMemo(
    () => (currentSaved ? normalizeDays(currentSaved.days) : {}),
    [currentSaved],
  );

  // FIX: dayMeals — always an object; fall back to empty record so the
  // MEAL_TIMES.map loop below produces nulls rather than showing empty state.
  const dayMeals: Record<MealTime, ScheduledMeal | undefined> = useMemo(
    () =>
      currentDayMap[String(selIdx)] ??
      ({} as Record<MealTime, ScheduledMeal | undefined>),
    [currentDayMap, selIdx],
  );

  // FIX: hasMealsForDay — checks if ANY meal time has a value for the selected day
  const hasMealsForDay = useMemo(
    () => MEAL_TIMES.some((mt) => !!dayMeals[mt]),
    [dayMeals],
  );

  const allThisWeek = useMemo(
    () => mealsInDayMap(currentDayMap),
    [currentDayMap],
  );
  const thisWeekDue = useMemo(
    () =>
      allThisWeek
        .filter((m) => m.paid !== true)
        .reduce((s, m) => s + m.price * (m.quantity ?? 1), 0),
    [allThisWeek],
  );

  const canGoPrev =
    !sameDay(baseWeekStart, earliestWeekStart) &&
    isBefore(earliestWeekStart, baseWeekStart);
  const prevWeek = useCallback(() => {
    const c = localDate(
      baseWeekStart.getFullYear(),
      baseWeekStart.getMonth(),
      baseWeekStart.getDate() - 7,
    );
    if (isBefore(c, earliestWeekStart) && !sameDay(c, earliestWeekStart))
      return;
    goToWeek(c);
  }, [baseWeekStart, earliestWeekStart, goToWeek]);
  const nextWeek = useCallback(
    () =>
      goToWeek(
        localDate(
          baseWeekStart.getFullYear(),
          baseWeekStart.getMonth(),
          baseWeekStart.getDate() + 7,
        ),
      ),
    [baseWeekStart, goToWeek],
  );
  const jumpToEarliest = useCallback(
    () => goToWeek(earliestWeekStart),
    [earliestWeekStart, goToWeek],
  );
  const jumpToToday = useCallback(
    () => goToWeek(thisWeekStart),
    [thisWeekStart, goToWeek],
  );

  const deleteMeal = useCallback(
    async (dayIdx: number, mt: MealTime) => {
      if (isPastWeek) return;
      const meal = normalizeDays(savedSchedules[wk]?.days ?? {})[
        String(dayIdx)
      ]?.[mt];
      if (!meal || meal.paid === true) return;
      await onRemoveItem(wk, meal.id);
    },
    [isPastWeek, savedSchedules, wk, onRemoveItem],
  );

  const weekLabel = useMemo(() => {
    const s = weekDates[0] ?? baseWeekStart;
    const e = weekDates[6] ?? baseWeekStart;
    return `${s.getDate()} ${(MONTHS[s.getMonth()] ?? "").slice(0, 3)} – ${e.getDate()} ${(MONTHS[e.getMonth()] ?? "").slice(0, 3)}, ${e.getFullYear()}`;
  }, [weekDates, baseWeekStart]);

  const tz = getUserTimezone();
  const toDisplayTime = useCallback(
    (meal: ScheduledMeal) =>
      meal.time.includes("T")
        ? utcToLocalDisplayTime(meal.time, tz)
        : meal.time,
    [tz],
  );

  // Selected day in EAT — gates action buttons
  const selectedDayEAT = useMemo(() => {
    const d = weekDates[selIdx] ?? baseWeekStart;
    return new Date(d.getTime() + 3 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]!;
  }, [weekDates, selIdx, baseWeekStart]);
  const canActOnDay = selectedDayEAT === eatToday;

  // Whether any paid-but-unconfirmed items exist today
  const hasPendingConfirmations = useMemo(
    () =>
      canActOnDay &&
      allThisWeek.some(
        (m) =>
          m.paid === true &&
          !["DELIVERED", "MISSED", "CANCELLED"].includes(
            itemStatusOverrides[m.id] ?? m.itemStatus ?? "PENDING",
          ),
      ),
    [canActOnDay, allThisWeek, itemStatusOverrides],
  );

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-5">
      {/* ── Outstanding balance banner ── */}
      {dueMealCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-background rounded-2xl border-2 border-primary/50 shadow-lg p-4 sm:p-5"
        >
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Outstanding Balance
              </p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-black text-foreground truncate">
                KES {due.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {dueMealCount} unpaid meal{dueMealCount !== 1 ? "s" : ""} · food
                cost only
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              <Button
                onClick={onManage}
                variant="outline"
                size="sm"
                className="rounded-xl font-bold text-xs sm:text-sm"
              >
                Manage
              </Button>
              <Button
                onClick={onPay}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-xl text-xs sm:text-sm shadow-md"
              >
                Pay Now · KES {due.toLocaleString()}
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── All settled banner ── */}
      {allSettled && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border-2 border-chart-3/40 bg-chart-3 overflow-hidden shadow-lg"
        >
          <div className="px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-base lg:text-lg font-black text-white">
                All Meals Paid ✓
              </p>
              <p className="text-[11px] sm:text-xs text-white/80 mt-0.5 leading-relaxed">
                You&apos;re all caught up — schedule new meals anytime
              </p>
            </div>
            <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 text-white/40 flex-shrink-0 hidden sm:block" />
          </div>
        </motion.div>
      )}

      {/* ── Empty state ── */}
      {totalMealCount === 0 && (
        <div className="bg-background/80 rounded-2xl border border-border px-4 sm:px-5 py-10 sm:py-14 text-center">
          <p className="text-4xl sm:text-5xl mb-3">🍽️</p>
          <p className="text-sm font-black text-foreground">
            No meals scheduled yet
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Go to Schedule Meals to plan your week
          </p>
        </div>
      )}

      {totalMealCount > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4 sm:gap-5">
          {/* ── Main schedule card ── */}
          <div className="bg-background rounded-2xl border border-border shadow-lg overflow-hidden">
            {/* Card header */}
            <div className="px-3 sm:px-4 lg:px-5 pt-4 pb-3 sm:pb-4 border-b border-border space-y-3">
              {/* Title + week nav */}
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg lg:text-xl font-black text-foreground uppercase">
                      My Table
                    </h2>
                    {isPastWeek && (
                      <span className="text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                        <History className="w-2.5 h-2.5" />
                        History
                      </span>
                    )}
                    {isCurrentWeek && (
                      <span className="text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-full bg-chart-3/10 text-chart-3">
                        This Week
                      </span>
                    )}
                    {!isPastWeek && !isCurrentWeek && (
                      <span className="text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        Upcoming
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                    Weekly Meal Schedule
                  </p>
                </div>

                {/* Week navigation controls */}
                <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap flex-shrink-0">
                  {!isCurrentWeek && (
                    <button
                      onClick={jumpToToday}
                      className="text-[9px] sm:text-[10px] font-bold text-primary border border-primary/30 rounded-lg px-1.5 sm:px-2 py-1 hover:bg-primary/5 transition-colors whitespace-nowrap"
                    >
                      Today
                    </button>
                  )}
                  {!sameDay(baseWeekStart, earliestWeekStart) && (
                    <button
                      onClick={jumpToEarliest}
                      className="text-[9px] sm:text-[10px] font-bold text-muted-foreground border border-border rounded-lg px-1.5 sm:px-2 py-1 hover:bg-muted transition-colors flex items-center gap-1"
                    >
                      <History className="w-2.5 h-2.5" />
                      <span className="hidden sm:inline">Oldest</span>
                    </button>
                  )}
                  <button
                    onClick={prevWeek}
                    disabled={!canGoPrev}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-border bg-muted hover:bg-background flex items-center justify-center disabled:opacity-30 transition-colors"
                    aria-label="Previous week"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  <div className="flex items-center gap-1 sm:gap-1.5 bg-muted rounded-xl px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-black shadow-sm">
                    <CalendarDays className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                    <span className="hidden md:inline">{weekLabel}</span>
                    <span className="md:hidden">{weekLabel.slice(0, 10)}…</span>
                  </div>
                  <button
                    onClick={nextWeek}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-border bg-muted hover:bg-background flex items-center justify-center transition-colors"
                    aria-label="Next week"
                  >
                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>

              {/* Day picker */}
              <div className="flex gap-1 sm:gap-1.5 lg:gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
                {weekDates.map((date, i) => {
                  const isToday = sameDay(date, TODAY);
                  const isSel = i === selIdx;
                  const isPastD = isBefore(date, TODAY);
                  const hasMeals = !!dayMealMap[toYMD(date)];
                  const dayArr = Object.values(
                    currentDayMap[String(i)] ?? {},
                  ).filter((m): m is ScheduledMeal => m != null);
                  const allPaid =
                    dayArr.length > 0 && dayArr.every((m) => m.paid === true);
                  return (
                    <button
                      key={i}
                      onClick={() => setSelIdx(i)}
                      className={`relative flex flex-col items-center px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 rounded-xl min-w-[40px] sm:min-w-[50px] lg:min-w-[58px] border transition-all flex-shrink-0 ${
                        isSel
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : isPastD
                            ? "opacity-60 bg-background border-border hover:opacity-80"
                            : "bg-background border-border hover:bg-muted"
                      }`}
                    >
                      <span
                        className={`text-[8px] sm:text-[9px] lg:text-[10px] font-black tracking-widest ${isSel ? "text-primary-foreground" : "text-muted-foreground"}`}
                      >
                        {DAY_SHORT[i] ?? ""}
                      </span>
                      <span
                        className={`text-base sm:text-lg lg:text-xl font-black ${isToday && !isSel ? "text-primary" : ""}`}
                      >
                        {date.getDate()}
                      </span>
                      {hasMeals && (
                        <span
                          className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${allPaid ? "bg-chart-3" : "bg-primary"}`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Escrow notice — only on today with unconfirmed paid items */}
              {hasPendingConfirmations && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="flex items-start gap-2 rounded-xl bg-chart-3/5 border border-chart-3/20 px-3 py-2.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-chart-3 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-relaxed">
                    Payment is held in escrow. Confirm each meal once received —
                    chef is paid at{" "}
                    <span className="font-bold text-foreground">8 PM EAT</span>.
                  </p>
                </motion.div>
              )}
            </div>

            {/* ── Meal list for selected day ── */}
            <div className="p-3 sm:p-4 lg:p-5 min-h-[260px] sm:min-h-[300px]">
              {!hasMealsForDay ? (
                <div className="text-center py-10 sm:py-14 lg:py-16 space-y-3">
                  <p className="text-4xl sm:text-5xl">📅</p>
                  <p className="text-sm font-semibold text-foreground">
                    {isPastWeek
                      ? "No meals were scheduled for this day"
                      : "No meals scheduled for this day"}
                  </p>
                  {!isPastWeek && (
                    <button
                      onClick={() => onGoSchedule(baseWeekStart)}
                      className="inline-flex items-center gap-1.5 text-xs text-primary font-bold border border-primary/30 rounded-full px-4 py-1.5 hover:bg-primary/5 transition-colors mt-2"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Schedule meals for this week
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5 sm:space-y-2">
                  {MEAL_TIMES.map((mt) => {
                    const meal = dayMeals[mt];
                    if (!meal) return null;

                    const c = MEAL_META[mt];
                    const ip = meal.paid === true;
                    const displayTime = toDisplayTime(meal);
                    const qty = meal.quantity ?? 1;
                    // FIX: safe fallback for itemStatus which may be absent on older records
                    const effectiveStatus =
                      itemStatusOverrides[meal.id] ??
                      meal.itemStatus ??
                      "PENDING";
                    const isDelivered = effectiveStatus === "DELIVERED";
                    const isMissed = effectiveStatus === "MISSED";
                    const showActions =
                      ip && canActOnDay && !isDelivered && !isMissed;
                    const isActioning_ = actioning === meal.id;
                    const isReporting = reportingId === meal.id;

                    return (
                      <motion.div key={mt} layout className="space-y-0">
                        {/* ── Meal row ── */}
                        <div
                          className={`group flex items-start gap-2 sm:gap-3 lg:gap-4 p-2.5 sm:p-3 lg:p-4 rounded-xl border transition-colors ${
                            isDelivered
                              ? "border-chart-3/20 bg-chart-3/5"
                              : isMissed
                                ? "border-destructive/20 bg-destructive/5"
                                : ip
                                  ? "border-border bg-muted/20"
                                  : "border-transparent"
                          }`}
                        >
                          {/* Status icon / emoji */}
                          <div
                            className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl flex items-center justify-center text-xl sm:text-2xl lg:text-3xl flex-shrink-0 border ${
                              isDelivered
                                ? "border-chart-3/20 bg-chart-3/10"
                                : isMissed
                                  ? "border-destructive/20 bg-destructive/10"
                                  : "border-border bg-muted"
                            }`}
                          >
                            {isDelivered ? (
                              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-chart-3" />
                            ) : isMissed ? (
                              <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-destructive" />
                            ) : (
                              meal.emoji
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {/* Name + price row */}
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm sm:text-base font-black text-foreground leading-tight truncate pr-1">
                                {meal.name}
                              </p>
                              <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                                <span
                                  className={`text-sm font-black whitespace-nowrap ${
                                    isDelivered
                                      ? "text-chart-3"
                                      : isMissed
                                        ? "text-destructive"
                                        : ip
                                          ? "text-chart-3"
                                          : "text-primary"
                                  }`}
                                >
                                  KES {(meal.price * qty).toLocaleString()}
                                  {qty > 1 && (
                                    <span className="text-xs font-normal text-muted-foreground ml-0.5">
                                      ×{qty}
                                    </span>
                                  )}
                                </span>
                                {ip && !isDelivered && !isMissed && (
                                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-chart-3 flex-shrink-0" />
                                )}
                              </div>
                            </div>

                            {/* Kitchen */}
                            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate">
                              {meal.kitchenName}
                            </p>

                            {/* Time + Prep */}
                            <div className="flex items-center gap-2 sm:gap-3 mt-1.5 flex-wrap">
                              <div>
                                <p className="text-[9px] sm:text-[10px] uppercase tracking-wide text-muted-foreground">
                                  Time
                                </p>
                                <p className="text-xs font-bold text-foreground">
                                  {displayTime}
                                </p>
                              </div>
                              <div className="h-4 w-px bg-border" />
                              <div>
                                <p className="text-[9px] sm:text-[10px] uppercase tracking-wide text-muted-foreground">
                                  Prep
                                </p>
                                <p className="text-xs font-bold text-foreground">
                                  {meal.prepTimeMin}m
                                </p>
                              </div>
                            </div>

                            {/* Status pills */}
                            <div className="flex items-center gap-1.5 sm:gap-2 mt-2 flex-wrap">
                              <span
                                className={`inline-flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full ${c.pill}`}
                              >
                                {c.icon} {c.label}
                              </span>
                              {isDelivered && (
                                <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-full bg-chart-3/10 text-chart-3">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  Confirmed
                                </span>
                              )}
                              {isMissed && (
                                <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                                  <XCircle className="w-2.5 h-2.5" />
                                  Not Received
                                </span>
                              )}
                              {ip &&
                                !isDelivered &&
                                !isMissed &&
                                !canActOnDay && (
                                  <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-full bg-chart-3/10 text-chart-3">
                                    <ShieldCheck className="w-2.5 h-2.5" />
                                    Paid
                                  </span>
                                )}
                              {ip &&
                                !isDelivered &&
                                !isMissed &&
                                isPastWeek && (
                                  <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                    Completed
                                  </span>
                                )}
                            </div>

                            {/* Action buttons — Received / Not Received */}
                            {showActions && (
                              <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-1.5 sm:gap-2 mt-3">
                                <Button
                                  onClick={() => void confirmDelivered(meal.id)}
                                  disabled={isActioning_}
                                  size="sm"
                                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-black h-8 px-3 w-full xs:w-auto flex items-center justify-center gap-1.5"
                                >
                                  {isActioning_ && !isReporting ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <>
                                      <ShieldCheck className="w-3 h-3" />
                                      Received
                                    </>
                                  )}
                                </Button>
                                <Button
                                  onClick={() =>
                                    setReportingId(isReporting ? null : meal.id)
                                  }
                                  disabled={isActioning_}
                                  variant="outline"
                                  size="sm"
                                  className="rounded-xl text-xs font-bold h-8 px-3 w-full xs:w-auto border-destructive/30 text-destructive hover:bg-destructive/5 flex items-center justify-center gap-1.5"
                                >
                                  <XCircle className="w-3 h-3" />
                                  Not Received
                                </Button>
                              </div>
                            )}
                          </div>

                          {/* Remove button — unpaid only */}
                          {!isPastWeek && !ip && (
                            <button
                              onClick={() => deleteMeal(selIdx, mt)}
                              className="text-muted-foreground hover:text-destructive p-1.5 transition-colors flex-shrink-0 self-start mt-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                              aria-label="Remove meal"
                            >
                              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                          )}
                        </div>

                        {/* ── Not Received confirmation panel ── */}
                        <AnimatePresence>
                          {isReporting && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.18 }}
                              className="overflow-hidden"
                            >
                              <div className="mx-1 sm:mx-2 mb-1.5 rounded-b-xl border border-t-0 border-destructive/20 bg-destructive/5 p-3 sm:p-4">
                                <div className="flex items-start gap-2.5 sm:gap-3">
                                  <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-destructive flex-shrink-0 mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs sm:text-sm font-black text-foreground leading-snug">
                                      Report &ldquo;{meal.name}&rdquo; as not
                                      received?
                                    </p>
                                    <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1 leading-relaxed">
                                      The chef will{" "}
                                      <span className="font-bold text-foreground">
                                        not
                                      </span>{" "}
                                      be paid for this meal. An admin will
                                      review the dispute. This cannot be undone.
                                    </p>
                                    <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-1.5 sm:gap-2 mt-3">
                                      <Button
                                        onClick={() =>
                                          void confirmMissed(meal.id)
                                        }
                                        disabled={isActioning_}
                                        size="sm"
                                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl text-xs font-black h-8 px-3 w-full xs:w-auto flex items-center justify-center gap-1.5"
                                      >
                                        {isActioning_ ? (
                                          <>
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            Reporting…
                                          </>
                                        ) : (
                                          "Yes, report"
                                        )}
                                      </Button>
                                      <Button
                                        onClick={() => setReportingId(null)}
                                        disabled={isActioning_}
                                        variant="outline"
                                        size="sm"
                                        className="rounded-xl text-xs font-bold h-8 px-3 w-full xs:w-auto"
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Week summary footer ── */}
            {allThisWeek.length > 0 && (
              <div className="px-3 sm:px-4 lg:px-5 py-3 border-t border-border flex items-center justify-between gap-2 text-xs flex-wrap">
                <span className="text-muted-foreground">
                  {allThisWeek.length} meal{allThisWeek.length !== 1 ? "s" : ""}{" "}
                  this week
                </span>
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  {thisWeekDue > 0 && (
                    <span className="font-black text-primary">
                      KES {thisWeekDue.toLocaleString()} due
                    </span>
                  )}
                  {(() => {
                    const paidTotal = allThisWeek
                      .filter((m) => m.paid === true)
                      .reduce((s, m) => s + m.price * (m.quantity ?? 1), 0);
                    return paidTotal > 0 ? (
                      <span className="font-black text-chart-3">
                        KES {paidTotal.toLocaleString()} paid
                      </span>
                    ) : null;
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* ── Wallet panel ── */}
          <WalletPanel savedSchedules={savedSchedules} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// WeekScheduler
// ─────────────────────────────────────────────────────
function WeekScheduler({
  onSave,
  saving,
  baseWeekStart,
  setBaseWeekStart,
  isCurrentWeek,
  savedSchedules,
  onCheckout,
  onSeededRefClear,
  onRegisterGetDraft,
}: {
  onSave: (
    schedule: WeekSchedule,
    weekMondayYMD: string,
    onSaved?: () => void,
  ) => Promise<void>;
  saving: boolean;
  baseWeekStart: Date;
  setBaseWeekStart: (d: Date) => void;
  isCurrentWeek: boolean;
  savedSchedules: Record<WeekKey, SavedSchedule>;
  onCheckout: () => void;
  onSeededRefClear: (clearFn: () => void) => void;
  onRegisterGetDraft: (
    fn: () => {
      weekKey: string;
      weekMondayYMD: string;
      schedule: WeekSchedule;
    } | null,
  ) => void;
}) {
  const TODAY = getToday();
  const weekDates = useMemo(() => buildWeek(baseWeekStart), [baseWeekStart]);
  const wk = wkOf(baseWeekStart);

  const weekMondayYMD = useMemo(() => {
    const mon = localDate(
      baseWeekStart.getFullYear(),
      baseWeekStart.getMonth(),
      baseWeekStart.getDate() + 1,
    );
    return toYMD(mon);
  }, [baseWeekStart]);

  const [allWeekSchedules, setAllWeekSchedules] = useState<
    Record<WeekKey, DayMap>
  >({});
  const [allSlotTimes, setAllSlotTimes] = useState<
    Record<WeekKey, Record<string, Record<MealTime, string>>>
  >({});
  const [mobileDayIdx, setMobileDayIdx] = useState(() => {
    const d = TODAY.getDay();
    return d === 0 ? 6 : d - 1;
  });
  const { plannedMeals, removeFromPlan, clearPlan } = usePlan();
  const seeded = useRef<Set<string>>(new Set());

  useEffect(() => {
    onSeededRefClear(() => {
      seeded.current.clear();
      setAllWeekSchedules({});
      setAllSlotTimes({});
    });
  }, [onSeededRefClear]);

  const schedule = allWeekSchedules[wk] ?? {};
  const slotTimes = allSlotTimes[wk] ?? {};
  const getSlotTime = useCallback(
    (dayIdx: number, mt: MealTime) =>
      slotTimes[String(dayIdx)]?.[mt] ?? DEFAULT_TIMES[mt],
    [slotTimes],
  );

  // Register getDraft
  const getDraft = useCallback(() => {
    const cur = allWeekSchedules[wk] ?? {};
    const nm = mealsInDayMap(cur).filter((m) => m.paid !== true);
    if (!nm.length) return null;
    return { weekKey: wk, weekMondayYMD, schedule: cur as WeekSchedule };
  }, [allWeekSchedules, wk, weekMondayYMD]);

  useEffect(() => {
    onRegisterGetDraft(getDraft);
  }, [onRegisterGetDraft, getDraft]);

  // FIX: Seed from saved schedules — use normalizeDays which now preserves
  // paid/itemStatus fields. The seededKey uses scheduleId so we re-seed
  // whenever the server returns an updated schedule (e.g. after payment).
  useEffect(() => {
    const monKey = toYMD(
      localDate(
        baseWeekStart.getFullYear(),
        baseWeekStart.getMonth(),
        baseWeekStart.getDate() + 1,
      ),
    );
    const existing = savedSchedules[wk] ?? savedSchedules[monKey];
    if (!existing) return;

    // Re-seed whenever scheduleId or the set of days changes
    const dayKeys = Object.keys(existing.days ?? {})
      .sort()
      .join(",");
    const seededKey = `${wk}:${existing.scheduleId ?? ""}:${dayKeys}`;
    if (seeded.current.has(seededKey)) return;
    seeded.current.add(seededKey);

    const tz = getUserTimezone();
    const normalized = normalizeDays(existing.days);

    startTransition(() => {
      setAllWeekSchedules((prev) => ({ ...prev, [wk]: normalized }));
      setAllSlotTimes((prev) => {
        const times: Record<string, Record<MealTime, string>> = {};
        Object.entries(normalized).forEach(([di, dm]) => {
          times[di] = { ...DEFAULT_TIMES };
          if (dm) {
            Object.entries(dm).forEach(([mt, meal]) => {
              if (meal) {
                times[di]![mt as MealTime] = meal.time.includes("T")
                  ? utcToLocalDisplayTime(meal.time, tz)
                  : meal.time;
              }
            });
          }
        });
        return { ...prev, [wk]: times };
      });
    });
  }, [wk, savedSchedules]);

  const setSchedule = useCallback(
    (updater: (prev: DayMap) => DayMap) => {
      setAllWeekSchedules((prev) => ({
        ...prev,
        [wk]: updater(prev[wk] ?? {}),
      }));
    },
    [wk],
  );

  const assignMeal = useCallback(
    (dayIdx: number, mealTime: MealTime, id: string) => {
      const meal = plannedMeals.find((m) => m.id === id);
      if (!meal) return;
      const dk = String(dayIdx);
      setSchedule((prev) => ({
        ...prev,
        [dk]: {
          ...prev[dk],
          [mealTime]: {
            id: `s-${dayIdx}-${mealTime}-${Date.now()}`,
            plannedMealId: meal.menuItemId,
            name: meal.name,
            emoji: meal.emoji,
            kitchenName: meal.kitchenName,
            price: meal.price,
            quantity: 1,
            mealTime,
            time: slotTimes[dk]?.[mealTime] ?? DEFAULT_TIMES[mealTime],
            prepTimeMin: meal.prepTimeMin,
            paidAt: null,
            paid: false,
            itemStatus: "PENDING",
          } satisfies ScheduledMeal,
        },
      }));
    },
    [plannedMeals, setSchedule, slotTimes],
  );

  const removeMeal = useCallback(
    (dayIdx: number, mealTime: MealTime) => {
      const dk = String(dayIdx);
      const ex = schedule[dk]?.[mealTime];
      if (ex?.paid === true) {
        toast.error("Paid meals cannot be removed");
        return;
      }
      setSchedule((prev) => {
        const day = { ...prev[dk] };
        delete day[mealTime];
        return { ...prev, [dk]: day };
      });
    },
    [setSchedule, schedule],
  );

  const updateQuantity = useCallback(
    (dayIdx: number, mealTime: MealTime, qty: number) => {
      const dk = String(dayIdx);
      setSchedule((prev) => {
        const ex = prev[dk]?.[mealTime];
        if (!ex || ex.paid === true) return prev;
        return {
          ...prev,
          [dk]: { ...prev[dk], [mealTime]: { ...ex, quantity: qty } },
        };
      });
    },
    [setSchedule],
  );

  const updateTime = useCallback(
    (dayIdx: number, mt: MealTime, time: string) => {
      const dk = String(dayIdx);
      setAllSlotTimes((prev) => ({
        ...prev,
        [wk]: {
          ...(prev[wk] ?? {}),
          [dk]: { ...(prev[wk]?.[dk] ?? DEFAULT_TIMES), [mt]: time },
        },
      }));
      setSchedule((prev) => {
        const ex = prev[dk]?.[mt];
        if (!ex) return prev;
        return { ...prev, [dk]: { ...prev[dk], [mt]: { ...ex, time } } };
      });
    },
    [wk, setSchedule],
  );

  const prevWeek = useCallback(() => {
    if (isCurrentWeek) return;
    setBaseWeekStart(
      localDate(
        baseWeekStart.getFullYear(),
        baseWeekStart.getMonth(),
        baseWeekStart.getDate() - 7,
      ),
    );
  }, [isCurrentWeek, baseWeekStart, setBaseWeekStart]);

  const nextWeek = useCallback(() => {
    setBaseWeekStart(
      localDate(
        baseWeekStart.getFullYear(),
        baseWeekStart.getMonth(),
        baseWeekStart.getDate() + 7,
      ),
    );
  }, [baseWeekStart, setBaseWeekStart]);

  // const {
  //   newMealsThisWeek,
  //   newMealsTotal,
  //   otherUnpaidTotal,
  //   combinedTotal,
  //   combinedCount,
  // } = useMemo(() => {
  //   const nm = mealsInDayMap(schedule).filter((m) => m.paid !== true);
  //   const nt = nm.reduce((s, m) => s + m.price * (m.quantity ?? 1), 0);
  //   const ou = Object.entries(savedSchedules)
  //     .filter(([k]) => k !== wk)
  //     .flatMap(([, w]) =>
  //       w?.days
  //         ? mealsInDayMap(normalizeDays(w.days)).filter((m) => m.paid !== true)
  //         : [],
  //     );
  //   const ot = ou.reduce((s, m) => s + m.price * (m.quantity ?? 1), 0);
  //   return {
  //     newMealsThisWeek: nm,
  //     newMealsTotal: nt,
  //     otherUnpaidTotal: ot,
  //     combinedTotal: nt + ot,
  //     combinedCount: nm.length + ou.length,
  //   };
  // }, [savedSchedules, wk, schedule]);

  const {
    newMealsThisWeek,
    newMealsTotal,
    otherUnpaidTotal,
    combinedTotal,
    combinedCount,
  } = useMemo(() => {
    const nm = mealsInDayMap(schedule).filter((m) => m.paid !== true);
    const nt = nm.reduce((s, m) => s + m.price * (m.quantity ?? 1), 0);

    // Exclude BOTH the Sunday key and the Monday key for the current week
    const monKey = toYMD(
      localDate(
        baseWeekStart.getFullYear(),
        baseWeekStart.getMonth(),
        baseWeekStart.getDate() + 1,
      ),
    );

    const ou = Object.entries(savedSchedules)
      .filter(([k]) => k !== wk && k !== monKey)
      .flatMap(([, w]) =>
        w?.days
          ? mealsInDayMap(normalizeDays(w.days)).filter((m) => m.paid !== true)
          : [],
      );
    const ot = ou.reduce((s, m) => s + m.price * (m.quantity ?? 1), 0);
    return {
      newMealsThisWeek: nm,
      newMealsTotal: nt,
      otherUnpaidTotal: ot,
      combinedTotal: nt + ot,
      combinedCount: nm.length + ou.length,
    };
  }, [savedSchedules, wk, schedule, baseWeekStart]);

  const savedDayMealMap = useMemo(
    () => buildDayMealMap(savedSchedules),
    [savedSchedules],
  );

  const firstDay = weekDates[0] ?? baseWeekStart;
  const lastDay = weekDates[6] ?? baseWeekStart;
  const weekLabel = `Week of ${MONTHS[firstDay.getMonth()] ?? ""} ${firstDay.getDate()} – ${lastDay.getDate()}, ${lastDay.getFullYear()}`;

  return (
    <div className="space-y-4">
      {/* Week nav */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-background/80 backdrop-blur-sm rounded-2xl border border-border px-4 sm:px-5 py-3.5 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={prevWeek}
            disabled={isCurrentWeek}
            className="w-8 h-8 rounded-full border border-border bg-muted hover:bg-background flex items-center justify-center disabled:opacity-30 transition-colors"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs sm:text-sm font-black text-foreground">
            {weekLabel}
          </span>
          <button
            onClick={nextWeek}
            className="w-8 h-8 rounded-full border border-border bg-muted hover:bg-background flex items-center justify-center transition-colors"
            aria-label="Next week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          {newMealsThisWeek.length > 0 ? (
            <>
              <span className="font-black text-foreground">
                {newMealsThisWeek.length}
              </span>{" "}
              new meal{newMealsThisWeek.length !== 1 ? "s" : ""} ·{" "}
              <span className="font-black text-primary">
                KES {newMealsTotal.toLocaleString()}
              </span>{" "}
              new
            </>
          ) : (
            "No new meals added this week"
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr] xl:grid-cols-[200px_1fr] gap-4">
        {/* Plan sidebar */}
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
                      aria-label="Remove from plan"
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

        {/* Grid */}
        <div>
          {/* Mobile day picker + single-day view */}
          <div className="lg:hidden space-y-3">
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {weekDates.map((date, i) => {
                const isPast = isBefore(date, TODAY);
                const dk = String(i);
                const hasPaid = Object.values(schedule[dk] ?? {}).some(
                  (m) => m?.paid === true,
                );
                const isSel = i === mobileDayIdx;
                const isToday = sameDay(date, TODAY);
                // FIX: dot shows for both saved meals AND unsaved draft meals
                const hasSaved = !!savedDayMealMap[toYMD(date)];
                const hasDraft = Object.values(schedule[dk] ?? {}).some(
                  (m) => m != null,
                );
                let count = 0;
                for (const m of Object.values(schedule[dk] ?? {})) {
                  if (m && m.paid !== true) count++;
                }
                return (
                  <button
                    key={i}
                    onClick={() => (!isPast || hasPaid) && setMobileDayIdx(i)}
                    disabled={isPast && !hasPaid}
                    className={`relative flex flex-col items-center px-2.5 py-2.5 rounded-xl min-w-[46px] border flex-shrink-0 transition-all ${
                      isPast && !hasPaid
                        ? "opacity-25 cursor-not-allowed bg-background/20 border-border/20"
                        : isSel
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-background/80 border-border hover:bg-background"
                    }`}
                  >
                    <span
                      className={`text-[9px] font-black tracking-widest ${
                        isSel
                          ? "text-primary-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {DAY_SHORT[i] ?? ""}
                    </span>
                    <span
                      className={`text-lg font-black ${isToday && !isSel ? "text-primary" : ""}`}
                    >
                      {date.getDate()}
                    </span>
                    {/* FIX: dot appears for saved OR draft meals */}
                    {(count > 0 || hasSaved || hasDraft) && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="bg-background/95 backdrop-blur-sm rounded-2xl border border-border shadow-lg overflow-visible">
              <div className="px-4 py-3 border-b border-border bg-muted/30">
                <p className="text-xs font-black text-foreground uppercase tracking-wider">
                  {DAY_SHORT[mobileDayIdx] ?? ""} ·{" "}
                  {
                    MONTHS[
                      (weekDates[mobileDayIdx] ?? baseWeekStart).getMonth()
                    ]!
                  }{" "}
                  {(weekDates[mobileDayIdx] ?? baseWeekStart).getDate()}
                </p>
              </div>
              <div className="p-3 space-y-3">
                {MEAL_TIMES.map((mt) => {
                  const c = MEAL_META[mt];
                  const dk = String(mobileDayIdx);
                  const isPaidMeal = schedule[dk]?.[mt]?.paid === true;
                  const isPastDay = isBefore(
                    weekDates[mobileDayIdx] ?? baseWeekStart,
                    TODAY,
                  );
                  return (
                    <div key={mt}>
                      <p
                        className={`text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full border inline-block mb-1.5 ${c.bg} ${c.text} ${c.border}`}
                      >
                        {c.icon} {c.label}
                      </p>
                      <MealCell
                        mealTime={mt}
                        scheduled={schedule[dk]?.[mt]}
                        onAssign={(id) => assignMeal(mobileDayIdx, mt, id)}
                        onRemove={() => removeMeal(mobileDayIdx, mt)}
                        onQuantityChange={(qty) =>
                          updateQuantity(mobileDayIdx, mt, qty)
                        }
                        time={getSlotTime(mobileDayIdx, mt)}
                        onTimeChange={(v) => updateTime(mobileDayIdx, mt, v)}
                        readonly={isPaidMeal || isPastDay}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Desktop 7-col grid */}
          <div className="hidden lg:block bg-background/95 backdrop-blur-sm rounded-2xl border border-border shadow-lg overflow-visible">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-border bg-muted/30">
              {weekDates.map((date, i) => {
                const isPast = isBefore(date, TODAY);
                const isToday = sameDay(date, TODAY);
                const dk = String(i);
                const hasPaid = Object.values(schedule[dk] ?? {}).some(
                  (m) => m?.paid === true,
                );
                // FIX: count only unsaved draft new meals for the "+N" badge
                let nc = 0;
                for (const m of Object.values(schedule[dk] ?? {})) {
                  if (m && m.paid !== true) nc++;
                }
                // FIX: dot/check shows for saved days OR days with any meal in draft
                const hasSaved = !!savedDayMealMap[toYMD(date)];
                const hasDraft = Object.values(schedule[dk] ?? {}).some(
                  (m) => m != null,
                );
                return (
                  <div
                    key={i}
                    className={`px-1.5 xl:px-2 py-3 text-center border-r border-border/50 last:border-0 ${
                      isPast && !hasPaid ? "opacity-40" : ""
                    }`}
                  >
                    <p className="text-[9px] xl:text-[10px] font-black tracking-widest text-muted-foreground">
                      {DAY_SHORT[i] ?? ""}
                    </p>
                    <p
                      className={`text-base xl:text-lg font-black ${
                        isToday ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {date.getDate()}
                    </p>
                    {/* New unsaved meals badge */}
                    {nc > 0 && (
                      <span className="inline-block text-[9px] font-black text-primary bg-primary/10 rounded-full px-1.5 py-0.5">
                        +{nc}
                      </span>
                    )}
                    {/* Saved / paid check mark — shown when no unsaved drafts */}
                    {nc === 0 && (hasSaved || hasDraft) && (
                      <span className="inline-block text-[9px] font-black text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full px-1.5 py-0.5">
                        ✓
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
                  const isPast = isBefore(date, TODAY);
                  const dk = String(dayIdx);
                  const isPaidMeal = schedule[dk]?.[mt]?.paid === true;
                  const shouldDim = isPast && !isPaidMeal;
                  return (
                    <div
                      key={dayIdx}
                      className={`p-1.5 xl:p-2 border-r border-border/30 last:border-0 ${
                        shouldDim
                          ? "opacity-25 pointer-events-none bg-muted/10"
                          : ""
                      }`}
                      style={{ minHeight: 100 }}
                    >
                      <MealCell
                        mealTime={mt}
                        scheduled={schedule[dk]?.[mt]}
                        onAssign={(id) => assignMeal(dayIdx, mt, id)}
                        onRemove={() => removeMeal(dayIdx, mt)}
                        onQuantityChange={(qty) =>
                          updateQuantity(dayIdx, mt, qty)
                        }
                        time={getSlotTime(dayIdx, mt)}
                        onTimeChange={(v) => updateTime(dayIdx, mt, v)}
                        readonly={isPaidMeal || isPast}
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
                let count = 0;
                for (const d of Object.values(schedule)) {
                  const meal = d ? d[mt] : undefined;
                  if (meal && meal.paid !== true) count++;
                }
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
                        {count} new
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Combined total bar */}
      {combinedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-background/90 backdrop-blur-sm rounded-2xl border-2 border-primary/30 shadow-lg px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
        >
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
              Total Unpaid
            </p>
            <p className="text-xl sm:text-2xl font-black text-foreground">
              KES {combinedTotal.toLocaleString()}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {newMealsThisWeek.length > 0 &&
                `${newMealsThisWeek.length} new this week`}
              {newMealsThisWeek.length > 0 && otherUnpaidTotal > 0 && " + "}
              {otherUnpaidTotal > 0 &&
                `KES ${otherUnpaidTotal.toLocaleString()} from other weeks`}
            </p>
          </div>
          <Button
            onClick={onCheckout}
            disabled={saving}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-xl px-5 sm:px-6 py-2.5 text-sm shadow-md self-start sm:self-auto"
          >
            {saving ? "Saving…" : `Pay · KES ${combinedTotal.toLocaleString()}`}
          </Button>
        </motion.div>
      )}

      {/* Mobile sticky bottom bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-md border-t border-border shadow-2xl px-4 py-3">
        <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              Unpaid Total
            </p>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-black text-foreground">
                {combinedCount} meal{combinedCount !== 1 ? "s" : ""}
              </span>
              <span>·</span>
              <span className="font-black text-primary">
                KES {combinedTotal.toLocaleString()}
              </span>
            </div>
          </div>
          <Button
            onClick={() => {
              if (combinedCount > 0) onCheckout();
            }}
            disabled={combinedCount === 0 || saving}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-xl px-5 py-2.5 text-xs shadow-lg disabled:opacity-40 flex-shrink-0"
          >
            Pay · KES {combinedTotal.toLocaleString()}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────
export default function MyTablePage() {
  const TODAY = getToday();

  const thisWeekStart = weekStartOf(TODAY);

  const { loading: planLoading } = usePlan();
  const {
    savedSchedules,
    loading: schedulesLoading,
    saving,
    upsertSchedule,
    removeItem,
    cancelWeek,
    deleteSchedule,
    checkout,
    loadSchedules,
    customerPhone,
    cancelPayment,
  } = useSchedules();

  // In MyTablePage, right after const { savedSchedules } = useSchedules();
  console.log(
    "keys:",
    Object.keys(savedSchedules),
    "looking for:",
    toYMD(weekStartOf(TODAY)),
  );

  const mounted = !planLoading && !schedulesLoading;

  const [activeTab, setActiveTab] = useState<"mytable" | "schedule">("mytable");
  const [baseWeekStart, setBaseWeekStart] = useState<Date>(thisWeekStart);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const [checkoutDraft, setCheckoutDraft] = useState<{
    weekKey: string;
    weekMondayYMD: string;
    schedule: WeekSchedule;
  } | null>(null);

  const clearSeededRef = useRef<(() => void) | null>(null);
  const handleSeededRefClear = useCallback((fn: () => void) => {
    clearSeededRef.current = fn;
  }, []);

  const getDraftRef = useRef<
    | (() => {
        weekKey: string;
        weekMondayYMD: string;
        schedule: WeekSchedule;
      } | null)
    | null
  >(null);
  const handleRegisterGetDraft = useCallback(
    (
      fn: () => {
        weekKey: string;
        weekMondayYMD: string;
        schedule: WeekSchedule;
      } | null,
    ) => {
      getDraftRef.current = fn;
    },
    [],
  );

  const isCurrentWeek = sameDay(baseWeekStart, thisWeekStart);

  const handleSave = useCallback(
    async (
      schedule: WeekSchedule,
      weekMondayYMD: string,
      onSaved?: () => void,
    ) => {
      const tz = getUserTimezone();
      const items: {
        menuItemId: string;
        scheduledDate: string;
        mealTime: MealTime;
        scheduledAt: string;
        quantity: number;
      }[] = [];
      const dm = normalizeDays(schedule);
      for (const [di, dayData] of Object.entries(dm)) {
        if (!dayData) continue;
        for (const [mt, meal] of Object.entries(dayData) as [
          MealTime,
          ScheduledMeal | undefined,
        ][]) {
          if (!meal || meal.paid === true) continue;
          items.push({
            menuItemId: meal.plannedMealId,
            scheduledDate: localDayYMD(weekMondayYMD, Number(di)),
            mealTime: mt,
            scheduledAt: buildScheduledAtISO(
              weekMondayYMD,
              Number(di),
              meal.time,
              tz,
            ),
            quantity: meal.quantity ?? 1,
          });
        }
      }
      if (!items.length) {
        toast.error("No new meals to save");
        return;
      }
      const sunKey = wkOf(baseWeekStart);
      const existing = savedSchedules[sunKey];
      const saved = await upsertSchedule({
        weekStartDate: weekMondayYMD,
        serviceType: (["DELIVERY", "PICKUP", "DINE_IN"] as const).includes(
          existing?.serviceType as "DELIVERY" | "PICKUP" | "DINE_IN",
        )
          ? (existing?.serviceType as "DELIVERY" | "PICKUP" | "DINE_IN")
          : "DELIVERY",
        items,
      });
      if (saved) {
        onSaved?.();
        toast.success("Schedule saved!", { duration: 3000 });
      }
    },
    [savedSchedules, upsertSchedule, baseWeekStart],
  );

  const handleRemoveItem = useCallback(
    async (weekKey: string, itemId: string) => {
      const week = savedSchedules[weekKey];
      if (!week?.scheduleId) return;
      await removeItem(week.scheduleId, itemId, weekKey);
    },
    [savedSchedules, removeItem],
  );

  const handleConfirmPayment = useCallback(
    async (
      serviceType: string,
      deliveryAddress?: string,
      deliveryLocation?: PickedLocation,
      phoneOverride?: string,
    ): Promise<{ apiRef: string; grandTotal: number }> => {
      if (checkoutDraft) {
        const tz = getUserTimezone();
        const items: {
          menuItemId: string;
          scheduledDate: string;
          mealTime: MealTime;
          scheduledAt: string;
          quantity: number;
        }[] = [];
        const dm = normalizeDays(checkoutDraft.schedule);
        for (const [di, dayData] of Object.entries(dm)) {
          if (!dayData) continue;
          for (const [mt, meal] of Object.entries(dayData) as [
            MealTime,
            ScheduledMeal | undefined,
          ][]) {
            if (!meal || meal.paid === true) continue;
            items.push({
              menuItemId: meal.plannedMealId,
              scheduledDate: localDayYMD(
                checkoutDraft.weekMondayYMD,
                Number(di),
              ),
              mealTime: mt,
              scheduledAt: buildScheduledAtISO(
                checkoutDraft.weekMondayYMD,
                Number(di),
                meal.time,
                tz,
              ),
              quantity: meal.quantity ?? 1,
            });
          }
        }
        if (items.length > 0) {
          const sunKey = checkoutDraft.weekKey;
          const existing = savedSchedules[sunKey];
          await upsertSchedule({
            weekStartDate: checkoutDraft.weekMondayYMD,
            serviceType:
              (existing?.serviceType as "DELIVERY" | "PICKUP" | "DINE_IN") ??
              "DELIVERY",
            items,
          });
        }
      }

      const result = await checkout({
        serviceType: serviceType as "DELIVERY" | "PICKUP" | "DINE_IN",
        ...(deliveryAddress ? { deliveryAddress } : {}),
        ...(deliveryLocation
          ? {
              deliveryLat: deliveryLocation.lat,
              deliveryLng: deliveryLocation.lng,
              deliveryPlaceId: deliveryLocation.place_id,
            }
          : {}),
        ...(phoneOverride ? { phoneOverride } : {}),
      });

      if (!result?.apiRef) throw new Error("Failed to initiate payment");
      return { apiRef: result.apiRef, grandTotal: result.grandTotal ?? 0 };
    },
    [checkoutDraft, savedSchedules, upsertSchedule, checkout],
  );

  const handleDeleteWeek = useCallback(
    async (weekKey: string) => {
      const week = savedSchedules[weekKey];
      if (!week?.scheduleId) return;
      await deleteSchedule(week.scheduleId, weekKey);
    },
    [savedSchedules, deleteSchedule],
  );

  const handleCancelWeek = useCallback(
    async (weekKey: string) => {
      const week = savedSchedules[weekKey];
      if (!week?.scheduleId) return;
      await cancelWeek(week.scheduleId, weekKey);
    },
    [savedSchedules, cancelWeek],
  );

  const handleEditWeek = useCallback((weekKey: string) => {
    setBaseWeekStart(fromYMD(weekKey));
    setActiveTab("schedule");
  }, []);

  const handleGoSchedule = useCallback((weekStart: Date) => {
    setBaseWeekStart(weekStart);
    setActiveTab("schedule");
  }, []);

  const handleCheckoutClose = useCallback(() => {
    setShowCheckout(false);
    setActiveTab("mytable");
  }, []);

  const handlePaymentComplete = useCallback(() => {
    setShowCheckout(false);
    setActiveTab("mytable");
    toast.success("Payment confirmed! Your meals are locked in. 🎉", {
      duration: 4000,
    });
    clearSeededRef.current?.();
    setTimeout(() => void loadSchedules(), 400);
  }, [loadSchedules]);

  const handleCancelPayment = useCallback(
    async (apiRef: string) => {
      await cancelPayment(apiRef);
      clearSeededRef.current?.();
      await loadSchedules();
    },
    [cancelPayment, loadSchedules],
  );

  const handleOpenCheckout = useCallback(
    async (draft: typeof checkoutDraft) => {
      await loadSchedules();

      const freshDraft = draft
        ? (() => {
            const draftMeals = mealsInDayMap(
              normalizeDays(draft.schedule as DayMap),
            );
            const savedIds = new Set(
              Object.values(savedSchedules).flatMap((w) =>
                mealsInDayMap(normalizeDays(w.days)).map((m) => m.id),
              ),
            );
            const hasNewMeals = draftMeals.some((m) => !savedIds.has(m.id));
            return hasNewMeals ? draft : null;
          })()
        : null;

      clearSeededRef.current?.();
      setCheckoutDraft(freshDraft);
      setShowCheckout(true);
    },
    [loadSchedules, savedSchedules],
  );

  if (!mounted) {
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
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-white/60 text-sm">Loading your table...</p>
          </div>
        </div>
      </div>
    );
  }

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
        className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5 sm:space-y-6"
        style={{ zIndex: 2 }}
      >
        {/* Page title */}
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl lg:text-5xl font-black uppercase tracking-tight text-white"
          >
            My <span className="text-primary">Table</span>
          </motion.h1>
          <p className="text-xs sm:text-sm text-white/70 mt-1">
            Plan your week, pay once, eat well every day
          </p>
        </div>

        {/* Tab switcher */}
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
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
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
                onRemoveItem={handleRemoveItem}
                onGoSchedule={handleGoSchedule}
                onPay={() => {
                  void handleOpenCheckout(null);
                }}
                onManage={() => setShowManager(true)}
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
                saving={saving}
                baseWeekStart={baseWeekStart}
                setBaseWeekStart={setBaseWeekStart}
                isCurrentWeek={isCurrentWeek}
                savedSchedules={savedSchedules}
                onCheckout={() => {
                  const draft = getDraftRef.current?.() ?? null;
                  void handleOpenCheckout(draft);
                }}
                onSeededRefClear={handleSeededRefClear}
                onRegisterGetDraft={handleRegisterGetDraft}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="h-24" />

      {/* Modals */}
      <AnimatePresence>
        {showCheckout && (
          <CheckoutModal
            savedSchedules={savedSchedules}
            draftSchedule={checkoutDraft}
            customerPhone={customerPhone ?? ""}
            onClose={handleCheckoutClose}
            onConfirm={handleConfirmPayment}
            onPaymentComplete={handlePaymentComplete}
            onCancelPayment={handleCancelPayment}
          />
        )}
        {showManager && (
          <ScheduleManagerModal
            savedSchedules={savedSchedules}
            onClose={() => setShowManager(false)}
            onEdit={handleEditWeek}
            onDelete={handleDeleteWeek}
            onCancelWeek={handleCancelWeek}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
