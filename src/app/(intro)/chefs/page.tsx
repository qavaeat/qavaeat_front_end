"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Star, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────
type TabType = "daily" | "plans";
type FilterType = "all" | "cuisines" | "rating" | "pricing";
type SortType = "popular" | "rating" | "newest" | "pricing";

// ── Dummy Data ─────────────────────────────────────────
const chefs = [
  {
    id: 1,
    name: "Chef Peninah",
    specialty: "African Spicy, Grilled Dishes",
    location: "Kitusuri",
    rating: 3,
    status: "open",
    tag: "daily",
  },
  {
    id: 2,
    name: "Fatima Hassan",
    specialty: "Great Swahili Dishes",
    location: "Kahawa West",
    rating: 3,
    status: "open",
    tag: "daily",
  },
  {
    id: 3,
    name: "Chef Juma",
    specialty: "Kenyan Cuisines, Roasting Curries",
    location: "Parklands",
    rating: 3,
    status: "open",
    tag: "plans",
  },
  {
    id: 4,
    name: "David",
    specialty: "Steaks, Burgers & Sea Foods",
    location: "Kilimani",
    rating: 3,
    status: "open",
    tag: "plans",
  },
  {
    id: 5,
    name: "Chef Amara",
    specialty: "Vegan & Plant-Based Cuisine",
    location: "Westlands",
    rating: 4,
    status: "open",
    tag: "daily",
  },
  {
    id: 6,
    name: "Chef Kofi",
    specialty: "West African Street Food",
    location: "South B",
    rating: 4,
    status: "closed",
    tag: "plans",
  },
  {
    id: 7,
    name: "Chef Zara",
    specialty: "Continental & Pastries",
    location: "Karen",
    rating: 5,
    status: "open",
    tag: "daily",
  },
  {
    id: 8,
    name: "Chef Ibrahim",
    specialty: "Halal Grills & Pilau",
    location: "Eastleigh",
    rating: 4,
    status: "open",
    tag: "plans",
  },
];

const sortOptions: { value: SortType; label: string }[] = [
  { value: "popular", label: "Most Popular" },
  { value: "rating", label: "Top Rated" },
  { value: "newest", label: "Newest" },
  { value: "pricing", label: "Pricing" },
];

const filters: { value: FilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "cuisines", label: "Cuisines" },
  { value: "rating", label: "Rating" },
  { value: "pricing", label: "Pricing" },
];

