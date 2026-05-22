"use client";


import { useEffect, useState, useCallback } from "react";
import { BusinessStatus } from "@/types/admin";



const EAT_OFFSET_MS = 3 * 60 * 60 * 1000;


function utcKeyToEAT(key: string): Date {
 
  const utcMidnight = new Date(`${key}T00:00:00Z`);
  return new Date(utcMidnight.getTime() + EAT_OFFSET_MS);
}


function formatEAT(
  isoString: string,
  opts: Intl.DateTimeFormatOptions,
): string {
  return new Date(isoString).toLocaleString("en-KE", {
    ...opts,
    timeZone: "Africa/Nairobi",
  });
}

/** Short label for a daily bar: "Mon 12" */
function barLabel(key: string): string {
  const d = utcKeyToEAT(key);
  return d.toLocaleDateString("en-KE", {
    timeZone: "Africa/Nairobi",
    weekday: "short",
    day: "numeric",
  });
}

/** Full tooltip label: "Mon, 12 May · KES 4,200" */
function tooltipLabel(key: string, amount: number): string {
  const d = utcKeyToEAT(key);
  const dateStr = d.toLocaleDateString("en-KE", {
    timeZone: "Africa/Nairobi",
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return `${dateStr} · KES ${amount.toLocaleString()}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface DailyPoint {
  date: string; // "YYYY-MM-DD" UTC day key from backend
  amount: number;
}

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalSubscriptions: number;
  averageOrderValue: number;
  dailyRevenue: DailyPoint[];
  ordersByStatus: { status: string; count: number }[];
  recentOrders: {
    id: string;
    total: number;
    status: string;
    createdAt: string; // UTC ISO string
  }[];
}

interface Props {
  businessId: string;
  status: BusinessStatus;
}

type Range = "1" | "7" | "30" | "90";

const RANGE_LABELS: Record<Range, string> = {
  "1": "Today",
  "7": "7 days",
  "30": "30 days",
  "90": "90 days",
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: "text-amber-500",
  CONFIRMED: "text-blue-500",
  PREPARING: "text-purple-500",
  READY: "text-indigo-500",
  DELIVERED: "text-green-600",
  CANCELLED: "text-red-500",
  FAILED: "text-gray-500",
  OUT_FOR_DELIVERY: "text-teal-500",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function BusinessAnalyticsPanel({ businessId, status }: Props) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<Range>("30");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const fetchAnalytics = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/admin/businesses/${businessId}/analytics?days=${range}`,
          { signal },
        );
        if (!res.ok) throw new Error("Failed to load analytics");
        const json = (await res.json()) as { data?: AnalyticsData };
        setData(json.data ?? null);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(
          err instanceof Error ? err.message : "Failed to load analytics",
        );
      } finally {
        setLoading(false);
      }
    },
    [businessId, range],
  );

  useEffect(() => {
    const controller = new AbortController();
    void fetchAnalytics(controller.signal);
    return () => controller.abort();
  }, [fetchAnalytics]);

  // ── Pending placeholder ───────────────────────────────────────────────────
  if (status === "PENDING") {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center">
          <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        </div>
        <p className="font-semibold text-[var(--foreground)]">No Analytics Yet</p>
        <p className="text-sm text-[var(--muted-foreground)] max-w-xs">
          Revenue data will appear here once this business is approved and starts receiving orders.
        </p>
      </div>
    );
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-[var(--muted)]" />
          ))}
        </div>
        <div className="h-44 rounded-xl bg-[var(--muted)]" />
        <div className="h-32 rounded-xl bg-[var(--muted)]" />
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-2xl">⚠️</div>
        <p className="text-sm text-[var(--muted-foreground)]">{error}</p>
        <button
          onClick={() => void fetchAnalytics(new AbortController().signal)}
          className="px-4 py-2 text-xs rounded-lg bg-[var(--primary)] text-white font-semibold hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-sm text-[var(--muted-foreground)]">No data available.</p>
      </div>
    );
  }

  // ── Chart computations ────────────────────────────────────────────────────
  const points = data.dailyRevenue;
  const maxAmt = Math.max(...points.map((p) => p.amount), 1);
  // For "today" (1d), show hourly buckets if we only have 1 point
  const showAllPoints = points.length <= 7;

  // Y-axis grid lines (4 lines)
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((frac) =>
    Math.round(maxAmt * frac),
  );

  const totalOrdersAll = data.ordersByStatus.reduce((a, b) => a + b.count, 0) || 1;

  return (
    <div className="space-y-5">

      {/* ── Range selector ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-[var(--muted)] p-1 rounded-xl w-fit">
        {(["1", "7", "30", "90"] as Range[]).map((r) => (
          <button
            key={r}
            onClick={() => { setRange(r); setHoveredIndex(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              range === r
                ? "bg-[var(--card)] text-[var(--primary)] shadow-sm"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            {RANGE_LABELS[r]}
          </button>
        ))}
      </div>

      {/* ── KPI strip ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <KPICard
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          label="Revenue"
          value={`KES ${data.totalRevenue.toLocaleString()}`}
          color="text-green-600"
          bg="bg-green-50"
          iconColor="text-green-600"
        />
        <KPICard
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
          label="Orders"
          value={data.totalOrders.toLocaleString()}
          color="text-[var(--primary)]"
          bg="bg-red-50"
          iconColor="text-[var(--primary)]"
        />
        <KPICard
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
          label="Subscriptions"
          value={data.totalSubscriptions.toLocaleString()}
          color="text-blue-600"
          bg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <KPICard
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
          label="Avg Order"
          value={`KES ${Math.round(data.averageOrderValue).toLocaleString()}`}
          color="text-purple-600"
          bg="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* ── Revenue bar chart ───────────────────────────────────────────────── */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
            Daily Income · EAT
          </h4>
          {hoveredIndex !== null && points[hoveredIndex] && (
            <span className="text-xs font-semibold text-[var(--primary)]">
              {tooltipLabel(points[hoveredIndex].date, points[hoveredIndex].amount)}
            </span>
          )}
        </div>

        {points.length === 0 ? (
          <div className="h-44 bg-[var(--muted)] rounded-xl flex items-center justify-center">
            <p className="text-sm text-[var(--muted-foreground)]">No revenue in this period</p>
          </div>
        ) : (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 select-none">
            {/* Y-axis labels + bars */}
            <div className="flex gap-2">
              {/* Y labels */}
              <div className="flex flex-col-reverse justify-between w-12 text-right pr-2 py-0.5" style={{ height: 140 }}>
                {gridLines.map((v, i) => (
                  <span key={i} className="text-[10px] text-[var(--muted-foreground)] leading-none">
                    {v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : v}
                  </span>
                ))}
              </div>

              {/* Chart area */}
              <div className="flex-1 relative" style={{ height: 140 }}>
                {/* Grid lines */}
                {gridLines.map((_, i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 border-t border-[var(--border)]"
                    style={{ bottom: `${(i / (gridLines.length - 1)) * 100}%` }}
                  />
                ))}

                {/* Bars */}
                <div className="absolute inset-0 flex items-end gap-px">
                  {points.map((pt, i) => {
                    const pct = Math.max((pt.amount / maxAmt) * 100, pt.amount > 0 ? 3 : 0);
                    const isHovered = hoveredIndex === i;
                    const hasRevenue = pt.amount > 0;
                    return (
                      <div
                        key={pt.date}
                        className="flex-1 flex flex-col justify-end cursor-pointer h-full"
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      >
                        <div
                          className={`w-full rounded-t transition-all duration-150 ${
                            !hasRevenue
                              ? "bg-[var(--border)]"
                              : isHovered
                              ? "bg-[var(--primary)]"
                              : "bg-[var(--primary)] opacity-60"
                          }`}
                          style={{ height: hasRevenue ? `${pct}%` : "2px" }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* X-axis labels — only when there are ≤7 points or every 7th otherwise */}
            <div className="flex gap-px mt-1 ml-14">
              {points.map((pt, i) => {
                const showLabel =
                  showAllPoints ||
                  i === 0 ||
                  i === points.length - 1 ||
                  i % Math.ceil(points.length / 6) === 0;
                return (
                  <div key={pt.date} className="flex-1 text-center">
                    {showLabel && (
                      <span
                        className={`text-[9px] leading-none transition-colors ${
                          hoveredIndex === i
                            ? "text-[var(--primary)] font-semibold"
                            : "text-[var(--muted-foreground)]"
                        }`}
                      >
                        {barLabel(pt.date)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer: timezone note */}
            <p className="text-[10px] text-[var(--muted-foreground)] mt-2 text-right">
              All times in EAT (UTC+3 · Nairobi)
            </p>
          </div>
        )}
      </div>

      {/* ── Orders by status ────────────────────────────────────────────────── */}
      {data.ordersByStatus.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-3">
            Orders by Status
          </h4>
          <div className="space-y-2.5">
            {data.ordersByStatus
              .sort((a, b) => b.count - a.count)
              .map((item) => {
                const pct = Math.round((item.count / totalOrdersAll) * 100);
                return (
                  <div key={item.status} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${STATUS_COLOR[item.status] ?? "text-[var(--foreground)]"}`}>
                        {item.status.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {item.count} · {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--primary)] rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ── Recent orders ───────────────────────────────────────────────────── */}
      {data.recentOrders.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-3">
            Recent Orders · EAT
          </h4>
          <div className="space-y-1.5">
            {data.recentOrders.slice(0, 5).map((o) => (
              <div
                key={o.id}
                className="flex items-center gap-3 bg-[var(--muted)] rounded-xl px-3 py-2.5"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-[var(--muted-foreground)] truncate">
                    #{o.id.slice(-8)}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {formatEAT(o.createdAt, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span className={`text-xs font-semibold ${STATUS_COLOR[o.status] ?? ""}`}>
                  {o.status.replace(/_/g, " ")}
                </span>
                <span className="text-sm font-bold text-[var(--foreground)] tabular-nums">
                  KES {o.total.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KPICard({
  icon,
  label,
  value,
  color,
  bg,
  iconColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bg: string;
  iconColor: string;
}) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-3.5 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg ${bg} ${iconColor} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className={`text-base font-bold ${color} truncate`}>{value}</p>
        <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
      </div>
    </div>
  );
}