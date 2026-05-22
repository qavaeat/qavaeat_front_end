"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Bike,
  ShoppingBag,
  UtensilsCrossed,
  MapPin,
  CalendarDays,
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
  { label: string; pill: string; icon: React.ElementType; progress: number }
> = {
  PENDING: {
    label: "Pending",
    pill: "bg-muted text-muted-foreground",
    icon: Clock,
    progress: 10,
  },
  CONFIRMED: {
    label: "Confirmed",
    pill: "bg-primary/10 text-primary",
    icon: CheckCircle2,
    progress: 30,
  },
  PREPARING: {
    label: "Preparing",
    pill: "bg-secondary/20 text-secondary-foreground",
    icon: ChefHat,
    progress: 60,
  },
  READY: {
    label: "Ready",
    pill: "bg-chart-3/10 text-chart-3",
    icon: Gift,
    progress: 85,
  },
  OUT_FOR_DELIVERY: {
    label: "Out for delivery",
    pill: "bg-primary/10 text-primary",
    icon: Bike,
    progress: 92,
  },
  DELIVERED: {
    label: "Delivered",
    pill: "bg-chart-3/20 text-chart-3",
    icon: Package,
    progress: 100,
  },
  CANCELLED: {
    label: "Cancelled",
    pill: "bg-muted text-muted-foreground",
    icon: XCircle,
    progress: 0,
  },
  FAILED: {
    label: "Failed",
    pill: "bg-destructive/10 text-destructive",
    icon: HeartCrack,
    progress: 0,
  },
};

const PAGE_SIZE = 6;
const TERMINAL_STATUSES = new Set(["DELIVERED", "CANCELLED", "FAILED"]);

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

/** Returns only relative date labels — no times */
function formatDate(iso: string): string {
  const ymd = toLocalYMD(iso);
  const diff = dayDiff(ymd);

  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff < 0) {
    const n = Math.abs(diff);
    return `${n} day${n === 1 ? "" : "s"} ago`;
  }
  if (diff <= 6) return `In ${diff} day${diff === 1 ? "" : "s"}`;

  const dt = new Date(ymd.y, ymd.m, ymd.d);
  return dt.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Misc helpers ─────────────────────────────────────────────────────────────

function orderSource(order: Order): "SCHEDULE" | "MEAL_PLAN" | "DIRECT" {
  if (order.source === "SCHEDULE") return "SCHEDULE";
  if (order.source === "MEAL_PLAN") return "MEAL_PLAN";
  return "DIRECT";
}

// ─── OrderCard ────────────────────────────────────────────────────────────────

