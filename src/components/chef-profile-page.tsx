"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Star, Clock, ChevronLeft, ChevronRight,
  ChevronDown, CalendarDays, UtensilsCrossed, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Types ──────────────────────────────────────────────
type MenuTab = "daily" | "plans";
type MealFilter = "All" | "Breakfast" | "Lunch" | "Dinner" | "Tags";
type SortOption = "Most Popular" | "Price: Low to High" | "Price: High to Low" | "Newest";

const CHEFS_DATA: Record<string, {
  name: string;
  location: string;
  specialty: string;
  bio: string;
  rating: number;
  reviewCount: number;
  priceMin: number;
  priceMax: number;
  cuisines: string[];
  experience: string;
  status: "open" | "closed";
  isTopRated: boolean;
}> = {
  "chef-peninah": {
    name: "Chef Peninah", location: "Kitusuri",
    specialty: "African Spicy, Grilled Dishes",
    bio: "I specialise in bold African flavours — fiery grills, smoky marinades and traditional spice blends passed down for generations.",
    rating: 3, reviewCount: 48, priceMin: 300, priceMax: 600,
    cuisines: ["African", "Grills"], experience: "5+ years",
    status: "open", isTopRated: false,
  },
  "fatima-hassan": {
    name: "Fatima Hassan", location: "Kahawa West",
    specialty: "Great Swahili Dishes",
    bio: "Authentic Swahili coastal cuisine with rich coconut-based curries, biryani and freshly caught seafood prepared the traditional way.",
    rating: 3, reviewCount: 61, priceMin: 250, priceMax: 550,
    cuisines: ["Swahili", "Coastal"], experience: "6+ years",
    status: "open", isTopRated: false,
  },
  "chef-juma": {
    name: "Chef Juma", location: "Parklands",
    specialty: "Kenyan Cuisines, Roasting Curries",
    bio: "A fusion of Kenyan home cooking and slow-roasted curries that bring warmth and comfort to every meal.",
    rating: 3, reviewCount: 39, priceMin: 280, priceMax: 580,
    cuisines: ["Kenyan", "Curries"], experience: "4+ years",
    status: "open", isTopRated: false,
  },
  "david": {
    name: "David", location: "Kilimani",
    specialty: "Steaks, Burgers & Sea Foods",
    bio: "I specialise in Italian cuisine and provide gourmet meals, steaks, burgers and sea foods.",
    rating: 4, reviewCount: 120, priceMin: 350, priceMax: 750,
    cuisines: ["Italian", "Gourmet"], experience: "7+ years",
    status: "open", isTopRated: true,
  },
  "chef-amara": {
    name: "Chef Amara", location: "Westlands",
    specialty: "Vegan & Plant-Based Cuisine",
    bio: "Creating vibrant, nourishing plant-based meals that prove healthy eating can be just as delicious and satisfying.",
    rating: 4, reviewCount: 85, priceMin: 320, priceMax: 680,
    cuisines: ["Vegan", "Plant-Based"], experience: "5+ years",
    status: "open", isTopRated: false,
  },
  "chef-kofi": {
    name: "Chef Kofi", location: "South B",
    specialty: "West African Street Food",
    bio: "Bringing the vibrant street food culture of West Africa to Nairobi — bold, spicy and full of character.",
    rating: 4, reviewCount: 72, priceMin: 200, priceMax: 450,
    cuisines: ["West African", "Street Food"], experience: "8+ years",
    status: "closed", isTopRated: false,
  },
  "chef-zara": {
    name: "Chef Zara", location: "Karen",
    specialty: "Continental & Pastries",
    bio: "Refined continental cuisine paired with handcrafted pastries and desserts made fresh every morning.",
    rating: 5, reviewCount: 204, priceMin: 500, priceMax: 1200,
    cuisines: ["Continental", "Pastries"], experience: "10+ years",
    status: "open", isTopRated: true,
  },
  "chef-ibrahim": {
    name: "Chef Ibrahim", location: "Eastleigh",
    specialty: "Halal Grills & Pilau",
    bio: "Certified halal cooking with aromatic pilau, slow-cooked nyama choma and traditional Somali-influenced dishes.",
    rating: 4, reviewCount: 93, priceMin: 280, priceMax: 600,
    cuisines: ["Halal", "Grills"], experience: "6+ years",
    status: "open", isTopRated: false,
  },
};

// Fallback for unknown slugs
const DEFAULT_CHEF = CHEFS_DATA["david"];
const MENU_ITEMS = Array.from({ length: 14 }, (_, i) => ({
  id: `item-${i}`,
  name: "Classic Rib Steak",
  description: "Juicy perfectly grilled rib steak served with garlic herb butter, roasted potatoes, and asparagus.",
  price: 645,
  tags: ["Steak", "Dinner"],
  mealTime: ["Lunch", "Dinner"][i % 2],
  prepTime: 25,
  imageUrl: null,
}));

