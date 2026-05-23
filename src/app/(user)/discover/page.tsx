"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  Star,
  Clock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Bike,
  ShoppingBag,
  UtensilsCrossed,
  Filter,
  Flame,
  Sparkles,
  BadgeCheck,
  Navigation,
  RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { LocationPrompt } from "@/components/user/LocationPrompt";
import { useLocation } from "@/hooks/useLocation";
import type {
  PublicBusiness,
  ServiceType,
  DayOfWeek,
  PaginationMeta,
} from "@/types/user-section";

// ── helpers ────────────────────────────────────────────────────────────────
const SERVICE_ICONS: Record<ServiceType, React.ReactNode> = {
  DELIVERY: <Bike className="w-3 h-3" />,
  PICKUP: <ShoppingBag className="w-3 h-3" />,
  DINE_IN: <UtensilsCrossed className="w-3 h-3" />,
};
const SERVICE_LABELS: Record<ServiceType, string> = {
  DELIVERY: "Delivery",
  PICKUP: "Pickup",
  DINE_IN: "Dine In",
};

function todayDay(): DayOfWeek {
  return (
    [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ] as DayOfWeek[]
  )[new Date().getDay()];
}

function isOpenNow(biz: PublicBusiness): boolean {
  // Convert current UTC time to EAT (UTC+3)
  const nowEAT = new Date(Date.now() + 3 * 60 * 60 * 1000);

  const eatDay = (
    [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ] as DayOfWeek[]
  )[nowEAT.getUTCDay()];

  // Must be one of the business's available days
  if (!biz.availability.includes(eatDay)) return false;

  // Between 07:00 and 23:00 EAT
  const eatHour = nowEAT.getUTCHours(); // UTC hours == EAT hours after the +3 shift above
  return eatHour >= 7 && eatHour < 23;
}

function chefName(biz: PublicBusiness): string {
  const p = biz.chef.profile;
  if (p?.firstName) return `${p.firstName} ${p.lastName ?? ""}`.trim();
  return biz.chef.email.split("@")[0];
}

// ── Sort portal ────────────────────────────────────────────────────────────
type SortOption =
  | "distance"
  | "popular"
  | "rating"
  | "price-low"
  | "price-high"
  | "newest";
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "distance", label: "Nearest First" },
  { value: "popular", label: "Most Popular" },
  { value: "rating", label: "Top Rated" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
];

function SortPortal({
  value,
  onChange,
  open,
  setOpen,
  triggerRef,
}: {
  value: SortOption;
  onChange: (v: SortOption) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setPos({
        top: r.bottom + window.scrollY + 6,
        right: window.innerWidth - r.right,
      });
    }
  }, [open, triggerRef]);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open, setOpen, triggerRef]);

  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
          style={{
            position: "absolute",
            top: pos.top,
            right: pos.right,
            zIndex: 99999,
            width: "13rem",
          }}
          className="bg-background border border-border rounded-xl shadow-2xl overflow-hidden"
        >
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                opt.value === value
                  ? "text-primary font-semibold bg-primary/5"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              {opt.value === "distance" && (
                <Navigation className="w-3 h-3 inline mr-1.5 text-primary" />
              )}
              {opt.label}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// ── Business card ──────────────────────────────────────────────────────────
