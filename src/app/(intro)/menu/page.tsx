"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, ChevronLeft, ChevronRight,
  CalendarDays, UtensilsCrossed, Flame,
  Truck, ShoppingBag, Users, CheckCircle2,
} from "lucide-react";
import type { MenuItem, MealPlan, PaginationMeta } from "@/types/menu";

// ── Types ──────────────────────────────────────────────
type MenuTab = "daily" | "plans";
type MealFilter = "All" | "Breakfast" | "Lunch" | "Dinner";

function applyMealFilter(items: MenuItem[], filter: MealFilter): MenuItem[] {
  if (filter === "All") return items;
  return items.filter((item) => item.mealTimes.includes(filter.toUpperCase()));
}

// ── Shimmer skeleton ───────────────────────────────────
function ShimmerCard() {
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm flex flex-col animate-pulse">
      <div className="w-full aspect-[4/3] bg-muted relative overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-foreground/5 to-transparent" />
      </div>
      <div className="p-3 flex flex-col gap-2.5">
        <div className="flex justify-between gap-2">
          <div className="h-3.5 bg-muted rounded-full w-3/5" />
          <div className="h-3.5 bg-muted rounded-full w-1/5" />
        </div>
        <div className="h-2.5 bg-muted rounded-full w-full" />
        <div className="h-2.5 bg-muted rounded-full w-4/5" />
        <div className="flex gap-1.5 mt-1">
          <div className="h-5 bg-muted rounded-full w-12" />
          <div className="h-5 bg-muted rounded-full w-16" />
        </div>
      </div>
    </div>
  );
}

