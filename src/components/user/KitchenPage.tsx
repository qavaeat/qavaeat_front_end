"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Star, Clock, ChevronLeft, ChevronRight, ChevronDown,
  CalendarDays, UtensilsCrossed, Plus, Bike, ShoppingBag, X,
  BadgeCheck, Sparkles, Phone, Calendar, Truck, Flame, BookOpen,
  Users, CheckCircle2, RefreshCw, Award, ChefHat, Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePlan } from "@/context/PlanContext";
import { toast } from "sonner";
import type { MealTime, DayOfWeek, DeliveryOption } from "@/types/user-section";

// ── Types ──────────────────────────────────────────────────────────────────
interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  imageUrl: string | null;
  isAvailable: boolean;
  calories: number | null;
  prepTimeMin: number | null;
  tags: string[];
  mealTimes: MealTime[];
}

interface MealPlanItem {
  id: string;
  menuItemId: string;
  menuItem: { id: string; name: string; imageUrl: string | null };
  mealTime: MealTime;
  dayNumber: number;
  notes: string | null;
}

interface MealPlan {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  cuisineType: string[];
  mealTypes: MealTime[];
  price: number;
  currency: string;
  durationDays: number;
  mealsPerDay: number;
  maxSubscribers: number | null;
  isDeliveryAvailable: boolean;
  isPickupAvailable: boolean;
  availableDays: DayOfWeek[];
  tags: string[];
  subscriberCount: number;
  meals?: MealPlanItem[];
  status: string;
}

interface Business {
  id: string;
  name: string;
  description: string | null;
  city: string;
  address: string;
  logoUrl: string | null;
  premiseImageUrl: string | null;
  foodSpecialty: string[];
  services: ("DELIVERY" | "PICKUP" | "DINE_IN")[];
  availability: DayOfWeek[];
  isFeatured?: boolean;
  isTopRated?: boolean;
  distanceKm?: number | null;
  chef: {
    profile: { firstName: string | null; lastName: string | null; phone: string | null } | null;
  };
  _count: { menuItems: number; reviews: number };
}

type KitchenTab = "menu" | "plans";
type MealFilter = "All" | MealTime;
type SortOpt = "popular" | "price-low" | "price-high";

const PAGE_SIZE_MENU = 8;
const PAGE_SIZE_PLANS = 6;

const ACCENT_COLORS = [
  "#DD3131","#0891b2","#d97706","#16a34a","#7c3aed","#ea580c","#059669",
];
const EMOJIS = ["🍖","🦞","🍛","🥩","🥗","🍢","🥐","🍱","🍝","🍤"];

function getAccent(id: string) {
  const hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return ACCENT_COLORS[hash % ACCENT_COLORS.length]!;
}
function getEmoji(id: string) {
  const hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return EMOJIS[hash % EMOJIS.length]!;
}

// Resolve chef display name — never falls back to "Chef" or shows empty
function resolveChefName(profile: Business["chef"]["profile"]): string {
  if (!profile) return "";
  const parts = [profile.firstName, profile.lastName]
    .filter((p): p is string => !!p && p.trim().length > 0)
    .map((p) => p.trim());
  return parts.length > 0 ? parts.join(" ") : "";
}