function OrderCard({ order, index }: { order: Order; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const source = orderSource(order);
  const status = STATUS_CONFIG[order.status] ?? STATUS_CONFIG["PENDING"]!;
  const isActive = !TERMINAL_STATUSES.has(order.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Live progress bar */}
      {isActive && (
        <div className="h-0.5 bg-muted">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${status.progress}%` }}
            transition={{ duration: 0.8, delay: index * 0.06 + 0.2 }}
            className="h-full bg-primary"
          />
        </div>
      )}

      <div className="p-4 sm:p-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center">
              {order.business.logoUrl ? (
                <img
                  src={order.business.logoUrl}
                  alt={order.business.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UtensilsCrossed className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-foreground">{order.business.name}</p>
              <p className="text-[10px] text-muted-foreground">{order.business.city}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
            <span
              className={`text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                source === "SCHEDULE"
                  ? "bg-primary/10 text-primary"
                  : source === "MEAL_PLAN"
                    ? "bg-secondary/20 text-secondary-foreground"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {source === "SCHEDULE" ? (
                <><CalendarRange className="w-2.5 h-2.5" /> Schedule</>
              ) : source === "MEAL_PLAN" ? (
                <><Salad className="w-2.5 h-2.5" /> Meal Plan</>
              ) : (
                <><ShoppingCart className="w-2.5 h-2.5" /> Direct</>
              )}
            </span>
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 ${status.pill}`}>
              <status.icon className="w-3 h-3" />
              {status.label}
            </span>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-2 mb-3">
          {order.items.slice(0, expanded ? undefined : 2).map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0"
            >
              <div className="w-9 h-9 rounded-lg bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center">
                {item.menuItem?.imageUrl ? (
                  <img
                    src={item.menuItem.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UtensilsCrossed className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{item.name}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-[10px] text-muted-foreground">×{item.quantity}</span>
                  {item.mealTime && (
                    <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full capitalize">
                      {item.mealTime.charAt(0) + item.mealTime.slice(1).toLowerCase()}
                    </span>
                  )}
                  {item.plannedDate && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <CalendarDays className="w-2.5 h-2.5" />
                      {formatDate(item.plannedDate)}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xs font-black text-foreground flex-shrink-0">
                KES {item.subtotal.toLocaleString()}
              </span>
            </div>
          ))}

          {order.items.length > 2 && !expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="text-[10px] text-primary font-bold hover:underline w-full text-center py-1"
            >
              +{order.items.length - 2} more item{order.items.length - 2 !== 1 ? "s" : ""}
            </button>
          )}
          {expanded && order.items.length > 2 && (
            <button
              onClick={() => setExpanded(false)}
              className="text-[10px] text-muted-foreground font-bold hover:underline w-full text-center py-1"
            >
              Show less
            </button>
          )}
        </div>

        {/* Meta row — no times, only relative dates */}
        <div className="flex items-center gap-3 flex-wrap text-[10px] text-muted-foreground mb-3">
          <span className="flex items-center gap-1 font-semibold">
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
            <span className="flex items-center gap-1 truncate max-w-xs">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              {order.deliveryAddress}
            </span>
          )}

          <span className="ml-auto">{formatDate(order.createdAt)}</span>
        </div>

        {/* Bottom: order ID + total */}
        <div className="flex items-center justify-between pt-3 border-t border-border/60">
          <div>
            <p className="text-[10px] text-muted-foreground">Order ID</p>
            <p className="text-xs font-mono font-bold text-foreground">
              #{order.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Total paid</p>
            <p className="text-base font-black text-primary">
              KES {order.total.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      }).toString();

      const res = await fetch(`/api/orders?${qs}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load orders (${res.status})`);

      const json = (await res.json()) as {
        data?: Order[];
        meta?: PaginationMeta;
      };

      setOrders(json.data ?? []);
      setMeta(json.meta ?? null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="relative border-b border-border overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "radial-gradient(circle, var(--foreground) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-black px-3 py-1 rounded-full
              bg-primary/10 text-primary border border-primary/20 mb-3"
            >
              <Receipt className="w-3 h-3" />
              My Orders
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight leading-tight">
              Order History
            </h1>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Your scheduled meals and meal plan subscriptions — all in one place.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Toolbar: total count + refresh */}
        <div className="flex items-center justify-between gap-3">
          {meta && (
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{meta.total}</span> order{meta.total !== 1 ? "s" : ""}
            </p>
          )}
          <button
            onClick={() => void load()}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground
              border border-border rounded-xl px-3 py-2 bg-background hover:bg-muted transition-colors
              disabled:opacity-50 ml-auto"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Content */}
        {error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <AlertCircle className="w-8 h-8 text-destructive" />
            <p className="text-sm text-destructive font-semibold">{error}</p>
            <Button variant="outline" onClick={() => void load()} className="rounded-xl text-xs">
              Try again
            </Button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-background rounded-2xl border border-border p-5 space-y-3 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-muted rounded-xl flex-shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 bg-muted rounded w-3/4" />
                    <div className="h-2.5 bg-muted rounded w-1/2" />
                  </div>
                </div>
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-2/3" />
                <div className="flex justify-between pt-2 border-t border-border">
                  <div className="h-3 bg-muted rounded w-20" />
                  <div className="h-4 bg-muted rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
              <ClipboardList className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-black text-foreground">No orders yet</p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Once you schedule meals or subscribe to a meal plan, your orders will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {orders.map((order, i) => (
                  <OrderCard key={order.id} order={order} index={i} />
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  Showing{" "}
                  <span className="font-semibold text-foreground">
                    {(meta.page - 1) * meta.limit + 1}–
                    {Math.min(meta.page * meta.limit, meta.total)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-foreground">{meta.total}</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!meta.hasPrevPage}
                    className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center
                      hover:bg-primary/90 disabled:opacity-40 shadow-md transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-bold text-foreground px-2">
                    {meta.page} / {meta.totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                    disabled={!meta.hasNextPage}
                    className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center
                      hover:bg-primary/90 disabled:opacity-40 shadow-md transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}