// ── Menu Item Card ─────────────────────────────────────
function MenuItemCard({ item, index }: { item: MenuItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.4, delay: (index % 4) * 0.06 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
    >
      <div className="relative w-full aspect-[4/3] bg-muted overflow-hidden flex-shrink-0">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl sm:text-4xl bg-gradient-to-br from-muted to-muted/60">
            🍽️
          </div>
        )}
        {item.quantity > 0 && item.quantity <= 3 && (
          <span className="absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground shadow-sm">
            Only {item.quantity} left
          </span>
        )}
      </div>

      <div className="p-2.5 sm:p-3 flex flex-col gap-1.5 sm:gap-2 flex-1">
        <div className="flex items-start justify-between gap-1.5">
          <p className="text-xs sm:text-sm font-bold text-card-foreground leading-tight flex-1 line-clamp-1">
            {item.name}
          </p>
          <p className="text-xs sm:text-sm font-black text-primary whitespace-nowrap flex-shrink-0">
            Ksh {Number(item.price).toLocaleString()}
          </p>
        </div>

        {item.description && (
          <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
            {item.description}
          </p>
        )}

        <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap">
          {item.calories != null && (
            <span className="flex items-center gap-0.5">
              <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
              {item.calories} kcal
            </span>
          )}
          {item.prepTimeMin != null && (
            <span className="flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              {item.prepTimeMin} min
            </span>
          )}
        </div>

        {item.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {item.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full bg-secondary/20 text-secondary-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Meal Plan Card ─────────────────────────────────────
function MealPlanCard({ plan, index }: { plan: MealPlan; index: number }) {
  const mealNames = [...new Set(plan.meals.map((m) => m.menuItem.name))].slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.4, delay: (index % 4) * 0.06 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
    >
      <div className="relative w-full aspect-[4/3] bg-muted overflow-hidden flex-shrink-0">
        {plan.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={plan.imageUrl} alt={plan.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl sm:text-4xl bg-gradient-to-br from-muted to-muted/60">
            🥗
          </div>
        )}
        {plan.isFeatured && (
          <span className="absolute top-2 left-2 text-[9px] font-black px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground shadow-sm">
            ⭐ Featured
          </span>
        )}
        <span className="absolute bottom-2 right-2 text-[10px] sm:text-[11px] font-black px-2 sm:px-2.5 py-1 rounded-xl bg-card/90 backdrop-blur-sm text-primary shadow-sm">
          {plan.currency} {Number(plan.price).toLocaleString()}
        </span>
      </div>

      <div className="p-2.5 sm:p-3 flex flex-col gap-1.5 sm:gap-2 flex-1">
        <p className="text-xs sm:text-sm font-bold text-card-foreground leading-tight line-clamp-1">
          {plan.name}
        </p>

        {plan.description && (
          <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
            {plan.description}
          </p>
        )}

        {mealNames.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {mealNames.map((name) => (
              <span key={name} className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                {name}
              </span>
            ))}
            {plan.meals.length > 3 && (
              <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                +{plan.meals.length - 3} more
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] text-muted-foreground flex-wrap">
          <span className="flex items-center gap-0.5">
            <CalendarDays className="w-2.5 h-2.5 sm:w-3 sm:h-3" />{plan.durationDays}d
          </span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-0.5">
            <UtensilsCrossed className="w-2.5 h-2.5 sm:w-3 sm:h-3" />{plan.totalMeals} meals
          </span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-0.5">
            <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3" />{plan.currentSubscribers}
          </span>
        </div>

        <div className="flex gap-1 sm:gap-1.5 flex-wrap">
          {plan.isDeliveryAvailable && (
            <span className="flex items-center gap-0.5 text-[9px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              <Truck className="w-2 h-2 sm:w-2.5 sm:h-2.5" /> Delivery
            </span>
          )}
          {plan.isPickupAvailable && (
            <span className="flex items-center gap-0.5 text-[9px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full bg-secondary/20 text-secondary-foreground border border-secondary/30">
              <ShoppingBag className="w-2 h-2 sm:w-2.5 sm:h-2.5" /> Pickup
            </span>
          )}
        </div>

        {plan.cuisineType.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {plan.cuisineType.slice(0, 2).map((c) => (
              <span key={c} className="text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {c}
              </span>
            ))}
          </div>
        )}

        {plan.availableDays.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary flex-shrink-0" />
            <span className="text-[9px] sm:text-[10px] text-muted-foreground">
              {plan.availableDays.map((d) => d.slice(0, 3)).join(", ")}
            </span>
          </div>
        )}

        <p className="text-[9px] sm:text-[10px] text-muted-foreground/70 mt-auto pt-1">
          by {plan.business.name} · {plan.business.city}
        </p>
      </div>
    </motion.div>
  );
}

// ── Pagination ─────────────────────────────────────────
function Pagination({
  meta,
  onPageChange,
}: {
  meta: PaginationMeta;
  onPageChange: (p: number) => void;
}) {
  if (meta.totalPages <= 1) return null;

  const getPages = (): (number | "...")[] => {
    const { page, totalPages } = meta;
    const pages: (number | "...")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="flex items-center justify-center gap-1 sm:gap-1.5 pb-8 flex-wrap"
    >
      <motion.button
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={() => onPageChange(meta.page - 1)}
        disabled={!meta.hasPrevPage}
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-md"
      >
        <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </motion.button>

      {getPages().map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="text-white/60 px-0.5 text-sm select-none">…</span>
        ) : (
          <motion.button
            key={p} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full text-xs sm:text-sm font-bold transition-all shadow-sm ${
              p === meta.page
                ? "bg-primary text-primary-foreground shadow-md scale-105"
                : "bg-card/80 backdrop-blur-sm text-card-foreground hover:bg-primary hover:text-primary-foreground border border-border/60"
            }`}
          >
            {p}
          </motion.button>
        )
      )}

      <motion.button
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={() => onPageChange(meta.page + 1)}
        disabled={!meta.hasNextPage}
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-md"
      >
        <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </motion.button>

      <span className="text-[10px] sm:text-xs font-semibold text-white/80 bg-card/20 backdrop-blur-sm px-2.5 sm:px-3 py-1.5 rounded-full border border-white/20 ml-1">
        {meta.page} / {meta.totalPages} · {meta.total}
      </span>
    </motion.div>
  );
}

// ── Main page ──────────────────────────────────────────
export default function PublicMenuPage() {
  const [activeTab, setActiveTab] = useState<MenuTab>("daily");
  const [mealFilter, setMealFilter] = useState<MealFilter>("All");

  const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>([]);
  const [menuMeta, setMenuMeta] = useState<PaginationMeta | null>(null);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuPage, setMenuPage] = useState(1);

  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [plansMeta, setPlansMeta] = useState<PaginationMeta | null>(null);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansPage, setPlansPage] = useState(1);

  const FILTERS: MealFilter[] = ["All", "Breakfast", "Lunch", "Dinner"];

  const fetchMenuItems = useCallback(async (page: number) => {
    setMenuLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      const res = await fetch(`/api/public/menu?${params}`);
      const json = await res.json();
      if (json.success) { setAllMenuItems(json.data); setMenuMeta(json.meta); }
    } catch (err) {
      console.error("Failed to fetch menu items:", err);
    } finally {
      setMenuLoading(false);
    }
  }, []);

  const fetchMealPlans = useCallback(async (page: number) => {
    setPlansLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      const res = await fetch(`/api/public/plans?${params}`);
      const json = await res.json();
      if (json.success) { setMealPlans(json.data); setPlansMeta(json.meta); }
    } catch (err) {
      console.error("Failed to fetch meal plans:", err);
    } finally {
      setPlansLoading(false);
    }
  }, []);

  useEffect(() => { fetchMenuItems(menuPage); }, [menuPage, fetchMenuItems]);
  useEffect(() => { fetchMealPlans(plansPage); }, [plansPage, fetchMealPlans]);

  const filteredMenuItems = applyMealFilter(allMenuItems, mealFilter);

  const handleTabChange = (tab: MenuTab) => {
    setActiveTab(tab);
    setMealFilter("All");
  };

  const isLoading = activeTab === "daily" ? menuLoading : plansLoading;
  const currentMeta = activeTab === "daily" ? menuMeta : plansMeta;

  return (
    <div className="relative w-full min-h-screen">
      <img
        src="/bg-chefs.png" alt="" aria-hidden="true" decoding="async"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", zIndex: 0, pointerEvents: "none" }}
      />
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.15)", zIndex: 1, pointerEvents: "none" }} />

      <div className="relative max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-4 sm:space-y-6" style={{ zIndex: 2 }}>

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="text-lg sm:text-xl lg:text-2xl font-black text-white text-center drop-shadow-md"
        >
          {activeTab === "daily" ? "Our Menu" : "Meal Plans"}
        </motion.h2>

        {/* Tab switcher */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}
          className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/50 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center shadow-md"
        >
          <div className="flex items-center gap-0.5 sm:gap-1 bg-muted rounded-xl p-1">
            {(["daily", "plans"] as MenuTab[]).map((tab) => (
              <button
                key={tab} onClick={() => handleTabChange(tab)}
                className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "daily" ? "Menu Items" : "Meal Plans"}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Filter pills — daily tab only */}
        {activeTab === "daily" && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.1 }}
            className="flex gap-1.5 sm:gap-2 flex-wrap"
          >
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setMealFilter(f)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-bold border transition-all duration-200 shadow-sm ${
                  mealFilter === f
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-card/80 backdrop-blur-sm text-card-foreground border-border/60 hover:border-primary/40 hover:text-primary hover:bg-card"
                }`}
              >
                {f}
              </button>
            ))}
          </motion.div>
        )}

        {/* Results count */}
        {!isLoading && (
          <p className="text-[10px] sm:text-xs text-white/70 font-medium">
            {activeTab === "daily"
              ? `Showing ${filteredMenuItems.length}${mealFilter !== "All" ? ` ${mealFilter}` : ""} item${filteredMenuItems.length !== 1 ? "s" : ""}`
              : `Showing ${mealPlans.length} of ${plansMeta?.total ?? 0} plans`
            }
          </p>
        )}

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3 lg:gap-4">
          <AnimatePresence mode="popLayout">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => <ShimmerCard key={`shimmer-${i}`} />)
              : activeTab === "daily"
                ? filteredMenuItems.map((item, i) => <MenuItemCard key={item.id} item={item} index={i} />)
                : mealPlans.map((plan, i) => <MealPlanCard key={plan.id} plan={plan} index={i} />)
            }
          </AnimatePresence>
        </div>

        {/* Empty states */}
        {!isLoading && activeTab === "daily" && filteredMenuItems.length === 0 && (
          <div className="text-center py-12 sm:py-16 text-white/60">
            <p className="text-3xl sm:text-4xl mb-3">🍽️</p>
            <p className="font-semibold text-sm sm:text-base">
              No {mealFilter !== "All" ? mealFilter : ""} items found
            </p>
          </div>
        )}
        {!isLoading && activeTab === "plans" && mealPlans.length === 0 && (
          <div className="text-center py-12 sm:py-16 text-white/60">
            <p className="text-3xl sm:text-4xl mb-3">🥗</p>
            <p className="font-semibold text-sm sm:text-base">No meal plans available</p>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && currentMeta && mealFilter === "All" && (
          <Pagination
            meta={currentMeta}
            onPageChange={(p) => {
              if (activeTab === "daily") setMenuPage(p);
              else setPlansPage(p);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        )}
      </div>

      <style jsx global>{`
        @keyframes shimmer { 100% { transform: translateX(200%); } }
      `}</style>
    </div>
  );
}