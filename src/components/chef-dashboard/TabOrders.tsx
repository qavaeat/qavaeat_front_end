
"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search, ChevronLeft, ChevronRight, Filter,
  ClipboardList, ChefHat, CheckCircle2, Download,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Order } from "./types";

type OrderFilter = "All Orders" | "Upcoming" | "Pending" | "Completed";
type SortOption = "Latest Order" | "Oldest Order" | "Highest Amount";

const LOCATIONS = [
  "78th Avenue, Westlands, Nairobi",
  "4th Avenue, Parklands, Nairobi",
  "Kilimani Road, Nairobi",
  "Kahawa West, Nairobi",
  "South B, Nairobi",
];

const DUMMY_ORDERS: Order[] = Array.from({ length: 28 }, (_, i) => ({
  id: `QE ${10000 + i * 37}`,
  customerName: ["John Waswa", "Peter Muli", "Emma Oketch", "Eunice Wendo", "Sarah Kim"][i % 5],
  customerPhone: "07346382729",
  customerAvatarUrl: null,
  item: ["Grilled Chicken Nuggets", "Herb Roasted Salmon", "Spaghetti Carbonara", "Vitality Veggie Bowl"][i % 4],
  itemImageUrl: null,
  mealTime: (["BREAKFAST", "LUNCH", "DINNER"] as const)[i % 3],
  amount: [645, 890, 520, 750, 1200][i % 5],
  date: i < 8 ? "Today" : i < 14 ? "Yesterday" : `${i} days ago`,
  time: ["8:00 AM", "11:15 AM", "12:30 PM", "1:30 PM", "2:00 PM", "8:30 PM"][i % 6],
  location: LOCATIONS[i % 5],
  expectedDeliveryTime: ["12:45 PM", "2:00 PM", "8:30 PM", "12:45 PM", "7:45 PM", "9:00 AM"][i % 6],
  status: (["delivered", "delivered", "pending", "preparing", "cancelled"] as const)[i % 5],
}));

const STATUS_STYLES: Record<Order["status"], { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-secondary", text: "text-secondary-foreground", label: "Pending" },
  preparing: { bg: "bg-primary/10", text: "text-primary", label: "Preparing" },
  delivered: { bg: "bg-[#007606]", text: "text-white", label: "Completed" },
  cancelled: { bg: "bg-muted", text: "text-muted-foreground", label: "Cancelled" },
};

const FILTER_MAP: Record<OrderFilter, (o: Order) => boolean> = {
  "All Orders": () => true,
  "Upcoming": (o) => o.status === "preparing",
  "Pending": (o) => o.status === "pending",
  "Completed": (o) => o.status === "delivered",
};

const PAGE_SIZE = 7;

