"use client";

import {
  useState, useEffect, useCallback, useRef, createContext, useContext,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, CalendarDays, Users, TrendingUp, Star, RefreshCw,
  Bike, ShoppingBag, UtensilsCrossed, Clock, MapPin, ChevronDown,
  ChevronLeft, ChevronRight, Loader2, AlertCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  todayDelivered: number;
  upcomingCount: number;
  activeMealPlans: number;
  totalSubscriptions: number;
  pendingPayments: number;
  confirmedSchedules: number;
  totalMealsToday: number;
}

interface ChefMealItem {
  id: string;
  source: "SCHEDULE" | "PLAN";
  menuItemName: string;
  menuItemImage: string | null;
  mealTime: string;
  displayTime: string; // already converted to EAT by backend (tzUtils.server.ts)
  scheduledAtUTC: string;
  scheduledDate: string;
  status: string;
  itemId: string;
  scheduleOrSubId: string;
  customerName: string;
  serviceType: string;
  deliveryAddress: string | null;
}

interface ActiveMealPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationDays: number;
  mealsPerDay: number;
  subscriberCount: number;
  status: string;
}

interface RecentOrder {
  id: string;
  customerName: string;
  items: { name: string; mealTime: string | null }[];
  status: string;
  createdAt: string;
  total: number;
}

interface ChartPoint {
  day: string;
  date: string;
  orders: number;
  completed: number;
}

interface DashboardData {
  targetDate: string;
  chefName: string;
  stats: DashboardStats;
  todaysMeals: ChefMealItem[];
  upcomingDeliveries: {
    id: string; customerName: string; item: string;
    scheduledAt: string | null; displayTime: string; serviceType: string;
  }[];
  activeMealPlans: ActiveMealPlan[];
  recentOrders: RecentOrder[];
  topPerforming: {
    id: string; name: string; price: number; imageUrl: string | null;
    mealTimes: string[]; orders: number; revenue: number;
  }[];
  feedback: { avgRating: number; totalReviews: number };
  performance: { completionRate: number; chartData: ChartPoint[] };
}

// ─── Constants ────────────────────────────────────────────────────────────────

type MealTime = "BREAKFAST" | "LUNCH" | "DINNER";

const MEAL_META: Record<MealTime, { label: string; emoji: string; pill: string; bar: string }> = {
  BREAKFAST: { label: "Breakfast", emoji: "☕",  pill: "bg-secondary/20 text-secondary-foreground", bar: "#F4CD2E" },
  LUNCH:     { label: "Lunch",     emoji: "🍽️", pill: "bg-primary/10 text-primary",               bar: "#DD3131" },
  DINNER:    { label: "Dinner",    emoji: "🌙",  pill: "bg-muted text-muted-foreground",             bar: "#858484" },
};

const SCHEDULE_STATUSES = ["SCHEDULED", "PREPARING", "READY", "DELIVERED", "MISSED", "CANCELLED"];
const PLAN_STATUSES     = ["SCHEDULED", "PROCESSING", "DELIVERED", "MISSED", "CANCELLED"];

const STATUS_PILL: Record<string, string> = {
  SCHEDULED:  "bg-secondary/20 text-secondary-foreground border-secondary/30",
  PREPARING:  "bg-primary/10 text-primary border-primary/20",
  PROCESSING: "bg-primary/10 text-primary border-primary/20",
  READY:      "bg-chart-3/10 text-chart-3 border-chart-3/20",
  DELIVERED:  "bg-chart-3/20 text-chart-3 border-chart-3/30",
  CONFIRMED:  "bg-chart-3/10 text-chart-3 border-chart-3/20",
  MISSED:     "bg-destructive/10 text-destructive border-destructive/20",
  CANCELLED:  "bg-muted text-muted-foreground border-border",
};

