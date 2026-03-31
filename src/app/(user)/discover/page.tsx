
"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MapPin, Star, Clock, ChevronDown,
  ChevronLeft, ChevronRight, Bike, ShoppingBag,
  UtensilsCrossed, Filter, Flame, Sparkles, BadgeCheck,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Business, ServiceType, DayOfWeek } from "@/types/user-section";

// ── Dummy seed data ────────────────────────────────────
const DAYS: DayOfWeek[] = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"];

const BUSINESSES: Business[] = [
  {
    id: "b1", name: "Mama Peninah's Kitchen", chefName: "Chef Peninah",
    description: "Bold African spices and slow-grilled meats, cooked fresh every morning in Kitusuri.",
    phone: "+254 712 345 678", address: "14 Mwangi Road", city: "Nairobi", state: "Nairobi", country: "Kenya",
    yearsOfExperience: 5, foodSpecialty: ["African", "Grills", "Spicy"],
    services: ["DELIVERY", "PICKUP"], availability: ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY"],
    rating: 4.3, reviewCount: 132, isOpen: true, priceMin: 280, priceMax: 620, isFeatured: false, isTopRated: false,
  },
  {
    id: "b2", name: "Fatima's Swahili Bites", chefName: "Fatima Hassan",
    description: "Authentic coastal Swahili cuisine — coconut curries, biryani, and the freshest seafood in Kahawa West.",
    phone: "+254 722 456 789", address: "7 Coastal Drive", city: "Nairobi", state: "Nairobi", country: "Kenya",
    yearsOfExperience: 6, foodSpecialty: ["Swahili", "Seafood", "Coastal"],
    services: ["DELIVERY", "DINE_IN"], availability: DAYS,
    rating: 4.6, reviewCount: 204, isOpen: true, priceMin: 300, priceMax: 700, isFeatured: true, isTopRated: true,
  },
  {
    id: "b3", name: "Juma's Curry House", chefName: "Chef Juma",
    description: "Slow-roasted curries and authentic Kenyan home cooking with a modern twist, served in Parklands.",
    phone: "+254 733 567 890", address: "22 Parklands Ave", city: "Nairobi", state: "Nairobi", country: "Kenya",
    yearsOfExperience: 4, foodSpecialty: ["Kenyan", "Curries", "Traditional"],
    services: ["PICKUP", "DINE_IN"], availability: ["TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"],
    rating: 4.1, reviewCount: 98, isOpen: false, priceMin: 250, priceMax: 580, isFeatured: false, isTopRated: false,
  },
  {
    id: "b4", name: "David's Grill & Co.", chefName: "David",
    description: "Gourmet steaks, artisan burgers and the finest sea foods in Kilimani. Italian-inspired excellence.",
    phone: "+254 744 678 901", address: "5 Kilimani Road", city: "Nairobi", state: "Nairobi", country: "Kenya",
    yearsOfExperience: 7, foodSpecialty: ["Italian", "Steaks", "Gourmet", "Seafood"],
    services: ["DELIVERY", "PICKUP", "DINE_IN"], availability: DAYS,
    rating: 4.8, reviewCount: 341, isOpen: true, priceMin: 350, priceMax: 950, isFeatured: true, isTopRated: true,
  },
  {
    id: "b5", name: "Amara Green Table", chefName: "Chef Amara",
    description: "Vibrant plant-based meals made with seasonal produce. Proving vegan food is extraordinary.",
    phone: "+254 755 789 012", address: "33 Westlands Rd", city: "Nairobi", state: "Nairobi", country: "Kenya",
    yearsOfExperience: 5, foodSpecialty: ["Vegan", "Plant-Based", "Healthy"],
    services: ["DELIVERY", "PICKUP"], availability: ["MONDAY","WEDNESDAY","FRIDAY","SATURDAY","SUNDAY"],
    rating: 4.5, reviewCount: 167, isOpen: true, priceMin: 320, priceMax: 680, isFeatured: false, isTopRated: false,
  },
  {
    id: "b6", name: "Kofi's Street Flavours", chefName: "Chef Kofi",
    description: "West African street food done right — suya, jollof, kelewele and more from South B.",
    phone: "+254 766 890 123", address: "9 South B Market", city: "Nairobi", state: "Nairobi", country: "Kenya",
    yearsOfExperience: 8, foodSpecialty: ["West African", "Street Food", "Grills"],
    services: ["PICKUP", "DINE_IN"], availability: ["FRIDAY","SATURDAY","SUNDAY"],
    rating: 4.4, reviewCount: 89, isOpen: false, priceMin: 180, priceMax: 420, isFeatured: false, isTopRated: false,
  },
  {
    id: "b7", name: "Zara Continental", chefName: "Chef Zara",
    description: "Refined continental cuisine and handcrafted pastries made fresh daily in the heart of Karen.",
    phone: "+254 777 901 234", address: "12 Karen Boulevard", city: "Nairobi", state: "Nairobi", country: "Kenya",
    yearsOfExperience: 10, foodSpecialty: ["Continental", "Pastries", "French"],
    services: ["DELIVERY", "DINE_IN"], availability: ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY"],
    rating: 4.9, reviewCount: 512, isOpen: true, priceMin: 500, priceMax: 1400, isFeatured: true, isTopRated: true,
  },
  {
    id: "b8", name: "Ibrahim Halal Kitchen", chefName: "Chef Ibrahim",
    description: "Certified halal grills, aromatic pilau and Somali-influenced dishes straight from Eastleigh.",
    phone: "+254 788 012 345", address: "3 Eastleigh Lane", city: "Nairobi", state: "Nairobi", country: "Kenya",
    yearsOfExperience: 6, foodSpecialty: ["Halal", "Grills", "Pilau", "Somali"],
    services: ["DELIVERY", "PICKUP"], availability: ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"],
    rating: 4.6, reviewCount: 223, isOpen: true, priceMin: 260, priceMax: 590, isFeatured: false, isTopRated: false,
  },
  {
    id: "b9", name: "Njeri's Home Plates", chefName: "Grace Njeri",
    description: "Hearty home-cooked Kenyan meals — mukimo, githeri, nyama choma. Comfort food at its finest.",
    phone: "+254 799 123 456", address: "45 Ruaka Town", city: "Nairobi", state: "Nairobi", country: "Kenya",
    yearsOfExperience: 3, foodSpecialty: ["Kenyan", "Home Cooking", "Traditional"],
    services: ["DELIVERY"], availability: ["MONDAY","WEDNESDAY","FRIDAY"],
    rating: 4.2, reviewCount: 74, isOpen: true, priceMin: 200, priceMax: 450, isFeatured: false, isTopRated: false,
  },
  {
    id: "b10", name: "Otieno's Smokehouse", chefName: "Kevin Otieno",
    description: "Low-and-slow smoked meats, BBQ platters and rich smoky sides. Weekend vibes, every day.",
    phone: "+254 700 234 567", address: "17 Industrial Area", city: "Nairobi", state: "Nairobi", country: "Kenya",
    yearsOfExperience: 9, foodSpecialty: ["BBQ", "Smoked Meats", "American"],
    services: ["PICKUP", "DINE_IN"], availability: ["WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"],
    rating: 4.7, reviewCount: 189, isOpen: true, priceMin: 400, priceMax: 1100, isFeatured: false, isTopRated: true,
  },
  {
    id: "b11", name: "Mutua's Breakfast Club", chefName: "Brian Mutua",
    description: "The city's best breakfast spread — avocado toasts, shakshuka, fresh juices and more.",
    phone: "+254 701 345 678", address: "8 Gigiri Close", city: "Nairobi", state: "Nairobi", country: "Kenya",
    yearsOfExperience: 4, foodSpecialty: ["Breakfast", "Brunch", "Continental"],
    services: ["DELIVERY", "DINE_IN"], availability: ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"],
    rating: 4.5, reviewCount: 156, isOpen: true, priceMin: 220, priceMax: 520, isFeatured: false, isTopRated: false,
  },
  {
    id: "b12", name: "Wendo's Dessert Lab", chefName: "Eunice Wendo",
    description: "Artisan cakes, gourmet desserts, macarons and custom sweet creations for every occasion.",
    phone: "+254 702 456 789", address: "21 Lavington Mall", city: "Nairobi", state: "Nairobi", country: "Kenya",
    yearsOfExperience: 5, foodSpecialty: ["Desserts", "Pastries", "Cakes"],
    services: ["DELIVERY", "PICKUP"], availability: ["TUESDAY","THURSDAY","SATURDAY","SUNDAY"],
    rating: 4.8, reviewCount: 298, isOpen: false, priceMin: 350, priceMax: 800, isFeatured: false, isTopRated: true,
  },
];