// ── Dummy meal plans ───────────────────────────────────
const MEAL_PLANS = Array.from({ length: 14 }, (_, i) => ({
  id: `plan-${i}`,
  name: "Weekly Healthy Diet",
  description: "A nutritious meal plan featuring balanced and healthy dishes for a week of dining well.",
  tags: ["Healthy", "Fresh", "Italian"],
  days: 7,
  meals: 14,
  imageUrl: null,
}));

const PAGE_SIZE = 8;

// ── Sort dropdown — portal-based to escape stacking contexts ──
function SortDropdown({
  value,
  onChange,
  triggerRef,
  open,
  setOpen,
}: {
  value: SortOption;
  onChange: (v: SortOption) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const [mounted] = useState(true);

  const OPTIONS: SortOption[] = [
    "Most Popular",
    "Price: Low to High",
    "Price: High to Low",
    "Newest",
  ];

 

  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + window.scrollY + 6,
        right: window.innerWidth - rect.right,
      });
    }
  }, [open, triggerRef]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, setOpen, triggerRef]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
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
            width: "13rem",
          }}
          className="bg-background border border-border rounded-xl shadow-2xl overflow-hidden"
        >
          {OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                opt === value
                  ? "text-primary font-semibold bg-primary/5"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              {opt}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ── Menu item card ─────────────────────────────────────
function MenuItemCard({ item, index }: { item: typeof MENU_ITEMS[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.4, delay: (index % 4) * 0.06 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-background rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
    >
      {/* Food image */}
      <div className="relative w-full aspect-[4/3] bg-muted overflow-hidden flex-shrink-0">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-muted to-muted/60">
            🥩
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        {/* Name + price */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-bold text-foreground leading-tight flex-1">{item.name}</p>
          <p className="text-sm font-black text-primary whitespace-nowrap flex-shrink-0">
            Ksh {item.price}
          </p>
        </div>

        {/* Description */}
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
          {item.description}
        </p>

        {/* Tags + prep time */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: tag === "Steak" ? "#F4CD2E40" : "#EBE9E9",
                color: tag === "Steak" ? "#8E771B" : "#858484",
              }}
            >
              {tag}
            </span>
          ))}
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground ml-auto">
            <Clock className="w-3 h-3" />
            {item.prepTime} min
          </span>
        </div>

        {/* CTA */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="mt-auto pt-1"
        >
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold py-4 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Add to Plan
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ── Meal plan card ─────────────────────────────────────
function MealPlanCard({ plan, index }: { plan: typeof MEAL_PLANS[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.4, delay: (index % 4) * 0.06 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-background rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
    >
      {/* Plan image */}
      <div className="relative w-full aspect-[4/3] bg-muted overflow-hidden flex-shrink-0">
        {plan.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={plan.imageUrl} alt={plan.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-muted to-muted/60">
            🥗
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col gap-2 flex-1">
        <p className="text-sm font-bold text-foreground leading-tight">{plan.name}</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
          {plan.description}
        </p>

        {/* Tags */}
        <div className="flex gap-1.5 flex-wrap">
          {plan.tags.map((tag, i) => (
            <span
              key={tag}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: i === 0 ? "#F4CD2E40" : i === 1 ? "#007606/10" : "#EBE9E9",
                color: i === 0 ? "#8E771B" : i === 1 ? "#007606" : "#858484",
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Duration + meals */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarDays className="w-3 h-3" />
            {plan.days} Days
          </span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-1">
            <UtensilsCrossed className="w-3 h-3" />
            {plan.meals} Meals
          </span>
        </div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="mt-auto pt-1">
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold py-4">
            View Plan
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ── Main page ──────────────────────────────────────────
export default function ChefProfilePage({ chefId }: { chefId?: string }) {
  // Derive chef data from URL slug — falls back to David if slug unknown
  const chef = (chefId && CHEFS_DATA[chefId]) ? CHEFS_DATA[chefId] : DEFAULT_CHEF;

  const [activeTab, setActiveTab] = useState<MenuTab>("daily");
  const [mealFilter, setMealFilter] = useState<MealFilter>("All");
  const [sort, setSort] = useState<SortOption>("Most Popular");
  const [showSort, setShowSort] = useState(false);
  const [page, setPage] = useState(1);
  const sortTriggerRef = useRef<HTMLButtonElement>(null);

  const FILTERS: MealFilter[] = ["All", "Breakfast", "Lunch", "Dinner", "Tags"];

  const items = activeTab === "daily" ? MENU_ITEMS : MEAL_PLANS;
  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const paginated = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleTabChange = (tab: MenuTab) => {
    setActiveTab(tab);
    setPage(1);
    setMealFilter("All");
  };

  // chefId as key forces full remount when navigating between chef profiles
  return (
    <div key={chefId} className="relative w-full min-h-screen">

      {/* ── Full-page background image — absolute so it remounts with key ── */}
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
      {/* Overlay for readability */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.15)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* All content sits above the bg */}
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6" style={{ zIndex: 2 }}>

        {/* ── Chef Profile Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-background/95 backdrop-blur-sm rounded-2xl border border-border shadow-lg overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row gap-4 p-5 sm:p-6">
            {/* Chef photo */}
            <div className="relative flex-shrink-0">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-xl overflow-hidden bg-muted">
                <div className="w-full h-full bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center text-5xl">
                  👨‍🍳
                </div>
              </div>
              {chef.isTopRated && (
                <span className="absolute top-2 left-2 text-[10px] font-black px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground shadow-sm">
                  Top Rated
                </span>
              )}
            </div>

            {/* Chef info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-foreground mb-1">{chef.name}</h1>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      {chef.location}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-4 h-4 ${s <= chef.rating ? "text-secondary fill-secondary" : "text-muted-foreground/30 fill-muted-foreground/10"}`} />
                      ))}
                      <span className="text-sm font-bold text-foreground">{chef.rating}.0</span>
                      <span className="text-xs text-muted-foreground">({chef.reviewCount})</span>
                    </div>
                  </div>
                </div>
                <span className={`text-xs font-black px-4 py-1.5 rounded-full border ${
                  chef.status === "open"
                    ? "bg-[#007606]/10 text-[#007606] border-[#007606]/30"
                    : "bg-muted text-muted-foreground border-border"
                }`}>
                  {chef.status.toUpperCase()}
                </span>
              </div>

              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {chef.bio}
              </p>

              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm font-medium text-muted-foreground">Ksh</span>
                <span className="text-lg font-black text-primary">{chef.priceMin}</span>
                <span className="text-muted-foreground">-</span>
                <span className="text-lg font-black text-primary">{chef.priceMax}</span>
                <span className="text-sm text-muted-foreground">/ meal</span>
              </div>

              {/* Cuisine tags + experience */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {chef.cuisines.map((tag) => (
                  <span key={tag} className="text-xs font-semibold px-3 py-1 rounded-full border border-border bg-muted text-foreground">
                    {tag}
                  </span>
                ))}
                <span className="ml-auto flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {chef.experience} of Exp.
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Section heading ── */}
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-xl sm:text-2xl font-black text-white text-center drop-shadow-md"
        >
          {activeTab === "daily" ? `Delicious Meals by ${chef.name}` : "Explore Meal Plans"}
        </motion.h2>

        {/* ── Tab + Sort controls ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-background/90 backdrop-blur-sm rounded-2xl border border-border/50 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
        >
          {/* Daily / Meal Plans toggle */}
          <div className="flex items-center gap-1 bg-muted rounded-xl p-1 w-fit">
            {(["daily", "plans"] as MenuTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`px-5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "daily" ? "Daily Menu Meals" : "Meal Plans"}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Sort by:</span>
            <button
              ref={sortTriggerRef}
              onClick={() => setShowSort((p) => !p)}
              className="flex items-center gap-2 text-sm font-semibold text-foreground border border-border rounded-xl px-4 py-2 bg-background hover:bg-muted transition-colors"
            >
              {sort}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showSort ? "rotate-180" : ""}`} />
            </button>
          </div>
        </motion.div>

        {/* Portal sort dropdown */}
        <SortDropdown
          value={sort}
          onChange={setSort}
          triggerRef={sortTriggerRef}
          open={showSort}
          setOpen={setShowSort}
        />

        {/* ── Meal time filter pills ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="flex gap-2 flex-wrap"
        >
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => { setMealFilter(f); setPage(1); }}
              className={`px-5 py-2 rounded-full text-xs font-bold border transition-all duration-200 shadow-sm ${
                mealFilter === f
                  ? "bg-primary text-primary-foreground border-primary shadow-md"
                  : "bg-background/80 backdrop-blur-sm text-foreground border-border/60 hover:border-primary/40 hover:text-primary hover:bg-background/95"
              }`}
            >
              {f}
            </button>
          ))}
        </motion.div>

        {/* ── Grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          <AnimatePresence mode="popLayout">
            {paginated.map((item, index) =>
              activeTab === "daily" ? (
                <MenuItemCard key={item.id} item={item as typeof MENU_ITEMS[0]} index={index} />
              ) : (
                <MealPlanCard key={item.id} plan={item as typeof MEAL_PLANS[0]} index={index} />
              )
            )}
          </AnimatePresence>
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex items-center justify-center gap-3 pb-8"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-md"
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>

            <span className="text-sm font-semibold text-foreground bg-background/90 backdrop-blur-sm px-4 py-1.5 rounded-full border border-border shadow-sm">
              {page} out of {totalPages}
            </span>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-md"
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
}