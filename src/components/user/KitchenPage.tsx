"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Star, Clock, ChevronLeft, ChevronRight, ChevronDown,
  CalendarDays, UtensilsCrossed, Plus, Minus, ShoppingCart,
  Bike, ShoppingBag, X, BadgeCheck, Sparkles, Phone,
  Calendar, Truck, Check, Flame, BookOpen, Users,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/context/CartContext";
import { usePlan } from "@/context/PlanContext";
import { toast } from "sonner";
import type { MenuItem, MealPlan, MealTime, DayOfWeek, DeliveryOption } from "@/types/user-section";

// ── Kitchen registry ───────────────────────────────────
const KITCHEN_DATA: Record<string, {
  name: string; chefName: string; description: string;
  phone: string; address: string; city: string;
  yearsOfExperience: number; foodSpecialty: string[];
  services: ("DELIVERY" | "PICKUP" | "DINE_IN")[];
  availability: DayOfWeek[];
  rating: number; reviewCount: number;
  isOpen: boolean; priceMin: number; priceMax: number;
  isFeatured: boolean; isTopRated: boolean;
  accentColor: string; emoji: string;
}> = {
  "b1": { name:"Mama Peninah's Kitchen", chefName:"Chef Peninah", description:"Bold African spices and slow-grilled meats, cooked fresh every morning in Kitusuri.", phone:"+254 712 345 678", address:"14 Mwangi Road", city:"Nairobi", yearsOfExperience:5, foodSpecialty:["African","Grills","Spicy"], services:["DELIVERY","PICKUP"], availability:["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY"] as DayOfWeek[], rating:4.3, reviewCount:132, isOpen:true, priceMin:280, priceMax:620, isFeatured:false, isTopRated:false, accentColor:"#DD3131", emoji:"🍖" },
  "b2": { name:"Fatima's Swahili Bites", chefName:"Fatima Hassan", description:"Authentic coastal Swahili cuisine — coconut curries, biryani, and the freshest seafood.", phone:"+254 722 456 789", address:"7 Coastal Drive", city:"Nairobi", yearsOfExperience:6, foodSpecialty:["Swahili","Seafood","Coastal"], services:["DELIVERY","DINE_IN"], availability:["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"] as DayOfWeek[], rating:4.6, reviewCount:204, isOpen:true, priceMin:300, priceMax:700, isFeatured:true, isTopRated:true, accentColor:"#0891b2", emoji:"🦞" },
  "b3": { name:"Juma's Curry House", chefName:"Chef Juma", description:"Slow-roasted curries and authentic Kenyan home cooking with a modern twist.", phone:"+254 733 567 890", address:"22 Parklands Ave", city:"Nairobi", yearsOfExperience:4, foodSpecialty:["Kenyan","Curries","Traditional"], services:["PICKUP","DINE_IN"], availability:["TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"] as DayOfWeek[], rating:4.1, reviewCount:98, isOpen:false, priceMin:250, priceMax:580, isFeatured:false, isTopRated:false, accentColor:"#d97706", emoji:"🍛" },
  "b4": { name:"David's Grill & Co.", chefName:"David", description:"Gourmet steaks, artisan burgers and the finest sea foods in Kilimani. Italian-inspired excellence since 2017.", phone:"+254 744 678 901", address:"5 Kilimani Road", city:"Nairobi", yearsOfExperience:7, foodSpecialty:["Italian","Steaks","Gourmet","Seafood","Burgers"], services:["DELIVERY","PICKUP","DINE_IN"], availability:["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"] as DayOfWeek[], rating:4.8, reviewCount:341, isOpen:true, priceMin:350, priceMax:950, isFeatured:true, isTopRated:true, accentColor:"#DD3131", emoji:"🥩" },
  "b5": { name:"Amara Green Table", chefName:"Chef Amara", description:"Vibrant plant-based meals made with seasonal produce.", phone:"+254 755 789 012", address:"33 Westlands Rd", city:"Nairobi", yearsOfExperience:5, foodSpecialty:["Vegan","Plant-Based","Healthy"], services:["DELIVERY","PICKUP"], availability:["MONDAY","WEDNESDAY","FRIDAY","SATURDAY","SUNDAY"] as DayOfWeek[], rating:4.5, reviewCount:167, isOpen:true, priceMin:320, priceMax:680, isFeatured:false, isTopRated:false, accentColor:"#16a34a", emoji:"🥗" },
  "b6": { name:"Kofi's Street Flavours", chefName:"Chef Kofi", description:"West African street food done right — suya, jollof, kelewele and more.", phone:"+254 766 890 123", address:"9 South B Market", city:"Nairobi", yearsOfExperience:8, foodSpecialty:["West African","Street Food","Grills"], services:["PICKUP","DINE_IN"], availability:["FRIDAY","SATURDAY","SUNDAY"] as DayOfWeek[], rating:4.4, reviewCount:89, isOpen:false, priceMin:180, priceMax:420, isFeatured:false, isTopRated:false, accentColor:"#ea580c", emoji:"🍢" },
  "b7": { name:"Zara Continental", chefName:"Chef Zara", description:"Refined continental cuisine and handcrafted pastries made fresh daily in Karen.", phone:"+254 777 901 234", address:"12 Karen Boulevard", city:"Nairobi", yearsOfExperience:10, foodSpecialty:["Continental","Pastries","French"], services:["DELIVERY","DINE_IN"], availability:["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY"] as DayOfWeek[], rating:4.9, reviewCount:512, isOpen:true, priceMin:500, priceMax:1400, isFeatured:true, isTopRated:true, accentColor:"#7c3aed", emoji:"🥐" },
  "b8": { name:"Ibrahim Halal Kitchen", chefName:"Chef Ibrahim", description:"Certified halal grills, aromatic pilau and Somali-influenced dishes from Eastleigh.", phone:"+254 788 012 345", address:"3 Eastleigh Lane", city:"Nairobi", yearsOfExperience:6, foodSpecialty:["Halal","Grills","Pilau","Somali"], services:["DELIVERY","PICKUP"], availability:["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"] as DayOfWeek[], rating:4.6, reviewCount:223, isOpen:true, priceMin:260, priceMax:590, isFeatured:false, isTopRated:false, accentColor:"#059669", emoji:"🍱" },
};
const FALLBACK_KITCHEN = KITCHEN_DATA["b4"];

