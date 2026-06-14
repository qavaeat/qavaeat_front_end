"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Globe,
  Truck,
  ShoppingBag,
  UtensilsCrossed,
  CalendarDays,
  ChefHat,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Utensils,
  BookOpen,
  Star,
  Lock,
} from "lucide-react";

const DAY_ORDER = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

const DAY_LABEL: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

const SERVICE_META: Record<string, { icon: React.ReactNode; label: string }> = {
  DELIVERY: { icon: <Truck className="w-3 h-3" />, label: "Delivery" },
  PICKUP: { icon: <ShoppingBag className="w-3 h-3" />, label: "Pickup" },
  DINE_IN: { icon: <UtensilsCrossed className="w-3 h-3" />, label: "Dine-in" },
};

function getTodayKey(): string {
  return [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ][new Date().getDay()]!;
}

// ── Types ────────────────────────────────────────────────────────────────

interface BusinessHour {
  day: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

interface Review {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  user: {
    profile: {
      firstName: string | null;
      lastName: string | null;
      avatarUrl: string | null;
    } | null;
  };
}

interface Chef {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  premiseImageUrl?: string | null;
  city: string;
  state: string;
  country: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
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
  reviews: Review[];
  _count: { menuItems: number; mealPlans: number; reviews: number };
}

interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  category?: string | null;
}

interface MealItem {
  menuItem: { name: string; imageUrl?: string | null };
}

interface MealPlan {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  meals: MealItem[];
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}

type KitchenTab = "menu" | "plans";

// ── Avatar ───────────────────────────────────────────────────────────────

function Avatar({
  src,
  name,
  size = "md",
}: {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const dims =
    size === "lg"
      ? "w-24 h-24 sm:w-28 sm:h-28 text-3xl sm:text-4xl"
      : size === "sm"
        ? "w-8 h-8 text-xs"
        : "w-16 h-16 text-xl";
  const border =
    size === "lg"
      ? "border-[4px] border-white/30"
      : size === "sm"
        ? "border border-white/20"
        : "border-[3px] border-white/20";

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
        className={`${dims} rounded-full object-cover ${border} flex-shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${dims} ${border} rounded-full flex items-center justify-center font-black text-white flex-shrink-0`}
      style={{
        background: "linear-gradient(135deg, var(--primary), var(--chart-5))",
      }}
    >
      {initials}
    </div>
  );
}

// ── Stars ────────────────────────────────────────────────────────────────

function Stars({
  rating,
  count,
  size = "sm",
}: {
  rating: number | null;
  count: number;
  size?: "sm" | "md";
}) {
  if (!rating)
    return <p className="text-xs text-muted-foreground">No reviews yet</p>;
  const filled = Math.round(rating);
  const iconCls = size === "md" ? "w-4 h-4" : "w-3 h-3";
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <svg
            key={i}
            className={iconCls}
            viewBox="0 0 20 20"
            fill={i <= filled ? "var(--secondary)" : "var(--muted)"}
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-xs text-muted-foreground font-medium">
        {rating} <span className="opacity-60">({count} reviews)</span>
      </span>
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────

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

  const btn =
    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="flex items-center justify-center gap-1 flex-wrap pt-2 pb-1">
      <button
        onClick={() => onChange(page - 1)}
        disabled={!meta.hasPrevPage}
        className={btn}
        style={{
          background: "var(--primary)",
          color: "var(--primary-foreground)",
        }}
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`e-${i}`} className="text-muted-foreground text-sm px-0.5">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p as number)}
            className={`${btn} border`}
            style={
              p === page
                ? {
                    background: "var(--primary)",
                    color: "var(--primary-foreground)",
                    borderColor: "var(--primary)",
                  }
                : {
                    background: "var(--card)",
                    color: "var(--card-foreground)",
                    borderColor: "var(--border)",
                  }
            }
          >
            {p}
          </button>
        ),
      )}
      <button
        onClick={() => onChange(page + 1)}
        disabled={!meta.hasNextPage}
        className={btn}
        style={{
          background: "var(--primary)",
          color: "var(--primary-foreground)",
        }}
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
      <span className="text-[10px] font-semibold text-muted-foreground ml-1">
        {page} / {totalPages}
      </span>
    </div>
  );
}

