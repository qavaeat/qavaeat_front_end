import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ChefHat,
  CheckCircle2,
  Download,
  ChevronDown,
  RefreshCw,
  Bike,
  ShoppingBag,
  UtensilsCrossed,
  Calendar,
  AlertCircle,
  Clock,
  Phone,
  Mail,
  MapPin,
  StickyNote,
  TrendingUp,
  XCircle,
  Utensils,
  Package,
} from "lucide-react";
import { Input } from "@/components/ui/input";
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
  menuItem: {
    id: string;
    name: string;
    imageUrl: string | null;
    category?: string | null;
    description?: string | null;
  } | null;
  status?: string | null;
  specialInstructions?: string | null;
  source?: "SCHEDULE_ITEM" | "MEAL_INSTANCE" | "ORDER_ITEM" | null;
}

interface Order {
  id: string;
  status: string;
  paymentStatus: string;
  serviceType: string;
  deliveryType: string;
  deliveryAddress: string | null;
  deliveryLat: number | null;
  deliveryLng: number | null;
  scheduledAt: string | null;
  subtotal: number;
  deliveryFee?: number;
  discount?: number;
  total: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  business: { id: string; name: string; city: string; logoUrl: string | null };
  items: OrderItem[];
  user?: {
    email: string;
    profile: {
      firstName: string | null;
      lastName: string | null;
      phone: string | null;
      avatarUrl?: string | null;
    } | null;
  };
}