const buildMenuItems = (kitchenId: string): MenuItem[] =>
  Array.from({ length: 12 }, (_, i) => ({
    id: `${kitchenId}-mi-${i + 1}`,
    name: ["Classic Rib Steak","Herb Roasted Salmon","Spaghetti Carbonara","Grilled Chicken Nuggets","Lobster Thermidor","Beef Tenderloin","Shrimp Linguine","Caesar Salad","Mushroom Risotto","BBQ Ribs","Tuna Tartare","Chocolate Lava Cake"][i],
    description: "Expertly prepared with the finest seasonal ingredients and signature house seasoning.",
    price: [645,890,750,520,1800,1200,950,380,680,980,760,420][i],
    quantity: 20, imageUrl: null, isAvailable: i % 5 !== 3,
    calories: [620,480,890,540,920,780,670,280,560,1100,380,540][i],
    prepTimeMin: [25,30,20,15,45,35,25,10,30,40,20,15][i],
    tags: [["Steak","Gourmet"],["Seafood","Healthy"],["Pasta","Italian"],["Chicken","Crispy"],["Seafood","Premium"],["Beef","Premium"],["Seafood","Pasta"],["Salad","Light"],["Vegetarian","Italian"],["BBQ","Grill"],["Seafood","Raw"],["Dessert","Sweet"]][i],
    mealTimes: [["LUNCH","DINNER"],["LUNCH","DINNER"],["LUNCH","DINNER"],["BREAKFAST","LUNCH"],["DINNER"],["DINNER"],["LUNCH","DINNER"],["BREAKFAST","LUNCH"],["LUNCH","DINNER"],["LUNCH","DINNER"],["LUNCH"],["BREAKFAST","LUNCH","DINNER"]][i] as MealTime[],
  }));

const buildMealPlans = (): MealPlan[] => [
  { id:"mp-1", name:"Chef's Weekly Selection", description:"A curated week of the chef's finest dishes — rotating daily for maximum variety.", imageUrl:null, cuisineType:["Mixed"], mealTypes:["LUNCH","DINNER"], price:4800, currency:"KES", durationDays:7, mealsPerDay:2, maxSubscribers:30, isDeliveryAvailable:true, isPickupAvailable:true, availableDays:["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY"] as DayOfWeek[], tags:["Premium","Weekly"], subscriberCount:18 },
  { id:"mp-2", name:"Monthly Gourmet Plan", description:"A full month of expertly crafted meals — the ultimate subscription for food lovers.", imageUrl:null, cuisineType:["Gourmet"], mealTypes:["LUNCH","DINNER"], price:16500, currency:"KES", durationDays:30, mealsPerDay:2, maxSubscribers:20, isDeliveryAvailable:true, isPickupAvailable:false, availableDays:["MONDAY","WEDNESDAY","FRIDAY","SATURDAY"] as DayOfWeek[], tags:["Monthly","Gourmet"], subscriberCount:11 },
  { id:"mp-3", name:"Weekend Indulgence", description:"Premium selections every weekend — the perfect treat to look forward to.", imageUrl:null, cuisineType:["Premium"], mealTypes:["LUNCH","DINNER"], price:2400, currency:"KES", durationDays:7, mealsPerDay:2, maxSubscribers:15, isDeliveryAvailable:true, isPickupAvailable:true, availableDays:["SATURDAY","SUNDAY"] as DayOfWeek[], tags:["Weekend","Premium"], subscriberCount:9 },
  { id:"mp-4", name:"Healthy Daily Plan", description:"Balanced meals for an active lifestyle — fresh, nutritious and delicious.", imageUrl:null, cuisineType:["Healthy"], mealTypes:["BREAKFAST","LUNCH"], price:3200, currency:"KES", durationDays:7, mealsPerDay:2, maxSubscribers:40, isDeliveryAvailable:true, isPickupAvailable:true, availableDays:["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY"] as DayOfWeek[], tags:["Healthy","Daily"], subscriberCount:24 },
];

