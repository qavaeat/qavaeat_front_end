"use client";


import { MapPin, Clock3, UtensilsCrossed, ChevronRight, Phone } from "lucide-react";
import { Business, BusinessStatus } from "@/types/admin";

interface StatusConfig { label: string; bg: string; text: string; dot: string; }

const STATUS_CONFIG: Record<BusinessStatus, StatusConfig> = {
  PENDING:   { label: "Pending Review", bg: "rgba(251,191,36,0.12)", text: "#b45309", dot: "#f59e0b" },
  APPROVED:  { label: "Approved",       bg: "rgba(34,197,94,0.1)",   text: "#15803d", dot: "#22c55e" },
  DECLINED:  { label: "Declined",       bg: "rgba(107,114,128,0.1)", text: "#6b7280", dot: "#9ca3af" },
  SUSPENDED: { label: "Suspended",      bg: "rgba(220,38,38,0.1)",   text: "#dc2626", dot: "#ef4444" },
};

const FALLBACK: StatusConfig = {
  label: "Unknown", bg: "rgba(107,114,128,0.1)", text: "#6b7280", dot: "#9ca3af",
};

export default function ChefCard({
  business, onClick,
}: {
  business: Business;
  onClick: () => void;
}) {
  const cfg = STATUS_CONFIG[business.status as BusinessStatus] ?? FALLBACK;

  const initials = business.name
    .split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const date = new Date(business.createdAt).toLocaleDateString("en-KE", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--primary)] hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          {business.logoUrl ? (
            <img src={business.logoUrl} alt={business.name}
              className="w-12 h-12 rounded-xl object-cover border border-[var(--border)]"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-[var(--primary)] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-bold text-[var(--foreground)] text-sm truncate group-hover:text-[var(--primary)] transition-colors">
              {business.name}
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] truncate mt-0.5">
              {business.chef.email}
            </p>
          </div>
        </div>

        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
          style={{ background: cfg.bg, color: cfg.text }}
        >
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
          {cfg.label}
        </span>
      </div>

      {/* Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          <MapPin size={13} strokeWidth={1.75} className="flex-shrink-0" />
          <span className="truncate">{business.city}, {business.country}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          <Phone size={13} strokeWidth={1.75} className="flex-shrink-0" />
          <span>{business.phone}</span>
        </div>
        {business.foodSpecialty.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
            <UtensilsCrossed size={13} strokeWidth={1.75} className="flex-shrink-0" />
            <span className="truncate">{business.foodSpecialty.slice(0, 3).join(", ")}</span>
          </div>
        )}
      </div>

      {/* Services */}
      {business.services.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {business.services.map((s) => (
            <span key={s} className="px-2 py-0.5 rounded-md bg-[var(--muted)] text-[var(--muted-foreground)] text-xs">
              {s.replace("_", " ")}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
          <Clock3 size={11} strokeWidth={1.75} />
          <span>Applied {date}</span>
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold text-[var(--primary)] group-hover:gap-2 transition-all">
          <span>Review</span>
          <ChevronRight size={13} strokeWidth={2.5} />
        </div>
      </div>
    </button>
  );
}