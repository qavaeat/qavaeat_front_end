"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Bike,
  ShoppingBag,
  UtensilsCrossed,
  Receipt,
  AlertCircle,
  ClipboardList,
  Clock,
  CheckCircle2,
  ChefHat,
  Gift,
  XCircle,
  HeartCrack,
  Package,
  CalendarRange,
  Salad,
  ShoppingCart,
  Wallet,
  Filter,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
  mealTime: string | null;
  plannedDate: string | null;
  scheduledAt: string | null;
  menuItem: { id: string; name: string; imageUrl: string | null } | null;
}

interface Order {
  id: string;
  source: "ORDER" | "SCHEDULE" | "MEAL_PLAN";
  status: string;
  paymentStatus: string;
  serviceType: string;
  deliveryAddress: string | null;
  scheduledAt: string | null;
  subtotal: number;
  total: number;
  notes: string | null;
  createdAt: string;
  business: { id: string; name: string; city: string; logoUrl: string | null };
  items: OrderItem[];
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    bg: string;
    text: string;
    dot: string;
    icon: React.ElementType;
    progress: number;
  }
> = {
  PENDING: {
    label: "Pending",
    bg: "bg-[#EBE9E9]",
    text: "text-[#858484]",
    dot: "bg-[#858484]",
    icon: Clock,
    progress: 10,
  },
  CONFIRMED: {
    label: "Confirmed",
    bg: "bg-[#DD3131]/10",
    text: "text-[#DD3131]",
    dot: "bg-[#DD3131]",
    icon: CheckCircle2,
    progress: 30,
  },
  PREPARING: {
    label: "Preparing",
    bg: "bg-[#F4CD2E]/15",
    text: "text-[#8E771B]",
    dot: "bg-[#F4CD2E]",
    icon: ChefHat,
    progress: 60,
  },
  READY: {
    label: "Ready",
    bg: "bg-[#007606]/10",
    text: "text-[#007606]",
    dot: "bg-[#007606]",
    icon: Gift,
    progress: 85,
  },
  OUT_FOR_DELIVERY: {
    label: "On the way",
    bg: "bg-[#DD3131]/10",
    text: "text-[#DD3131]",
    dot: "bg-[#DD3131]",
    icon: Bike,
    progress: 92,
  },
  DELIVERED: {
    label: "Paid",
    bg: "bg-[#007606]/10",
    text: "text-[#007606]",
    dot: "bg-[#007606]",
    icon: Package,
    progress: 100,
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-[#EBE9E9]",
    text: "text-[#858484]",
    dot: "bg-[#858484]",
    icon: XCircle,
    progress: 0,
  },
  FAILED: {
    label: "Failed",
    bg: "bg-[#DD3131]/10",
    text: "text-[#DD3131]",
    dot: "bg-[#DD3131]",
    icon: HeartCrack,
    progress: 0,
  },
};

const MEAL_DOT_COLORS: Record<string, string> = {
  BREAKFAST: "bg-[#F4CD2E]",
  LUNCH: "bg-[#007606]",
  DINNER: "bg-[#DD3131]",
};

const SOURCE_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; icon: React.ElementType }
> = {
  SCHEDULE: {
    label: "Scheduled",
    bg: "bg-[#DD3131]/10",
    text: "text-[#DD3131]",
    icon: CalendarRange,
  },
  MEAL_PLAN: {
    label: "Meal Plan",
    bg: "bg-[#F4CD2E]/20",
    text: "text-[#8E771B]",
    icon: Salad,
  },
  DIRECT: {
    label: "Direct",
    bg: "bg-[#EBE9E9]",
    text: "text-[#858484]",
    icon: ShoppingCart,
  },
};

const PAGE_SIZE = 7;

// ─── Date helpers ─────────────────────────────────────────────────────────────

function toLocalYMD(value: string): { y: number; m: number; d: number } {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return { y: y!, m: m! - 1, d: d! };
  }
  const dt = new Date(value);
  return { y: dt.getFullYear(), m: dt.getMonth(), d: dt.getDate() };
}

function dayDiff(target: { y: number; m: number; d: number }): number {
  const now = new Date();
  const todayMs = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const tgtMs = Date.UTC(target.y, target.m, target.d);
  return Math.round((tgtMs - todayMs) / 86_400_000);
}