// Dummy items per plan (replace with real fetch)
const PLAN_ITEMS: Record<string, { day: number; mealTime: MealTime; name: string; emoji: string }[]> = {
  "mp-1": [
    { day:1, mealTime:"LUNCH", name:"Classic Rib Steak", emoji:"🥩" },
    { day:1, mealTime:"DINNER", name:"Herb Roasted Salmon", emoji:"🐟" },
    { day:2, mealTime:"LUNCH", name:"Spaghetti Carbonara", emoji:"🍝" },
    { day:2, mealTime:"DINNER", name:"Beef Tenderloin", emoji:"🥩" },
    { day:3, mealTime:"LUNCH", name:"Caesar Salad", emoji:"🥗" },
    { day:3, mealTime:"DINNER", name:"BBQ Ribs", emoji:"🍖" },
    { day:4, mealTime:"LUNCH", name:"Shrimp Linguine", emoji:"🍤" },
    { day:4, mealTime:"DINNER", name:"Mushroom Risotto", emoji:"🍄" },
  ],
  "mp-2": [
    { day:1, mealTime:"LUNCH", name:"Lobster Thermidor", emoji:"🦞" },
    { day:1, mealTime:"DINNER", name:"Beef Tenderloin", emoji:"🥩" },
    { day:2, mealTime:"LUNCH", name:"Spaghetti Carbonara", emoji:"🍝" },
  ],
  "mp-3": [
    { day:1, mealTime:"LUNCH", name:"Tuna Tartare", emoji:"🐟" },
    { day:1, mealTime:"DINNER", name:"Lobster Thermidor", emoji:"🦞" },
  ],
  "mp-4": [
    { day:1, mealTime:"BREAKFAST", name:"Caesar Salad", emoji:"🥗" },
    { day:1, mealTime:"LUNCH", name:"Mushroom Risotto", emoji:"🍄" },
  ],
};

type KitchenTab = "menu" | "plans";
type MealFilter = "All" | MealTime;
type SortOpt = "popular" | "price-low" | "price-high";
const PAGE_SIZE_MENU = 8;
const PAGE_SIZE_PLANS = 4;