const STATUS_DOT: Record<string, string> = {
  SCHEDULED:  "bg-secondary-foreground",
  PREPARING:  "bg-primary",
  PROCESSING: "bg-primary",
  READY:      "bg-chart-3",
  DELIVERED:  "bg-chart-3",
  MISSED:     "bg-destructive",
  CANCELLED:  "bg-muted-foreground",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toYMD(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function fromYMD(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}

function dayLabel(ymd: string): string {
  const today = toYMD(new Date());
  const tom   = toYMD(new Date(Date.now() + 86400000));
  if (ymd === today) return "Today";
  if (ymd === tom)   return "Tomorrow";
  return fromYMD(ymd).toLocaleDateString("en-KE", {
    weekday: "short", day: "numeric", month: "short",
  });
}

function formatRelative(iso: string): string {
  const d     = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor(
    (today.getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86400000,
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-KE", { day: "numeric", month: "short" });
}

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.32, delay },
});

// ─── Portal dropdown context ──────────────────────────────────────────────────

const DropdownCtx = createContext<{
  openId: string | null;
  setOpenId: (id: string | null) => void;
}>({ openId: null, setOpenId: () => {} });

// ─── StatusDropdown — portal-rendered to escape card overflow clipping ────────

function StatusDropdown({
  itemId, source, current, onUpdate,
}: {
  itemId: string;
  source: "SCHEDULE" | "PLAN";
  current: string;
  onUpdate: (itemId: string, newStatus: string) => void;
}) {
  const { openId, setOpenId } = useContext(DropdownCtx);
  const open       = openId === itemId;
  const [busy, setBusy]       = useState(false);
  const [pos, setPos]         = useState({ top: 0, left: 0, width: 0 });
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const statuses   = source === "SCHEDULE" ? SCHEDULE_STATUSES : PLAN_STATUSES;

  useEffect(() => { setMounted(true); }, []);

  const calcPos = useCallback(() => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setPos({
      top:   r.bottom + window.scrollY + 4,
      left:  Math.min(r.left + window.scrollX, window.innerWidth - 170),
      width: Math.max(r.width, 150),
    });
  }, []);

  const toggle = () => {
    if (open) { setOpenId(null); return; }
    calcPos();
    setOpenId(itemId);
  };

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node)) return;
      setOpenId(null);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open, setOpenId]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", calcPos, true);
    window.addEventListener("resize", calcPos);
    return () => {
      window.removeEventListener("scroll", calcPos, true);
      window.removeEventListener("resize", calcPos);
    };
  }, [open, calcPos]);

  const handleSelect = async (newStatus: string) => {
    if (newStatus === current) { setOpenId(null); return; }
    setOpenId(null);
    setBusy(true);
    try {
      const url = source === "SCHEDULE"
        ? `/api/chefs/dashboard/schedule-items/${itemId}/status`
        : `/api/chefs/dashboard/plan-instances/${itemId}/status`;
      const res = await fetch(url, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      onUpdate(itemId, newStatus);
    } catch {
      // silent — parent state was already updated optimistically
    } finally {
      setBusy(false);
    }
  };

  const pillCls = STATUS_PILL[current] ?? "bg-muted text-muted-foreground border-border";

  return (
    <>
      <button
        ref={triggerRef}
        onClick={toggle}
        disabled={busy}
        className={`flex items-center gap-1 text-[10px] font-black px-2 sm:px-2.5 py-1 sm:py-1.5
          rounded-lg border transition-all flex-shrink-0 whitespace-nowrap ${pillCls}
          hover:opacity-80 disabled:opacity-50 cursor-pointer`}
      >
        {busy
          ? <Loader2 className="w-2.5 h-2.5 animate-spin" />
          : <span>{current.charAt(0) + current.slice(1).toLowerCase()}</span>}
        {!busy && (
          <ChevronDown className={`w-2.5 h-2.5 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
        )}
      </button>

      {mounted && createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              exit={{    opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.13 }}
              style={{
                position: "absolute",
                top:      pos.top,
                left:     pos.left,
                width:    pos.width,
                zIndex:   99999,
              }}
              className="bg-background border border-border rounded-xl shadow-2xl overflow-hidden"
            >
              {statuses.map((s) => (
                <button
                  key={s}
                  onClick={() => void handleSelect(s)}
                  className={`w-full text-left px-3 py-2.5 text-[11px] font-bold
                    transition-colors flex items-center gap-2.5
                    ${s === current
                      ? "opacity-40 cursor-default " + (STATUS_PILL[s] ?? "bg-muted text-muted-foreground")
                      : "text-foreground hover:bg-muted"
                    }`}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[s] ?? "bg-muted-foreground"}`} />
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                  {s === current && (
                    <span className="ml-auto text-[9px] opacity-60">current</span>
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}

// ─── MealCard ─────────────────────────────────────────────────────────────────

function MealCard({ meal, onStatusUpdate }: {
  meal: ChefMealItem;
  onStatusUpdate: (itemId: string, newStatus: string) => void;
}) {
  const meta = MEAL_META[meal.mealTime as MealTime];

  return (
    <div className="bg-background rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow overflow-visible">
      <div className="flex items-stretch">
        {/* Left colour bar */}
        <div
          className="w-1 rounded-l-2xl flex-shrink-0"
          style={{ background: meta?.bar ?? "#858484" }}
        />

        <div className="flex-1 p-3 sm:p-4 min-w-0">
          {/* Top row */}
          <div className="flex items-start gap-2 sm:gap-3">
            {/* Meal image */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center text-lg sm:text-xl">
              {meal.menuItemImage
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={meal.menuItemImage} alt={meal.menuItemName} className="w-full h-full object-cover" />
                : "🍽️"}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Name + status dropdown */}
              <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-black text-foreground truncate leading-tight">
                    {meal.menuItemName}
                  </p>
                  <p className="text-[11px] sm:text-xs font-semibold text-foreground mt-0.5 truncate">
                    {meal.customerName}
                  </p>
                </div>
                {/* Status dropdown — always visible, portal-rendered */}
                <StatusDropdown
                  itemId={meal.itemId}
                  source={meal.source}
                  current={meal.status}
                  onUpdate={onStatusUpdate}
                />
              </div>

              {/* Meta chips — wrap gracefully on all screen sizes */}
              <div className="flex items-center gap-1 sm:gap-1.5 mt-2 flex-wrap">
                {/* Source badge */}
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                  meal.source === "SCHEDULE"
                    ? "bg-primary/10 text-primary"
                    : "bg-secondary/20 text-secondary-foreground"
                }`}>
                  {meal.source === "SCHEDULE" ? "SCHEDULE" : "MEAL PLAN"}
                </span>

                {/* Meal time */}
                {meta && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${meta.pill}`}>
                    {meta.emoji} {meta.label}
                  </span>
                )}

                {/* Scheduled time — displayTime is EAT-correct from backend */}
                <span className="flex items-center gap-0.5 sm:gap-1 text-[10px] text-muted-foreground flex-shrink-0">
                  <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                  {meal.displayTime}
                </span>

                {/* Service type — label always shown, not hidden on mobile */}
                <span className="flex items-center gap-0.5 sm:gap-1 text-[10px] text-muted-foreground flex-shrink-0">
                  {meal.serviceType === "DELIVERY"
                    ? <Bike className="w-2.5 h-2.5 flex-shrink-0" />
                    : meal.serviceType === "PICKUP"
                      ? <ShoppingBag className="w-2.5 h-2.5 flex-shrink-0" />
                      : <UtensilsCrossed className="w-2.5 h-2.5 flex-shrink-0" />}
                  {meal.serviceType === "DELIVERY" ? "Delivery"
                    : meal.serviceType === "PICKUP" ? "Pickup" : "Dine In"}
                </span>
              </div>

              {/* Delivery address — always visible, wraps on small screens */}
              {meal.deliveryAddress && (
                <div className="flex items-start gap-1 mt-1.5">
                  <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground flex-shrink-0 mt-px" />
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-relaxed break-words min-w-0">
                    {meal.deliveryAddress}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DayPicker ────────────────────────────────────────────────────────────────

function DayPicker({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (ymd: string) => void;
}) {
  const today     = toYMD(new Date());
  const scrollRef = useRef<HTMLDivElement>(null);

  const days = Array.from({ length: 15 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 7 + i);
    return toYMD(d);
  });

  // Auto-scroll selected into view
  useEffect(() => {
    const el = scrollRef.current?.querySelector("[data-sel='true']");
    el?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [selected]);

  const go = (dir: -1 | 1) => {
    const idx  = days.indexOf(selected);
    const next = days[idx + dir];
    if (next) onChange(next);
  };

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {/* Prev arrow */}
      <button
        onClick={() => go(-1)}
        disabled={days[0] === selected}
        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-border bg-background
          flex items-center justify-center disabled:opacity-30 flex-shrink-0
          hover:bg-muted transition-colors"
        aria-label="Previous day"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>

      {/* Scrollable day row */}
      <div ref={scrollRef} className="flex gap-1 sm:gap-1.5 overflow-x-auto pb-1 scrollbar-hide flex-1">
        {days.map((ymd) => {
          const d     = fromYMD(ymd);
          const isSel = ymd === selected;
          const isNow = ymd === today;
          return (
            <button
              key={ymd}
              data-sel={isSel}
              onClick={() => onChange(ymd)}
              className={`flex flex-col items-center px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl
                min-w-[42px] sm:min-w-[52px] border flex-shrink-0 transition-all ${
                isSel
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : isNow
                    ? "bg-primary/5 border-primary/30 text-foreground"
                    : "bg-background border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              <span className="text-[8px] sm:text-[9px] font-black tracking-widest uppercase">
                {d.toLocaleDateString("en", { weekday: "short" })}
              </span>
              <span className={`text-lg sm:text-xl font-black leading-tight ${isNow && !isSel ? "text-primary" : ""}`}>
                {d.getDate()}
              </span>
              {isNow && (
                <span className={`text-[7px] sm:text-[8px] font-black ${isSel ? "text-primary-foreground/70" : "text-primary"}`}>
                  TODAY
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Next arrow */}
      <button
        onClick={() => go(1)}
        disabled={days[days.length - 1] === selected}
        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-border bg-background
          flex items-center justify-center disabled:opacity-30 flex-shrink-0
          hover:bg-muted transition-colors"
        aria-label="Next day"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TabDashboard() {
  const [data, setData]                 = useState<DashboardData | null>(null);
  const [meals, setMeals]               = useState<ChefMealItem[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [lastUpdated, setLastUpdated]   = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState(toYMD(new Date()));
  const [mealFilter, setMealFilter]     = useState<"ALL" | MealTime>("ALL");
  const [openDropId, setOpenDropId]     = useState<string | null>(null);

  const fetchDashboard = useCallback(async (date: string) => {
    try {
      setError(null);
      const res  = await fetch(`/api/chefs/dashboard?date=${date}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load dashboard");
      const json = await res.json() as { data: DashboardData };
      setData(json.data);
      setMeals(json.data.todaysMeals);
      setLastUpdated(new Date());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    void fetchDashboard(selectedDate);
  }, [fetchDashboard, selectedDate]);

  // Auto-refresh every 60 s on today's view
  useEffect(() => {
    const iv = setInterval(() => {
      if (selectedDate === toYMD(new Date())) void fetchDashboard(selectedDate);
    }, 60_000);
    return () => clearInterval(iv);
  }, [fetchDashboard, selectedDate]);

  const handleStatusUpdate = useCallback((itemId: string, newStatus: string) => {
    setMeals((prev) => prev.map((m) => m.itemId === itemId ? { ...m, status: newStatus } : m));
  }, []);

  const filteredMeals = mealFilter === "ALL"
    ? meals
    : meals.filter((m) => m.mealTime === mealFilter);

  const counts = {
    ALL:       meals.length,
    BREAKFAST: meals.filter((m) => m.mealTime === "BREAKFAST").length,
    LUNCH:     meals.filter((m) => m.mealTime === "LUNCH").length,
    DINNER:    meals.filter((m) => m.mealTime === "DINNER").length,
  };

  // Sparkline
  const pts  = data?.performance.chartData ?? [];
  const maxY = Math.max(...pts.map((p) => p.orders), 1);
  const norm = (v: number) => 100 - ((v / maxY) * 80) - 10;
  const cPath = pts.length > 1
    ? pts.map((p, i) => `${(i / (pts.length - 1)) * 280},${norm(p.orders)}`).join(" L ")
    : "";

  const STATS = data ? [
    { label: "Meals Today",   value: data.stats.totalMealsToday,    sub: "Combined", color: "#DD3131" },
    { label: "Delivered",     value: data.stats.todayDelivered,     sub: "Today",    color: "#007606" },
    { label: "Meal Plans",    value: data.stats.activeMealPlans,    sub: "Active",   color: "#8E771B" },
    { label: "Subscriptions", value: data.stats.totalSubscriptions, sub: "Active",   color: "#DD3131" },
  ] : [];

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (loading && !data) {
    return (
      <div className="space-y-4 sm:space-y-5 animate-pulse">
        <div className="h-6 sm:h-7 w-40 sm:w-52 bg-muted rounded-xl" />
        <div className="flex gap-1.5 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 sm:h-16 w-12 sm:w-14 bg-muted rounded-xl flex-shrink-0" />
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 sm:h-24 bg-muted rounded-2xl" />
          ))}
        </div>
        <div className="space-y-2 sm:space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 sm:h-20 bg-muted rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 sm:py-20 gap-3">
        <AlertCircle className="w-7 h-7 sm:w-8 sm:h-8 text-destructive" />
        <p className="text-sm text-destructive font-semibold text-center px-4">{error}</p>
        <button
          onClick={() => void fetchDashboard(selectedDate)}
          className="text-xs text-primary underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <DropdownCtx.Provider value={{ openId: openDropId, setOpenId: setOpenDropId }}>
      <div className="space-y-4 sm:space-y-5 relative">

        {/* ── Header ── */}
        <motion.div {...fadeUp(0)} className="flex items-start sm:items-center justify-between flex-wrap gap-2">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-foreground leading-tight">
              Welcome back, Chef {data?.chefName ?? "…"}!
            </h2>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
              {dayLabel(selectedDate)} · {filteredMeals.length} meal{filteredMeals.length !== 1 ? "s" : ""} to handle
            </p>
          </div>
          <button
            onClick={() => void fetchDashboard(selectedDate)}
            className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-muted-foreground
              hover:text-foreground transition-colors border border-border rounded-xl
              px-2.5 sm:px-3 py-1.5 bg-background hover:bg-muted flex-shrink-0"
          >
            <RefreshCw className="w-3 h-3" />
            {lastUpdated
              ? lastUpdated.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })
              : "Refresh"}
          </button>
        </motion.div>

        {/* ── Day picker ── */}
        <motion.div {...fadeUp(0.05)}>
          <DayPicker
            selected={selectedDate}
            onChange={(d) => {
              setSelectedDate(d);
              setMealFilter("ALL");
              setOpenDropId(null);
            }}
          />
        </motion.div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              {...fadeUp(0.08 + i * 0.06)}
              className="bg-background rounded-2xl border border-border p-3 sm:p-3.5 lg:p-4 flex flex-col gap-1.5"
            >
              <p className="text-[10px] sm:text-[11px] lg:text-xs text-muted-foreground font-medium">{s.label}</p>
              <p className="text-2xl sm:text-3xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground">{s.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* ── Meal time filter ── */}
        <motion.div {...fadeUp(0.18)} className="flex gap-1.5 sm:gap-2 flex-wrap">
          {(["ALL", "BREAKFAST", "LUNCH", "DINNER"] as const).map((f) => {
            const meta  = f !== "ALL" ? MEAL_META[f] : null;
            const count = counts[f];
            return (
              <button
                key={f}
                onClick={() => setMealFilter(f)}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 lg:px-3.5
                  py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold border
                  transition-all ${
                  mealFilter === f
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary bg-background"
                }`}
              >
                {meta ? `${meta.emoji} ${meta.label}` : "All"}
                {count > 0 && (
                  <span className={`text-[8px] sm:text-[9px] font-black px-1 sm:px-1.5 py-0.5 rounded-full ${
                    mealFilter === f
                      ? "bg-white/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </motion.div>

        {/* ── Meals feed ── */}
        <motion.div {...fadeUp(0.22)}>
          {filteredMeals.length === 0 ? (
            <div className="text-center py-12 sm:py-14 bg-background rounded-2xl border border-border space-y-2 px-4">
              <p className="text-3xl sm:text-4xl">🍽️</p>
              <p className="text-sm font-black text-foreground">
                No{mealFilter !== "ALL"
                  ? ` ${MEAL_META[mealFilter as MealTime].label.toLowerCase()}`
                  : ""} meals for {dayLabel(selectedDate).toLowerCase()}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {selectedDate === toYMD(new Date()) ? "Enjoy a quiet day!" : "Nothing scheduled here."}
              </p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-5">
              {(["BREAKFAST", "LUNCH", "DINNER"] as MealTime[]).map((mt) => {
                const group = filteredMeals.filter((m) => m.mealTime === mt);
                if (!group.length) return null;
                const meta = MEAL_META[mt];
                return (
                  <div key={mt}>
                    {/* Section divider */}
                    <div className="flex items-center gap-2 mb-2 sm:mb-2.5 px-0.5">
                      <span className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        {meta.emoji} {meta.label}
                      </span>
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                        {group.length} meal{group.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="space-y-2 sm:space-y-2.5">
                      {group.map((meal) => (
                        <MealCard key={meal.id} meal={meal} onStatusUpdate={handleStatusUpdate} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* ── Bottom panels ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">

          {/* Active meal plans */}
          <motion.div
            {...fadeUp(0.28)}
            className="bg-background rounded-2xl border border-border p-3.5 sm:p-4 lg:p-5 flex flex-col gap-3"
          >
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary flex-shrink-0" />
              Active Meal Plans
            </h3>
            {!data?.activeMealPlans.length ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No active meal plans</p>
            ) : (
              <div className="space-y-3">
                {data.activeMealPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="flex items-start justify-between gap-2 pb-3 border-b border-border/50 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{plan.name}</p>
                      {plan.description && (
                        <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                          {plan.description}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                          {plan.mealsPerDay}/day · {plan.durationDays}d
                        </span>
                        <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full flex items-center gap-1">
                          <Users className="w-2 h-2" />{plan.subscriberCount}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs font-black text-foreground whitespace-nowrap">
                        KES {plan.price.toLocaleString()}
                      </span>
                      <span className="text-[9px] bg-chart-3/10 text-chart-3 font-bold px-2 py-0.5 rounded-full">
                        ACTIVE
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Recent orders */}
          <motion.div
            {...fadeUp(0.32)}
            className="bg-background rounded-2xl border border-border p-3.5 sm:p-4 lg:p-5 flex flex-col gap-3"
          >
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
              Recent Orders
            </h3>
            {!data?.recentOrders.length ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No orders yet</p>
            ) : (
              <div className="space-y-2">
                {data.recentOrders.map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center gap-2 sm:gap-2.5 py-2 border-b border-border/50 last:border-0"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex-shrink-0
                      flex items-center justify-center text-xs font-black text-primary">
                      {o.customerName[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] sm:text-xs font-semibold text-foreground truncate">
                        {o.customerName}
                      </p>
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground truncate">
                        {o.items.map((i) => i.name).join(", ")}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[9px] sm:text-[10px] font-semibold text-foreground whitespace-nowrap">
                        {formatRelative(o.createdAt)}
                      </p>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border ${
                        STATUS_PILL[o.status] ?? "bg-muted text-muted-foreground border-border"
                      }`}>
                        {o.status.toLowerCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Performance + rating */}
          <motion.div
            {...fadeUp(0.36)}
            className="bg-background rounded-2xl border border-border p-3.5 sm:p-4 lg:p-5
              flex flex-col gap-3 sm:col-span-2 lg:col-span-1"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary flex-shrink-0" />
                Performance
              </h3>
              <span className="text-[10px] text-chart-3 font-bold">This month</span>
            </div>

            <div className="flex items-end gap-3 sm:gap-4 flex-wrap">
              <div>
                <p className="text-3xl sm:text-4xl font-black text-foreground">
                  {data?.performance.completionRate ?? 0}%
                </p>
                <p className="text-[10px] text-muted-foreground">Completion rate</p>
              </div>
              <div className="flex items-center gap-1 mb-1 ml-auto">
                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary fill-secondary" />
                <span className="text-sm font-black text-foreground">
                  {data?.feedback.avgRating.toFixed(1)}
                </span>
                <span className="text-[10px] text-muted-foreground">/ 5</span>
              </div>
            </div>

            <div className="w-full" style={{ height: "60px" }}>
              {cPath && (
                <svg viewBox="0 0 280 100" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="cg2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#007606" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#007606" stopOpacity="0"   />
                    </linearGradient>
                  </defs>
                  <path d={`M ${cPath} L 280,100 L 0,100 Z`} fill="url(#cg2)" />
                  <polyline
                    points={cPath}
                    fill="none"
                    stroke="#007606"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>

            <div className="flex justify-between text-[8px] sm:text-[9px] text-muted-foreground">
              {pts.map((p) => <span key={p.day}>{p.day}</span>)}
            </div>

            <p className="text-[9px] sm:text-[10px] text-muted-foreground text-center border-t border-border pt-2">
              {data?.feedback.totalReviews
                ? `Based on ${data.feedback.totalReviews} review${data.feedback.totalReviews !== 1 ? "s" : ""}`
                : "No reviews yet"}
            </p>
          </motion.div>
        </div>
      </div>
    </DropdownCtx.Provider>
  );
}