// ── Login prompt overlay (shown on card click) ────────────────────────────
// A subtle locked-state indicator on each card instead of a hard redirect,
// so the user can still browse before deciding to log in.

function LoginPromptCard({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="absolute inset-0 flex flex-col items-center justify-center gap-2
        bg-background/80 backdrop-blur-[2px] rounded-2xl cursor-pointer
        opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center"
        style={{ background: "var(--primary)" }}
      >
        <Lock className="w-4 h-4 text-white" />
      </div>
      <p className="text-xs font-black text-foreground">Sign in to order</p>
      <p className="text-[10px] text-muted-foreground">Tap to continue</p>
    </div>
  );
}

// ── Menu Item Card ────────────────────────────────────────────────────────

function MenuItemCard({
  item,
  index,
  onLoginRequired,
}: {
  item: MenuItem;
  index: number;
  onLoginRequired: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.28, delay: (index % 6) * 0.04 }}
      onClick={onLoginRequired}
      className="relative group bg-card border border-border rounded-2xl overflow-hidden
        shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col cursor-pointer"
    >
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-full h-36 sm:h-40 object-cover"
        />
      ) : (
        <div
          className="w-full h-36 sm:h-40 flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, var(--muted), var(--border))",
          }}
        >
          <Utensils className="w-8 h-8 text-muted-foreground opacity-40" />
        </div>
      )}

      <div className="p-3 flex flex-col gap-1 flex-1">
        {item.category && (
          <span className="text-[9px] font-bold uppercase tracking-wider text-primary">
            {item.category}
          </span>
        )}
        <p className="text-xs sm:text-sm font-black text-card-foreground leading-snug line-clamp-2">
          {item.name}
        </p>
        {item.description && (
          <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}
        <div className="mt-auto pt-2 flex items-center justify-between gap-2">
          <span
            className="text-sm font-black"
            style={{ color: "var(--primary)" }}
          >
            KES {Number(item.price).toLocaleString()}
          </span>
          <span
            className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground
            border border-border rounded-full px-2 py-0.5"
          >
            <Lock className="w-2.5 h-2.5" /> Sign in
          </span>
        </div>
      </div>

      {/* Hover overlay */}
      <LoginPromptCard onClick={onLoginRequired} />
    </motion.div>
  );
}

// ── Meal Plan Card ────────────────────────────────────────────────────────

