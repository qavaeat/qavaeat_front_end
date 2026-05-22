"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LocationPicker } from "@/lib/locationPicker";
import { PickedLocation } from "@/lib/maps";
import {
  CalendarDays,
  UtensilsCrossed,
  Bike,
  ShoppingBag,
  X,
  MapPin,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Navigation,
  Shield,
  Sparkles,
  Search,
  BookOpen,
  ChefHat,
  Flame,
  RefreshCw,
  ArrowRight,
  Calendar,
  Info,
  Tag,
  Filter,
  Phone,
  Receipt,
  XCircle,
  Wallet,
  ShieldCheck,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLocation } from "@/hooks/useLocation";
import { usePaymentStatus } from "@/hooks/usePaymentStatus";
import { apiFetch } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type MealTime = "BREAKFAST" | "LUNCH" | "DINNER";
type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";
type DeliveryOpt = "DELIVERY" | "PICKUP";
type SubStatus =
  | "PENDING"
  | "ACTIVE"
  | "PAUSED"
  | "CANCELLED"
  | "COMPLETED"
  | "EXPIRED";

interface PlanMenuItem {
  id: string;
  menuItemId: string;
  menuItem: {
    id: string;
    name: string;
    imageUrl: string | null;
    price: number | string;
    prepTimeMin: number | null;
  };
  mealTime: MealTime;
  dayNumber: number;
  notes: string | null;
}
interface Plan {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  cuisineType: string[];
  mealTypes: MealTime[];
  price: number;
  currency: string;
  durationDays: number;
  mealsPerDay: number;
  totalMeals: number;
  maxSubscribers: number | null;
  currentSubscribers: number;
  isDeliveryAvailable: boolean;
  isPickupAvailable: boolean;
  availableDays: DayOfWeek[];
  isFeatured: boolean;
  tags: string[];
  meals?: PlanMenuItem[];
  business?: {
    id: string;
    name: string;
    city: string;
    logoUrl: string | null;
    chef: {
      profile: { firstName: string | null; lastName: string | null } | null;
    };
  };
}
interface Subscription {
  id: string;
  mealPlanId: string;
  mealPlan: Plan;
  status: SubStatus;
  deliveryOption: DeliveryOpt;
  deliveryAddress: string | null;
  deliveryLat: number | null;
  deliveryLng: number | null;
  startDate: string;
  endDate: string;
  amountPaid: number | string;
  paymentStatus: string;
  paymentRef: string | null;
  createdAt: string;
  cancelledAt: string | null;
}
interface MealInstance {
  id: string;
  subscriptionId: string;
  menuItemId: string;
  mealTime: MealTime;
  scheduledDate: string;
  dayNumber: number;
  status: "SCHEDULED" | "PROCESSING" | "DELIVERED" | "MISSED" | "CANCELLED";
  processedAt: string | null;
  remittedAt: string | null;
  menuItem: {
    id: string;
    name: string;
    price: number | string;
    prepTimeMin: number | null;
    imageUrl: string | null;
  };
}

interface SubscribePayload {
  deliveryOption: DeliveryOpt;
  startDate: string;
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  phoneOverride?: string;
}
interface PageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
type RawPlanMenuItem = Omit<PlanMenuItem, "menuItem"> & {
  menuItem: Omit<PlanMenuItem["menuItem"], "price"> & {
    price: number | string;
  };
};
type RawPlan = Omit<
  Plan,
  "price" | "currentSubscribers" | "totalMeals" | "isFeatured" | "meals"
