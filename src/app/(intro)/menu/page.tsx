"use client";

// src/app/(intro)/menu/page.tsx
// Displays all approved chefs on a paginated grid.

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  MapPin,
  ChevronLeft,
  ChevronRight,
  Truck,
  ShoppingBag,
  UtensilsCrossed,
  CalendarDays,
  ChefHat,
  Search,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────

interface BusinessHour {
  day: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

interface Chef {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  city: string;
  state: string;
  country: string;
  foodSpecialty: string[];
  services: string[];
  availability: string[];
  yearsOfExperience: number;
  businessHours: BusinessHour[];
  isOpen: boolean;
  averageRating: number | null;
  chef: {
    profile: {
      firstName: string | null;
      lastName: string | null;
      avatarUrl: string | null;
    } | null;
  };
  _count: {
    menuItems: number;
    mealPlans: number;
    reviews: number;
  };
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}

// ── Avatar ─────────────────────────────────────────────────────────────

function Avatar({ src, name }: { src?: string | null; name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="w-20 h-20 sm:w-[88px] sm:h-[88px] rounded-full object-cover border-[3px] border-white/30"
      />
    );
  }

  return (
    <div
      className="w-20 h-20 sm:w-[88px] sm:h-[88px] rounded-full flex items-center justify-center font-black text-2xl sm:text-3xl text-white border-[3px] border-white/20"
      style={{
        background: "linear-gradient(135deg, var(--primary), var(--chart-5))",
      }}
    >
      {initials}
    </div>
  );
}

// ── Star row ───────────────────────────────────────────────────────────