export function TabOrders() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<OrderFilter>("All Orders");
  const [sort, setSort] = useState<SortOption>("Latest Order");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showSort, setShowSort] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSort(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = DUMMY_ORDERS.filter((o) => {
    const matchSearch =
      search === "" ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.item.toLowerCase().includes(search.toLowerCase()) ||
      o.location.toLowerCase().includes(search.toLowerCase());
    return matchSearch && FILTER_MAP[filter](o);
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === paginated.length) setSelected(new Set());
    else setSelected(new Set(paginated.map((o) => o.id)));
  };

  const FILTERS: OrderFilter[] = ["All Orders", "Upcoming", "Pending", "Completed"];
  const SORTS: SortOption[] = ["Latest Order", "Oldest Order", "Highest Amount"];

  // Stats
  const newToday = DUMMY_ORDERS.filter((o) => o.date === "Today").length;
  const inPrep = DUMMY_ORDERS.filter((o) => o.status === "preparing").length;
  const completed = DUMMY_ORDERS.filter((o) => o.status === "delivered").length;

  return (
    <div className="space-y-4">
      {/* Top search bar row */}
      <div className="flex items-center gap-3 justify-end">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search orders..."
            className="pl-9 rounded-full border-border bg-background"
          />
        </div>
        <button className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors">
          <Filter className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Stats bar */}
      <div className="bg-background rounded-2xl border border-border flex flex-wrap divide-x divide-border overflow-hidden">
        {[
          { icon: ClipboardList, value: newToday, label: "New Orders Today", color: "#F4CD2E", iconBg: "#8E771B" },
          { icon: ChefHat, value: inPrep, label: "In Preparation", color: "#DD3131", iconBg: "#DD3131" },
          { icon: CheckCircle2, value: completed, label: "Orders Completed", color: "#007606", iconBg: "#007606" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="flex items-center gap-4 px-6 py-4 flex-1 min-w-[160px]">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${stat.iconBg}20` }}>
                <Icon className="w-6 h-6" style={{ color: stat.iconBg }} />
              </div>
              <div>
                <p className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          );
        })}
        {/* Sort by */}
        <div ref={sortRef} className="flex items-center gap-3 px-6 py-4 flex-shrink-0 relative">
          <span className="text-xs text-muted-foreground font-medium">Sort by:</span>
          <button
            onClick={() => setShowSort((p) => !p)}
            className="flex items-center gap-2 text-sm font-semibold text-foreground border border-border rounded-xl px-3 py-1.5 hover:bg-muted transition-colors"
          >
            {sort}
            <ChevronLeft className={`w-3 h-3 transition-transform duration-200 ${showSort ? "rotate-90" : "-rotate-90"}`} />
          </button>
          {showSort && (
            <div className="absolute right-4 top-full mt-1 w-44 bg-background border border-border rounded-xl shadow-xl overflow-hidden z-50">
              {SORTS.map((s) => (
                <button key={s} onClick={() => { setSort(s); setShowSort(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    sort === s ? "text-primary font-semibold bg-primary/5" : "text-foreground hover:bg-muted"
                  }`}>{s}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table card */}
      <div className="bg-background rounded-2xl border border-border overflow-hidden shadow-sm">
        {/* Table toolbar */}
        <div className="flex items-center gap-3 px-4 sm:px-5 py-3 border-b border-border flex-wrap">
          <Button variant="outline" className="rounded-full border-border text-sm flex items-center gap-2 h-8 px-4">
            <Download className="w-3.5 h-3.5" />
            Export
          </Button>
          <div className="flex items-center gap-1 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => { setFilter(f); setPage(1); }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 ${
                  filter === f
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/30 hover:text-primary bg-background"
                }`}
              >
                {f === "All Orders" ? `All Orders (${DUMMY_ORDERS.length})` : f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={selected.size === paginated.length && paginated.length > 0}
                    onChange={toggleAll}
                    className="rounded border-border accent-primary"
                  />
                </th>
                {["Order ID", "Customer", "Order Details", "Expected Delivery", "Location", "Status"].map((h) => (
                  <th key={h} className="text-left text-xs font-bold text-muted-foreground px-4 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((order, i) => {
                const st = STATUS_STYLES[order.status];
                return (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.03 }}
                    className={`border-b border-border/50 last:border-0 transition-colors ${
                      selected.has(order.id) ? "bg-primary/5" : "hover:bg-muted/20"
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={selected.has(order.id)}
                        onChange={() => toggleSelect(order.id)}
                        className="rounded border-border accent-primary"
                      />
                    </td>
                    {/* Order ID */}
                    <td className="px-4 py-3.5 text-xs font-mono font-semibold text-foreground whitespace-nowrap">
                      {order.id}
                    </td>
                    {/* Customer */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-black text-muted-foreground flex-shrink-0 overflow-hidden">
                          {order.customerName[0]}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground whitespace-nowrap">{order.customerName}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {"customerPhone" in order ? (order as Order & { customerPhone: string }).customerPhone : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    {/* Order Details — item image + name */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-lg flex-shrink-0">
                          🍽️
                        </div>
                        <p className="text-xs font-semibold text-foreground max-w-[120px] leading-tight">{order.item}</p>
                      </div>
                    </td>
                    {/* Expected Delivery */}
                    <td className="px-4 py-3.5">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-foreground">{order.date}</span>
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full capitalize">
                            {order.mealTime.charAt(0) + order.mealTime.slice(1).toLowerCase()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{order.expectedDeliveryTime}</p>
                      </div>
                    </td>
                    {/* Location */}
                    <td className="px-4 py-3.5 text-xs text-foreground max-w-[140px]">
                      <p className="leading-snug">{order.location}</p>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] px-3 py-1 rounded-full font-bold whitespace-nowrap ${st.bg} ${st.text}`}>
                        {st.label}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-14 text-sm text-muted-foreground">No orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-3 px-4 py-4 border-t border-border">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-muted-foreground font-medium">{page} out of {totalPages || 1}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}
            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}