interface OrderStats {
  newToday: number;
  preparing: number;
  delivered: number;
  confirmed: number;
  ready: number;
  cancelled: number;
  scheduleInProgress: number;
  scheduleCompleted: number;
  missedMeals: number;
  totalRevenue?: number;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface ApiResponse {
  data: Order[];
  meta: PaginationMeta;
  stats: OrderStats;
}

// ─── Constants ────────────────────────────────────────────────────────────────

type SortOption = "newest" | "oldest" | "highest";

const DEFAULT_STATS: OrderStats = {
  newToday: 0,
  preparing: 0,
  delivered: 0,
  confirmed: 0,
  ready: 0,
  cancelled: 0,
  scheduleInProgress: 0,
  scheduleCompleted: 0,
  missedMeals: 0,
  totalRevenue: 0,
};

const PAGE_SIZE = 10;
const POLL_INTERVAL_MS = 20_000;

// ─── Utilities ────────────────────────────────────────────────────────────────

/** An order is considered "delivered" if its status is DELIVERED OR every item is individually DELIVERED */
function isOrderDelivered(order: Order): boolean {
  if (order.status === "DELIVERED") return true;
  if (order.items.length === 0) return false;
  const isDirectOrder = order.items.every((i) => i.source === "ORDER_ITEM");
  if (isDirectOrder) return order.status === "DELIVERED";
  return order.items.every((i) => i.status === "DELIVERED");
}

/** Sort: today first (by createdAt), then by recency descending */
function sortOrdersDefault(orders: Order[]): Order[] {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  return [...orders].sort((a, b) => {
    const aDate = new Date(a.createdAt);
    const bDate = new Date(b.createdAt);
    const aIsToday = aDate >= todayStart;
    const bIsToday = bDate >= todayStart;

    if (aIsToday && !bIsToday) return -1;
    if (!aIsToday && bIsToday) return 1;
    return bDate.getTime() - aDate.getTime(); // newest first within same day bucket
  });
}

function customerName(order: Order): string {
  const p = order.user?.profile;
  if (p?.firstName || p?.lastName)
    return `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();
  return order.user?.email?.split("@")[0] ?? "Guest";
}

function customerInitials(order: Order): string {
  const n = customerName(order);
  const parts = n.split(" ");
  return parts.length >= 2
    ? `${parts[0]![0]}${parts[1]![0]}`.toUpperCase()
    : n.slice(0, 2).toUpperCase();
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.floor((today.getTime() - day.getTime()) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: diff > 365 ? "numeric" : undefined,
  });
}

function fmtTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString("en-KE", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Africa/Nairobi",
    });
  } catch {
    return "—";
  }
}

function fmtDateTime(iso: string): string {
  return `${fmtDate(iso)} · ${fmtTime(iso)}`;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return fmtDate(iso);
}

function orderSource(order: Order): "SCHEDULE" | "PLAN" | "DIRECT" {
  if (order.notes?.startsWith("Schedule week:")) return "SCHEDULE";
  if (order.notes?.startsWith("Meal plan subscription:")) return "PLAN";
  return "DIRECT";
}

function mealTimeLabel(mt: string): string {
  const map: Record<string, string> = {
    BREAKFAST: "Breakfast",
    LUNCH: "Lunch",
    DINNER: "Dinner",
    SNACK: "Snack",
  };
  return map[mt] ?? mt.charAt(0) + mt.slice(1).toLowerCase();
}

// ─── DeliveryStatusBadge (read-only, two states) ─────────────────────────────

function DeliveryStatusBadge({ delivered }: { delivered: boolean }) {
  if (delivered) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full border bg-chart-3/10 text-chart-3 border-chart-3/30">
        <CheckCircle2 className="w-3 h-3" />
        Delivered
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full border bg-primary/10 text-primary border-primary/20">
      <XCircle className="w-3 h-3" />
      Not Delivered
    </span>
  );
}

// ─── ItemStatusBadge ──────────────────────────────────────────────────────────

function ItemStatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return null;
  const delivered = status === "DELIVERED";
  return (
    <span
      className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${
        delivered
          ? "bg-chart-3/10 text-chart-3 border-chart-3/20"
          : "bg-primary/10 text-primary border-primary/20"
      }`}
    >
      {delivered ? "Delivered" : status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

// ─── ExpandedOrderPanel ───────────────────────────────────────────────────────

function ExpandedOrderPanel({ order }: { order: Order }) {
  const source = orderSource(order);
  const delivered = isOrderDelivered(order);

  return (
    <tr className="bg-muted/30 border-b border-border">
      <td colSpan={10} className="px-0 py-0">
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.22, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="px-6 py-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ── Col 1: Order meta ─────────────────────────────── */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Order Details
              </h4>

              {/* Timestamps */}
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Clock className="w-3 h-3 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium">Order Placed</p>
                    <p className="text-xs font-bold text-foreground">
                      {new Date(order.createdAt).toLocaleDateString("en-KE", {
                        weekday: "short",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {fmtTime(order.createdAt)} · {relativeTime(order.createdAt)}
                    </p>
                  </div>
                </div>

                {order.scheduledAt && (
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-chart-3/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Calendar className="w-3 h-3 text-chart-3" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-medium">Scheduled Delivery</p>
                      <p className="text-xs font-bold text-foreground">
                        {new Date(order.scheduledAt).toLocaleDateString("en-KE", {
                          weekday: "short",
                          day: "numeric",
                          month: "long",
                        })}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{fmtTime(order.scheduledAt)}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                    <RefreshCw className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium">Last Updated</p>
                    <p className="text-xs font-semibold text-foreground">{fmtDateTime(order.updatedAt)}</p>
                  </div>
                </div>
              </div>

              {/* Customer */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Customer</h4>
                <div className="bg-muted/40 rounded-xl p-3 space-y-2 border border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">
                      {customerInitials(order)}
                    </div>
                    <p className="text-xs font-bold text-foreground">{customerName(order)}</p>
                  </div>
                  {order.user?.profile?.phone && (
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      {order.user.profile.phone}
                    </div>
                  )}
                  {order.user?.email && (
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{order.user.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery */}
              {(order.deliveryAddress || order.serviceType === "DELIVERY") && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Delivery</h4>
                  <div className="bg-muted/40 rounded-xl p-3 border border-border">
                    <div className="flex items-start gap-1.5 text-[10px] text-foreground">
                      <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span>{order.deliveryAddress ?? "No address provided"}</span>
                    </div>
                    {order.deliveryFee !== undefined && (
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        Delivery fee:{" "}
                        <span className="text-foreground font-semibold">KES {order.deliveryFee.toLocaleString()}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {order.notes && (
                <div className="flex items-start gap-2 bg-secondary/5 border border-secondary/20 rounded-xl p-3">
                  <StickyNote className="w-3 h-3 text-secondary-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-foreground leading-relaxed">{order.notes}</p>
                </div>
              )}
            </div>

            {/* ── Col 2-3: Items ────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Items · {order.items.length}
                </h4>
                <span className="text-[10px] text-muted-foreground">
                  {source === "SCHEDULE" ? "📅 Weekly Schedule" : source === "PLAN" ? "🗓 Meal Plan" : "🛒 Direct Order"}
                </span>
              </div>

              {/* Delivery progress notice */}
              {!delivered && order.items.some((i) => i.status === "DELIVERED") && (
                <div className="flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-xl px-3 py-2.5">
                  <AlertCircle className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-foreground">
                    {order.items.filter((i) => i.status === "DELIVERED").length} of {order.items.length} meal items delivered.
                    Order will auto-complete once all items are delivered.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 bg-card rounded-xl border border-border px-3.5 py-3 hover:border-primary/20 transition-colors"
                  >
                    <div className="w-11 h-11 rounded-lg bg-muted overflow-hidden flex items-center justify-center text-xl flex-shrink-0">
                      {item.menuItem?.imageUrl ? (
                        <img src={item.menuItem.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <Utensils className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{item.name}</p>
                          {item.menuItem?.category && (
                            <p className="text-[9px] text-muted-foreground mt-0.5">{item.menuItem.category}</p>
                          )}
                        </div>
                        <span className="text-xs font-black text-primary flex-shrink-0 whitespace-nowrap">
                          KES {item.subtotal.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-[9px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-semibold">
                          ×{item.quantity} · KES {item.price.toLocaleString()} each
                        </span>
                        {item.mealTime && (
                          <span className="text-[9px] bg-secondary/10 text-secondary-foreground px-2 py-0.5 rounded-full border border-secondary/20 font-semibold">
                            {mealTimeLabel(item.mealTime)}
                          </span>
                        )}
                        {item.plannedDate && (
                          <span className="text-[9px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" />
                            {fmtDate(item.plannedDate)}
                          </span>
                        )}
                        {item.status && <ItemStatusBadge status={item.status} />}
                      </div>

                      {item.specialInstructions && (
                        <p className="text-[9px] text-muted-foreground mt-1.5 italic">
                          &quot;{item.specialInstructions}&quot;
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="bg-muted/30 rounded-xl border border-border p-4 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-semibold text-foreground">KES {order.subtotal.toLocaleString()}</span>
                </div>
                {order.deliveryFee !== undefined && order.deliveryFee > 0 && (
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Delivery Fee</span>
                    <span className="font-semibold text-foreground">KES {order.deliveryFee.toLocaleString()}</span>
                  </div>
                )}
                {order.discount !== undefined && order.discount > 0 && (
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Discount</span>
                    <span className="font-semibold text-chart-3">−KES {order.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1.5 border-t border-border">
                  <span className="text-xs font-black text-foreground">Total</span>
                  <span className="text-sm font-black text-primary">KES {order.total.toLocaleString()}</span>
                </div>
              </div>

              {/* Badges row */}
              <div className="flex flex-wrap gap-2">
                <span
                  className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${
                    order.paymentStatus === "PAID"
                      ? "bg-chart-3/10 text-chart-3 border-chart-3/20"
                      : "bg-destructive/10 text-destructive border-destructive/20"
                  }`}
                >
                  {order.paymentStatus === "PAID" ? "✓ Paid" : `⚠ ${order.paymentStatus}`}
                </span>
                <span className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border flex items-center gap-1">
                  {order.serviceType === "DELIVERY" ? (
                    <><Bike className="w-2.5 h-2.5" /> Delivery</>
                  ) : order.serviceType === "PICKUP" ? (
                    <><ShoppingBag className="w-2.5 h-2.5" /> Pickup</>
                  ) : (
                    <><UtensilsCrossed className="w-2.5 h-2.5" /> Dine In</>
                  )}
                </span>
                {orderSource(order) !== "DIRECT" && (
                  <span
                    className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${
                      orderSource(order) === "SCHEDULE"
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-secondary/10 text-secondary-foreground border-secondary/20"
                    }`}
                  >
                    {orderSource(order) === "SCHEDULE" ? "Schedule" : "Meal Plan"}
                  </span>
                )}
                {/* Delivery status detail badge */}
                <DeliveryStatusBadge delivered={delivered} />
              </div>
            </div>
          </div>
        </motion.div>
      </td>
    </tr>
  );
}

// ─── OrderRow ─────────────────────────────────────────────────────────────────

function OrderRow({
  order,
  index,
  selected,
  expanded,
  onSelect,
  onExpand,
}: {
  order: Order;
  index: number;
  selected: boolean;
  expanded: boolean;
  onSelect: (id: string) => void;
  onExpand: (id: string) => void;
}) {
  const source = orderSource(order);
  const delivered = isOrderDelivered(order);

  return (
    <React.Fragment>
      <motion.tr
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: Math.min(index * 0.04, 0.3) }}
        className={`border-b transition-colors group cursor-pointer ${
          expanded
            ? "border-border bg-muted/20"
            : selected
              ? "border-border bg-primary/5"
              : "border-border hover:bg-muted/20"
        }`}
        onClick={() => onExpand(order.id)}
      >
        {/* Checkbox */}
        <td className="pl-4 pr-2 py-4" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(order.id)}
            className="rounded border-border accent-primary cursor-pointer"
          />
        </td>

        {/* Expand chevron */}
        <td className="px-2 py-4">
          <div
            className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
              expanded ? "bg-primary/10" : "bg-muted group-hover:bg-muted/80"
            }`}
          >
            <ChevronDown
              className={`w-3 h-3 transition-transform duration-200 ${
                expanded ? "rotate-180 text-primary" : "text-muted-foreground"
              }`}
            />
          </div>
        </td>

        {/* Order ID */}
        <td className="px-4 py-4">
          <p className="text-[11px] font-mono font-bold text-foreground">
            #{order.id.slice(0, 8).toUpperCase()}
          </p>
          <p className="text-[9px] text-muted-foreground mt-0.5 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            {relativeTime(order.createdAt)}
          </p>
        </td>

        {/* Customer */}
        <td className="px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-[9px] font-black text-primary border border-primary/20">
              {customerInitials(order)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate max-w-[110px]">
                {customerName(order)}
              </p>
              <p className="text-[9px] text-muted-foreground truncate max-w-[110px]">
                {order.user?.profile?.phone ?? order.user?.email ?? "—"}
              </p>
            </div>
          </div>
        </td>

        {/* Items summary */}
        <td className="px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-muted overflow-hidden flex items-center justify-center flex-shrink-0 border border-border">
              {order.items[0]?.menuItem?.imageUrl ? (
                <img src={order.items[0].menuItem.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <Utensils className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate max-w-[120px]">
                {order.items[0]?.name ?? "—"}
              </p>
              {order.items.length > 1 && (
                <p className="text-[9px] text-muted-foreground">
                  +{order.items.length - 1} item{order.items.length > 2 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
        </td>

        {/* Source */}
        <td className="px-4 py-4">
          <span
            className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${
              source === "SCHEDULE"
                ? "bg-primary/10 text-primary border-primary/20"
                : source === "PLAN"
                  ? "bg-secondary/10 text-secondary-foreground border-secondary/20"
                  : "bg-muted text-muted-foreground border-border"
            }`}
          >
            {source === "SCHEDULE" ? "Schedule" : source === "PLAN" ? "Meal Plan" : "Direct"}
          </span>
        </td>

        {/* Scheduled */}
        <td className="px-4 py-4">
          {order.scheduledAt ? (
            <div>
              <p className="text-[11px] font-semibold text-foreground">{fmtDate(order.scheduledAt)}</p>
              <p className="text-[9px] text-muted-foreground">{fmtTime(order.scheduledAt)}</p>
            </div>
          ) : (
            <span className="text-[11px] text-muted-foreground">—</span>
          )}
        </td>

        {/* Placed at */}
        <td className="px-4 py-4">
          <p className="text-[11px] font-semibold text-foreground">{fmtDate(order.createdAt)}</p>
          <p className="text-[9px] text-muted-foreground">{fmtTime(order.createdAt)}</p>
        </td>

        {/* Service */}
        <td className="px-4 py-4">
          <span className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground">
            {order.serviceType === "DELIVERY" ? (
              <><Bike className="w-3 h-3 text-primary" /><span className="text-primary">Delivery</span></>
            ) : order.serviceType === "PICKUP" ? (
              <><ShoppingBag className="w-3 h-3" /> Pickup</>
            ) : (
              <><UtensilsCrossed className="w-3 h-3" /> Dine In</>
            )}
          </span>
        </td>

        {/* Total */}
        <td className="px-4 py-4">
          <span className="text-xs font-black text-foreground whitespace-nowrap">
            KES {order.total.toLocaleString()}
          </span>
          <p className={`text-[8px] mt-0.5 font-bold ${order.paymentStatus === "PAID" ? "text-chart-3" : "text-destructive"}`}>
            {order.paymentStatus}
          </p>
        </td>

        {/* Delivery Status — read-only */}
        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
          <DeliveryStatusBadge delivered={delivered} />
        </td>
      </motion.tr>

      <AnimatePresence>
        {expanded && <ExpandedOrderPanel key={`exp-${order.id}`} order={order} />}
      </AnimatePresence>
    </React.Fragment>
  );
}

// ─── LiveStatCard ─────────────────────────────────────────────────────────────

function LiveStatCard({
  icon: Icon,
  value,
  label,
  colorClass,
  pulse,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
  colorClass: string;
  pulse?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 flex-1 min-w-[130px] relative">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-muted">
        <Icon className={`w-5 h-5 ${colorClass}`} />
      </div>
      <div>
        <motion.p
          key={value}
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: "backOut" }}
          className={`text-2xl font-black tabular-nums ${colorClass}`}
        >
          {value}
        </motion.p>
        <p className="text-[10px] text-muted-foreground font-medium">{label}</p>
      </div>
      {pulse && value > 0 && (
        <span className="absolute top-3 right-3 w-2 h-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
        </span>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TabOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [stats, setStats] = useState<OrderStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showSort, setShowSort] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node))
        setShowSort(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
        }).toString();

        const res = await fetch(`/api/orders/business?${qs}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Server error ${res.status}`);

        const json = (await res.json()) as ApiResponse;

        let data = json.data ?? [];

        // Apply sort: default is today-first + newest; other sorts override
        if (sort === "oldest") {
          data = [...data].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );
        } else if (sort === "highest") {
          data = [...data].sort((a, b) => b.total - a.total);
        } else {
          // "newest" → today first, then recency
          data = sortOrdersDefault(data);
        }

        setOrders(data);
        setMeta(json.meta ?? null);
        setStats(json.stats ?? DEFAULT_STATS);
        setLastUpdated(new Date());
      } catch (e) {
        setError((e as Error).message ?? "Unknown error");
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [page, debouncedSearch, sort],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const iv = setInterval(() => void load(true), POLL_INTERVAL_MS);
    return () => clearInterval(iv);
  }, [load]);

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const toggleAll = () =>
    setSelected(
      selected.size === orders.length && orders.length > 0
        ? new Set()
        : new Set(orders.map((o) => o.id)),
    );

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const SORTS: { val: SortOption; label: string }[] = [
    { val: "newest", label: "Today First" },
    { val: "oldest", label: "Oldest First" },
    { val: "highest", label: "Highest Amount" },
  ];

  // Derived counts for stats bar
  const deliveredCount = orders.filter((o) => isOrderDelivered(o)).length;
  const pendingCount = orders.filter((o) => !isOrderDelivered(o)).length;

  const SkeletonRow = () => (
    <tr className="border-b border-border animate-pulse">
      {Array.from({ length: 11 }).map((_, j) => (
        <td key={j} className="px-4 py-4">
          <div className="h-3 bg-muted rounded w-full" />
        </td>
      ))}
    </tr>
  );

  return (
    <div className="space-y-4 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-black text-foreground tracking-tight">Orders</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {lastUpdated
              ? `Live · updated ${lastUpdated.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}`
              : "Loading…"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search orders…"
              className="pl-9 rounded-full border-border bg-background text-foreground placeholder:text-muted-foreground h-9 text-xs w-52 focus:border-primary/50 focus:ring-primary/20"
            />
          </div>
          <button
            onClick={() => {
              setIsRefreshing(true);
              void load();
            }}
            className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="flex flex-wrap divide-x divide-border">
          <LiveStatCard
            icon={ChefHat}
            value={stats.preparing}
            label="Preparing"
            colorClass="text-primary"
          />
          <LiveStatCard
            icon={Package}
            value={pendingCount}
            label="Not Delivered"
            colorClass="text-primary"
            pulse
          />
          <LiveStatCard
            icon={CheckCircle2}
            value={deliveredCount}
            label="Delivered"
            colorClass="text-chart-3"
          />

          {/* Sort control */}
          <div ref={sortRef} className="flex items-center gap-2 px-5 py-4 flex-shrink-0 relative ml-auto">
            <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
            <button
              onClick={() => setShowSort((p) => !p)}
              className="flex items-center gap-1.5 text-xs font-semibold text-foreground border border-border
                rounded-xl px-3 py-1.5 hover:bg-muted transition-colors whitespace-nowrap"
            >
              {SORTS.find((s) => s.val === sort)?.label ?? "Sort"}
              <ChevronDown className={`w-3 h-3 transition-transform ${showSort ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {showSort && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-4 top-full mt-1 w-44 bg-popover border border-border rounded-xl shadow-xl overflow-hidden z-50"
                >
                  {SORTS.map((s) => (
                    <button
                      key={s.val}
                      onClick={() => {
                        setSort(s.val);
                        setShowSort(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs transition-colors ${
                        sort === s.val
                          ? "text-primary font-bold bg-primary/5"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border flex-wrap bg-card">
          <Button
            variant="outline"
            className="rounded-xl border-border hover:bg-muted text-foreground text-xs h-8 px-3 flex items-center gap-1.5"
          >
            <Download className="w-3 h-3" />
            Export
          </Button>

          {selected.size > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2"
            >
              <span className="text-xs text-primary font-semibold">{selected.size} selected</span>
              <button
                onClick={() => setSelected(new Set())}
                className="text-[10px] text-muted-foreground hover:text-foreground underline"
              >
                clear
              </button>
            </motion.div>
          )}

          {/* Total count */}
          {meta && (
            <span className="ml-auto text-[10px] text-muted-foreground">
              <span className="font-semibold text-foreground">{meta.total}</span> total orders
            </span>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-2 px-5 py-3 text-xs text-destructive bg-destructive/5 border-b border-destructive/10">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {error} —{" "}
            <button onClick={() => void load()} className="underline hover:text-destructive/80">
              retry
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="pl-4 pr-2 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={selected.size === orders.length && orders.length > 0}
                    onChange={toggleAll}
                    className="rounded border-border accent-primary"
                  />
                </th>
                {["", "Order ID", "Customer", "Items", "Source", "Scheduled", "Placed At", "Service", "Total", "Status"].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left text-[9px] font-black text-muted-foreground uppercase tracking-widest px-4 py-3 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonRow key={i} />)
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-20">
                    <div className="inline-flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                        <ClipboardList className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-foreground">No orders found</p>
                        <p className="text-xs text-muted-foreground mt-1">Orders will appear here after checkout</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order, i) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    index={i}
                    selected={selected.has(order.id)}
                    expanded={expanded.has(order.id)}
                    onSelect={toggleSelect}
                    onExpand={toggleExpand}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-border flex-wrap gap-3">
            <p className="text-xs text-muted-foreground">
              Showing{" "}
              <span className="font-semibold text-foreground">
                {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)}
              </span>{" "}
              of <span className="font-semibold text-foreground">{meta.total}</span> orders
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!meta.hasPrevPage}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, meta.totalPages) }).map((_, idx) => {
                  const p =
                    meta.totalPages <= 5
                      ? idx + 1
                      : meta.page <= 3
                        ? idx + 1
                        : meta.page >= meta.totalPages - 2
                          ? meta.totalPages - 4 + idx
                          : meta.page - 2 + idx;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                        p === meta.page
                          ? "bg-primary text-primary-foreground font-black"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={!meta.hasNextPage}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}