// ── Sort portal ────────────────────────────────────────
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
    const h = (e: MouseEvent) => { if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open, setOpen, triggerRef]);
  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}
          transition={{ duration:0.15 }}
          style={{ position:"absolute", top:pos.top, right:pos.right, zIndex:99999, width:"11rem" }}
          className="bg-background border border-border rounded-xl shadow-2xl overflow-hidden">
          {[{v:"popular",l:"Most Popular"},{v:"price-low",l:"Price: Low to High"},{v:"price-high",l:"Price: High to Low"}].map(opt => (
            <button key={opt.v} onClick={() => { onChange(opt.v as SortOpt); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${opt.v === value ? "text-primary font-semibold bg-primary/5" : "text-foreground hover:bg-muted"}`}>
              {opt.l}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ── View Meal Plan modal ───────────────────────────────
function ViewPlanModal({ plan, onClose, onSubscribe }: { plan: MealPlan; onClose: () => void; onSubscribe: () => void }) {
  const items = PLAN_ITEMS[plan.id] ?? [];
  const days = [...new Set(items.map(i => i.day))].sort((a, b) => a - b);
  const MEAL_ORDER: MealTime[] = ["BREAKFAST", "LUNCH", "DINNER"];

  return (
    <div className="fixed inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-6"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity:0, scale:0.96, y:16 }} animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:0.96 }} transition={{ duration:0.3 }}
        className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-base font-black text-foreground">{plan.name}</h2>
            <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{plan.durationDays} days</span>
              <span>·</span>
              <span className="flex items-center gap-1"><UtensilsCrossed className="w-3 h-3" />{plan.mealsPerDay} meals/day</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{plan.subscriberCount} subscribers</span>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description + tags */}
        <div className="px-6 py-3 border-b border-border/50 flex-shrink-0">
          <p className="text-xs text-muted-foreground leading-relaxed">{plan.description}</p>
          <div className="flex gap-1.5 flex-wrap mt-2">
            {plan.tags.map(t => <span key={t} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{t}</span>)}
            {plan.mealTypes.map(mt => <span key={mt} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary/20 text-secondary-foreground">{mt.charAt(0)+mt.slice(1).toLowerCase()}</span>)}
          </div>
        </div>

        {/* Meal items by day */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">No meal items added to this plan yet.</div>
          ) : (
            days.map(day => (
              <div key={day}>
                {/* Day header */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-[11px] font-black text-primary-foreground flex-shrink-0">{day}</span>
                  <span className="text-xs font-black text-foreground">Day {day}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                {/* Meals for this day */}
                <div className="space-y-1.5 pl-9">
                  {MEAL_ORDER.filter(mt => items.some(i => i.day === day && i.mealTime === mt)).map(mt => {
                    const item = items.find(i => i.day === day && i.mealTime === mt)!;
                    return (
                      <div key={mt} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                        <span className="text-lg flex-shrink-0">{item.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{item.name}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          mt === "BREAKFAST" ? "bg-secondary/20 text-secondary-foreground"
                          : mt === "LUNCH" ? "bg-primary/10 text-primary"
                          : "bg-[#007606]/10 text-[#007606]"
                        }`}>{mt.charAt(0)+mt.slice(1).toLowerCase()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border flex-shrink-0">
          <div>
            <p className="text-lg font-black text-primary">KES {plan.price.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">{plan.durationDays === 7 ? "per week" : "per month"}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="rounded-full border-border px-5">Close</Button>
            <motion.div whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}>
              <Button onClick={() => { onClose(); onSubscribe(); }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 font-bold">
                Subscribe
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Subscribe modal ────────────────────────────────────
function SubscribeModal({ plan, onClose }: { plan: MealPlan; onClose: () => void }) {
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>("DELIVERY");
  const [startDate, setStartDate] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isValid = startDate.trim().length > 0 && (deliveryOption === "PICKUP" || address.trim().length > 0);

  return (
    <div className="fixed inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-6"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity:0, scale:0.96, y:16 }} animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:0.96 }} transition={{ duration:0.3 }}
        className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-black text-foreground">Subscribe to Plan</h2>
            <p className="text-xs text-muted-foreground">{plan.name} · KES {plan.price.toLocaleString()}/{plan.durationDays===7?"week":"month"}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-primary" /> Start Date *</label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} min={new Date().toISOString().split("T")[0]} className="rounded-xl border-border" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Delivery Option *</label>
            <div className="grid grid-cols-2 gap-2">
              {(["DELIVERY","PICKUP"] as DeliveryOption[]).map(opt => (
                <button key={opt} onClick={() => setDeliveryOption(opt)}
                  disabled={(opt==="DELIVERY"&&!plan.isDeliveryAvailable)||(opt==="PICKUP"&&!plan.isPickupAvailable)}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${deliveryOption===opt?"bg-primary text-primary-foreground border-primary":"border-border text-muted-foreground hover:border-primary/40 bg-background"}`}>
                  {opt==="DELIVERY"?<Truck className="w-3.5 h-3.5"/>:<ShoppingBag className="w-3.5 h-3.5"/>}
                  {opt==="DELIVERY"?"Delivery":"Pickup"}
                </button>
              ))}
            </div>
          </div>
          {deliveryOption==="DELIVERY" && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Delivery Address *</label>
              <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. 14 Mwangi Road, Westlands" className="rounded-xl border-border" />
            </div>
          )}
          <div className="bg-muted/40 rounded-xl p-3 space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span className="font-semibold">{plan.durationDays} days</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total meals</span><span className="font-semibold">{plan.durationDays*plan.mealsPerDay}</span></div>
            <div className="flex justify-between border-t border-border pt-1.5"><span className="font-bold text-foreground">Total</span><span className="font-black text-primary">KES {plan.price.toLocaleString()}</span></div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={onClose} className="rounded-full px-6">Cancel</Button>
          <Button onClick={async () => { if (!isValid) return; setSubmitting(true); await new Promise(r=>setTimeout(r,1000)); toast.success(`Subscribed to ${plan.name}!`); setSubmitting(false); onClose(); }}
            disabled={!isValid||submitting}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 font-bold disabled:opacity-40">
            {submitting?<span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Subscribing...</span>:"Subscribe Now"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Cart drawer ────────────────────────────────────────
function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { cart, updateItem, removeItem, clearCart } = useCart();
  const [checkout, setCheckout] = useState(false);
  const [serviceType, setServiceType] = useState<"PICKUP"|"DELIVERY"|"DINE_IN">("DELIVERY");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);
  const canCheckout = serviceType !== "DELIVERY" || address.trim().length > 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40" onClick={onClose} />
          <motion.div initial={{ x:"100%" }} animate={{ x:0 }} exit={{ x:"100%" }}
            transition={{ type:"spring", damping:28, stiffness:300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-background border-l border-border shadow-2xl z-50 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                <h2 className="text-base font-black text-foreground">Cart</h2>
                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-bold">{cart.items.length}</span>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"><X className="w-4 h-4"/></button>
            </div>
            {cart.items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center"><ShoppingCart className="w-7 h-7 text-muted-foreground"/></div>
                <p className="text-sm font-semibold text-foreground">Your cart is empty</p>
                <p className="text-xs text-muted-foreground">Add items or subscribe to a meal plan</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  {!checkout ? (
                    <>
                      {cart.items.map(item => (
                        <motion.div key={item.id} layout initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                          className="flex gap-3 p-3 rounded-xl border border-border bg-muted/20">
                          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-xl flex-shrink-0">🍽️</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">{item.name}</p>
                            <p className="text-xs font-black text-primary mt-0.5">KES {item.price}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <button onClick={() => item.quantity>1?updateItem(item.id,{quantity:item.quantity-1}):removeItem(item.id)} className="w-6 h-6 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"><Minus className="w-3 h-3"/></button>
                              <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                              <button onClick={() => updateItem(item.id,{quantity:item.quantity+1})} className="w-6 h-6 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"><Plus className="w-3 h-3"/></button>
                            </div>
                          </div>
                          <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive p-1 flex-shrink-0"><X className="w-4 h-4"/></button>
                        </motion.div>
                      ))}
                      <button onClick={clearCart} className="w-full text-xs text-muted-foreground hover:text-destructive font-semibold py-2">Clear cart</button>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <h3 className="text-sm font-black text-foreground">Checkout Details</h3>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">Service Type *</label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[{v:"DELIVERY",l:"Delivery",icon:<Bike className="w-3.5 h-3.5"/>},{v:"PICKUP",l:"Pickup",icon:<ShoppingBag className="w-3.5 h-3.5"/>},{v:"DINE_IN",l:"Dine In",icon:<UtensilsCrossed className="w-3.5 h-3.5"/>}].map(({v,l,icon}) => (
                            <button key={v} onClick={() => setServiceType(v as typeof serviceType)}
                              className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-[10px] font-bold border transition-all ${serviceType===v?"bg-primary text-primary-foreground border-primary":"border-border text-muted-foreground hover:border-primary/40"}`}>
                              {icon}{l}
                            </button>
                          ))}
                        </div>
                      </div>
                      {serviceType==="DELIVERY" && <div className="space-y-1.5"><label className="text-xs font-bold text-foreground">Delivery Address *</label><Input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Your delivery address" className="rounded-xl border-border text-sm"/></div>}
                      <div className="space-y-1.5"><label className="text-xs font-bold text-foreground">Notes</label><Textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Special instructions..." rows={3} className="rounded-xl border-border resize-none text-sm"/></div>
                    </div>
                  )}
                </div>
                <div className="px-5 py-4 border-t border-border space-y-3">
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-semibold">KES {cart.subtotal.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Delivery Fee</span><span className="font-semibold">KES {cart.deliveryFee.toLocaleString()}</span></div>
                    <div className="flex justify-between border-t border-border pt-1.5"><span className="font-black text-foreground">Total</span><span className="font-black text-primary">KES {cart.total.toLocaleString()}</span></div>
                  </div>
                  {!checkout ? (
                    <Button onClick={() => setCheckout(true)} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold">Proceed to Checkout</Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setCheckout(false)} className="flex-1 rounded-xl border-border">Back</Button>
                      <Button onClick={async () => { if (!canCheckout) return; setPlacing(true); await new Promise(r=>setTimeout(r,1200)); toast.success("Order placed!"); clearCart(); setPlacing(false); setCheckout(false); onClose(); }} disabled={!canCheckout||placing} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold disabled:opacity-40">
                        {placing?<span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Placing...</span>:"Place Order"}
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Menu item card ─────────────────────────────────────
function MenuItemCard({ item, index, kitchenName, kitchenEmoji }: { item: MenuItem; index: number; kitchenName: string; kitchenEmoji: string }) {
  const { addToplan, isPlanned, removeFromPlan, plannedMeals } = usePlan();
  const planned = isPlanned(item.id);
  const plannedItem = plannedMeals.find(m => m.menuItemId === item.id);

  const handleTogglePlan = () => {
    if (planned && plannedItem) {
      removeFromPlan(plannedItem.id);
      toast.success(`${item.name} removed from plan`);
    } else {
      addToplan({ menuItemId: item.id, name: item.name, imageUrl: item.imageUrl, price: item.price, description: item.description, kitchenName, emoji: kitchenEmoji });
      toast.success(`${item.name} added to your plan!`);
    }
  };

  return (
    <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
      viewport={{ once:true, margin:"-16px" }} transition={{ duration:0.35, delay:(index%4)*0.05 }}
      whileHover={{ y:-3, transition:{ duration:0.2 } }}
      className={`bg-background rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col ${item.isAvailable?"border-border":"border-border/50 opacity-60"}`}>

      <div className="relative w-full aspect-[4/3] bg-muted overflow-hidden flex-shrink-0">
        <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-muted to-muted/60">🍽️</div>
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
            <span className="text-xs font-black text-muted-foreground border border-border px-3 py-1 rounded-full bg-background">Unavailable</span>
          </div>
        )}
        {/* Price badge */}
        <span className="absolute bottom-2 right-2 text-xs font-black px-2.5 py-1 rounded-full bg-background/90 text-primary shadow-sm">
          KES {item.price}
        </span>
      </div>

      <div className="p-3 flex flex-col gap-2 flex-1">
        <p className="text-sm font-bold text-foreground leading-tight">{item.name}</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{item.description}</p>

        <div className="flex items-center gap-1.5 flex-wrap">
          {item.mealTimes.map(mt => (
            <span key={mt} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary/20 text-secondary-foreground">
              {mt.charAt(0)+mt.slice(1).toLowerCase()}
            </span>
          ))}
          {item.prepTimeMin && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground ml-auto">
              <Clock className="w-3 h-3"/>{item.prepTimeMin}m
            </span>
          )}
        </div>

        {item.isAvailable && (
          <motion.button
            onClick={handleTogglePlan}
            whileTap={{ scale:0.95 }}
            className={`w-full mt-auto rounded-xl text-xs font-bold py-2.5 flex items-center justify-center gap-1.5 transition-all ${
              planned
                ? "bg-[#007606] text-white hover:bg-[#007606]/90"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            }`}
          >
            {planned
              ? <><CheckCircle2 className="w-3.5 h-3.5"/>Added to Plan</>
              : <><Plus className="w-3.5 h-3.5"/>Add to Plan</>}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

// ── Meal plan card ─────────────────────────────────────
function MealPlanCard({ plan, index, onSubscribe }: { plan: MealPlan; index: number; onSubscribe: (p: MealPlan) => void }) {
  const [viewingPlan, setViewingPlan] = useState(false);

  return (
    <>
      <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
        viewport={{ once:true, margin:"-16px" }} transition={{ duration:0.35, delay:index*0.06 }}
        whileHover={{ y:-3, transition:{ duration:0.2 } }}
        className="bg-background rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
        <div className="relative w-full aspect-[16/9] bg-muted overflow-hidden flex-shrink-0">
          <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-muted to-muted/60">🥗</div>
          <span className={`absolute top-2.5 right-2.5 text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm ${plan.durationDays<=7?"bg-secondary text-secondary-foreground":"bg-primary/10 text-primary"}`}>
            {plan.durationDays<=7?"Weekly":"Monthly"}
          </span>
        </div>
        <div className="p-4 flex flex-col gap-2.5 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-black text-foreground leading-tight flex-1">{plan.name}</h3>
            <p className="text-sm font-black text-primary whitespace-nowrap">KES {plan.price.toLocaleString()}</p>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{plan.description}</p>
          <div className="flex flex-wrap gap-1.5">
            {plan.tags.map(t => <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{t}</span>)}
          </div>
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3"/>{plan.durationDays} days</span>
            <span>|</span>
            <span className="flex items-center gap-1"><UtensilsCrossed className="w-3 h-3"/>{plan.mealsPerDay} meals/day</span>
          </div>
          <div className="flex gap-2 text-[10px]">
            {plan.isDeliveryAvailable && <span className="flex items-center gap-1 text-[#007606]"><Bike className="w-3 h-3"/>Delivery</span>}
            {plan.isPickupAvailable && <span className="flex items-center gap-1 text-[#007606]"><ShoppingBag className="w-3 h-3"/>Pickup</span>}
          </div>
          {/* Two buttons: View Plan + Subscribe */}
          <div className="flex gap-2 mt-auto pt-1">
            <Button onClick={() => setViewingPlan(true)} variant="outline"
              className="flex-1 rounded-xl border-border text-xs font-bold h-9 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5"/>View Plan
            </Button>
            <Button onClick={() => onSubscribe(plan)}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-black h-9">
              Subscribe
            </Button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {viewingPlan && (
          <ViewPlanModal plan={plan} onClose={() => setViewingPlan(false)} onSubscribe={() => onSubscribe(plan)} />
        )}
      </AnimatePresence>
    </>
  );
}

// ── Main Kitchen Page ──────────────────────────────────
export default function KitchenPage({ businessId }: { businessId?: string }) {
  const kitchen = businessId ? (KITCHEN_DATA[businessId] ?? FALLBACK_KITCHEN) : FALLBACK_KITCHEN;
  const MENU_ITEMS = buildMenuItems(businessId ?? "b4");
  const MEAL_PLANS = buildMealPlans();

  const [activeTab, setActiveTab] = useState<KitchenTab>("menu");
  const [mealFilter, setMealFilter] = useState<MealFilter>("All");
  const [sort, setSort] = useState<SortOpt>("popular");
  const [showSort, setShowSort] = useState(false);
  const [page, setPage] = useState(1);
  const [cartOpen, setCartOpen] = useState(false);
  const [subscribingTo, setSubscribingTo] = useState<MealPlan | null>(null);
  const sortRef = useRef<HTMLButtonElement>(null);
  const { itemCount, cart } = useCart();
  const { count: planCount } = usePlan();

  const filteredItems = MENU_ITEMS.filter(item =>
    mealFilter === "All" || item.mealTimes.includes(mealFilter as MealTime)
  ).sort((a, b) =>
    sort==="price-low" ? a.price-b.price :
    sort==="price-high" ? b.price-a.price :
    b.mealTimes.length-a.mealTimes.length
  );

  const totalPages = activeTab==="menu"
    ? Math.ceil(filteredItems.length/PAGE_SIZE_MENU)
    : Math.ceil(MEAL_PLANS.length/PAGE_SIZE_PLANS);
  const paginatedItems = filteredItems.slice((page-1)*PAGE_SIZE_MENU, page*PAGE_SIZE_MENU);
  const paginatedPlans = MEAL_PLANS.slice((page-1)*PAGE_SIZE_PLANS, page*PAGE_SIZE_PLANS);

  return (
    <div key={businessId} className="min-h-screen bg-muted/20">

      {/* Hero */}
      <div className="relative w-full overflow-hidden" style={{ height:"280px" }}>
        <div className="absolute inset-0" style={{ background:`linear-gradient(135deg, ${kitchen.accentColor}ee 0%, ${kitchen.accentColor}99 40%, ${kitchen.accentColor}44 70%, transparent 100%)` }} />
        <div className="absolute inset-0" style={{ background:"linear-gradient(225deg, #F4CD2E33 0%, transparent 60%)" }} />
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage:"radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize:"24px 24px" }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="select-none" style={{ fontSize:"clamp(80px,14vw,140px)", opacity:0.18, lineHeight:1 }}>{kitchen.emoji}</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 lg:px-8 pb-6 pt-12" style={{ background:"linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)" }}>
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }} className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 text-white/70 text-xs mb-1"><span>Discover</span><span>›</span><span className="text-white/90">{kitchen.name}</span></div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white drop-shadow-lg">{kitchen.name}</h1>
            <p className="text-white/85 text-sm mt-1 flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-secondary"/>{kitchen.chefName} · {kitchen.city}</p>
          </motion.div>
        </div>
        <div className="absolute top-4 right-4">
          <span className={`text-xs font-black px-4 py-2 rounded-full shadow-lg ${kitchen.isOpen?"bg-[#007606] text-white":"bg-black/40 text-white/80 border border-white/20"}`}>
            {kitchen.isOpen?"● OPEN NOW":"● CLOSED"}
          </span>
        </div>
        {kitchen.isFeatured && (
          <div className="absolute top-4 left-4">
            <span className="flex items-center gap-1 text-[10px] font-black px-3 py-1.5 rounded-full bg-primary text-primary-foreground shadow-lg">
              <Flame className="w-3 h-3"/>Featured
            </span>
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 pb-8 space-y-5">

        {/* Info card */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
          className="bg-background rounded-2xl border border-border shadow-lg p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-background shadow-md flex items-center justify-center text-4xl" style={{ background:`${kitchen.accentColor}18` }}>
                {kitchen.emoji}
              </div>
              {kitchen.isTopRated && (
                <span className="absolute -top-1.5 -right-1.5 flex items-center gap-0.5 text-[10px] font-black px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground shadow-sm">
                  <BadgeCheck className="w-3 h-3"/>Top
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-xl font-black text-foreground">{kitchen.name}</h2>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-primary"/>{kitchen.chefName}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-primary"/>{kitchen.address}, {kitchen.city}</span>
                    <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-primary"/>{kitchen.phone}</span>
                    <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-secondary fill-secondary"/>{kitchen.rating} <span>({kitchen.reviewCount})</span></span>
                  </div>
                </div>
                <span className="text-xs font-bold text-foreground">KES {kitchen.priceMin}–{kitchen.priceMax}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-2">{kitchen.description}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {kitchen.foodSpecialty.map(s => <span key={s} className="text-xs font-semibold px-3 py-1 rounded-full border border-border bg-muted text-foreground">{s}</span>)}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
            {kitchen.services.map(s => (
              <span key={s} className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl bg-primary/5 text-primary border border-primary/15">
                {s==="DELIVERY"&&<Bike className="w-3.5 h-3.5"/>}{s==="PICKUP"&&<ShoppingBag className="w-3.5 h-3.5"/>}{s==="DINE_IN"&&<UtensilsCrossed className="w-3.5 h-3.5"/>}
                {s==="DELIVERY"?"Delivery":s==="PICKUP"?"Pickup":"Dine In"}
              </span>
            ))}
            <span className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl bg-secondary/20 text-secondary-foreground ml-auto">
              <CalendarDays className="w-3.5 h-3.5"/>{kitchen.yearsOfExperience}+ yrs exp
            </span>
          </div>
        </motion.div>

        {/* Floating buttons */}
        <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-30">
          {planCount > 0 && (
            <motion.a initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:20 }}
              href="/my-table"
              className="flex items-center gap-2.5 bg-[#007606] text-white rounded-2xl px-4 py-3 shadow-2xl font-bold text-sm hover:bg-[#007606]/90 transition-colors">
              <CalendarDays className="w-4 h-4"/>
              {planCount} meal{planCount!==1?"s":""} planned · Schedule
            </motion.a>
          )}
          {itemCount > 0 && (
            <motion.button initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:20 }}
              onClick={() => setCartOpen(true)}
              className="flex items-center gap-2.5 bg-primary text-primary-foreground rounded-2xl px-4 py-3 shadow-2xl font-bold text-sm hover:bg-primary/90 transition-colors">
              <ShoppingCart className="w-4 h-4"/>
              {itemCount} item{itemCount!==1?"s":""} · KES {cart.subtotal.toLocaleString()}
            </motion.button>
          )}
        </div>

        {/* Tab + sort */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-background/90 backdrop-blur-sm rounded-2xl border border-border/50 px-4 py-3 shadow-sm">
          <div className="flex items-center gap-1 bg-muted rounded-xl p-1 w-fit">
            {([["menu","Daily Menu Meals"],["plans","Meal Plans"]] as [KitchenTab,string][]).map(([tab,label]) => (
              <button key={tab} onClick={() => { setActiveTab(tab); setPage(1); setMealFilter("All"); }}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${activeTab===tab?"bg-primary text-primary-foreground shadow-sm":"text-muted-foreground hover:text-foreground"}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Sort by:</span>
            <button ref={sortRef} onClick={() => setShowSort(p=>!p)}
              className="flex items-center gap-2 text-xs font-semibold text-foreground border border-border rounded-xl px-3 py-1.5 bg-background hover:bg-muted transition-colors whitespace-nowrap">
              {sort==="popular"?"Most Popular":sort==="price-low"?"Price: Low–High":"Price: High–Low"}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSort?"rotate-180":""}`}/>
            </button>
          </div>
        </div>

        <SortPortal value={sort} onChange={v=>{setSort(v);setPage(1);}} open={showSort} setOpen={setShowSort} triggerRef={sortRef}/>

        {/* Meal filter pills */}
        <AnimatePresence>
          {activeTab==="menu" && (
            <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
              className="flex gap-2 flex-wrap overflow-hidden">
              {(["All","BREAKFAST","LUNCH","DINNER"] as MealFilter[]).map(f => (
                <button key={f} onClick={() => { setMealFilter(f); setPage(1); }}
                  className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${mealFilter===f?"bg-primary text-primary-foreground border-primary shadow-sm":"border-border text-muted-foreground hover:border-primary/40 hover:text-primary bg-background"}`}>
                  {f==="All"?"All":f.charAt(0)+f.slice(1).toLowerCase()}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid */}
        <AnimatePresence mode="wait">
          {activeTab==="menu" ? (
            <motion.div key="menu" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {paginatedItems.map((item,i) => <MenuItemCard key={item.id} item={item} index={i} kitchenName={kitchen.name} kitchenEmoji={kitchen.emoji}/>)}
              {paginatedItems.length===0 && <div className="col-span-full text-center py-16 text-sm text-muted-foreground">No items for this meal time.</div>}
            </motion.div>
          ) : (
            <motion.div key="plans" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {paginatedPlans.map((plan,i) => <MealPlanCard key={plan.id} plan={plan} index={i} onSubscribe={setSubscribingTo}/>)}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2 pb-6">
            <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
              onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1}
              className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-md">
              <ChevronLeft className="w-4 h-4"/>
            </motion.button>
            <div className="flex items-center gap-1">
              {Array.from({length:totalPages},(_,i)=>i+1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${p===page?"bg-primary text-primary-foreground shadow-md":"text-muted-foreground hover:bg-muted"}`}>{p}</button>
              ))}
            </div>
            <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
              onClick={() => setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
              className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-md">
              <ChevronRight className="w-4 h-4"/>
            </motion.button>
          </div>
        )}
      </div>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)}/>
      <AnimatePresence>
        {subscribingTo && <SubscribeModal plan={subscribingTo} onClose={() => setSubscribingTo(null)}/>}
      </AnimatePresence>
    </div>
  );
}