const SERVICE_ICONS: Record<ServiceType, React.ReactNode> = {
  DELIVERY: <Bike className="w-3 h-3" />,
  PICKUP: <ShoppingBag className="w-3 h-3" />,
  DINE_IN: <UtensilsCrossed className="w-3 h-3" />,
};
const SERVICE_LABELS: Record<ServiceType, string> = {
  DELIVERY: "Delivery", PICKUP: "Pickup", DINE_IN: "Dine In",
};

type FilterTab = "all" | "open" | "top-rated" | "featured";
type SortOption = "popular" | "rating" | "price-low" | "price-high" | "newest";
const PAGE_SIZE = 8;

// ── Sort portal dropdown ───────────────────────────────
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "popular", label: "Most Popular" },
  { value: "rating", label: "Top Rated" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
];

function SortPortal({
  value, onChange, open, setOpen, triggerRef,
}: {
  value: SortOption;
  onChange: (v: SortOption) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + window.scrollY + 6, right: window.innerWidth - r.right });
    }
  }, [open, triggerRef]);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open, setOpen, triggerRef]);

  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
          style={{ position: "absolute", top: pos.top, right: pos.right, zIndex: 99999, width: "12rem" }}
          className="bg-background border border-border rounded-xl shadow-2xl overflow-hidden"
        >
          {SORT_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                opt.value === value ? "text-primary font-semibold bg-primary/5" : "text-foreground hover:bg-muted"
              }`}>
              {opt.label}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ── Business card ──────────────────────────────────────
function BusinessCard({ biz, index }: { biz: Business; index: number }) {
  const initials = biz.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const todayDay = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"][new Date().getDay()] as DayOfWeek;
  const availableToday = biz.availability.includes(todayDay);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-16px" }}
      transition={{ duration: 0.4, delay: (index % 4) * 0.07 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-background rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 flex flex-col group"
    >
      {/* Premise image / logo area */}
      <div className="relative w-full aspect-[16/9] bg-muted overflow-hidden flex-shrink-0">
        {biz.premiseImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={biz.premiseImageUrl} alt={biz.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/5 via-muted to-secondary/10 flex flex-col items-center justify-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-background/80 border border-border flex items-center justify-center shadow-sm">
              <span className="text-xl font-black text-primary">{initials}</span>
            </div>
          </div>
        )}

        {/* Badges top-left */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
          {biz.isTopRated && (
            <span className="flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground shadow-sm">
              <BadgeCheck className="w-3 h-3" /> Top Rated
            </span>
          )}
          {biz.isFeatured && (
            <span className="flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-primary text-primary-foreground shadow-sm">
              <Flame className="w-3 h-3" /> Featured
            </span>
          )}
        </div>

        {/* Open/Closed badge */}
        <span className={`absolute top-2.5 right-2.5 text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm ${
          biz.isOpen && availableToday
            ? "bg-[#007606] text-white"
            : "bg-muted/90 text-muted-foreground border border-border"
        }`}>
          {biz.isOpen && availableToday ? "OPEN" : "CLOSED"}
        </span>

        {/* Logo overlay bottom-left */}
        {biz.logoUrl && (
          <div className="absolute bottom-2.5 left-2.5 w-10 h-10 rounded-xl bg-background border border-border overflow-hidden shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={biz.logoUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-3.5 sm:p-4 flex flex-col gap-2 flex-1">
        {/* Name + rating */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-black text-foreground leading-tight flex-1">{biz.name}</h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Star className="w-3.5 h-3.5 text-secondary fill-secondary" />
            <span className="text-xs font-bold text-foreground">{biz.rating}</span>
            <span className="text-[10px] text-muted-foreground">({biz.reviewCount})</span>
          </div>
        </div>

        {/* Chef + location */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-primary" />
            {biz.chefName}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-primary" />
            {biz.city}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {biz.yearsOfExperience}y exp
          </span>
        </div>

        {/* Description */}
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
          {biz.description}
        </p>

        {/* Specialties */}
        <div className="flex gap-1 flex-wrap">
          {biz.foodSpecialty.slice(0, 3).map((s) => (
            <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {s}
            </span>
          ))}
          {biz.foodSpecialty.length > 3 && (
            <span className="text-[10px] text-muted-foreground">+{biz.foodSpecialty.length - 3}</span>
          )}
        </div>

        {/* Services + price */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-1">
          <div className="flex gap-1.5">
            {biz.services.map((s) => (
              <span key={s} title={SERVICE_LABELS[s]}
                className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-primary/8 text-primary border border-primary/15">
                {SERVICE_ICONS[s]}
                <span className="hidden sm:inline">{SERVICE_LABELS[s]}</span>
              </span>
            ))}
          </div>
          <span className="text-xs font-bold text-foreground whitespace-nowrap">
            Ksh {biz.priceMin}–{biz.priceMax}
          </span>
        </div>

        {/* CTA */}
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

// ── Main page ──────────────────────────────────────────
export default function DiscoverPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<FilterTab>("all");
  const [sort, setSort] = useState<SortOption>("popular");
  const [showSort, setShowSort] = useState(false);
  const [serviceFilter, setServiceFilter] = useState<ServiceType | "all">("all");
  const [page, setPage] = useState(1);
  const sortRef = useRef<HTMLButtonElement>(null);

  const TABS: { value: FilterTab; label: string; icon?: React.ReactNode }[] = [
    { value: "all", label: "All Kitchens" },
    { value: "open", label: "Open Now" },
    { value: "top-rated", label: "Top Rated", icon: <BadgeCheck className="w-3.5 h-3.5" /> },
    { value: "featured", label: "Featured", icon: <Flame className="w-3.5 h-3.5" /> },
  ];

  const SERVICE_FILTERS: { value: ServiceType | "all"; label: string }[] = [
    { value: "all", label: "All Services" },
    { value: "DELIVERY", label: "Delivery" },
    { value: "PICKUP", label: "Pickup" },
    { value: "DINE_IN", label: "Dine In" },
  ];

  const todayDay = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"][new Date().getDay()] as DayOfWeek;

  // Filter
  const filtered = BUSINESSES.filter((b) => {
    const matchSearch = search === "" ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.chefName.toLowerCase().includes(search.toLowerCase()) ||
      b.city.toLowerCase().includes(search.toLowerCase()) ||
      b.foodSpecialty.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    const matchTab =
      tab === "all" ? true :
      tab === "open" ? b.isOpen && b.availability.includes(todayDay) :
      tab === "top-rated" ? b.isTopRated :
      tab === "featured" ? b.isFeatured : true;
    const matchService = serviceFilter === "all" || b.services.includes(serviceFilter);
    return matchSearch && matchTab && matchService;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sort === "rating") return b.rating - a.rating;
    if (sort === "price-low") return a.priceMin - b.priceMin;
    if (sort === "price-high") return b.priceMax - a.priceMax;
    if (sort === "popular") return b.reviewCount - a.reviewCount;
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleTabChange = (t: FilterTab) => { setTab(t); setPage(1); };
  const handleServiceFilter = (s: ServiceType | "all") => { setServiceFilter(s); setPage(1); };

  return (
    <div className="min-h-screen bg-muted/20">

      {/* ── Hero search bar ── */}
      <div className="bg-background border-b border-border px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground">
              Discover Kitchens Near You
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Find private chefs, browse menus and subscribe to meal plans
            </p>
          </div>

          {/* Search */}
          <div className="relative flex items-center">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by chef, cuisine, neighbourhood..."
              className="pl-11 pr-4 py-5 rounded-2xl border-border bg-background text-sm shadow-sm focus-visible:ring-primary"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            {TABS.map((t) => (
              <button key={t.value} onClick={() => handleTabChange(t.value)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                  tab === t.value
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary bg-background"
                }`}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5">

        {/* Service filter + sort + result count */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Service pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            {SERVICE_FILTERS.map((sf) => (
              <button key={sf.value} onClick={() => handleServiceFilter(sf.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${
                  serviceFilter === sf.value
                    ? "bg-secondary text-secondary-foreground border-secondary"
                    : "border-border text-muted-foreground hover:border-primary/30 bg-background"
                }`}>
                {sf.value !== "all" && SERVICE_ICONS[sf.value as ServiceType]}
                {sf.label}
              </button>
            ))}
          </div>

          {/* Sort + count */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {sorted.length} kitchen{sorted.length !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Sort by:</span>
              <button ref={sortRef} onClick={() => setShowSort((p) => !p)}
                className="flex items-center gap-2 text-xs font-semibold text-foreground border border-border rounded-xl px-3 py-1.5 bg-background hover:bg-muted transition-colors whitespace-nowrap">
                {SORT_OPTIONS.find((s) => s.value === sort)?.label}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showSort ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          <AnimatePresence mode="popLayout">
            {paginated.length > 0 ? (
              paginated.map((biz, i) => (
                <BusinessCard key={biz.id} biz={biz} index={i} />
              ))
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full text-center py-20 space-y-2"
              >
                <p className="text-lg font-black text-foreground">No kitchens found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-4 pb-8">
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-md"
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                    p === page
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}>
                  {p}
                </button>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-md"
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        )}
      </div>

      {/* Sort portal */}
      <SortPortal
        value={sort} onChange={(v) => { setSort(v); setPage(1); }}
        open={showSort} setOpen={setShowSort} triggerRef={sortRef}
      />
    </div>
  );
}