> & {
  price: number | string;
  currentSubscribers?: number | string;
  totalMeals?: number | string;
  isFeatured?: boolean;
  meals?: RawPlanMenuItem[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

// Theme-aligned meal meta — uses CSS variable classes only
const MEAL_META: Record<
  MealTime,
  { label: string; emoji: string; cls: string }
> = {
  BREAKFAST: {
    label: "Breakfast",
    emoji: "☕",
    cls: "bg-secondary/20 text-secondary-foreground",
  },
  LUNCH: { label: "Lunch", emoji: "🍽️", cls: "bg-primary/10 text-primary" },
  DINNER: {
    label: "Dinner",
    emoji: "🌙",
    cls: "bg-muted text-muted-foreground",
  },
};

const DAY_SHORT = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
const DAY_FULL: Record<string, DayOfWeek> = {
  MON: "MONDAY",
  TUE: "TUESDAY",
  WED: "WEDNESDAY",
  THU: "THURSDAY",
  FRI: "FRIDAY",
  SAT: "SATURDAY",
  SUN: "SUNDAY",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function kes(n: number | string): string {
  return `KES ${Number(n).toLocaleString("en-KE")}`;
}
function durationLabel(days: number): string {
  if (days <= 7) return "Weekly";
  if (days <= 31) return "Monthly";
  return `${days}-day`;
}

// Theme-aligned status badges — no hardcoded colors
function subStatusCls(s: SubStatus): string {
  const map: Record<SubStatus, string> = {
    ACTIVE: "bg-chart-3/10 text-chart-3 dark:bg-chart-3/20 dark:text-chart-3",
    PENDING: "bg-secondary/20 text-secondary-foreground",
    PAUSED: "bg-primary/10 text-primary",
    CANCELLED: "bg-destructive/10 text-destructive",
    COMPLETED: "bg-muted text-muted-foreground",
    EXPIRED: "bg-muted text-muted-foreground",
  };
  return map[s] ?? "bg-muted text-muted-foreground";
}

function normalisePlanMenuItem(raw: RawPlanMenuItem): PlanMenuItem {
  return {
    ...raw,
    menuItem: { ...raw.menuItem, price: Number(raw.menuItem.price ?? 0) },
  };
}
function normalisePlan(raw: RawPlan): Plan {
  return {
    ...raw,
    price: Number(raw.price ?? 0),
    currentSubscribers: Number(raw.currentSubscribers ?? 0),
    totalMeals: Number(
      raw.totalMeals ?? Number(raw.durationDays) * Number(raw.mealsPerDay),
    ),
    isFeatured: Boolean(raw.isFeatured ?? false),
    meals: (raw.meals ?? []).map(normalisePlanMenuItem),
  };
}

// FIX: durationDays = number of active meal days, not calendar days
function generateMealDates(
  startDate: Date,
  durationDays: number,
  availableDays: DayOfWeek[],
): Date[] {
  const dayMap: Record<DayOfWeek, number> = {
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
  };
  const active = new Set(availableDays.map((d) => dayMap[d]));
  const dates: Date[] = [];
  const cursor = new Date(startDate);
  let scanned = 0;
  while (dates.length < durationDays && scanned < 365) {
    if (active.has(cursor.getDay())) dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
    scanned++;
  }
  return dates;
}

function normalizeKEPhone(raw: string): string | null {
  const d = raw.replace(/\D/g, "");
  if (/^0[17]\d{8}$/.test(d)) return `+254${d.slice(1)}`;
  if (/^254[17]\d{8}$/.test(d)) return `+${d}`;
  return null;
}
function formatKEPhoneDisplay(raw: string): string {
  const n = normalizeKEPhone(raw);
  return n ? n.replace(/^\+254(\d{3})(\d{3})(\d{3})$/, "+254 $1 $2 $3") : raw;
}

// ─── useMealPlanPayment ───────────────────────────────────────────────────────

function useMealPlanPayment(onComplete: () => void) {
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [apiRef, setApiRef] = useState<string | null>(null);
  const [grandTotal, setGrandTotal] = useState(0);
  const snap = useRef<string | null>(null);

  const {
    pollStatus,
    secondsLeft,
    startPolling,
    reset: resetPoll,
  } = usePaymentStatus(
    useCallback(() => {
      onComplete();
    }, [onComplete]),
    useCallback(() => {}, []),
  );

  const isWaiting = apiRef !== null;

  const subscribe = useCallback(
    async (planId: string, payload: SubscribePayload) => {
      const res = await apiFetch<{
        success?: boolean;
        data?: {
          subscription: { id: string; amountPaid?: number | string };
          invoiceId: string;
          apiRef: string;
          grandTotal?: number;
        };
        subscription?: { id: string; amountPaid?: number | string };
        invoiceId?: string;
        apiRef?: string;
        grandTotal?: number;
      }>(`/meal-plans/${planId}/subscribe`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      // Handle both wrapped { success, data: {...} } and flat response shapes
      const data = (res as { data?: typeof res })?.data ?? res;
      if (!data?.apiRef)
        throw new Error("Payment initiation failed — no reference returned");

      const sub = (
        data as { subscription?: { id: string; amountPaid?: number | string } }
      ).subscription;

      setSubscriptionId(sub?.id ?? null);
      setInvoiceId(data.invoiceId ?? null);
      setApiRef(data.apiRef);

      setGrandTotal(
        data.grandTotal != null
          ? Number(data.grandTotal)
          : Number(sub?.amountPaid ?? 0),
      );
      snap.current = data.apiRef;
      startPolling(data.apiRef, "/api/meal-plans/subscriptions/payment-status");
    },
    [startPolling],
  );

  const cancel = useCallback(async () => {
    setApiRef(null);
    setSubscriptionId(null);
    setInvoiceId(null);
    setGrandTotal(0);
    snap.current = null;
    resetPoll();
  }, [apiRef, resetPoll]);

  const reset = useCallback(() => {
    setApiRef(null);
    setSubscriptionId(null);
    setInvoiceId(null);
    setGrandTotal(0);
    snap.current = null;
    resetPoll();
  }, [resetPoll]);

  return {
    subscriptionId,
    invoiceId,
    apiRef,
    grandTotal,
    isWaiting,
    pollStatus: pollStatus === "idle" && isWaiting ? "polling" : pollStatus,
    secondsLeft,
    subscribe,
    cancel,
    reset,
  };
}

// ─── PhoneInput — theme-aligned ───────────────────────────────────────────────

function PhoneInput({
  systemPhone,
  value,
  onChange,
  onValidChange,
}: {
  systemPhone: string;
  value: string;
  onChange: (v: string) => void;
  onValidChange: (n: string | null) => void;
}) {
  const [useAlt, setUseAlt] = useState(false);
  const [error, setError] = useState("");
  const normalized = normalizeKEPhone(value);

  const handleToggle = () => {
    setUseAlt((p) => !p);
    onChange("");
    setError("");
    onValidChange(null);
  };
  const handleChange = (raw: string) => {
    const f = raw.replace(/[^\d\s+\-()]/g, "");
    onChange(f);
    setError("");
    onValidChange(normalizeKEPhone(f));
  };
  const handleBlur = () => {
    if (!value.trim()) {
      setError("");
      return;
    }
    if (!normalizeKEPhone(value))
      setError("Enter a valid Safaricom or Airtel number (e.g. 0712 345 678)");
  };

  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3 space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Phone className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              M-Pesa Prompt
            </p>
            <p className="text-xs font-bold text-foreground truncate">
              {useAlt && normalized ? formatKEPhoneDisplay(value) : systemPhone}
            </p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          className={`text-[10px] font-black border rounded-lg px-2.5 py-1 transition-colors flex-shrink-0 whitespace-nowrap ${
            useAlt
              ? "text-muted-foreground border-border hover:bg-muted"
              : "text-primary border-primary/30 hover:bg-primary/5"
          }`}
        >
          {useAlt ? "← Use my number" : "Someone else is paying"}
        </button>
      </div>

      {!useAlt && (
        <p className="text-[10px] text-muted-foreground">
          The M-Pesa prompt will go to your registered number.
        </p>
      )}

      <AnimatePresence>
        {useAlt && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-1 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wide">
                  Payer&apos;s M-Pesa Number
                </label>
                {/* secondary = yellow — maps directly to theme */}
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-secondary/20 text-secondary-foreground">
                  They&apos;ll get the prompt
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm select-none">
                  🇰🇪
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={value}
                  onChange={(e) => handleChange(e.target.value)}
                  onBlur={handleBlur}
                  placeholder="0712 345 678"
                  maxLength={15}
                  autoFocus
                  className={`w-full pl-9 pr-9 py-2.5 text-sm rounded-lg border bg-background outline-none transition-colors font-medium ${
                    error
                      ? "border-destructive"
                      : normalized
                        ? "border-chart-3"
                        : "border-border focus:border-primary"
                  }`}
                />
                {normalized && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-chart-3" />
                )}
              </div>
              {error && (
                <p className="text-[10px] text-destructive font-semibold">
                  {error}
                </p>
              )}
              {normalized && !error && (
                <p className="text-[10px] text-chart-3 font-semibold">
                  ✓ Prompt goes to {formatKEPhoneDisplay(value)}
                </p>
              )}
              <p className="text-[9px] text-muted-foreground">
                Their number is only used for this payment. Your profile phone (
                {systemPhone}) remains your default.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── PaymentWaitingOverlay — theme-aligned ────────────────────────────────────

function PaymentWaitingOverlay({
  grandTotal,
  phoneNumber,
  secondsLeft,
  pollStatus,
  onCancel,
}: {
  grandTotal: number;
  phoneNumber: string;
  secondsLeft: number;
  pollStatus: "polling" | "complete" | "failed" | "timeout";
  onCancel: () => void;
}) {
  const isComplete = pollStatus === "complete";
  const isFailed = pollStatus === "failed" || pollStatus === "timeout";

  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center space-y-5 min-h-[340px]">
      {!isComplete && !isFailed && (
        <>
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <span className="text-4xl relative z-10">📱</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-base font-black text-foreground">
              Check your phone
            </p>
            <p className="text-sm text-muted-foreground">
              M-Pesa prompt sent to{" "}
              <span className="font-bold text-foreground">{phoneNumber}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Enter your PIN to confirm
            </p>
          </div>
          <div className="bg-muted rounded-xl px-6 py-3">
            <p className="text-xs text-muted-foreground">Amount</p>
            <p className="text-2xl font-black text-primary">
              KES {grandTotal.toLocaleString()}
            </p>
          </div>
          <div className="w-full max-w-xs">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Waiting for confirmation…</span>
              <span
                className={`font-bold ${secondsLeft <= 15 ? "text-destructive" : ""}`}
              >
                {secondsLeft}s
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: "100%" }}
                animate={{ width: `${(secondsLeft / 90) * 100}%` }}
                transition={{ duration: 1, ease: "linear" }}
              />
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
          >
            Cancel payment
          </button>
        </>
      )}

      {isComplete && (
        <>
          {/* chart-3 = #007606 = confirmed/paid — the only green in the system */}
          <div className="w-20 h-20 rounded-full bg-chart-3/10 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-chart-3" />
          </div>
          <div>
            <p className="text-lg font-black text-foreground">
              Payment confirmed!
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Your subscription is now active.
            </p>
          </div>
        </>
      )}

      {isFailed && (
        <>
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="w-10 h-10 text-destructive" />
          </div>
          <div>
            <p className="text-lg font-black text-foreground">
              {pollStatus === "timeout"
                ? "Payment timed out"
                : "Payment failed"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {pollStatus === "timeout"
                ? "No confirmation received. Your subscription has NOT been activated."
                : "The payment was not completed. No money was taken."}
            </p>
          </div>
          <Button onClick={onCancel} variant="outline" className="rounded-xl">
            Close and try again
          </Button>
        </>
      )}
    </div>
  );
}

// ─── LocationModal ────────────────────────────────────────────────────────────

interface LocationResult {
  address: string;
  lat?: number;
  lng?: number;
}

function LocationModal({
  onConfirm,
  onClose,
  initial,
}: {
  onConfirm: (r: LocationResult) => void;
  onClose: () => void;
  initial?: LocationResult;
}) {
  const { coords, status, request, clear } = useLocation();
  const [mode, setMode] = useState<"manual" | "gps">("manual");
  const [manualAddr, setManualAddr] = useState(initial?.address ?? "");
  const [gpsLabel, setGpsLabel] = useState<string | null>(null);
  const displayedGpsLabel = coords ? gpsLabel : null;

  useEffect(() => {
    if (!coords) return;
    const { latitude: lat, longitude: lng } = coords;

    // Set coordinate fallback only after fetch fails or as initial value via callback
    const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { "Accept-Language": "en" } },
    )
      .then((r) => r.json())
      .then((j: { display_name?: string }) => {
        setGpsLabel(j?.display_name ?? fallback);
      })
      .catch(() => {
        setGpsLabel(fallback);
      });
  }, [coords]);

  const hasGPS = coords !== null;
  const canSubmit = mode === "gps" ? hasGPS : manualAddr.trim().length > 5;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.22 }}
        className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-md"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-black text-foreground">
                Delivery Location
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Where should we deliver?
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-2 bg-muted rounded-xl p-1">
            {(["manual", "gps"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  if (m === "gps" && !hasGPS) clear();
                }}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  mode === m
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "manual" ? "📝 Type Address" : "📍 Use GPS"}
              </button>
            ))}
          </div>

          {mode === "manual" ? (
            <div className="space-y-2">
              <Input
                value={manualAddr}
                onChange={(e) => setManualAddr(e.target.value)}
                placeholder="e.g. 14 Mwangi Road, Westlands, Nairobi"
                className="rounded-xl border-border h-11"
                autoFocus
              />
              <p className="text-[10px] text-muted-foreground">
                Include street, area and city
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {status === "idle" && !hasGPS && (
                <button
                  onClick={() => void request()}
                  className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 text-primary text-sm font-bold hover:bg-primary/10 transition-colors"
                >
                  <Navigation className="w-4 h-4" />
                  Tap to detect my location
                </button>
              )}
              {status === "requesting" && (
                <div className="flex items-center justify-center gap-2.5 py-4 text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Detecting location…
                </div>
              )}
              {(status === "denied" || status === "unavailable") && (
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-xs text-destructive flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  {status === "denied"
                    ? "Location access denied."
                    : "Geolocation not supported."}
                </div>
              )}
              {hasGPS && coords && (
                <div className="rounded-xl bg-chart-3/5 border border-chart-3/20 px-4 py-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-chart-3 text-xs font-black">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Location captured
                  </div>
                  {displayedGpsLabel && (
                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                      {displayedGpsLabel}
                    </p>
                  )}
                  <p className="text-[10px] font-mono text-muted-foreground/60">
                    {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}
                  </p>
                  <button
                    onClick={() => {
                      clear();
                      setGpsLabel(null);
                    }}
                    className="text-[10px] text-primary underline"
                  >
                    Clear and retry
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (mode === "gps" && coords)
                onConfirm({
                  address:
                    gpsLabel ?? `${coords.latitude}, ${coords.longitude}`,
                  lat: coords.latitude,
                  lng: coords.longitude,
                });
              else onConfirm({ address: manualAddr.trim() });
            }}
            disabled={!canSubmit}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold disabled:opacity-40"
          >
            Confirm Location
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── PlanDetailModal ──────────────────────────────────────────────────────────

function PlanDetailModal({
  plan,
  onClose,
  onSubscribe,
}: {
  plan: Plan;
  onClose: () => void;
  onSubscribe: (p: Plan) => void;
}) {
  const [full, setFull] = useState<Plan>(plan);
  const [loading, setLoading] = useState(
    !plan.meals || plan.meals.length === 0,
  );
  const MEAL_ORDER: MealTime[] = ["BREAKFAST", "LUNCH", "DINNER"];

  useEffect(() => {
    if (plan.meals && plan.meals.length > 0) return;
    fetch(`/api/meal-plans/${plan.id}`)
      .then((r) => r.json())
      .then((j: { data?: RawPlan }) => {
        if (j?.data) setFull(normalisePlan(j.data));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [plan]);

  const meals = full.meals ?? [];
  const days = [...new Set(meals.map((m) => m.dayNumber))].sort(
    (a, b) => a - b,
  );

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.28 }}
        className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-border flex-shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              {full.isFeatured && (
                <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                  <Flame className="w-2.5 h-2.5" />
                  Featured
                </span>
              )}
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary/20 text-secondary-foreground">
                {durationLabel(full.durationDays)}
              </span>
            </div>
            <h2 className="text-lg font-black text-foreground leading-tight">
              {full.name}
            </h2>
            {full.business && (
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <ChefHat className="w-3 h-3" />
                {full.business.name} · {full.business.city}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center flex-shrink-0 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 divide-x divide-border border-b border-border flex-shrink-0">
          {(
            [
              {
                icon: <CalendarDays className="w-3.5 h-3.5" />,
                val: `${full.durationDays}`,
                sub: "days",
              },
              {
                icon: <UtensilsCrossed className="w-3.5 h-3.5" />,
                val: `${full.mealsPerDay}`,
                sub: "meals/day",
              },
              {
                icon: <Users className="w-3.5 h-3.5" />,
                val: `${full.currentSubscribers}`,
                sub: "subscribers",
              },
              {
                icon: <Tag className="w-3.5 h-3.5" />,
                val: kes(full.price),
                sub: full.durationDays <= 7 ? "per week" : "per month",
              },
            ] as const
          ).map((s, i) => (
            <div key={i} className="px-4 py-3 text-center">
              <div className="flex items-center justify-center text-primary mb-0.5">
                {s.icon}
              </div>
              <p className="text-sm font-black text-foreground">{s.val}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide">
                {s.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">
            {full.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {full.description}
              </p>
            )}

            <div className="flex flex-wrap gap-1.5">
              {full.cuisineType.map((c) => (
                <span
                  key={c}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-border bg-muted/60 text-foreground"
                >
                  {c}
                </span>
              ))}
              {full.mealTypes.map((mt) => (
                <span
                  key={mt}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${MEAL_META[mt].cls}`}
                >
                  {MEAL_META[mt].emoji} {MEAL_META[mt].label}
                </span>
              ))}
              {full.tags.map((t) => (
                <span
                  key={t}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                >
                  {t}
                </span>
              ))}
            </div>

            <div className="flex gap-3 flex-wrap">
              {full.isDeliveryAvailable && (
                <span className="flex items-center gap-2 px-3 py-2 rounded-xl bg-chart-3/5 border border-chart-3/20 text-xs font-bold text-chart-3">
                  <Bike className="w-3.5 h-3.5" />
                  Delivery available
                </span>
              )}
              {full.isPickupAvailable && (
                <span className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/20 text-xs font-bold text-primary">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Pickup available
                </span>
              )}
            </div>

            {full.availableDays.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">
                  Available days
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {DAY_SHORT.map((d) => {
                    const isOn = full.availableDays.includes(DAY_FULL[d]!);
                    return (
                      <span
                        key={d}
                        className={`text-[10px] font-black w-8 h-8 rounded-lg flex items-center justify-center ${
                          isOn
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground/40"
                        }`}
                      >
                        {d.slice(0, 2)}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Meal schedule — prices removed */}
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">
                Meal schedule ({full.totalMeals} meals)
              </p>
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading schedule…
                </div>
              ) : days.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground rounded-xl bg-muted/30 border border-border">
                  No meals added to this plan yet
                </div>
              ) : (
                <div className="space-y-2">
                  {days.map((day) => (
                    <div
                      key={day}
                      className="rounded-xl border border-border overflow-hidden"
                    >
                      <div className="flex items-center gap-3 px-4 py-2.5 bg-muted/30 border-b border-border">
                        <span className="w-6 h-6 rounded-md bg-primary flex items-center justify-center text-[11px] font-black text-primary-foreground flex-shrink-0">
                          {day}
                        </span>
                        <span className="text-xs font-black text-foreground">
                          Day {day}
                        </span>
                      </div>
                      <div className="divide-y divide-border/50">
                        {MEAL_ORDER.filter((mt) =>
                          meals.some(
                            (m) => m.dayNumber === day && m.mealTime === mt,
                          ),
                        ).map((mt) => {
                          const meal = meals.find(
                            (m) => m.dayNumber === day && m.mealTime === mt,
                          )!;
                          return (
                            <div
                              key={mt}
                              className="flex items-center gap-3 px-4 py-2.5"
                            >
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${MEAL_META[mt].cls}`}
                              >
                                {MEAL_META[mt].emoji} {MEAL_META[mt].label}
                              </span>
                              <p className="text-xs font-semibold text-foreground truncate flex-1">
                                {meal.menuItem.name}
                              </p>
                              {meal.menuItem.prepTimeMin && (
                                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground flex-shrink-0">
                                  <Clock className="w-2.5 h-2.5" />
                                  {meal.menuItem.prepTimeMin}m
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-border flex-shrink-0">
          <div>
            <p className="text-xl font-black text-primary">{kes(full.price)}</p>
            <p className="text-[10px] text-muted-foreground">
              {full.durationDays <= 7 ? "per week" : "per month"} ·{" "}
              {full.totalMeals} meals
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-xl px-5"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                onClose();
                onSubscribe(full);
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6 font-black flex items-center gap-2"
            >
              Subscribe <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── SubscribeModal ───────────────────────────────────────────────────────────

function SubscribeModal({
  plan,
  customerPhone,
  existingPendingSub,
  onClose,
  onSuccess,
}: {
  plan: Plan;
  customerPhone: string;
  existingPendingSub: Subscription | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [deliveryOpt, setDelOpt] = useState<DeliveryOpt>(
    plan.isDeliveryAvailable ? "DELIVERY" : "PICKUP",
  );
  const [startDate, setStartDate] = useState(
    existingPendingSub
      ? new Date(existingPendingSub.startDate).toISOString().split("T")[0]!
      : "",
  );
  const [locData, setLocData] = useState<PickedLocation | null>(null);
  const [placing, setPlacing] = useState(false);
  const [altPhoneRaw, setAltPhoneRaw] = useState("");
  const [altPhoneNormalized, setAltPhoneNormalized] = useState<string | null>(
    null,
  );

  const today = new Date().toISOString().split("T")[0]!;
  const payment = useMealPlanPayment(
    useCallback(() => {
      onSuccess();
    }, [onSuccess]),
  );

  const canProceed =
    startDate.trim().length > 0 &&
    (deliveryOpt !== "DELIVERY" || !!locData?.formatted_address?.trim()) &&
    (altPhoneRaw.trim() === "" || altPhoneNormalized !== null);

  const handlePlace = async () => {
    if (!canProceed) return;
    setPlacing(true);
    try {
      await payment.subscribe(plan.id, {
        deliveryOption: deliveryOpt,
        startDate,
        ...(locData?.formatted_address
          ? { deliveryAddress: locData.formatted_address }
          : {}),
        ...(locData?.lat ? { deliveryLat: locData.lat } : {}),
        ...(locData?.lng ? { deliveryLng: locData.lng } : {}),
        ...(altPhoneNormalized ? { phoneOverride: altPhoneNormalized } : {}),
      });
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string }).message ?? "Failed to initiate payment",
      );
    } finally {
      setPlacing(false);
    }
  };

  const handleCancel = async () => {
    await payment.cancel();
    payment.reset();
    setAltPhoneRaw("");
    setAltPhoneNormalized(null);
    onClose();
  };

  const isWaiting = payment.isWaiting;
  const displayPhone = altPhoneNormalized
    ? formatKEPhoneDisplay(altPhoneRaw)
    : customerPhone;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-3 py-4 sm:px-4 sm:py-6"
      onClick={(e) => {
        if (isWaiting && payment.pollStatus === "polling") return;
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.25 }}
        className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-xl flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Receipt className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-black text-foreground">
                {isWaiting ? "Awaiting Payment" : "Subscribe to Plan"}
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {isWaiting
                  ? "Do not close this window"
                  : `${plan.name} · ${kes(plan.price)}`}
              </p>
            </div>
          </div>
          {(!isWaiting || payment.pollStatus !== "polling") && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center mt-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {isWaiting && (
              <motion.div
                key="waiting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <PaymentWaitingOverlay
                  grandTotal={payment.grandTotal}
                  phoneNumber={displayPhone}
                  secondsLeft={payment.secondsLeft}
                  pollStatus={
                    payment.pollStatus === "idle"
                      ? "polling"
                      : (payment.pollStatus as
                          | "polling"
                          | "complete"
                          | "failed"
                          | "timeout")
                  }
                  onCancel={handleCancel}
                />
              </motion.div>
            )}

            {!isWaiting && (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 sm:p-5 space-y-4 sm:space-y-5"
              >
                {/* Pending sub banner */}
                {existingPendingSub && (
                  <div className="rounded-xl border border-secondary/40 bg-secondary/10 p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-4 h-4 text-secondary-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-black text-foreground">
                          Payment incomplete
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          You have a pending subscription for this plan from{" "}
                          {new Date(
                            existingPendingSub.startDate,
                          ).toLocaleDateString("en-KE", {
                            day: "numeric",
                            month: "short",
                          })}
                          . Complete the payment below or cancel it first to
                          start fresh.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Plan summary card */}
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-xl bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center text-2xl">
                      {plan.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={plan.imageUrl}
                          alt={plan.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        "🥗"
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-foreground">
                        {plan.name}
                      </p>
                      {plan.business && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <ChefHat className="w-3 h-3" />
                          {plan.business.name}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {plan.durationDays} days
                        </span>
                        <span className="flex items-center gap-1">
                          <UtensilsCrossed className="w-3 h-3" />
                          {plan.totalMeals} meals
                        </span>
                      </div>
                    </div>
                    <p className="text-base font-black text-primary flex-shrink-0">
                      {kes(plan.price)}
                    </p>
                  </div>
                </div>

                {/* Start date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    Start Date *
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    min={today}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="rounded-xl border-border h-11"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Plan runs for {plan.durationDays} active meal days from this
                    date
                  </p>
                </div>

                {/* Service type */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-foreground">
                    How do you want your meals? *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["DELIVERY", "PICKUP"] as DeliveryOpt[]).map((opt) => {
                      const avail =
                        opt === "DELIVERY"
                          ? plan.isDeliveryAvailable
                          : plan.isPickupAvailable;
                      const sel = deliveryOpt === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => avail && setDelOpt(opt)}
                          disabled={!avail}
                          className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                            sel
                              ? "border-primary bg-primary/5"
                              : "border-border bg-background hover:border-primary/40"
                          }`}
                        >
                          {opt === "DELIVERY" ? (
                            <Bike
                              className={`w-5 h-5 ${sel ? "text-primary" : "text-muted-foreground"}`}
                            />
                          ) : (
                            <ShoppingBag
                              className={`w-5 h-5 ${sel ? "text-primary" : "text-muted-foreground"}`}
                            />
                          )}
                          <span
                            className={`text-xs font-bold ${sel ? "text-primary" : "text-muted-foreground"}`}
                          >
                            {opt === "DELIVERY" ? "Delivery" : "Pickup"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Delivery address */}
                {deliveryOpt === "DELIVERY" && (
                  <LocationPicker
                    value={locData}
                    onChange={setLocData}
                    label="Delivery Address"
                    confirmLabel="Delivering here"
                    hint="Search, use GPS, or tap the map to set your delivery location"
                    required
                  />
                )}

                {/* Phone */}
                <PhoneInput
                  systemPhone={customerPhone}
                  value={altPhoneRaw}
                  onChange={setAltPhoneRaw}
                  onValidChange={setAltPhoneNormalized}
                />

                {/* Payment summary */}
                <div className="rounded-xl border-2 border-chart-3/30 bg-chart-3/5 overflow-hidden">
                  <div className="px-4 py-3 border-b border-chart-3/20">
                    <p className="text-[10px] font-black uppercase tracking-widest text-chart-3">
                      Payment Summary
                    </p>
                  </div>
                  <div className="px-4 py-3 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {durationLabel(plan.durationDays)} plan
                        <span className="text-[10px] ml-1 text-muted-foreground/70">
                          ({plan.totalMeals} meals)
                        </span>
                      </span>
                      <span className="font-bold text-foreground">
                        {kes(plan.price)}
                      </span>
                    </div>
                    <div className="pt-2 mt-1 border-t border-chart-3/20 flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-sm font-black text-foreground">
                          Total Due Now
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          food cost only
                        </p>
                      </div>
                      <p className="text-xl sm:text-2xl font-black text-chart-3">
                        {kes(plan.price)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-[10px] text-muted-foreground bg-muted/40 border border-border rounded-xl px-3 py-2.5">
                  <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <span>
                    Subscription activates only after M-Pesa payment is
                    confirmed. No charge if you cancel before entering your PIN.
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Shield className="w-3 h-3 text-chart-3" />
                  <span>
                    Secured · Funds held in escrow until delivery confirmed
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {!isWaiting && (
          <div className="flex gap-3 px-4 sm:px-5 py-4 border-t border-border flex-shrink-0">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-full"
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handlePlace()}
              disabled={!canProceed || placing}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-black disabled:opacity-40"
            >
              {placing ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending prompt…
                </span>
              ) : (
                `Pay ${kes(plan.price)}`
              )}
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

const MEAL_ORDER: MealTime[] = ["BREAKFAST", "LUNCH", "DINNER"];

const INSTANCE_STATUS_META: Record<
  MealInstance["status"],
  { label: string; cls: string; icon: string }
> = {
  SCHEDULED: {
    label: "Scheduled",
    cls: "bg-muted text-muted-foreground",
    icon: "🕐",
  },
  PROCESSING: {
    label: "Preparing",
    cls: "bg-secondary/20 text-secondary-foreground",
    icon: "👨‍🍳",
  },
  DELIVERED: {
    label: "Delivered",
    cls: "bg-chart-3/10 text-chart-3 dark:bg-chart-3/20 dark:text-chart-3",
    icon: "✓",
  },
  MISSED: {
    label: "Not Received",
    cls: "bg-destructive/10 text-destructive",
    icon: "✗",
  },
  CANCELLED: {
    label: "Cancelled",
    cls: "bg-muted text-muted-foreground",
    icon: "—",
  },
};

// Convert a UTC ISO string to EAT (UTC+3) YYYY-MM-DD
function utcToEATDateYMD(utcISO: string): string {
  const eat = new Date(new Date(utcISO).getTime() + 3 * 60 * 60 * 1000);
  return eat.toISOString().split("T")[0]!;
}

// Today's date in EAT as YYYY-MM-DD
function todayEATYMD(): string {
  return utcToEATDateYMD(new Date().toISOString());
}

// Parse YYYY-MM-DD to a Date at midnight UTC (safe for comparisons)
function ymdToDate(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000Z`);
}

// Add/subtract days from a YYYY-MM-DD string
function shiftYMD(ymd: string, days: number): string {
  const d = new Date(ymdToDate(ymd).getTime() + days * 86_400_000);
  return d.toISOString().split("T")[0]!;
}

// Format YYYY-MM-DD for display in EAT locale
function formatDisplayDate(ymd: string): string {
  return new Date(`${ymd}T12:00:00.000Z`).toLocaleDateString("en-KE", {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: "Africa/Nairobi",
  });
}

function TodaysMealsModal({
  sub,
  onClose,
  onInstanceUpdated,
}: {
  sub: Subscription;
  onClose: () => void;
  onInstanceUpdated?: () => void;
}) {
  const today = todayEATYMD();
  const subStart = utcToEATDateYMD(sub.startDate);
  const subEnd = utcToEATDateYMD(sub.endDate);

  const [selectedDate, setSelectedDate] = useState(today);
  const [instances, setInstances] = useState<MealInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null); // instanceId in flight
  const [reportingId, setReportingId] = useState<string | null>(null); // confirm-not-received dialog

  const isToday = selectedDate === today;
  const isPastDay = selectedDate < today;
  // Actions only allowed on today — past and future are read-only
  const canAct = isToday;

  const canGoPrev = selectedDate > subStart;
  const canGoNext = selectedDate < subEnd;

  const fetchInstances = useCallback(
    async (date: string) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/meal-plans/subscriptions/${sub.id}/instances?date=${date}`,
        );
        const json: { data?: MealInstance[] } = await res.json();
        setInstances(json.data ?? []);
      } catch {
        toast.error("Failed to load meals");
      } finally {
        setLoading(false);
      }
    },
    [sub.id],
  );

  useEffect(() => {
    void fetchInstances(selectedDate);
  }, [fetchInstances, selectedDate]);

  const goToDate = (ymd: string) => {
    if (ymd < subStart || ymd > subEnd) return;
    setSelectedDate(ymd);
    setReportingId(null);
  };

  // ── Confirm received ───────────────────────────────────────────────────────
  const confirmDelivered = async (instanceId: string) => {
    setActioning(instanceId);
    try {
      const res = await fetch(
        `/api/meal-plans/instances/${instanceId}/delivered`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        },
      );
      const json: { success: boolean; message?: string } = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.message ?? "Failed to confirm");
      setInstances((prev) =>
        prev.map((i) =>
          i.id === instanceId
            ? {
                ...i,
                status: "DELIVERED",
                processedAt: new Date().toISOString(),
              }
            : i,
        ),
      );
      toast.success("Meal confirmed as received. Chef will be paid at 8 PM.");
      onInstanceUpdated?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setActioning(null);
    }
  };

  // ── Report not received ────────────────────────────────────────────────────
  const confirmNotReceived = async (instanceId: string) => {
    setActioning(instanceId);
    try {
      const res = await fetch(
        `/api/meal-plans/instances/${instanceId}/missed`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        },
      );
      const json: { success: boolean; message?: string } = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.message ?? "Failed to report");
      setInstances((prev) =>
        prev.map((i) =>
          i.id === instanceId
            ? { ...i, status: "MISSED", processedAt: new Date().toISOString() }
            : i,
        ),
      );
      setReportingId(null);
      toast.success("Reported. This meal will not be paid out to the chef.");
      onInstanceUpdated?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setActioning(null);
    }
  };

  const grouped = useMemo(
    () =>
      MEAL_ORDER.map((mt) => ({
        mealTime: mt,
        items: instances.filter((i) => i.mealTime === mt),
      })).filter((g) => g.items.length > 0),
    [instances],
  );

  const allSettled =
    instances.length > 0 &&
    instances.every(
      (i) =>
        i.status === "DELIVERED" ||
        i.status === "MISSED" ||
        i.status === "CANCELLED",
    );
  const pendingCount = instances.filter(
    (i) => i.status === "SCHEDULED" || i.status === "PROCESSING",
  ).length;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-3 py-4 sm:px-4 sm:py-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.25 }}
        className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-lg flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Package className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-black text-foreground">
                {sub.mealPlan.name}
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {new Date(`${subStart}T12:00:00.000Z`).toLocaleDateString(
                  "en-KE",
                  {
                    day: "numeric",
                    month: "short",
                    timeZone: "Africa/Nairobi",
                  },
                )}
                {" – "}
                {new Date(`${subEnd}T12:00:00.000Z`).toLocaleDateString(
                  "en-KE",
                  {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    timeZone: "Africa/Nairobi",
                  },
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center mt-0.5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Escrow notice — only on today */}
        {isToday && (
          <div className="flex items-start gap-2.5 px-5 py-3 border-b border-border bg-muted/30 flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-chart-3 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Payment is held in escrow. Confirm each meal once received — the
              chef is paid at{" "}
              <span className="font-bold text-foreground">8:00 PM EAT</span>.
            </p>
          </div>
        )}

        {/* Read-only notice — past or future */}
        {!isToday && (
          <div className="flex items-center gap-2 px-5 py-2.5 border-b border-border bg-muted/20 flex-shrink-0">
            <Info className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <p className="text-[11px] text-muted-foreground">
              {isPastDay
                ? "Past day — status is read-only."
                : "Upcoming day — meals are scheduled."}
            </p>
          </div>
        )}

        {/* Date navigator */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border flex-shrink-0">
          <button
            onClick={() => goToDate(shiftYMD(selectedDate, -1))}
            disabled={!canGoPrev}
            className="w-8 h-8 rounded-full border border-border bg-muted hover:bg-background flex items-center justify-center disabled:opacity-30 transition-colors flex-shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="text-center min-w-0">
            <p className="text-sm font-black text-foreground leading-tight">
              {formatDisplayDate(selectedDate)}
            </p>
            {isToday && (
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                TODAY
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {!isToday && (
              <button
                onClick={() => goToDate(today)}
                className="text-[10px] font-black text-primary border border-primary/30 rounded-lg px-2 py-1 hover:bg-primary/5 transition-colors"
              >
                Today
              </button>
            )}
            <button
              onClick={() => goToDate(shiftYMD(selectedDate, 1))}
              disabled={!canGoNext}
              className="w-8 h-8 rounded-full border border-border bg-muted hover:bg-background flex items-center justify-center disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground text-sm">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading meals…
            </div>
          ) : instances.length === 0 ? (
            <div className="text-center py-14 space-y-2 px-6">
              <p className="text-4xl">🗓️</p>
              <p className="text-sm font-black text-foreground">
                No meals on this day
              </p>
              <p className="text-[11px] text-muted-foreground">
                This plan runs on specific days of the week.
              </p>
            </div>
          ) : (
            <div className="p-4 sm:p-5 space-y-4">
              {/* All settled banner (today only) */}
              {isToday && allSettled && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-chart-3/30 bg-chart-3/5 px-4 py-3 flex items-center gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-chart-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-black text-foreground">
                      All meals settled!
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Confirmed meals will be paid out to the chef at 8:00 PM
                      EAT.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Pending count — today only */}
              {isToday && pendingCount > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  <span className="font-black text-foreground">
                    {pendingCount}
                  </span>{" "}
                  meal{pendingCount !== 1 ? "s" : ""} awaiting your confirmation
                </p>
              )}

              {/* Meal groups */}
              {grouped.map(({ mealTime, items }) => (
                <div key={mealTime} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full ${MEAL_META[mealTime].cls}`}
                    >
                      {MEAL_META[mealTime].emoji} {MEAL_META[mealTime].label}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {items.map((instance) => {
                    const meta = INSTANCE_STATUS_META[instance.status];
                    const isPending =
                      instance.status === "SCHEDULED" ||
                      instance.status === "PROCESSING";
                    const isDelivered = instance.status === "DELIVERED";
                    const isMissed = instance.status === "MISSED";
                    const isActioning_ = actioning === instance.id;
                    const isReporting = reportingId === instance.id;

                    return (
                      <motion.div
                        key={instance.id}
                        layout
                        className="space-y-0"
                      >
                        <div
                          className={`rounded-xl border p-3.5 flex items-center gap-3 transition-colors ${
                            isDelivered
                              ? "border-chart-3/20 bg-chart-3/5"
                              : isMissed
                                ? "border-destructive/20 bg-destructive/5"
                                : "border-border bg-background"
                          }`}
                        >
                          {/* Status icon */}
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              isDelivered
                                ? "bg-chart-3/10"
                                : isMissed
                                  ? "bg-destructive/10"
                                  : "bg-muted"
                            }`}
                          >
                            {isDelivered ? (
                              <CheckCircle2 className="w-5 h-5 text-chart-3" />
                            ) : isMissed ? (
                              <XCircle className="w-5 h-5 text-destructive" />
                            ) : (
                              <span className="text-xl">
                                {MEAL_META[mealTime].emoji}
                              </span>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">
                              {instance.menuItem.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span
                                className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${meta.cls}`}
                              >
                                {meta.label}
                              </span>
                              {instance.menuItem.prepTimeMin && (
                                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                  <Clock className="w-2.5 h-2.5" />
                                  {instance.menuItem.prepTimeMin}m
                                </span>
                              )}
                              {(isDelivered || isMissed) &&
                                instance.processedAt && (
                                  <span
                                    className={`text-[10px] ${isDelivered ? "text-chart-3" : "text-destructive"}`}
                                  >
                                    {isDelivered ? "✓" : "✗"}{" "}
                                    {new Date(
                                      instance.processedAt,
                                    ).toLocaleTimeString("en-KE", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      timeZone: "Africa/Nairobi",
                                    })}
                                  </span>
                                )}
                            </div>
                          </div>

                          {/* Action buttons — TODAY only */}
                          {canAct && isPending && (
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <Button
                                onClick={() =>
                                  void confirmDelivered(instance.id)
                                }
                                disabled={isActioning_}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-black h-8 px-3 flex items-center gap-1"
                              >
                                {isActioning_ ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <>
                                    <ShieldCheck className="w-3 h-3" />
                                    Received
                                  </>
                                )}
                              </Button>
                              <Button
                                onClick={() =>
                                  setReportingId(
                                    isReporting ? null : instance.id,
                                  )
                                }
                                disabled={isActioning_}
                                variant="outline"
                                className="rounded-xl text-xs font-bold h-8 px-3 border-destructive/30 text-destructive hover:bg-destructive/5 flex items-center gap-1"
                              >
                                <XCircle className="w-3 h-3" />
                                Not Received
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Inline "Not Received" confirmation panel */}
                        <AnimatePresence>
                          {isReporting && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.18 }}
                              className="overflow-hidden"
                            >
                              <div className="rounded-b-xl border border-t-0 border-destructive/20 bg-destructive/5 px-4 py-3">
                                <div className="flex items-start gap-3">
                                  <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black text-foreground">
                                      Report this meal as not received?
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                                      The chef will{" "}
                                      <span className="font-bold">not</span> be
                                      paid for this meal. An admin will review
                                      the dispute. This cannot be undone.
                                    </p>
                                    <div className="flex items-center gap-2 mt-2.5">
                                      <Button
                                        onClick={() =>
                                          void confirmNotReceived(instance.id)
                                        }
                                        disabled={isActioning_}
                                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl text-xs font-black h-7 px-3 flex items-center gap-1"
                                      >
                                        {isActioning_ ? (
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                          "Yes, report"
                                        )}
                                      </Button>
                                      <Button
                                        onClick={() => setReportingId(null)}
                                        disabled={isActioning_}
                                        variant="outline"
                                        className="rounded-xl text-xs font-bold h-7 px-3"
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              ))}

              {/* Remittance info */}
              {isToday && (
                <div className="rounded-xl bg-muted/40 border border-border px-4 py-3 flex items-start gap-2.5">
                  <Info className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Unconfirmed meals are auto-missed at the 8 PM payout run and
                    the chef is not paid. Reported meals go to admin review
                    before any refund is processed.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full rounded-xl"
          >
            Close
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── SubscriptionCard ─────────────────────────────────────────────────────────

function SubscriptionCard({
  sub,
  onCancelled,
  onCompletePayment,
}: {
  sub: Subscription;
  onCancelled: (id: string) => void;
  onCompletePayment: (sub: Subscription) => void;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showTodaysMeals, setShowTodaysMeals] = useState(false);
  const [busy, setBusy] = useState(false);
  const plan = sub.mealPlan;
  const isPending = sub.status === "PENDING";
  const isActive = sub.status === "ACTIVE";
  const canCancel = isPending || isActive;

  const doCancel = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/meal-plans/subscriptions/${sub.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancellationReason: "User cancelled" }),
      });
      const json: { success: boolean; message?: string } = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.message ?? "Failed to cancel");
      toast.success("Subscription cancelled");
      onCancelled(sub.id);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="bg-background rounded-2xl border border-border overflow-hidden shadow-sm">
      <div className="flex items-start gap-4 p-4">
        <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center text-2xl">
          {plan.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={plan.imageUrl}
              alt={plan.name}
              className="w-full h-full object-cover"
            />
          ) : (
            "🥗"
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <p className="text-sm font-black text-foreground truncate">
                {plan.name}
              </p>
              {plan.business && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <ChefHat className="w-3 h-3" />
                  {plan.business.name}
                </p>
              )}
            </div>
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0 ${subStatusCls(sub.status)}`}
            >
              {sub.status}
            </span>
          </div>

          <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(sub.startDate).toLocaleDateString("en-KE", {
                day: "numeric",
                month: "short",
              })}
              {" – "}
              {new Date(sub.endDate).toLocaleDateString("en-KE", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1">
              {sub.deliveryOption === "DELIVERY" ? (
                <Bike className="w-3 h-3" />
              ) : (
                <ShoppingBag className="w-3 h-3" />
              )}
              {sub.deliveryOption === "DELIVERY" ? "Delivery" : "Pickup"}
            </span>
            <span className="font-black text-primary">
              {kes(sub.amountPaid)}
            </span>
          </div>

          {sub.deliveryAddress && (
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1 truncate">
              <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
              {sub.deliveryAddress}
            </p>
          )}

          {/* Pending nudge — secondary (yellow) = warning in this theme */}
          {isPending && (
            <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-secondary/10 border border-secondary/30 px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 text-secondary-foreground flex-shrink-0" />
              <p className="text-[10px] font-semibold text-secondary-foreground">
                Payment not completed
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action row */}
      {canCancel && !showConfirm && (
        <div className="border-t border-border px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {isPending && (
              <Button
                onClick={() => onCompletePayment(sub)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-black h-8 px-4 flex items-center gap-1.5"
              >
                <Wallet className="w-3.5 h-3.5" />
                Complete Payment
              </Button>
            )}
            {isActive && (
              <Button
                onClick={() => setShowTodaysMeals(true)}
                variant="outline"
                className="rounded-xl text-xs font-black h-8 px-4 flex items-center gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
              >
                <Package className="w-3.5 h-3.5" />
                Today&apos;s Meals
              </Button>
            )}
          </div>
          <Button
            onClick={() => setShowConfirm(true)}
            variant="outline"
            className="text-xs font-bold rounded-xl border-destructive/30 text-destructive hover:bg-destructive/5 h-8 px-4"
          >
            Cancel subscription
          </Button>
        </div>
      )}

      {/* Today's Meals modal */}
      <AnimatePresence>
        {showTodaysMeals && (
          <TodaysMealsModal
            sub={sub}
            onClose={() => setShowTodaysMeals(false)}
          />
        )}
      </AnimatePresence>

      {/* Inline cancel confirmation */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-destructive/20 bg-destructive/5 px-4 py-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-foreground">
                    Cancel this subscription?
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                    {isPending
                      ? "This will remove the pending subscription. No payment was taken."
                      : "Your active subscription will be cancelled. Meals already scheduled remain confirmed."}
                  </p>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <Button
                      onClick={() => void doCancel()}
                      disabled={busy}
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl text-xs font-black h-8 px-4 flex items-center gap-1.5"
                    >
                      {busy ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                          Cancelling…
                        </>
                      ) : (
                        "Yes, cancel"
                      )}
                    </Button>
                    <Button
                      onClick={() => setShowConfirm(false)}
                      variant="outline"
                      disabled={busy}
                      className="rounded-xl text-xs font-bold h-8 px-4"
                    >
                      Keep subscription
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── PlanCard ─────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  index,
  onView,
  onSubscribe,
}: {
  plan: Plan;
  index: number;
  onView: (p: Plan) => void;
  onSubscribe: (p: Plan) => void;
}) {
  const isFull =
    plan.maxSubscribers !== null &&
    plan.currentSubscribers >= plan.maxSubscribers;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.38, delay: (index % 3) * 0.07 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-background rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
    >
      <div className="relative w-full aspect-[16/9] bg-muted overflow-hidden flex-shrink-0">
        {plan.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={plan.imageUrl}
            alt={plan.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-primary/5 to-secondary/10">
            🥗
          </div>
        )}
        {plan.isFeatured && (
          <span className="absolute top-2.5 left-2.5 flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Flame className="w-2.5 h-2.5" />
            Featured
          </span>
        )}
        <span className="absolute top-2.5 right-2.5 text-[10px] font-black px-2.5 py-1 rounded-lg bg-background/90 text-foreground shadow-sm backdrop-blur-sm">
          {durationLabel(plan.durationDays)}
        </span>
        <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/65 to-transparent">
          <p className="text-white font-black text-sm">{kes(plan.price)}</p>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-2.5 flex-1">
        <div>
          <h3 className="text-sm font-black text-foreground leading-tight">
            {plan.name}
          </h3>
          {plan.business && (
            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
              <ChefHat className="w-3 h-3" />
              {plan.business.name}
            </p>
          )}
          {plan.description && (
            <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
              {plan.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <CalendarDays className="w-3 h-3" />
            {plan.durationDays}d
          </span>
          <span className="opacity-40">·</span>
          <span className="flex items-center gap-1">
            <UtensilsCrossed className="w-3 h-3" />
            {plan.mealsPerDay}/day
          </span>
          <span className="opacity-40">·</span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {plan.currentSubscribers}
          </span>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {plan.mealTypes.map((mt) => (
            <span
              key={mt}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${MEAL_META[mt].cls}`}
            >
              {MEAL_META[mt].emoji} {MEAL_META[mt].label}
            </span>
          ))}
        </div>
        <div className="flex gap-2.5 text-[10px]">
          {plan.isDeliveryAvailable && (
            <span className="flex items-center gap-1 text-chart-3 font-semibold">
              <Bike className="w-3 h-3" />
              Delivery
            </span>
          )}
          {plan.isPickupAvailable && (
            <span className="flex items-center gap-1 text-primary font-semibold">
              <ShoppingBag className="w-3 h-3" />
              Pickup
            </span>
          )}
        </div>
        <div className="flex gap-2 mt-auto pt-1">
          <Button
            onClick={() => onView(plan)}
            variant="outline"
            className="flex-1 rounded-xl text-xs font-bold h-9 flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Details
          </Button>
          <Button
            onClick={() => onSubscribe(plan)}
            disabled={isFull}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-black h-9 disabled:opacity-40"
          >
            {isFull ? "Full" : "Subscribe"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function PlanSkeleton() {
  return (
    <div className="bg-background rounded-2xl border border-border overflow-hidden animate-pulse">
      <div className="aspect-[16/9] bg-muted" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="flex gap-2 mt-1">
          <div className="h-9 bg-muted rounded-xl flex-1" />
          <div className="h-9 bg-muted rounded-xl flex-1" />
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MealPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [customerPhone, setCustomerPhone] = useState("your phone");
  const [meta, setMeta] = useState<PageMeta>({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [tab, setTab] = useState<"discover" | "my">("discover");
  const [search, setSearch] = useState("");
  const [durFilter, setDurFilter] = useState<"all" | "weekly" | "monthly">(
    "all",
  );
  const [delFilter, setDelFilter] = useState<"all" | "delivery" | "pickup">(
    "all",
  );
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<Plan | null>(null);
  const [subscribing, setSubscribing] = useState<Plan | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((res: { data?: { phone?: string | null } }) => {
        const phone = res?.data?.phone;
        if (phone) setCustomerPhone(phone);
      })
      .catch(() => {});
  }, []);

  const fetchPlans = useCallback(
    async (pg: number) => {
      setLoading(true);
      const qs = new URLSearchParams({
        page: String(pg),
        limit: "12",
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(durFilter !== "all" ? { duration: durFilter } : {}),
        ...(delFilter !== "all" ? { delivery: delFilter } : {}),
      }).toString();
      try {
        const res = await fetch(`/api/meal-plans?${qs}`);
        const json: { data?: RawPlan[]; meta?: PageMeta } = await res.json();
        setPlans((json.data ?? []).map(normalisePlan));
        if (json.meta) setMeta(json.meta);
      } catch {
        toast.error("Failed to load meal plans");
      } finally {
        setLoading(false);
      }
    },
    [search, durFilter, delFilter],
  );

  const fetchSubs = useCallback(async () => {
    setLoadingSubs(true);
    try {
      const res = await fetch("/api/meal-plans/subscriptions");
      const json: { data?: Subscription[] } = await res.json();
      // Only show actionable subscriptions — CANCELLED/COMPLETED/EXPIRED are historical noise
      const VISIBLE: SubStatus[] = ["PENDING", "ACTIVE", "PAUSED"];
      setSubs(
        (json.data ?? []).filter((s) =>
          VISIBLE.includes(s.status as SubStatus),
        ),
      );
    } catch {
      toast.error("Failed to load subscriptions");
    } finally {
      setLoadingSubs(false);
    }
  }, []);

  useEffect(() => {
    void fetchPlans(1);
    setPage(1);
  }, [fetchPlans]);
  useEffect(() => {
    if (tab === "my") void fetchSubs();
  }, [tab, fetchSubs]);

  const onSubscribeSuccess = useCallback(() => {
    setSubscribing(null);
    void fetchPlans(page);
    void fetchSubs();
    setTab("my");
    toast.success("🎉 Subscription activated!", { duration: 4000 });
  }, [fetchPlans, fetchSubs, page]);

  // Always refresh subs on close — surfaces PENDING/CANCELLED states immediately
  const handleSubscribeModalClose = useCallback(() => {
    setSubscribing(null);
    void fetchSubs();
  }, [fetchSubs]);

  const handleCompletePayment = useCallback(
    (sub: Subscription) => {
      const plan = plans.find((p) => p.id === sub.mealPlanId) ?? sub.mealPlan;
      setSubscribing(plan);
    },
    [plans],
  );

  const existingPendingSub = useMemo(
    () =>
      subscribing
        ? (subs.find(
            (s) => s.mealPlanId === subscribing.id && s.status === "PENDING",
          ) ?? null)
        : null,
    [subscribing, subs],
  );

  const activeSubCount = useMemo(
    () =>
      subs.filter((s) => s.status === "ACTIVE" || s.status === "PENDING")
        .length,
    [subs],
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="relative border-b border-border overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle, var(--foreground) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 mb-4">
              <Sparkles className="w-3 h-3" />
              Meal Plans
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight leading-[1.05]">
              Weekly &amp; Monthly
              <br />
              <span className="text-primary">Meal Plans</span>
            </h1>
            <p className="text-muted-foreground mt-3 text-sm sm:text-base max-w-md leading-relaxed">
              Subscribe to a curated plan from your favourite kitchen.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Tabs */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
            {(["discover", "my"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                  tab === t
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "discover" ? "Discover Plans" : "My Subscriptions"}
                {t === "my" && activeSubCount > 0 && (
                  <span className="text-[10px] font-black bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                    {activeSubCount}
                  </span>
                )}
              </button>
            ))}
          </div>
          {tab === "discover" && (
            <button
              onClick={() => void fetchPlans(page)}
              className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Discover */}
        {tab === "discover" && (
          <>
            <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search plans, cuisines…"
                  className="pl-9 rounded-xl border-border h-10"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" />
                  Filter:
                </span>
                <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
                  {(["all", "weekly", "monthly"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setDurFilter(v)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                        durFilter === v
                          ? "bg-background shadow-sm text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {v === "all" ? "All" : v}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
                  {(["all", "delivery", "pickup"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setDelFilter(v)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                        delFilter === v
                          ? "bg-background shadow-sm text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {v === "all" ? "All" : v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {!loading && (
              <p className="text-xs text-muted-foreground">
                {meta.total > 0
                  ? `${meta.total} plan${meta.total !== 1 ? "s" : ""} found`
                  : "No plans match your filters"}
                {meta.totalPages > 1 &&
                  ` · Page ${meta.page} of ${meta.totalPages}`}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <PlanSkeleton key={i} />
                ))
              ) : plans.length > 0 ? (
                plans.map((p, i) => (
                  <PlanCard
                    key={p.id}
                    plan={p}
                    index={i}
                    onView={setViewing}
                    onSubscribe={setSubscribing}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-20 space-y-3">
                  <p className="text-5xl">📋</p>
                  <p className="text-sm font-black text-foreground">
                    No meal plans available
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {search || durFilter !== "all" || delFilter !== "all"
                      ? "Try adjusting your filters"
                      : "Kitchens haven't published plans yet"}
                  </p>
                  {(search || durFilter !== "all" || delFilter !== "all") && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearch("");
                        setDurFilter("all");
                        setDelFilter("all");
                      }}
                      className="rounded-xl text-xs mt-2"
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              )}
            </div>

            {meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    const p = Math.max(1, page - 1);
                    setPage(p);
                    void fetchPlans(p);
                  }}
                  disabled={page === 1}
                  className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 shadow-md transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from(
                  { length: Math.min(meta.totalPages, 7) },
                  (_, i) => i + 1,
                ).map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setPage(p);
                      void fetchPlans(p);
                    }}
                    className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                      p === page
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => {
                    const p = Math.min(meta.totalPages, page + 1);
                    setPage(p);
                    void fetchPlans(p);
                  }}
                  disabled={page === meta.totalPages}
                  className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 shadow-md transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}

        {/* My subs */}
        {tab === "my" && (
          <div className="space-y-4">
            {loadingSubs ? (
              <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-sm">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading subscriptions…
              </div>
            ) : subs.length === 0 ? (
              <div className="text-center py-24 space-y-4">
                <p className="text-6xl">🥗</p>
                <p className="text-sm font-black text-foreground">
                  No subscriptions yet
                </p>
                <p className="text-xs text-muted-foreground">
                  Discover a plan and subscribe to get started
                </p>
                <Button
                  onClick={() => setTab("discover")}
                  className="rounded-xl text-xs mt-2 flex items-center gap-2 mx-auto bg-primary text-primary-foreground"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Browse Plans
                </Button>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  {subs.length} subscription{subs.length !== 1 ? "s" : ""}
                </p>
                <div className="space-y-3">
                  {subs.map((s) => (
                    <SubscriptionCard
                      key={s.id}
                      sub={s}
                      onCancelled={(id) =>
                        setSubs((prev) => prev.filter((x) => x.id !== id))
                      }
                      onCompletePayment={handleCompletePayment}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {viewing && (
          <PlanDetailModal
            plan={viewing}
            onClose={() => setViewing(null)}
            onSubscribe={(p) => {
              setViewing(null);
              setSubscribing(p);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {subscribing && (
          <SubscribeModal
            plan={subscribing}
            customerPhone={customerPhone}
            existingPendingSub={existingPendingSub}
            onClose={handleSubscribeModalClose}
            onSuccess={onSubscribeSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