function formatDate(iso: string): string {
  const ymd = toLocalYMD(iso);
  const diff = dayDiff(ymd);
  if (diff === 0) return "Today";
  if (diff === -1) return "Yesterday";
  if (diff < 0) {
    const n = Math.abs(diff);
    if (n <= 6) return `${n}d ago`;
  }
  const dt = new Date(ymd.y, ymd.m, ymd.d);
  return dt.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: diff < -300 ? "numeric" : undefined,
  });
}

function formatFullDate(iso: string): string {
  const ymd = toLocalYMD(iso);
  const dt = new Date(ymd.y, ymd.m, ymd.d);
  return dt.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  try {
    const dt = new Date(iso);
    return dt.toLocaleTimeString("en-KE", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}

function orderSource(order: Order): "SCHEDULE" | "MEAL_PLAN" | "DIRECT" {
  if (order.source === "SCHEDULE") return "SCHEDULE";
  if (order.source === "MEAL_PLAN") return "MEAL_PLAN";
  return "DIRECT";
}

// ─── Wallet Panel ─────────────────────────────────────────────────────────────

function WalletPanel({ orders }: { orders: Order[] }) {
  const totalMeals = orders.reduce((s, o) => s + o.items.length, 0);
  const totalScheduled = orders.reduce((s, o) => s + o.total, 0);

  const paidOrders = useMemo(
    () =>
      orders
        .filter((o) => o.status === "DELIVERED" || o.paymentStatus === "PAID")
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [orders],
  );

  const totalPaid = paidOrders.reduce((s, o) => s + o.total, 0);
  const paidMeals = paidOrders.reduce((s, o) => s + o.items.length, 0);

  const dueOrders = orders.filter(
    (o) => o.status !== "DELIVERED" && o.paymentStatus !== "PAID",
  );
  const totalDue = Math.max(0, totalScheduled - totalPaid);
  const dueMeals = dueOrders.reduce((s, o) => s + o.items.length, 0);

  const pct =
    totalScheduled > 0 ? Math.round((totalPaid / totalScheduled) * 100) : 0;

  const recentPaid = paidOrders.slice(0, 10);

  return (
    <div className="bg-background rounded-2xl border border-border overflow-hidden flex flex-col h-fit">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-border flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-[#DD3131]/10 flex items-center justify-center flex-shrink-0">
          <Wallet className="w-3.5 h-3.5 text-[#DD3131]" />
        </div>
        <h3 className="text-[11px] font-black uppercase tracking-widest text-foreground">
          Wallet &amp; Activity
        </h3>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        {[
          {
            label: "Scheduled",
            val: totalScheduled,
            sub: `${totalMeals} meal${totalMeals !== 1 ? "s" : ""}`,
            color: "text-foreground",
          },
          {
            label: "Paid",
            val: totalPaid,
            sub: `${paidMeals} settled`,
            color: "text-[#007606]",
          },
          {
            label: "Due",
            val: totalDue,
            sub: `${dueMeals} pending`,
            color: totalDue > 0 ? "text-[#DD3131]" : "text-[#858484]",
          },
        ].map(({ label, val, sub, color }) => (
          <div key={label} className="px-3 py-3">
            <p className="text-[9px] uppercase tracking-wide text-muted-foreground mb-0.5">
              {label}
            </p>
            <p className={`text-sm font-black ${color} tabular-nums`}>
              {val > 0 ? `KES ${val.toLocaleString()}` : "—"}
            </p>
            <p className="text-[9px] text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex justify-between items-center mb-1.5">
          <p className="text-[10px] text-muted-foreground">Payment progress</p>
          <p
            className={`text-[10px] font-black ${pct === 100 ? "text-[#007606]" : "text-[#DD3131]"}`}
          >
            {pct}%
          </p>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${pct === 100 ? "bg-[#007606]" : "bg-[#DD3131]"}`}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.9, delay: 0.2 }}
          />
        </div>
      </div>

      {/* Recently Paid */}
      <div className="px-4 py-3">
        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">
          Recently Paid
        </p>
        {recentPaid.length === 0 ? (
          <div className="rounded-xl border border-border bg-muted/30 px-4 py-6 text-center">
            <p className="text-[11px] text-muted-foreground">
              No paid orders yet.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            {recentPaid.map((order, i) => (
              <div
                key={order.id}
                className={`flex items-center gap-2 px-3 py-2.5 hover:bg-muted/30 transition-colors ${
                  i < recentPaid.length - 1 ? "border-b border-border/50" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-foreground truncate">
                    {order.business.name}
                  </p>
                  <p className="text-[9px] text-muted-foreground">
                    {formatDate(order.createdAt)} · {order.items.length} meal
                    {order.items.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <span className="text-[10px] font-black text-[#007606] flex-shrink-0 tabular-nums">
                  KES {order.total.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Order Row ────────────────────────────────────────────────────────────────

function OrderRow({
  order,
  index,
  isExpanded,
  onToggle,
}: {
  order: Order;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const source = orderSource(order);
  const status = STATUS_CONFIG[order.status] ?? STATUS_CONFIG["PENDING"]!;
  const srcConfig = SOURCE_CONFIG[source]!;
  const mealTimes = [
    ...new Set(order.items.map((i) => i.mealTime).filter(Boolean)),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.04 }}
    >
      <button
        onClick={onToggle}
        className="w-full text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3 px-4 py-3.5">
          {/* Date column */}
          <div className="w-[90px] flex-shrink-0">
            <p className="text-[11px] font-bold text-foreground">
              {formatFullDate(order.createdAt)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {formatTime(order.createdAt)}
            </p>
          </div>

          {/* Order # */}
          <div className="w-[100px] flex-shrink-0 hidden sm:block">
            <p className="text-[11px] font-mono font-bold text-foreground">
              #{order.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="text-[9px] text-muted-foreground">
              {order.business.name}
            </p>
          </div>

          {/* Meal dots */}
          <div className="flex-1 min-w-0 hidden md:flex flex-col gap-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {mealTimes.map((mt) => (
                <span key={mt} className="flex items-center gap-1">
                  <span
                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      MEAL_DOT_COLORS[mt!] ?? "bg-muted-foreground"
                    }`}
                  />
                  <span className="text-[9px] text-muted-foreground capitalize">
                    {mt!.charAt(0) + mt!.slice(1).toLowerCase()}
                  </span>
                </span>
              ))}
            </div>
            <p className="text-[9px] text-muted-foreground">
              {order.items.length} meal{order.items.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Type badge */}
          <div className="w-[90px] flex-shrink-0 hidden lg:block">
            <span
              className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-full ${srcConfig.bg} ${srcConfig.text}`}
            >
              <srcConfig.icon className="w-2.5 h-2.5" />
              {srcConfig.label}
            </span>
          </div>

          {/* Amount */}
          <div className="w-[80px] flex-shrink-0 text-right">
            <p className="text-[12px] font-black text-foreground tabular-nums">
              KES {order.total.toLocaleString()}
            </p>
          </div>

          {/* Status */}
          <div className="w-[80px] flex-shrink-0 flex justify-end">
            <span
              className={`inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-full ${status.bg} ${status.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mx-4 mb-3 rounded-xl border border-border bg-muted/20 overflow-hidden">
              <div className="divide-y divide-border/50">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-3 py-2.5"
                  >
                    <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      {item.menuItem?.imageUrl ? (
                        <img
                          src={item.menuItem.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <UtensilsCrossed className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-foreground truncate">
                        {item.name}
                      </p>
                      {item.mealTime && (
                        <span className="text-[9px] text-muted-foreground capitalize">
                          {item.mealTime.charAt(0) +
                            item.mealTime.slice(1).toLowerCase()}{" "}
                          · ×{item.quantity}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-black text-foreground flex-shrink-0 tabular-nums">
                      KES {item.subtotal.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              {/* Footer meta */}
              <div className="px-3 py-2.5 border-t border-border/50 bg-background flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    {order.serviceType === "DELIVERY" ? (
                      <Bike className="w-3 h-3" />
                    ) : order.serviceType === "PICKUP" ? (
                      <ShoppingBag className="w-3 h-3" />
                    ) : (
                      <UtensilsCrossed className="w-3 h-3" />
                    )}
                    {order.serviceType === "DELIVERY"
                      ? "Delivery"
                      : order.serviceType === "PICKUP"
                        ? "Pickup"
                        : "Dine In"}
                  </span>
                  {order.scheduledAt && (
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {formatDate(order.scheduledAt)}
                    </span>
                  )}
                  {order.deliveryAddress && (
                    <span className="truncate max-w-[160px]">
                      {order.deliveryAddress}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-muted-foreground">
                    Subtotal
                  </span>
                  <span className="text-[11px] font-black text-foreground tabular-nums">
                    KES {order.subtotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

function FilterBar({
  dateFilter,
  onDateChange,
  typeFilter,
  onTypeChange,
}: {
  dateFilter: string;
  onDateChange: (v: string) => void;
  typeFilter: string;
  onTypeChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-border flex-wrap">
      <div className="relative">
        <select
          value={dateFilter}
          onChange={(e) => onDateChange(e.target.value)}
          className="appearance-none text-[11px] font-bold border border-border rounded-xl pl-8 pr-7 py-2 bg-background text-foreground cursor-pointer hover:bg-muted/50 transition-colors focus:outline-none focus:ring-1 focus:ring-[#DD3131]/30"
        >
          <option value="all">All Dates</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
        <CalendarDays className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <ChevronRight className="w-3 h-3 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
      </div>

      <div className="relative">
        <select
          value={typeFilter}
          onChange={(e) => onTypeChange(e.target.value)}
          className="appearance-none text-[11px] font-bold border border-border rounded-xl pl-8 pr-7 py-2 bg-background text-foreground cursor-pointer hover:bg-muted/50 transition-colors focus:outline-none focus:ring-1 focus:ring-[#DD3131]/30"
        >
          <option value="all">All Types</option>
          <option value="SCHEDULE">Scheduled</option>
          <option value="MEAL_PLAN">Meal Plan</option>
          <option value="ORDER">Direct</option>
        </select>
        <Filter className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <ChevronRight className="w-3 h-3 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
      </div>
    </div>
  );
}

// ─── Table header ─────────────────────────────────────────────────────────────

function TableHeader() {
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-muted/30 border-b border-border">
      <div className="w-[90px] flex-shrink-0">
        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
          Date
        </span>
      </div>
      <div className="w-[100px] flex-shrink-0 hidden sm:block">
        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
          Order
        </span>
      </div>
      <div className="flex-1 hidden md:block">
        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
          Meals
        </span>
      </div>
      <div className="w-[90px] flex-shrink-0 hidden lg:block">
        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
          Type
        </span>
      </div>
      <div className="w-[80px] flex-shrink-0 text-right">
        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
          Amount
        </span>
      </div>
      <div className="w-[80px] flex-shrink-0 text-right">
        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
          Status
        </span>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const countRes = await fetch(`/api/orders?page=1&limit=1`, {
        cache: "no-store",
      });
      if (!countRes.ok)
        throw new Error(`Failed to load orders (${countRes.status})`);
      const countJson = (await countRes.json()) as { meta?: PaginationMeta };
      const total = countJson.meta?.total ?? 0;

      if (total === 0) {
        setAllOrders([]);
        return;
      }

      const res = await fetch(`/api/orders?page=1&limit=${total}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Failed to load orders (${res.status})`);
      const json = (await res.json()) as {
        data?: Order[];
        meta?: PaginationMeta;
      };

      setAllOrders(json.data ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredOrders = useMemo(() => {
    return allOrders.filter((o) => {
      if (typeFilter !== "all" && o.source !== typeFilter) return false;
      if (dateFilter !== "all") {
        const now = new Date();
        const created = new Date(o.createdAt);
        if (dateFilter === "today") {
          return created.toDateString() === now.toDateString();
        }
        if (dateFilter === "week") {
          const weekAgo = new Date(now.getTime() - 7 * 86400000);
          return created >= weekAgo;
        }
        if (dateFilter === "month") {
          return (
            created.getMonth() === now.getMonth() &&
            created.getFullYear() === now.getFullYear()
          );
        }
      }
      return true;
    });
  }, [allOrders, dateFilter, typeFilter]);

  useEffect(() => {
    setPage(1);
    setExpandedId(null);
  }, [dateFilter, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageEnd = pageStart + PAGE_SIZE;
  const pagedOrders = filteredOrders.slice(pageStart, pageEnd);

  const hasPrevPage = safePage > 1;
  const hasNextPage = safePage < totalPages;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="relative border-b border-border overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #DD3131 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight uppercase">
              Order History <span className="text-[#DD3131]">&amp; Wallet</span>
            </h1>
            <p className="text-muted-foreground text-xs mt-1">
              All your meals, payments, and activity in one place
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/*
         * THE FIX: both the Orders panel AND WalletPanel are children
         * of this single grid div. On lg+ they sit side by side;
         * on smaller screens they stack.
         */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">
          {/* ── Left: Orders panel ── */}
          <div className="bg-background rounded-2xl border border-border overflow-hidden shadow-sm">
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Receipt className="w-3.5 h-3.5 text-[#DD3131]" />
                <span className="text-[11px] font-black uppercase tracking-widest text-foreground">
                  Orders
                </span>
                {!loading && (
                  <span className="text-[9px] font-black text-[#DD3131] bg-[#DD3131]/10 px-1.5 py-0.5 rounded-full">
                    {filteredOrders.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => void load()}
                disabled={loading}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground border border-border rounded-lg px-2.5 py-1.5 hover:bg-muted transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3 h-3 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>

            {/* Filters */}
            <FilterBar
              dateFilter={dateFilter}
              onDateChange={setDateFilter}
              typeFilter={typeFilter}
              onTypeChange={setTypeFilter}
            />

            <TableHeader />

            {error ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <AlertCircle className="w-7 h-7 text-[#DD3131]" />
                <p className="text-sm text-[#DD3131] font-semibold">{error}</p>
                <Button
                  variant="outline"
                  onClick={() => void load()}
                  className="rounded-xl text-xs"
                >
                  Try again
                </Button>
              </div>
            ) : loading ? (
              <div className="divide-y divide-border/50">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-3.5 animate-pulse"
                  >
                    <div className="w-[90px] space-y-1.5 flex-shrink-0">
                      <div className="h-2.5 bg-muted rounded w-full" />
                      <div className="h-2 bg-muted rounded w-2/3" />
                    </div>
                    <div className="w-[100px] space-y-1.5 flex-shrink-0 hidden sm:block">
                      <div className="h-2.5 bg-muted rounded w-full" />
                      <div className="h-2 bg-muted rounded w-3/4" />
                    </div>
                    <div className="flex-1 space-y-1.5 hidden md:block">
                      <div className="h-2.5 bg-muted rounded w-1/2" />
                      <div className="h-2 bg-muted rounded w-1/3" />
                    </div>
                    <div className="w-[90px] hidden lg:block">
                      <div className="h-5 bg-muted rounded-full w-[70px]" />
                    </div>
                    <div className="w-[80px] flex-shrink-0 flex justify-end">
                      <div className="h-3 bg-muted rounded w-16" />
                    </div>
                    <div className="w-[80px] flex-shrink-0 flex justify-end">
                      <div className="h-5 bg-muted rounded-full w-14" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-20 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                  <ClipboardList className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-black text-foreground">
                  No orders found
                </p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  {typeFilter !== "all" || dateFilter !== "all"
                    ? "Try adjusting your filters."
                    : "Once you schedule meals or subscribe to a meal plan, your orders will appear here."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                <AnimatePresence mode="popLayout">
                  {pagedOrders.map((order, i) => (
                    <OrderRow
                      key={order.id}
                      order={order}
                      index={i}
                      isExpanded={expandedId === order.id}
                      onToggle={() =>
                        setExpandedId(expandedId === order.id ? null : order.id)
                      }
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Pagination */}
            {!loading && filteredOrders.length > PAGE_SIZE && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-[10px] text-muted-foreground">
                  Showing{" "}
                  <span className="font-bold text-foreground">
                    {pageStart + 1}–{Math.min(pageEnd, filteredOrders.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-foreground">
                    {filteredOrders.length}
                  </span>{" "}
                  order{filteredOrders.length !== 1 ? "s" : ""}
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setPage((p) => Math.max(1, p - 1));
                      setExpandedId(null);
                    }}
                    disabled={!hasPrevPage}
                    className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-muted disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-bold text-foreground px-1.5">
                    {safePage} / {totalPages}
                  </span>
                  <button
                    onClick={() => {
                      setPage((p) => Math.min(totalPages, p + 1));
                      setExpandedId(null);
                    }}
                    disabled={!hasNextPage}
                    className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-muted disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
          {/* ── end Orders panel ── */}

          {/* ── Right: Wallet panel ── */}
          <WalletPanel orders={allOrders} />
        </div>
        {/* ── end grid ── */}
      </div>
    </div>
  );
}