// ── Portal Sort Dropdown ───────────────────────────────
function SortDropdown({
  sortBy,
  setSortBy,
  showSort,
  setShowSort,
  triggerRef,
}: {
  sortBy: SortType;
  setSortBy: (v: SortType) => void;
  showSort: boolean;
  setShowSort: (v: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Recalculate position whenever the dropdown opens
  useEffect(() => {
    if (showSort && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + window.scrollY + 6,
        right: window.innerWidth - rect.right,
      });
    }
  }, [showSort, triggerRef]);

  // Close on outside click
  useEffect(() => {
    if (!showSort) return;
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setShowSort(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showSort, setShowSort, triggerRef]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {showSort && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.97 }}
          transition={{ duration: 0.15 }}
          style={{
            position: "absolute",
            top: pos.top,
            right: pos.right,
            zIndex: 99999,
            width: "11rem",
          }}
          className="bg-background border border-border rounded-xl shadow-2xl overflow-hidden"
        >
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setSortBy(opt.value);
                setShowSort(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                sortBy === opt.value
                  ? "text-primary font-semibold bg-primary/5"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// ── Star Rating ────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
            star <= rating
              ? "text-secondary fill-secondary"
              : "text-muted-foreground/30 fill-muted-foreground/10"
          }`}
        />
      ))}
    </div>
  );
}

// ── Chef Card ──────────────────────────────────────────
function ChefCard({ chef, index }: { chef: (typeof chefs)[0]; index: number }) {
  const initials = chef.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Generate a URL-friendly slug from the chef's name
  const slug = chef.name.toLowerCase().replace(/\s+/g, "-");

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.45, delay: index * 0.06 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="bg-background rounded-2xl border border-border overflow-hidden shadow-md hover:shadow-xl hover:border-primary/25 transition-shadow duration-300 flex flex-col cursor-pointer"
    >
      <div className="relative w-full aspect-[4/3] bg-muted overflow-hidden">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-muted to-muted/60">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
            <span className="text-lg sm:text-xl font-black text-primary">
              {initials}
            </span>
          </div>
          <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">
            Photo coming soon
          </span>
        </div>
        <span
          className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm ${
            chef.status === "open"
              ? "bg-[#007606] text-white"
              : "bg-muted text-muted-foreground border border-border"
          }`}
        >
          {chef.status}
        </span>
      </div>

      <div className="p-3 sm:p-4 flex flex-col gap-1.5 sm:gap-2 flex-1">
        <h3 className="text-sm sm:text-base font-bold text-foreground leading-tight">
          {chef.name}
        </h3>
        <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug line-clamp-2">
          {chef.specialty}
        </p>
        <div className="flex items-center gap-1 text-[11px] sm:text-xs text-muted-foreground">
          <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary flex-shrink-0" />
          <span>{chef.location}</span>
        </div>
        <StarRating rating={chef.rating} />
        <div className="mt-auto pt-2">
          <Link href={`/chefs/${slug}`}>
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-[11px] sm:text-xs font-bold py-4 sm:py-5 tracking-widest uppercase">
              View Kitchen
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Export ────────────────────────────────────────
export default function ChefsSection() {
  const [activeTab, setActiveTab] = useState<TabType>("daily");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortType>("popular");
  const [search, setSearch] = useState("");
  const [showSort, setShowSort] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8);
  const sortTriggerRef = useRef<HTMLButtonElement>(null);

  const filtered = chefs.filter((chef) => {
    const matchesTab =
      activeTab === "daily" ? chef.tag === "daily" : chef.tag === "plans";
    const matchesSearch =
      search === "" ||
      chef.name.toLowerCase().includes(search.toLowerCase()) ||
      chef.specialty.toLowerCase().includes(search.toLowerCase()) ||
      chef.location.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div className="relative w-full">
      {/* Fixed background */}
      <img
        src="/bg-chefs.png"
        alt=""
        aria-hidden="true"
        decoding="async"
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          zIndex: -2,
          pointerEvents: "none",
        }}
      />

      {/* Fixed dark overlay */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          zIndex: -1,
          pointerEvents: "none",
        }}
      />

      {/* ── Hero ── */}
      <div className="w-full flex flex-col items-center px-4 sm:px-6 pt-12 sm:pt-16 md:pt-20 pb-8 sm:pb-10">
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-6 sm:gap-8">
          {/* Title */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-primary uppercase tracking-tight leading-none mb-3">
              Find Your Private Chef
            </h1>
            <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
              <span className="text-secondary text-xs sm:text-sm font-bold tracking-widest uppercase">
                Curated Kitchens
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-secondary flex-shrink-0" />
              <span className="text-secondary text-xs sm:text-sm font-bold tracking-widest uppercase">
                Verified Professionals
              </span>
            </div>
          </motion.div>

          {/* Search */}
          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <div className="relative flex items-center">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by neighbourhood, chef name, cuisine..."
                className="w-full pl-5 pr-14 py-5 sm:py-6 rounded-full border-0 bg-background/95 backdrop-blur-sm text-sm sm:text-base shadow-lg text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
              />
              <button
                className="absolute right-2 w-10 h-10 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center transition-colors shadow-sm"
                aria-label="Search"
              >
                <Search className="w-4 h-4 text-primary-foreground" />
              </button>
            </div>
          </motion.div>

          {/* Tabs + Sort trigger */}
          <motion.div
            className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 bg-background/90 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg border border-border/50"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-muted rounded-xl p-1 w-full sm:w-auto">
              {(["daily", "plans"] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setVisibleCount(8);
                  }}
                  className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "daily" ? "Daily Menu Meals" : "Meal Plans"}
                </button>
              ))}
            </div>

            {/* Sort trigger button — ref tracked for portal positioning */}
            <button
              ref={sortTriggerRef}
              onClick={() => setShowSort((p) => !p)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm font-medium text-foreground hover:border-primary/40 transition-colors w-full sm:w-auto justify-between sm:justify-start"
            >
              <span className="text-muted-foreground text-xs">Sort by:</span>
              <span className="font-semibold">
                {sortOptions.find((s) => s.value === sortBy)?.label}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                  showSort ? "rotate-180" : ""
                }`}
              />
            </button>
          </motion.div>
        </div>
      </div>

      {/* Portal dropdown */}
      <SortDropdown
        sortBy={sortBy}
        setSortBy={setSortBy}
        showSort={showSort}
        setShowSort={setShowSort}
        triggerRef={sortTriggerRef}
      />

      {/* ── Filter Pills ── */}
      <div className="w-full px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="flex flex-wrap gap-2 sm:gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.35 }}
          >
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold border transition-all duration-200 shadow-sm ${
                  activeFilter === f.value
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-background/80 backdrop-blur-sm text-foreground border-border/60 hover:border-primary/40 hover:text-primary hover:bg-background/95"
                }`}
              >
                {f.label}
              </button>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Chef Grid ── */}
      <div className="w-full px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            <AnimatePresence mode="popLayout">
              {visible.length > 0 ? (
                visible.map((chef, index) => (
                  <ChefCard key={chef.id} chef={chef} index={index} />
                ))
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full text-center py-20"
                >
                  <p className="text-base font-semibold text-white">
                    No chefs found.
                  </p>
                  <p className="text-sm text-white/70 mt-1">
                    Try a different search or filter.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── See More ── */}
      <div className="w-full flex justify-center px-4 pb-16 sm:pb-20 pt-4">
        <AnimatePresence>
          {hasMore && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              <Button
                onClick={() => setVisibleCount((p) => p + 8)}
                className="bg-primary hover:bg-primary/90 text-white font-bold rounded-full px-10 py-5 sm:py-6 text-sm sm:text-base shadow-lg tracking-wide"
              >
                See More
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