function BusinessCard({ biz, index }: { biz: PublicBusiness; index: number }) {
  const initials = biz.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const open = isOpenNow(biz);
  const name = chefName(biz);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-16px" }}
      transition={{ duration: 0.4, delay: (index % 4) * 0.07 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-background rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 flex flex-col group"
    >
      {/* Image */}
      <div className="relative w-full aspect-[16/9] bg-muted overflow-hidden flex-shrink-0">
        {biz.premiseImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={biz.premiseImageUrl}
            alt={biz.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/5 via-muted to-secondary/10 flex flex-col items-center justify-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-background/80 border border-border flex items-center justify-center shadow-sm">
              <span className="text-xl font-black text-primary">
                {initials}
              </span>
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
          {biz.isTopRated && (
            <span className="flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground shadow-sm">
              <BadgeCheck className="w-3 h-3" />
              Top Rated
            </span>
          )}
          {biz.isFeatured && (
            <span className="flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-primary text-primary-foreground shadow-sm">
              <Flame className="w-3 h-3" />
              Featured
            </span>
          )}
        </div>

        <span
          className={`absolute top-2.5 right-2.5 text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm ${
            open
              ? "bg-[#007606] text-white"
              : "bg-muted/90 text-muted-foreground border border-border"
          }`}
        >
          {open ? "OPEN" : "CLOSED"}
        </span>

        {/* Distance badge */}
        {biz.distanceKm !== null && (
          <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-background/90 text-foreground shadow-sm">
            <Navigation className="w-2.5 h-2.5 text-primary" />
            {biz.distanceKm < 1
              ? `${Math.round(biz.distanceKm * 1000)}m`
              : `${biz.distanceKm}km`}
          </span>
        )}

        {biz.logoUrl && (
          <div className="absolute bottom-2.5 right-2.5 w-10 h-10 rounded-xl bg-background border border-border overflow-hidden shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={biz.logoUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3.5 sm:p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-black text-foreground leading-tight flex-1">
            {biz.name}
          </h3>
          {biz.rating !== undefined && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star className="w-3.5 h-3.5 text-secondary fill-secondary" />
              <span className="text-xs font-bold text-foreground">
                {biz.rating}
              </span>
              <span className="text-[10px] text-muted-foreground">
                ({biz.reviewCount ?? biz._count.reviews})
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-primary" />
            {name}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-primary" />
            {biz.city}
          </span>
        </div>

        {biz.description && (
          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
            {biz.description}
          </p>
        )}

        <div className="flex gap-1 flex-wrap">
          {biz.foodSpecialty.slice(0, 3).map((s) => (
            <span
              key={s}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
            >
              {s}
            </span>
          ))}
          {biz.foodSpecialty.length > 3 && (
            <span className="text-[10px] text-muted-foreground">
              +{biz.foodSpecialty.length - 3}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 mt-auto pt-1">
          <div className="flex gap-1.5 flex-wrap">
            {biz.services.map((s) => (
              <span
                key={s}
                title={SERVICE_LABELS[s]}
                className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-primary/5 text-primary border border-primary/15"
              >
                {SERVICE_ICONS[s]}
                <span className="hidden sm:inline">{SERVICE_LABELS[s]}</span>
              </span>
            ))}
          </div>
          <span className="text-xs font-bold text-foreground whitespace-nowrap">
            {biz._count.menuItems} items
          </span>
        </div>

        <Link href={`/discover/${biz.id}`}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="w-full mt-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-black py-2.5 tracking-wide transition-colors"
          >
            View Kitchen
          </motion.button>
        </Link>
      </div>
    </motion.div>
  );
}

// ── Skeleton card ──────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-background rounded-2xl border border-border overflow-hidden animate-pulse">
      <div className="aspect-[16/9] bg-muted" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-8 bg-muted rounded-xl w-full mt-2" />
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
type FilterTab = "all" | "open" | "top-rated" | "featured" | "nearby";
const PAGE_SIZE = 8;
const LOCATION_PROMPT_KEY = "qavaeat_location_prompted";

export default function DiscoverPage() {
  const { coords, status, request, clear } = useLocation();
  const [mounted,] = useState(true);

  // Data
  const [businesses, setBusinesses] = useState<PublicBusiness[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tab, setTab] = useState<FilterTab>("all");
  const [sort, setSort] = useState<SortOption>("popular");
  const [showSort, setShowSort] = useState(false);
  const [serviceFilter, setServiceFilter] = useState<ServiceType | "all">(
    "all",
  );
  const [page, setPage] = useState(1);
  const sortRef = useRef<HTMLButtonElement>(null);

  // Location prompt
  const [showPrompt, setShowPrompt] = useState(false);

  // Show prompt on first visit if not already answered
  useEffect(() => {
    if (typeof window === "undefined") return;
    const answered = localStorage.getItem(LOCATION_PROMPT_KEY);
    if (!answered && status === "idle") {
      // Small delay so page renders first
      const t = setTimeout(() => setShowPrompt(true), 800);
      return () => clearTimeout(t);
    }
  }, [status]);

 

  const handleAllow = async () => {
    localStorage.setItem(LOCATION_PROMPT_KEY, "granted");
    await request();
    setShowPrompt(false);
    setSort("distance");
  };

  const handleDecline = () => {
    localStorage.setItem(LOCATION_PROMPT_KEY, "declined");
    setShowPrompt(false);
  };

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch
  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(serviceFilter !== "all" ? { service: serviceFilter } : {}),
        ...(tab === "nearby" && coords ? { radiusKm: "25" } : {}),
        ...(coords
          ? {
              userLat: String(coords.latitude),
              userLng: String(coords.longitude),
            }
          : {}),
      });

      const res = await fetch(`/api/business?${params}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch kitchens");
      const json = await res.json();

      let data: PublicBusiness[] = json?.businesses ?? [];

      // Client-side tab filtering
      if (tab === "open") data = data.filter((b) => isOpenNow(b));
      if (tab === "top-rated") data = data.filter((b) => b.isTopRated);
      if (tab === "featured") data = data.filter((b) => b.isFeatured);

      // Client-side sort (backend already sorted by distance if coords available)
      if (sort === "rating")
        data = [...data].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      if (sort === "price-low")
        data = [...data].sort((a, b) => (a.priceMin ?? 0) - (b.priceMin ?? 0));
      if (sort === "price-high")
        data = [...data].sort((a, b) => (b.priceMax ?? 0) - (a.priceMax ?? 0));
      if (sort === "popular")
        data = [...data].sort((a, b) => b._count.reviews - a._count.reviews);
      // "distance" and "newest" already sorted by backend

      setBusinesses(data);
      setMeta(json?.meta ?? null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, serviceFilter, tab, sort, coords]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  const handleTabChange = (t: FilterTab) => {
    setTab(t);
    setPage(1);
    if (t === "nearby" && !coords) request();
  };

  const TABS: { value: FilterTab; label: string; icon?: React.ReactNode }[] = [
    { value: "all", label: "All Kitchens" },
    { value: "open", label: "Open Now" },
    {
      value: "top-rated",
      label: "Top Rated",
      icon: <BadgeCheck className="w-3.5 h-3.5" />,
    },
    {
      value: "featured",
      label: "Featured",
      icon: <Flame className="w-3.5 h-3.5" />,
    },
    {
      value: "nearby",
      label: "Nearby",
      icon: <Navigation className="w-3.5 h-3.5" />,
    },
  ];

  const SERVICE_FILTERS: { value: ServiceType | "all"; label: string }[] = [
    { value: "all", label: "All Services" },
    { value: "DELIVERY", label: "Delivery" },
    { value: "PICKUP", label: "Pickup" },
    { value: "DINE_IN", label: "Dine In" },
  ];

  return (
    <div className="min-h-screen bg-muted/20">
      <LocationPrompt
        open={showPrompt}
        status={status}
        onAllow={handleAllow}
        onDecline={handleDecline}
      />

      {/* Hero search */}
      <div className="bg-background border-b border-border px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground">
                Discover Kitchens Near You
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Find private chefs, browse menus and subscribe to meal plans
              </p>
            </div>

            {/* Location status badge */}
           
            <div className="flex-shrink-0">
              {!mounted ? null : status === "granted" && coords ? (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-[#007606] bg-[#007606]/10 px-3 py-1.5 rounded-full">
                    <Navigation className="w-3.5 h-3.5" />
                    Location on
                  </span>
                  <button
                    onClick={() => {
                      clear();
                      localStorage.removeItem(LOCATION_PROMPT_KEY);
                    }}
                    className="text-[10px] text-muted-foreground hover:text-destructive font-semibold transition-colors"
                  >
                    Turn off
                  </button>
                </div>
              ) : status === "denied" ? (
                <span className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                  Location off
                </span>
              ) : (
                <button
                  onClick={() => setShowPrompt(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-primary border border-primary/30 px-3 py-1.5 rounded-full hover:bg-primary/5 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  Enable location
                </button>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by chef, cuisine, neighbourhood..."
              className="pl-11 pr-4 py-5 rounded-2xl border-border bg-background text-sm shadow-sm focus-visible:ring-primary"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            {TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => handleTabChange(t.value)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                  tab === t.value
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary bg-background"
                }`}
              >
                {t.icon}
                {t.label}
                {t.value === "nearby" && !coords && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-pulse" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5">
        {/* Service filter + sort + count */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            {SERVICE_FILTERS.map((sf) => (
              <button
                key={sf.value}
                onClick={() => {
                  setServiceFilter(sf.value);
                  setPage(1);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${
                  serviceFilter === sf.value
                    ? "bg-secondary text-secondary-foreground border-secondary"
                    : "border-border text-muted-foreground hover:border-primary/30 bg-background"
                }`}
              >
                {sf.value !== "all" && SERVICE_ICONS[sf.value as ServiceType]}
                {sf.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {meta?.total ?? businesses.length} kitchen
              {(meta?.total ?? businesses.length) !== 1 ? "s" : ""}
              {coords && " · sorted by distance"}
            </span>
            <button
              onClick={fetchBusinesses}
              className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Sort:</span>
              <button
                ref={sortRef}
                onClick={() => setShowSort((p) => !p)}
                className="flex items-center gap-2 text-xs font-semibold text-foreground border border-border rounded-xl px-3 py-1.5 bg-background hover:bg-muted transition-colors whitespace-nowrap"
              >
                {SORT_OPTIONS.find((s) => s.value === sort)?.label}
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${showSort ? "rotate-180" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-2xl px-5 py-6 text-center space-y-2">
            <p className="text-sm font-semibold text-destructive">{error}</p>
            <button
              onClick={fetchBusinesses}
              className="text-xs underline text-muted-foreground hover:text-foreground"
            >
              Try again
            </button>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          <AnimatePresence mode="popLayout">
            {loading ? (
              Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <SkeletonCard key={i} />
              ))
            ) : businesses.length > 0 ? (
              businesses.map((biz, i) => (
                <BusinessCard key={biz.id} biz={biz} index={i} />
              ))
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full text-center py-20 space-y-2"
              >
                <p className="text-lg font-black text-foreground">
                  No kitchens found
                </p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filters
                </p>
                {tab === "nearby" && (
                  <button
                    onClick={() => handleTabChange("all")}
                    className="text-xs text-primary font-bold underline mt-2"
                  >
                    Show all kitchens instead
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-4 pb-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!meta.hasPrevPage}
              className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>

            <div className="flex items-center gap-1">
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === meta.totalPages ||
                    Math.abs(p - meta.page) <= 1,
                )
                .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1)
                    acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === "…" ? (
                    <span
                      key={`e-${idx}`}
                      className="text-xs text-muted-foreground px-1"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                        meta.page === p
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={!meta.hasNextPage}
              className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        )}
      </div>

      <SortPortal
        value={sort}
        onChange={(v) => {
          setSort(v);
          setPage(1);
        }}
        open={showSort}
        setOpen={setShowSort}
        triggerRef={sortRef}
      />
    </div>
  );
}
