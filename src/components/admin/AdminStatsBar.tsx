"use client";


import { useEffect, useState } from "react";
import {
  Clock,
  ChefHat,
  ShieldOff,
  TrendingUp,
  ShoppingBag,
} from "lucide-react";
import { AdminStats } from "../../types/admin";

const CARDS = (stats: AdminStats) => [
  {
    label: "Pending Review",
    value: stats.pendingApplications,
    Icon: Clock,
    accent: "#d97706",
    bg: "rgba(251,191,36,0.08)",
    border: "rgba(251,191,36,0.25)",
  },
  {
    label: "Active Chefs",
    value: stats.approvedBusinesses,
    Icon: ChefHat,
    accent: "#16a34a",
    bg: "rgba(34,197,94,0.08)",
    border: "rgba(34,197,94,0.25)",
  },
  {
    label: "Suspended",
    value: stats.suspendedBusinesses,
    Icon: ShieldOff,
    accent: "var(--primary, #dc2626)",
    bg: "rgba(220,38,38,0.08)",
    border: "rgba(220,38,38,0.25)",
  },
  {
    label: "Monthly Revenue",
    value: `KES ${(stats.monthlyRevenue / 1000).toFixed(1)}K`,
    Icon: TrendingUp,
    accent: "#7c3aed",
    bg: "rgba(124,58,237,0.08)",
    border: "rgba(124,58,237,0.25)",
  },
  {
    label: "Total Orders",
    value: stats.totalOrders.toLocaleString(),
    Icon: ShoppingBag,
    accent: "var(--foreground)",
    bg: "var(--muted)",
    border: "var(--border)",
  },
];

export default function AdminStatsBar() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => setStats(d.data ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-[var(--muted)] animate-pulse" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cards = CARDS(stats);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="relative overflow-hidden rounded-2xl p-4 border flex flex-col gap-3"
          style={{ background: c.bg, borderColor: c.border }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: `${c.accent}18` }}
          >
            <c.Icon
              size={18}
              strokeWidth={1.75}
              style={{ color: c.accent }}
            />
          </div>
          <div>
            <p
              className="text-xl font-bold tabular-nums leading-none mb-1"
              style={{ color: c.accent }}
            >
              {c.value}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">{c.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}