// ── Sort portal ────────────────────────────────────────────────────────────
function SortPortal({ value, onChange, open, setOpen, triggerRef }: {
  value: SortOpt; onChange: (v: SortOpt) => void;
  open: boolean; setOpen: (v: boolean) => void;
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
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
          style={{ position: "absolute", top: pos.top, right: pos.right, zIndex: 99999, width: "11rem" }}
          className="bg-background border border-border rounded-xl shadow-2xl overflow-hidden">
          {[
            { v: "popular", l: "Most Popular" },
            { v: "price-low", l: "Price: Low to High" },
            { v: "price-high", l: "Price: High to Low" },
          ].map((opt) => (
            <button key={opt.v} onClick={() => { onChange(opt.v as SortOpt); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                opt.v === value ? "text-primary font-semibold bg-primary/5" : "text-foreground hover:bg-muted"
              }`}>
              {opt.l}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// ── View Plan modal ────────────────────────────────────────────────────────
function ViewPlanModal({ plan, onClose, onSubscribe }: {
  plan: MealPlan; onClose: () => void; onSubscribe: () => void;
}) {
  const meals = plan.meals ?? [];
  const days = [...new Set(meals.map((m) => m.dayNumber))].sort((a, b) => a - b);
  const MEAL_ORDER: MealTime[] = ["BREAKFAST", "LUNCH", "DINNER"];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.3 }}
        className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-start justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-base font-black text-foreground">{plan.name}</h2>
            <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{plan.durationDays} days</span>
              <span>·</span>
              <span className="flex items-center gap-1"><UtensilsCrossed className="w-3 h-3" />{plan.mealsPerDay} meals/day</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{plan.subscriberCount} subs</span>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-3 border-b border-border/50 flex-shrink-0">
          <p className="text-xs text-muted-foreground leading-relaxed">{plan.description}</p>
          <div className="flex gap-1.5 flex-wrap mt-2">
            {plan.tags.map((t) => (
              <span key={t} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{t}</span>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {meals.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">No meal items added yet.</div>
          ) : (
            days.map((day) => (
              <div key={day}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-[11px] font-black text-primary-foreground flex-shrink-0">{day}</span>
                  <span className="text-xs font-black text-foreground">Day {day}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="space-y-1.5 pl-9">
                  {MEAL_ORDER.filter((mt) => meals.some((m) => m.dayNumber === day && m.mealTime === mt)).map((mt) => {
                    const meal = meals.find((m) => m.dayNumber === day && m.mealTime === mt)!;
                    return (
                      <div key={mt} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/30 border border-border/50">
                        <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-sm flex-shrink-0">🍽️</div>
                        <p className="text-xs font-bold text-foreground truncate flex-1">{meal.menuItem.name}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          mt === "BREAKFAST" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : mt === "LUNCH" ? "bg-primary/10 text-primary"
                          : "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                        }`}>{mt.charAt(0) + mt.slice(1).toLowerCase()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-border flex-shrink-0">
          <div>
            <p className="text-lg font-black text-primary">KES {plan.price.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">{plan.durationDays <= 7 ? "per week" : "per month"}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="rounded-full border-border px-5">Close</Button>
            <Button onClick={() => { onClose(); onSubscribe(); }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 font-bold">
              Subscribe
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Subscribe modal ────────────────────────────────────────────────────────
function SubscribeModal({ plan, onClose }: { plan: MealPlan; onClose: () => void }) {
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>("DELIVERY");
  const [startDate, setStartDate] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isValid = startDate.trim().length > 0 && (deliveryOption === "PICKUP" || address.trim().length > 0);

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/meal-plan-subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealPlanId: plan.id, deliveryOption, deliveryAddress: deliveryOption === "DELIVERY" ? address : null, startDate }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json?.message ?? "Failed to subscribe");
      }
      toast.success(`Subscribed to ${plan.name}!`);
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.3 }}
        className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-black text-foreground">Subscribe to Plan</h2>
            <p className="text-xs text-muted-foreground">{plan.name} · KES {plan.price.toLocaleString()}/{plan.durationDays <= 7 ? "week" : "month"}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" /> Start Date *
            </label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]} className="rounded-xl border-border" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Delivery Option *</label>
            <div className="grid grid-cols-2 gap-2">
              {(["DELIVERY", "PICKUP"] as DeliveryOption[]).map((opt) => (
                <button key={opt} onClick={() => setDeliveryOption(opt)}
                  disabled={(opt === "DELIVERY" && !plan.isDeliveryAvailable) || (opt === "PICKUP" && !plan.isPickupAvailable)}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                    deliveryOption === opt ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40 bg-background"
                  }`}>
                  {opt === "DELIVERY" ? <Truck className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                  {opt === "DELIVERY" ? "Delivery" : "Pickup"}
                </button>
              ))}
            </div>
          </div>
          {deliveryOption === "DELIVERY" && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Delivery Address *</label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 14 Mwangi Road, Westlands" className="rounded-xl border-border" />
            </div>
          )}
          <div className="bg-muted/40 rounded-xl p-3 space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span className="font-semibold">{plan.durationDays} days</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total meals</span><span className="font-semibold">{plan.durationDays * plan.mealsPerDay}</span></div>
            <div className="flex justify-between border-t border-border pt-1.5">
              <span className="font-black text-foreground">Total</span>
              <span className="font-black text-primary">KES {plan.price.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={onClose} className="rounded-full px-6">Cancel</Button>
          <Button onClick={handleSubmit} disabled={!isValid || submitting}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 font-bold disabled:opacity-40">
            {submitting
              ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Subscribing...</span>
              : "Subscribe Now"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-background rounded-2xl border border-border overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-muted" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-8 bg-muted rounded-xl mt-2" />
      </div>
    </div>
  );
}

// ── Menu item card ─────────────────────────────────────────────────────────
function MenuItemCard({ item, index, kitchenName, kitchenEmoji, kitchenId }: {
  item: MenuItem; index: number; kitchenName: string; kitchenEmoji: string; kitchenId: string;
}) {
  const { addToplan, isPlanned, removeFromPlan, plannedMeals, loading } = usePlan();
  const planned = isPlanned(item.id);
  const plannedItem = plannedMeals.find((m) => m.menuItemId === item.id);

  const handleToggle = () => {
    if (loading) return;
    if (planned && plannedItem) {
      removeFromPlan(plannedItem.id);
      toast.success(`${item.name} removed from plan`);
    } else {
      addToplan({
        menuItemId:  item.id,
        name:        item.name,
        imageUrl:    item.imageUrl,
        price:       item.price,
        description: item.description ?? "",
        kitchenName,
        kitchenId,
        emoji:       kitchenEmoji,
        prepTimeMin: item.prepTimeMin ?? 20,
      });
      toast.success(`${item.name} added to your plan!`);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-16px" }} transition={{ duration: 0.35, delay: (index % 4) * 0.05 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={`bg-background rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col ${
        item.isAvailable ? "border-border" : "border-border/50 opacity-60"
      }`}>
      <div className="relative w-full aspect-[4/3] bg-muted overflow-hidden flex-shrink-0">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-muted to-muted/60">🍽️</div>
        )}
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
            <span className="text-xs font-black text-muted-foreground border border-border px-3 py-1 rounded-full bg-background">Unavailable</span>
          </div>
        )}
        <span className="absolute bottom-2 right-2 text-xs font-black px-2.5 py-1 rounded-full bg-background/90 text-primary shadow-sm">
          KES {Number(item.price).toLocaleString()}
        </span>
      </div>
      <div className="p-3 flex flex-col gap-2 flex-1">
        <p className="text-sm font-bold text-foreground leading-tight">{item.name}</p>
        {item.description && (
          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{item.description}</p>
        )}
        <div className="flex items-center gap-1.5 flex-wrap">
          {item.mealTimes.map((mt) => (
            <span key={mt} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary/20 text-secondary-foreground">
              {mt.charAt(0) + mt.slice(1).toLowerCase()}
            </span>
          ))}
          {item.prepTimeMin && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground ml-auto">
              <Clock className="w-3 h-3" />{item.prepTimeMin}m
            </span>
          )}
        </div>
        {item.isAvailable && (
          <motion.button onClick={handleToggle} disabled={loading} whileTap={{ scale: 0.95 }}
            className={`w-full mt-auto rounded-xl text-xs font-bold py-2.5 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 ${
              planned ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-primary hover:bg-primary/90 text-primary-foreground"
            }`}>
            {planned
              ? <><CheckCircle2 className="w-3.5 h-3.5" />Added to Plan</>
              : <><Plus className="w-3.5 h-3.5" />Add to Plan</>}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

// ── Meal plan card ─────────────────────────────────────────────────────────
function MealPlanCard({ plan, index, onSubscribe }: {
  plan: MealPlan; index: number; onSubscribe: (p: MealPlan) => void;
}) {
  const [viewing, setViewing] = useState(false);

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-16px" }} transition={{ duration: 0.35, delay: index * 0.06 }}
        whileHover={{ y: -3, transition: { duration: 0.2 } }}
        className="bg-background rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
        <div className="relative w-full aspect-[16/9] bg-muted overflow-hidden flex-shrink-0">
          {plan.imageUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={plan.imageUrl} alt={plan.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-muted to-muted/60">🥗</div>}
          <span className={`absolute top-2.5 right-2.5 text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm ${
            plan.durationDays <= 7 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" : "bg-primary/10 text-primary"
          }`}>
            {plan.durationDays <= 7 ? "Weekly" : "Monthly"}
          </span>
        </div>
        <div className="p-4 flex flex-col gap-2.5 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-black text-foreground leading-tight flex-1">{plan.name}</h3>
            <p className="text-sm font-black text-primary whitespace-nowrap">KES {Number(plan.price).toLocaleString()}</p>
          </div>
          {plan.description && (
            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{plan.description}</p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {plan.tags.map((t) => (
              <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{t}</span>
            ))}
          </div>
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{plan.durationDays} days</span>
            <span>|</span>
            <span className="flex items-center gap-1"><UtensilsCrossed className="w-3 h-3" />{plan.mealsPerDay} meals/day</span>
          </div>
          <div className="flex gap-3 text-[10px]">
            {plan.isDeliveryAvailable && <span className="flex items-center gap-1 text-emerald-600"><Bike className="w-3 h-3" />Delivery</span>}
            {plan.isPickupAvailable && <span className="flex items-center gap-1 text-emerald-600"><ShoppingBag className="w-3 h-3" />Pickup</span>}
          </div>
          <div className="flex gap-2 mt-auto pt-1">
            <Button onClick={() => setViewing(true)} variant="outline"
              className="flex-1 rounded-xl border-border text-xs font-bold h-9 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />View Plan
            </Button>
            <Button onClick={() => onSubscribe(plan)}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-black h-9">
              Subscribe
            </Button>
          </div>
        </div>
      </motion.div>
      <AnimatePresence>
        {viewing && (
          <ViewPlanModal plan={plan} onClose={() => setViewing(false)} onSubscribe={() => onSubscribe(plan)} />
        )}
      </AnimatePresence>
    </>
  );
}

// ── Hero skeleton (shown while business loads) ─────────────────────────────
function HeroSkeleton() {
  return (
    <div className="relative w-full bg-muted animate-pulse" style={{ height: "380px" }}>
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-8">
        <div className="max-w-6xl mx-auto space-y-3">
          <div className="h-3 w-24 bg-white/20 rounded" />
          <div className="h-9 w-64 bg-white/20 rounded-lg" />
          <div className="h-4 w-48 bg-white/10 rounded" />
        </div>
      </div>
    </div>
  );
}

// ── Main KitchenPage ───────────────────────────────────────────────────────
export default function KitchenPage({ businessId }: { businessId?: string }) {
  const [business, setBusiness]       = useState<Business | null>(null);
  const [menuItems, setMenuItems]     = useState<MenuItem[]>([]);
  const [mealPlans, setMealPlans]     = useState<MealPlan[]>([]);
  const [loadingBiz, setLoadingBiz]   = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const [activeTab, setActiveTab]   = useState<KitchenTab>("menu");
  const [mealFilter, setMealFilter] = useState<MealFilter>("All");
  const [sort, setSort]             = useState<SortOpt>("popular");
  const [showSort, setShowSort]     = useState(false);
  const [page, setPage]             = useState(1);
  const [subscribingTo, setSubscribingTo] = useState<MealPlan | null>(null);
  const [mounted, setMounted]       = useState(false);
  const sortRef = useRef<HTMLButtonElement>(null);

  const { count: planCount } = usePlan();

  useEffect(() => { setMounted(true); }, []);

  const fetchBusiness = useCallback(async () => {
    if (!businessId) return;
    setLoadingBiz(true);
    try {
      const res  = await fetch(`/api/business/${businessId}`, { cache: "no-store" });
      const json = await res.json();
      setBusiness(json?.data ?? json?.business ?? null);
    } catch {
      setError("Failed to load kitchen details.");
    } finally {
      setLoadingBiz(false);
    }
  }, [businessId]);

  const fetchMenu = useCallback(async () => {
    if (!businessId) return;
    setLoadingMenu(true);
    try {
      const res  = await fetch(`/api/business/${businessId}/menu?limit=100`, { cache: "no-store" });
      const json = await res.json();
      const raw  = json?.items ?? json?.data ?? [];
      setMenuItems(raw.map((item: MenuItem & { price: number | string }) => ({ ...item, price: Number(item.price) })));
    } catch {
      setError("Failed to load menu items.");
    } finally {
      setLoadingMenu(false);
    }
  }, [businessId]);

  const fetchMealPlans = useCallback(async () => {
    if (!businessId) return;
    setLoadingPlans(true);
    try {
      const res  = await fetch(`/api/business/${businessId}/meal-plans?limit=50`, { cache: "no-store" });
      const json = await res.json();
      const raw  = json?.data ?? [];
      setMealPlans(raw.map((p: MealPlan & { price: number | string }) => ({
        ...p, price: Number(p.price),
        subscriberCount: p.subscriberCount ?? (p as unknown as { currentSubscribers?: number }).currentSubscribers ?? 0,
        meals: (p as unknown as { meals?: MealPlanItem[] }).meals ?? [],
      })));
    } catch {
      setError("Failed to load meal plans.");
    } finally {
      setLoadingPlans(false);
    }
  }, [businessId]);

  useEffect(() => { fetchBusiness(); fetchMenu(); }, [fetchBusiness, fetchMenu]);
  useEffect(() => { if (activeTab === "plans") fetchMealPlans(); }, [activeTab, fetchMealPlans]);

  // ── Derived values — only computed once business is non-null ──────────────
  const accentColor = business ? getAccent(business.id) : "#DD3131";
  const emoji       = business ? getEmoji(business.id) : "🍽️";
  const chefName    = business ? resolveChefName(business.chef.profile) : "";

  const filteredItems = menuItems
    .filter((item) => mealFilter === "All" || item.mealTimes.includes(mealFilter as MealTime))
    .sort((a, b) =>
      sort === "price-low" ? a.price - b.price :
      sort === "price-high" ? b.price - a.price :
      b.mealTimes.length - a.mealTimes.length,
    );

  const totalPages     = activeTab === "menu"
    ? Math.ceil(filteredItems.length / PAGE_SIZE_MENU)
    : Math.ceil(mealPlans.length / PAGE_SIZE_PLANS);
  const paginatedItems = filteredItems.slice((page - 1) * PAGE_SIZE_MENU, page * PAGE_SIZE_MENU);
  const paginatedPlans = mealPlans.slice((page - 1) * PAGE_SIZE_PLANS, page * PAGE_SIZE_PLANS);

  // ── Error state ────────────────────────────────────────────────────────────
  if (error && !business) {
    return (
      <div className="min-h-screen bg-muted/20 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-5xl mb-2">🍽️</p>
          <p className="text-sm font-semibold text-destructive">{error}</p>
          <button onClick={() => { fetchBusiness(); fetchMenu(); }} className="text-xs text-primary underline">
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div key={businessId} className="min-h-screen bg-muted/10">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      {loadingBiz ? <HeroSkeleton /> : (
        <div className="relative w-full overflow-hidden" style={{ height: "380px" }}>
          {/* Background image or gradient */}
          {business?.premiseImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={business.premiseImageUrl} alt=""
              className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <>
              {/* Rich layered gradient background */}
              <div className="absolute inset-0"
                style={{ background: `linear-gradient(135deg, ${accentColor}f0 0%, ${accentColor}b0 35%, ${accentColor}60 65%, ${accentColor}20 100%)` }} />
              <div className="absolute inset-0"
                style={{ background: "linear-gradient(225deg, rgba(255,220,80,0.2) 0%, transparent 55%)" }} />
              {/* Dot grid texture */}
              <div className="absolute inset-0 opacity-[0.07]"
                style={{ backgroundImage: "radial-gradient(circle, #fff 1.5px, transparent 1.5px)", backgroundSize: "28px 28px" }} />
              {/* Large decorative emoji */}
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                <span className="select-none blur-[1px]"
                  style={{ fontSize: "clamp(120px,20vw,200px)", opacity: 0.12, lineHeight: 1, transform: "rotate(-8deg)" }}>
                  {emoji}
                </span>
              </div>
            </>
          )}

          {/* Dark overlay gradient at bottom for text readability */}
          <div className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.08) 100%)" }} />

          {/* Featured badge */}
          {business?.isFeatured && (
            <div className="absolute top-5 left-5">
              <span className="flex items-center gap-1.5 text-[11px] font-black px-3 py-1.5 rounded-full bg-primary text-primary-foreground shadow-lg backdrop-blur-sm">
                <Flame className="w-3 h-3" />Featured Kitchen
              </span>
            </div>
          )}

          {/* Top-rated badge */}
          {business?.isTopRated && (
            <div className="absolute top-5 right-5">
              <span className="flex items-center gap-1.5 text-[11px] font-black px-3 py-1.5 rounded-full bg-amber-400 text-amber-900 shadow-lg">
                <Award className="w-3 h-3" />Top Rated
              </span>
            </div>
          )}

          {/* Hero content */}
          <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-8 pt-16">
            <div className="max-w-6xl mx-auto">
              {/* Breadcrumb */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                className="flex items-center gap-1.5 text-white/60 text-xs mb-3 font-medium tracking-wide">
                <span>Discover</span>
                <span className="text-white/40">›</span>
                <span className="text-white/80">{business?.city}</span>
                <span className="text-white/40">›</span>
                <span className="text-white/95">{business?.name}</span>
              </motion.div>

              <div className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                  {/* Kitchen name */}
                  <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.05 }}
                    className="text-3xl sm:text-4xl lg:text-5xl font-black text-white drop-shadow-xl leading-tight tracking-tight">
                    {business?.name}
                  </motion.h1>

                  {/* Chef + city line — only rendered when data exists */}
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.12 }}
                    className="flex items-center gap-3 mt-2 flex-wrap">
                    {chefName ? (
                      <span className="flex items-center gap-1.5 text-white/90 text-sm font-semibold">
                        <ChefHat className="w-4 h-4 text-white/70" />
                        {chefName}
                      </span>
                    ) : null}
                    {chefName && business?.city ? (
                      <span className="text-white/40">·</span>
                    ) : null}
                    {business?.city ? (
                      <span className="flex items-center gap-1.5 text-white/75 text-sm">
                        <MapPin className="w-3.5 h-3.5 text-white/55" />
                        {business.city}
                      </span>
                    ) : null}
                    {business?.chef.profile?.phone ? (
                      <>
                        <span className="text-white/40">·</span>
                        <span className="flex items-center gap-1.5 text-white/70 text-sm">
                          <Phone className="w-3.5 h-3.5 text-white/50" />
                          {business.chef.profile.phone}
                        </span>
                      </>
                    ) : null}
                  </motion.div>
                </div>

                {/* Stats pill cluster */}
                <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.18 }}
                  className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2 text-white">
                    <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                    <span className="text-xs font-black">{business?._count.reviews ?? 0}</span>
                    <span className="text-[10px] text-white/60 font-medium">reviews</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2 text-white">
                    <Utensils className="w-3.5 h-3.5 text-white/70" />
                    <span className="text-xs font-black">{business?._count.menuItems ?? 0}</span>
                    <span className="text-[10px] text-white/60 font-medium">dishes</span>
                  </div>
                  {business?.services.map((s) => (
                    <div key={s} className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2 text-white">
                      {s === "DELIVERY" && <Bike className="w-3.5 h-3.5 text-white/70" />}
                      {s === "PICKUP" && <ShoppingBag className="w-3.5 h-3.5 text-white/70" />}
                      {s === "DINE_IN" && <UtensilsCrossed className="w-3.5 h-3.5 text-white/70" />}
                      <span className="text-[10px] font-bold text-white/80">
                        {s === "DELIVERY" ? "Delivery" : s === "PICKUP" ? "Pickup" : "Dine In"}
                      </span>
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

        {/* ── INFO STRIP ──────────────────────────────────────────────────── */}
        {!loadingBiz && business && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row gap-0">

              {/* Logo + identity */}
              <div className="flex items-center gap-4 p-5 sm:border-r border-border sm:min-w-[260px]">
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl border-2 border-border shadow-sm flex items-center justify-center text-3xl overflow-hidden"
                    style={{ background: `${accentColor}15` }}>
                    {business.logoUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={business.logoUrl} alt="" className="w-full h-full object-cover" />
                      : emoji}
                  </div>
                  {business.isTopRated && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shadow-sm">
                      <BadgeCheck className="w-3 h-3 text-amber-900" />
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-black text-foreground text-sm leading-tight">{business.name}</p>
                  {chefName && (
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <ChefHat className="w-3 h-3" />{chefName}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />{business.address}, {business.city}
                  </p>
                </div>
              </div>

              {/* Description + specialties */}
              <div className="flex-1 p-5 space-y-3">
                {business.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{business.description}</p>
                )}
                {business.foodSpecialty.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {business.foodSpecialty.map((s) => (
                      <span key={s} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-border bg-muted/50 text-foreground">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Availability strip */}
              {business.availability.length > 0 && (
                <div className="sm:border-l border-t sm:border-t-0 border-border p-5 flex flex-col justify-center gap-1.5 sm:min-w-[140px]">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Open</p>
                  <div className="flex flex-wrap gap-1">
                    {["MON","TUE","WED","THU","FRI","SAT","SUN"].map((d, i) => {
                      const dayMap: Record<string, string> = {
                        MON:"MONDAY",TUE:"TUESDAY",WED:"WEDNESDAY",
                        THU:"THURSDAY",FRI:"FRIDAY",SAT:"SATURDAY",SUN:"SUNDAY",
                      };
                      const isOpen = business.availability.includes(dayMap[d] as DayOfWeek);
                      return (
                        <span key={i} className={`text-[9px] font-black w-6 h-6 rounded-md flex items-center justify-center ${
                          isOpen ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground/40"
                        }`}>{d.slice(0,1)}</span>
                      );
                    })}
                  </div>
                  {business.chef.profile?.phone && (
                    <a href={`tel:${business.chef.profile.phone}`}
                      className="text-[10px] text-primary font-bold flex items-center gap-1 mt-1 hover:underline">
                      <Phone className="w-2.5 h-2.5" />{business.chef.profile.phone}
                    </a>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── FLOATING SCHEDULE BUTTON ─────────────────────────────────────── */}
        {mounted && planCount > 0 && (
          <motion.a initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            href="/my-table"
            className="fixed bottom-6 right-6 z-30 flex items-center gap-2.5 bg-emerald-600 text-white rounded-2xl px-4 py-3 shadow-2xl font-bold text-sm hover:bg-emerald-700 transition-colors">
            <CalendarDays className="w-4 h-4" />
            {planCount} meal{planCount !== 1 ? "s" : ""} planned · Schedule
          </motion.a>
        )}

        {/* ── TAB BAR + SORT ───────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-background/95 backdrop-blur-sm rounded-2xl border border-border px-4 py-3 shadow-sm">
          <div className="flex items-center gap-1 bg-muted rounded-xl p-1 w-fit">
            {([["menu", "Menu"], ["plans", "Meal Plans"]] as [KitchenTab, string][]).map(([tab, label]) => (
              <button key={tab} onClick={() => { setActiveTab(tab); setPage(1); setMealFilter("All"); }}
                className={`px-5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === tab ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => activeTab === "menu" ? fetchMenu() : fetchMealPlans()}
              className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors" title="Refresh">
              <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <span className="text-xs text-muted-foreground hidden sm:block">Sort:</span>
            <button ref={sortRef} onClick={() => setShowSort((p) => !p)}
              className="flex items-center gap-2 text-xs font-semibold text-foreground border border-border rounded-xl px-3 py-1.5 bg-background hover:bg-muted transition-colors whitespace-nowrap">
              {sort === "popular" ? "Popular" : sort === "price-low" ? "Price ↑" : "Price ↓"}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSort ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>

        <SortPortal value={sort} onChange={(v) => { setSort(v); setPage(1); }} open={showSort} setOpen={setShowSort} triggerRef={sortRef} />

        {/* ── MEAL FILTER PILLS ────────────────────────────────────────────── */}
        <AnimatePresence>
          {activeTab === "menu" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} className="flex gap-2 flex-wrap overflow-hidden">
              {(["All", "BREAKFAST", "LUNCH", "DINNER"] as MealFilter[]).map((f) => (
                <button key={f} onClick={() => { setMealFilter(f); setPage(1); }}
                  className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                    mealFilter === f
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary bg-background"
                  }`}>
                  {f === "All" ? "All Meals" : f === "BREAKFAST" ? "☕ Breakfast" : f === "LUNCH" ? "🍽️ Lunch" : "🌙 Dinner"}
                </button>
              ))}
              {filteredItems.length > 0 && (
                <span className="ml-auto self-center text-xs text-muted-foreground font-medium">
                  {filteredItems.length} dish{filteredItems.length !== 1 ? "es" : ""}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── GRID ────────────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {activeTab === "menu" ? (
            <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {loadingMenu
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
                : paginatedItems.length > 0
                  ? paginatedItems.map((item, i) => (
                      <MenuItemCard key={item.id} item={item} index={i}
                        kitchenName={business?.name ?? ""}
                        kitchenId={business?.id ?? ""}
                        kitchenEmoji={emoji} />
                    ))
                  : (
                    <div className="col-span-full text-center py-20 space-y-2">
                      <p className="text-4xl">🍽️</p>
                      <p className="text-sm font-semibold text-foreground">No dishes for this meal time</p>
                      <p className="text-xs text-muted-foreground">Try a different filter</p>
                    </div>
                  )}
            </motion.div>
          ) : (
            <motion.div key="plans" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {loadingPlans
                ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                : paginatedPlans.length > 0
                  ? paginatedPlans.map((plan, i) => (
                      <MealPlanCard key={plan.id} plan={plan} index={i} onSubscribe={setSubscribingTo} />
                    ))
                  : (
                    <div className="col-span-full text-center py-20 space-y-2">
                      <p className="text-4xl">📋</p>
                      <p className="text-sm font-semibold text-foreground">No meal plans yet</p>
                      <p className="text-xs text-muted-foreground">Check back soon</p>
                    </div>
                  )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── PAGINATION ───────────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2 pb-6">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-md">
              <ChevronLeft className="w-4 h-4" />
            </motion.button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                    p === page ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted"
                  }`}>{p}</button>
              ))}
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-md">
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {subscribingTo && <SubscribeModal plan={subscribingTo} onClose={() => setSubscribingTo(null)} />}
      </AnimatePresence>
    </div>
  );
}