function Stars({ rating, count }: { rating: number | null; count: number }) {
  if (!rating) return null;
  const filled = Math.round(rating);
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-px">
        {[1, 2, 3, 4, 5].map((i) => (
          <svg
            key={i}
            className="w-3 h-3"
            viewBox="0 0 20 20"
            fill={i <= filled ? "var(--secondary)" : "var(--muted)"}
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-[10px] text-muted-foreground">
        {rating} <span className="opacity-60">({count})</span>
      </span>
    </div>
  );
}

// ── Shimmer skeleton ───────────────────────────────────────────────────

function ShimmerCard() {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden animate-pulse">
      <div className="h-1 w-full bg-muted" />
      <div className="p-3 sm:p-4 flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-full bg-muted" />
        <div className="w-full space-y-2 flex flex-col items-center">
          <div className="h-3.5 bg-muted rounded-full w-3/4" />
          <div className="h-2.5 bg-muted rounded-full w-1/2" />
          <div className="h-2.5 bg-muted rounded-full w-2/3" />
        </div>
        <div className="flex gap-1.5">
          <div className="h-5 w-16 bg-muted rounded-full" />
          <div className="h-5 w-14 bg-muted rounded-full" />
        </div>
        <div className="h-8 bg-muted rounded-xl w-full" />
      </div>
    </div>
  );
}

// ── Chef Card ──────────────────────────────────────────────────────────

const SERVICE_META: Record<string, { icon: React.ReactNode; label: string }> = {
  DELIVERY: { icon: <Truck className="w-2.5 h-2.5" />, label: "Delivery" },
  PICKUP: { icon: <ShoppingBag className="w-2.5 h-2.5" />, label: "Pickup" },
  DINE_IN: {
    icon: <UtensilsCrossed className="w-2.5 h-2.5" />,
    label: "Dine-in",
  },
};

function ChefCard({ chef, index }: { chef: Chef; index: number }) {
  const router = useRouter();
  const profile = chef.chef?.profile;
  const chefName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || "Chef";
  const avatarSrc = chef.logoUrl ?? profile?.avatarUrl;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.38, delay: (index % 4) * 0.06 }}
      whileHover={{ y: -4, transition: { duration: 0.18 } }}
      className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden"
    >
      {/* Open/Closed colour strip at top */}
      <div
        className="h-1 w-full flex-shrink-0 transition-colors duration-500"
        style={{ background: chef.isOpen ? "#22c55e" : "var(--muted)" }}
      />

      <div className="p-3 sm:p-4 flex flex-col items-center gap-2 sm:gap-2.5 flex-1">
        {/* Avatar + live badge */}
        <div className="relative mt-1">
          <Avatar src={avatarSrc} name={chef.name} />
          <span
            className="absolute -bottom-1 -right-1 text-[8px] font-black px-1.5 py-[3px] rounded-full border-2 border-card whitespace-nowrap leading-none"
            style={
              chef.isOpen
                ? { background: "#22c55e", color: "#fff" }
                : {
                    background: "var(--muted)",
                    color: "var(--muted-foreground)",
                  }
            }
          >
            {chef.isOpen ? "● Open" : "● Closed"}
          </span>
        </div>

        {/* Chef name first, then business name */}
        <div className="text-center space-y-0.5">
          <p className="text-xs sm:text-sm font-black text-card-foreground leading-tight line-clamp-1">
            {chefName}
          </p>
          <p className="text-[10px] text-muted-foreground">{chef.name}</p>
        </div>

        {/* Stars */}
        <Stars rating={chef.averageRating} count={chef._count.reviews} />

        {/* Location */}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground max-w-full">
          <MapPin className="w-3 h-3 flex-shrink-0 text-primary" />
          <span className="truncate">
            {[chef.city, chef.state].filter(Boolean).join(", ")}
          </span>
        </div>

        {/* Services */}
        {chef.services.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-center">
            {chef.services.map((s) => {
              const m = SERVICE_META[s];
              if (!m) return null;
              return (
                <span
                  key={s}
                  className="flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-[3px] rounded-full bg-primary/10 text-primary border border-primary/20"
                >
                  {m.icon} {m.label}
                </span>
              );
            })}
          </div>
        )}

        {/* Specialties */}
        {chef.foodSpecialty.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-center">
            {chef.foodSpecialty.slice(0, 2).map((f) => (
              <span
                key={f}
                className="text-[9px] px-1.5 py-[3px] rounded-full bg-secondary/20 text-secondary-foreground font-medium"
              >
                {f}
              </span>
            ))}
            {chef.foodSpecialty.length > 2 && (
              <span className="text-[9px] px-1.5 py-[3px] rounded-full bg-muted text-muted-foreground font-medium">
                +{chef.foodSpecialty.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Stat pills */}
        <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-muted-foreground justify-center flex-wrap">
          <span className="flex items-center gap-0.5">
            <UtensilsCrossed className="w-2.5 h-2.5" />
            {chef._count.menuItems} items
          </span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-0.5">
            <CalendarDays className="w-2.5 h-2.5" />
            {chef._count.mealPlans} plans
          </span>
          {chef.yearsOfExperience > 0 && (
            <>
              <span className="text-border">·</span>
              <span className="flex items-center gap-0.5">
                <ChefHat className="w-2.5 h-2.5" />
                {chef.yearsOfExperience}y exp
              </span>
            </>
          )}
        </div>

        {/* Push CTA to bottom */}
        <div className="flex-1" />

        {/* View Kitchen CTA */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push(`/kitchen/${chef.id}`)}
          className="w-full py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-black text-primary-foreground shadow-md hover:shadow-lg hover:opacity-90 transition-all duration-150 mt-1"
          style={{ background: "var(--primary)" }}
        >
          View Kitchen
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── Pagination ─────────────────────────────────────────────────────────

function Pagination({
  meta,
  onChange,
}: {
  meta: PaginationMeta;
  onChange: (p: number) => void;
}) {
  if (meta.totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  const { page, totalPages } = meta;

  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    )
      pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  const btnBase =
    "w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="flex items-center justify-center gap-1 sm:gap-1.5 flex-wrap pb-8"
    >
      <button
        onClick={() => onChange(page - 1)}
        disabled={!meta.hasPrevPage}
        className={btnBase}
        style={{
          background: "var(--primary)",
          color: "var(--primary-foreground)",
        }}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pages.map((p, i) =>
        p === "..." ? (
          <span
            key={`e-${i}`}
            className="text-white/60 text-sm select-none px-0.5"
          >
            …
          </span>
        ) : (
          <motion.button
            key={p}
            whileTap={{ scale: 0.93 }}
            onClick={() => onChange(p as number)}
            className={`${btnBase} border`}
            style={
              p === page
                ? {
                    background: "var(--primary)",
                    color: "var(--primary-foreground)",
                    borderColor: "var(--primary)",
                  }
                : {
                    background: "rgba(255,255,255,0.85)",
                    color: "var(--foreground)",
                    borderColor: "rgba(255,255,255,0.4)",
                  }
            }
          >
            {p}
          </motion.button>
        ),
      )}

      <button
        onClick={() => onChange(page + 1)}
        disabled={!meta.hasNextPage}
        className={btnBase}
        style={{
          background: "var(--primary)",
          color: "var(--primary-foreground)",
        }}
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      <span className="text-[10px] sm:text-xs font-semibold text-white/80 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/20 ml-1">
        {page} / {totalPages} · {meta.total}
      </span>
    </motion.div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────

export default function ChefsPage() {
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const fetchChefs = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "12" });
      const res = await fetch(`/api/public/chefs?${params}`);
      const json = await res.json();
      if (json.success) {
        setChefs(json.data);
        setMeta(json.meta);
      }
    } catch (err) {
      console.error("Failed to fetch chefs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChefs(page);
  }, [page, fetchChefs]);

  // ── Frontend filter — runs instantly as the user types ──────────────
  const filteredChefs = search.trim()
    ? chefs.filter((chef) => {
        const q = search.toLowerCase();
        const profile = chef.chef?.profile;
        const chefName = [profile?.firstName, profile?.lastName]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return (
          chef.name.toLowerCase().includes(q) ||
          chefName.includes(q) ||
          chef.city?.toLowerCase().includes(q) ||
          chef.state?.toLowerCase().includes(q) ||
          chef.country?.toLowerCase().includes(q) ||
          chef.foodSpecialty.some((s) => s.toLowerCase().includes(q)) ||
          chef.services.some((s) => s.toLowerCase().includes(q))
        );
      })
    : chefs;

  return (
    <div className="relative w-full min-h-screen">
      {/* Background */}
      <img
        src="/bg-chefs.png"
        alt=""
        aria-hidden="true"
        decoding="async"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.18)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      <div
        className="relative max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-4 sm:space-y-6"
        style={{ zIndex: 2 }}
      >
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center space-y-2"
        >
          <h2
            className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight drop-shadow-lg"
            style={{ color: "var(--primary)" }}
          >
            FIND YOUR PRIVATE CHEF
          </h2>
          <p
            className="text-xs sm:text-sm font-black tracking-[0.2em] drop-shadow-sm"
            style={{ color: "var(--secondary)" }}
          >
            CURATED KITCHENS &nbsp;·&nbsp; VERIFIED PROFESSIONALS
          </p>
        </motion.div>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.08 }}
          className="relative max-w-md mx-auto w-full"
        >
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chefs, cuisines, locations…"
            className="pl-10 rounded-xl bg-white/90 backdrop-blur-sm border-white/30 text-foreground placeholder:text-muted-foreground shadow-md focus-visible:ring-primary"
          />
        </motion.div>

        {/* Count line */}
        {!loading && meta && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] sm:text-xs text-white/70 font-medium"
          >
            {meta.total} chef{meta.total !== 1 ? "s" : ""} available
          </motion.p>
        )}

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3 lg:gap-4">
          <AnimatePresence mode="popLayout">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <ShimmerCard key={`shimmer-${i}`} />
                ))
              : filteredChefs.map((chef, i) => (
                  <ChefCard key={chef.id} chef={chef} index={i} />
                ))}
          </AnimatePresence>
        </div>

        {/* Empty state */}
        {!loading && filteredChefs.length === 0 && (
          <div className="text-center py-16 text-white/60">
            <p className="text-5xl mb-4">👨‍🍳</p>
            {search.trim() ? (
              <>
                <p className="font-semibold text-sm sm:text-base">
                  No chefs match &quot;{search}&quot;
                </p>
                <p className="text-xs mt-1 opacity-70">
                  Try a different name, cuisine or location
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold text-sm sm:text-base">
                  No chefs available right now
                </p>
                <p className="text-xs mt-1 opacity-70">Check back soon!</p>
              </>
            )}
          </div>
        )}

        {/* Pagination — hidden while searching since we filter in-memory */}
        {!loading && meta && !search.trim() && (
          <Pagination
            meta={meta}
            onChange={(p) => {
              setPage(p);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        )}
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          100% {
            transform: translateX(200%);
          }
        }
      `}</style>
    </div>
  );
}