function MealPlanCard({
  plan,
  index,
  onLoginRequired,
}: {
  plan: MealPlan;
  index: number;
  onLoginRequired: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.28, delay: (index % 6) * 0.04 }}
      onClick={onLoginRequired}
      className="relative group bg-card border border-border rounded-2xl p-4
        shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col gap-3 cursor-pointer"
    >
      {/* Plan header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <BookOpen
              className="w-3.5 h-3.5 flex-shrink-0"
              style={{ color: "var(--primary)" }}
            />
            <p className="text-xs sm:text-sm font-black text-card-foreground leading-snug line-clamp-1">
              {plan.name}
            </p>
          </div>
          {plan.description && (
            <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
              {plan.description}
            </p>
          )}
        </div>
        {plan.price != null && (
          <span
            className="text-sm font-black flex-shrink-0"
            style={{ color: "var(--primary)" }}
          >
            KES {Number(plan.price).toLocaleString()}
          </span>
        )}
      </div>

      {/* Meal thumbnails */}
      {plan.meals.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
            Includes
          </p>
          <div className="flex flex-wrap gap-1.5">
            {plan.meals.slice(0, 4).map((m, i) => (
              <div key={i} className="flex items-center gap-1">
                {m.menuItem.imageUrl ? (
                  <img
                    src={m.menuItem.imageUrl}
                    alt={m.menuItem.name}
                    className="w-5 h-5 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div
                    className="w-5 h-5 rounded-full border border-border flex items-center justify-center"
                    style={{ background: "var(--muted)" }}
                  >
                    <Utensils className="w-2.5 h-2.5 text-muted-foreground" />
                  </div>
                )}
                <span className="text-[10px] text-card-foreground font-medium">
                  {m.menuItem.name}
                </span>
              </div>
            ))}
            {plan.meals.length > 4 && (
              <span className="text-[10px] text-muted-foreground self-center">
                +{plan.meals.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-2">
        <span
          className="text-[9px] font-bold px-2 py-1 rounded-full"
          style={{
            background: "var(--primary)",
            color: "var(--primary-foreground)",
          }}
        >
          {plan.meals.length} meal{plan.meals.length !== 1 ? "s" : ""} included
        </span>
        <span
          className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground
          border border-border rounded-full px-2 py-0.5"
        >
          <Lock className="w-2.5 h-2.5" /> Sign in to subscribe
        </span>
      </div>

      {/* Hover overlay */}
      <LoginPromptCard onClick={onLoginRequired} />
    </motion.div>
  );
}

// ── Shimmer ───────────────────────────────────────────────────────────────

function ShimmerGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-card border border-border rounded-2xl overflow-hidden animate-pulse"
        >
          <div className="h-36 bg-muted" />
          <div className="p-3 space-y-2">
            <div className="h-2.5 bg-muted rounded-full w-3/4" />
            <div className="h-2 bg-muted rounded-full w-full" />
            <div className="h-4 bg-muted rounded-full w-1/3 mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Review Card ───────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: Review }) {
  const profile = review.user?.profile;
  const name =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    "Guest";
  const date = new Date(review.createdAt).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const filled = Math.round(review.rating);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col gap-3"
    >
      <div className="flex items-start gap-3">
        <Avatar src={profile?.avatarUrl} name={name} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-card-foreground leading-tight">
            {name}
          </p>
          <p className="text-[10px] text-muted-foreground">{date}</p>
        </div>
        <div className="flex gap-px flex-shrink-0">
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
      </div>
      {review.comment && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">
          {review.comment}
        </p>
      )}
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function KitchenPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [chef, setChef] = useState<Chef | null>(null);
  const [chefLoading, setChefLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<KitchenTab>("menu");

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuMeta, setMenuMeta] = useState<PaginationMeta | null>(null);
  const [menuPage, setMenuPage] = useState(1);
  const [menuLoading, setMenuLoading] = useState(false);

  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [mealMeta, setMealMeta] = useState<PaginationMeta | null>(null);
  const [mealPage, setMealPage] = useState(1);
  const [mealLoading, setMealLoading] = useState(false);

  // const handleLoginRequired = useCallback(() => {
  //   const returnTo = encodeURIComponent(window.location.pathname);
  //   router.push(`/auth?redirect=${returnTo}`);
  // }, [router]);

  const handleLoginRequired = useCallback(() => {
    const returnTo = encodeURIComponent(window.location.pathname);
    window.location.href = `/auth?redirect=${returnTo}`;
  }, []);

  // ── Fetch chef ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    (async () => {
      setChefLoading(true);
      try {
        const res = await fetch(`/api/public/chefs/${id}`);
        const json = await res.json();
        if (json.success && json.data) setChef(json.data);
        else setNotFound(true);
      } catch {
        setNotFound(true);
      } finally {
        setChefLoading(false);
      }
    })();
  }, [id]);

  const fetchMenuItems = useCallback(
    async (page: number) => {
      if (!id) return;
      setMenuLoading(true);
      try {
        const res = await fetch(
          `/api/public/chefs/${id}/menu-items?page=${page}&limit=9`,
        );
        const json = await res.json();
        if (json.success) {
          setMenuItems(json.data);
          setMenuMeta(json.meta);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setMenuLoading(false);
      }
    },
    [id],
  );

  const fetchMealPlans = useCallback(
    async (page: number) => {
      if (!id) return;
      setMealLoading(true);
      try {
        const res = await fetch(
          `/api/public/chefs/${id}/meal-plans?page=${page}&limit=9`,
        );
        const json = await res.json();
        if (json.success) {
          setMealPlans(json.data);
          setMealMeta(json.meta);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setMealLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    if (chef) fetchMenuItems(menuPage);
  }, [chef, menuPage, fetchMenuItems]);
  useEffect(() => {
    if (chef) fetchMealPlans(mealPage);
  }, [chef, mealPage, fetchMealPlans]);

  const today = getTodayKey();
  const sortedHours = chef
    ? [...chef.businessHours].sort(
        (a, b) =>
          DAY_ORDER.indexOf(a.day as (typeof DAY_ORDER)[number]) -
          DAY_ORDER.indexOf(b.day as (typeof DAY_ORDER)[number]),
      )
    : [];

  const hoursGrid = DAY_ORDER.map((day) => {
    const row = sortedHours.find((h) => h.day === day);
    const inAvailability = chef?.availability.includes(day) ?? false;
    if (!inAvailability) return { day, open: false, label: "Closed" };
    if (!row) return { day, open: true, label: "07:00 – 23:00" };
    if (row.isClosed) return { day, open: false, label: "Closed" };
    return { day, open: true, label: `${row.openTime} – ${row.closeTime}` };
  });

  const chefProfile = chef?.chef?.profile;
  const chefName =
    [chefProfile?.firstName, chefProfile?.lastName].filter(Boolean).join(" ") ||
    "Chef";
  const avatarSrc = chef?.logoUrl ?? chefProfile?.avatarUrl;

  if (!chefLoading && notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-6xl">🍽️</p>
        <h2 className="text-lg font-black text-card-foreground">
          Kitchen not found
        </h2>
        <p className="text-sm text-muted-foreground text-center">
          This chef may no longer be available.
        </p>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-primary-foreground"
          style={{ background: "var(--primary)" }}
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  if (chefLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-30 h-14 bg-card/80 backdrop-blur-md border-b border-border animate-pulse" />
        <div className="h-56 sm:h-64 bg-muted animate-pulse" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-12 pb-24 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-5 animate-pulse space-y-3">
            <div className="w-24 h-24 rounded-full bg-muted" />
            <div className="h-5 bg-muted rounded-full w-1/2" />
            <div className="h-3 bg-muted rounded-full w-1/3" />
            <div className="h-3 bg-muted rounded-full w-2/3" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-xl h-16 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!chef) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-30 bg-card/90 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-full flex items-center justify-center border border-border hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-card-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-card-foreground truncate">
              {chef.name}
            </p>
          </div>
          <span
            className="text-[10px] font-black px-2.5 py-1 rounded-full flex-shrink-0"
            style={
              chef.isOpen
                ? { background: "#22c55e20", color: "#16a34a" }
                : {
                    background: "var(--muted)",
                    color: "var(--muted-foreground)",
                  }
            }
          >
            {chef.isOpen ? "● Open Now" : "● Closed"}
          </span>
        </div>
      </div>

      {/* ── Hero ── */}
      <div className="relative w-full h-52 sm:h-64 overflow-hidden">
        {chef.premiseImageUrl ? (
          <img
            src={chef.premiseImageUrl}
            alt={chef.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, var(--primary) 0%, var(--chart-5) 60%, #000 100%)",
            }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.18), rgba(0,0,0,0.65))",
          }}
        />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
      </div>

      {/* ── Main content ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-16 pb-24 space-y-4 sm:space-y-5 relative z-10">
        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-card border border-border rounded-2xl shadow-md overflow-hidden"
        >
          <div
            className="h-1 w-full"
            style={{ background: chef.isOpen ? "#22c55e" : "var(--muted)" }}
          />
          <div className="p-4 sm:p-6">
            <div className="flex gap-4 sm:gap-5 items-start">
              <div className="relative flex-shrink-0">
                <Avatar src={avatarSrc} name={chef.name} size="lg" />
                <span
                  className="absolute -bottom-1 -right-1 text-[9px] font-black px-1.5 py-[3px] rounded-full border-2 border-card whitespace-nowrap"
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
              <div className="flex-1 min-w-0 space-y-2">
                <div>
                  <h1 className="text-base sm:text-xl font-black text-card-foreground leading-tight">
                    {chef.name}
                  </h1>
                  <p className="text-xs text-muted-foreground">by {chefName}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin
                    className="w-3.5 h-3.5 flex-shrink-0"
                    style={{ color: "var(--primary)" }}
                  />
                  <span className="truncate">
                    {[chef.city, chef.state, chef.country]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </div>
                <Stars
                  rating={chef.averageRating}
                  count={chef._count.reviews}
                  size="md"
                />
                {chef.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {chef.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.08 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3"
        >
          {[
            {
              icon: <Utensils className="w-4 h-4" />,
              value: chef._count.menuItems,
              label: "Menu Items",
            },
            {
              icon: <BookOpen className="w-4 h-4" />,
              value: chef._count.mealPlans,
              label: "Meal Plans",
            },
            {
              icon: <Star className="w-4 h-4" />,
              value: chef._count.reviews,
              label: "Reviews",
            },
            {
              icon: <ChefHat className="w-4 h-4" />,
              value: chef.yearsOfExperience,
              label: "Yrs Exp.",
            },
          ].map(({ icon, value, label }) => (
            <div
              key={label}
              className="bg-card border border-border rounded-xl p-3 flex flex-col items-center gap-1 shadow-sm"
            >
              <div style={{ color: "var(--primary)" }}>{icon}</div>
              <p className="text-xl font-black text-card-foreground">{value}</p>
              <p className="text-[10px] text-muted-foreground font-medium">
                {label}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Services + Specialties */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.12 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          {chef.services.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-3">
                Services
              </p>
              <div className="flex flex-wrap gap-2">
                {chef.services.map((s) => {
                  const m = SERVICE_META[s];
                  if (!m) return null;
                  return (
                    <span
                      key={s}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border"
                      style={{
                        background: "var(--primary)",
                        color: "var(--primary-foreground)",
                        borderColor: "var(--primary)",
                      }}
                    >
                      {m.icon} {m.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          {chef.foodSpecialty.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-3">
                Specialties
              </p>
              <div className="flex flex-wrap gap-2">
                {chef.foodSpecialty.map((f) => (
                  <span
                    key={f}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full border"
                    style={{
                      background: "var(--secondary)",
                      color: "var(--secondary-foreground)",
                      borderColor: "var(--secondary)",
                    }}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Contact */}
        {(chef.phone || chef.email || chef.website) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, delay: 0.15 }}
            className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-wrap gap-4"
          >
            {chef.phone && (
              <a
                href={`tel:${chef.phone}`}
                className="flex items-center gap-2 text-xs font-semibold text-card-foreground hover:text-primary transition-colors"
              >
                <Phone
                  className="w-3.5 h-3.5"
                  style={{ color: "var(--primary)" }}
                />
                {chef.phone}
              </a>
            )}
            {chef.email && (
              <a
                href={`mailto:${chef.email}`}
                className="flex items-center gap-2 text-xs font-semibold text-card-foreground hover:text-primary transition-colors truncate"
              >
                <Mail
                  className="w-3.5 h-3.5 flex-shrink-0"
                  style={{ color: "var(--primary)" }}
                />
                <span className="truncate">{chef.email}</span>
              </a>
            )}
            {chef.website && (
              <a
                href={chef.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs font-semibold text-card-foreground hover:text-primary transition-colors"
              >
                <Globe
                  className="w-3.5 h-3.5"
                  style={{ color: "var(--primary)" }}
                />
                Visit Website
              </a>
            )}
          </motion.div>
        )}

        {/* Business hours */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.18 }}
          className="bg-card border border-border rounded-2xl p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4" style={{ color: "var(--primary)" }} />
            <p className="text-sm font-black text-card-foreground">
              Business Hours
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {hoursGrid.map(({ day, open, label }) => {
              const isToday = day === today;
              return (
                <div
                  key={day}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl transition-colors ${isToday ? "border" : ""}`}
                  style={
                    isToday
                      ? {
                          background: "var(--primary)",
                          borderColor: "var(--primary)",
                        }
                      : {}
                  }
                >
                  <div className="flex items-center gap-2">
                    {isToday && (
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-white" />
                    )}
                    <span
                      className={`text-xs font-bold ${isToday ? "text-white" : "text-card-foreground"}`}
                    >
                      {DAY_LABEL[day]}
                      {isToday && (
                        <span className="ml-1.5 text-[9px] font-black opacity-80">
                          Today
                        </span>
                      )}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-semibold ${isToday ? "text-white/90" : open ? "text-card-foreground" : "text-muted-foreground"}`}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Tab navigation ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.2 }}
          className="flex gap-1 bg-muted p-1 rounded-2xl"
        >
          {(
            [
              {
                key: "menu",
                icon: <Utensils className="w-3.5 h-3.5" />,
                label: "Menu Items",
                count: chef._count.menuItems,
              },
              {
                key: "plans",
                icon: <BookOpen className="w-3.5 h-3.5" />,
                label: "Meal Plans",
                count: chef._count.mealPlans,
              },
            ] as const
          ).map(({ key, icon, label, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all duration-200"
              style={
                activeTab === key
                  ? {
                      background: "var(--primary)",
                      color: "var(--primary-foreground)",
                    }
                  : { color: "var(--muted-foreground)" }
              }
            >
              {icon}
              {label}
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full font-black ml-0.5"
                style={
                  activeTab === key
                    ? {
                        background: "rgba(255,255,255,0.25)",
                        color: "var(--primary-foreground)",
                      }
                    : {
                        background: "var(--border)",
                        color: "var(--muted-foreground)",
                      }
                }
              >
                {count}
              </span>
            </button>
          ))}
        </motion.div>

        {/* ── Tab content ── */}
        <AnimatePresence mode="popLayout">
          {activeTab === "menu" && (
            <motion.div
              key="menu-tab"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.22 }}
            >
              {menuLoading ? (
                <ShimmerGrid count={6} />
              ) : menuItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Utensils className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-semibold">
                    No menu items available
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                    <AnimatePresence mode="popLayout">
                      {menuItems.map((item, i) => (
                        <MenuItemCard
                          key={item.id}
                          item={item}
                          index={i}
                          onLoginRequired={handleLoginRequired}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                  {menuMeta && (
                    <Pagination
                      meta={menuMeta}
                      onChange={(p) => {
                        setMenuPage(p);
                        window.scrollTo({ top: 400, behavior: "smooth" });
                      }}
                    />
                  )}
                </>
              )}
            </motion.div>
          )}

          {activeTab === "plans" && (
            <motion.div
              key="plans-tab"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.22 }}
            >
              {mealLoading ? (
                <ShimmerGrid count={6} />
              ) : mealPlans.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-semibold">
                    No meal plans available
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <AnimatePresence mode="popLayout">
                      {mealPlans.map((plan, i) => (
                        <MealPlanCard
                          key={plan.id}
                          plan={plan}
                          index={i}
                          onLoginRequired={handleLoginRequired}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                  {mealMeta && (
                    <Pagination
                      meta={mealMeta}
                      onChange={(p) => {
                        setMealPage(p);
                        window.scrollTo({ top: 400, behavior: "smooth" });
                      }}
                    />
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
