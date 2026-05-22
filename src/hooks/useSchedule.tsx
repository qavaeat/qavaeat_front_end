"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import type { MealTime } from "@/types/user-section";
import { apiFetch, ApiError } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScheduledMeal {
  quantity: number;
  id: string;
  plannedMealId: string;
  name: string;
  emoji: string;
  kitchenName: string;
  price: number;
  mealTime: MealTime;
  time: string;
  prepTimeMin: number;
  paid: boolean;
  paidAt: string | null;
  itemStatus: string;
}

export type WeekSchedule = Record<
  string,
  Partial<Record<MealTime, ScheduledMeal>>
>;

export interface SavedSchedule {
  weekKey: string;
  scheduleId: string;
  mondayISO: string;
  status: string;
  paymentStatus: string;
  serviceType: string;
  deliveryAddress: string | null;
  totalAmount: number;
  savedAt: string;
  days: WeekSchedule;
}

export type ServiceTypeValue = "DELIVERY" | "PICKUP" | "DINE_IN";

export interface UpsertSchedulePayload {
  weekStartDate: string;
  serviceType?: ServiceTypeValue;
  deliveryAddress?: string | undefined;
  deliveryLat?: number | undefined;
  deliveryLng?: number | undefined;
  items: {
    menuItemId: string;
    scheduledDate: string;
    mealTime: MealTime;
    scheduledAt: string;
    quantity?: number | undefined;
  }[];
}

export interface CheckoutPayload {
  serviceType: ServiceTypeValue;
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  deliveryPlaceId?: string;
  phoneOverride?: string;
}

interface CheckoutApiResponse {
  invoiceId: string;
  apiRef: string;
  grandTotal: number;
  currency: string;
  status: string;
  message: string;
}

interface CheckoutResponse {
  apiRef: string;
  invoiceId: string;
  grandTotal: number;
}

// ─── API response envelope ────────────────────────────────────────────────────

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSchedules() {
  const [savedSchedules, setSavedSchedules] = useState<
    Record<string, SavedSchedule>
  >({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customerPhone, setCustomerPhone] = useState("your phone");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((res: { data?: { phone?: string | null } }) => {
        const phone = res?.data?.phone;
        if (phone) setCustomerPhone(phone);
      })
      .catch(() => {});
  }, []);

  // ── Load ────────────────────────────────────────────────────────────────

  const loadSchedules = useCallback(async () => {
    try {
      const res =
        await apiFetch<ApiEnvelope<Record<string, SavedSchedule>>>(
          "/schedules/my",
        );
      setSavedSchedules(res?.data ?? {});
    } catch (err) {
      if (err instanceof ApiError && err.status !== 401) {
        toast.error(err.message);
      } else if (!(err instanceof ApiError)) {
        toast.error("Failed to load your schedules");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  // ── Upsert week ─────────────────────────────────────────────────────────

  const upsertSchedule = useCallback(
    async (payload: UpsertSchedulePayload): Promise<SavedSchedule | null> => {
      setSaving(true);
      try {
        const res = await apiFetch<ApiEnvelope<SavedSchedule>>("/schedules", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        // Reload from DB so week keys and paid states are always in sync.
        // loadSchedules is stable (no deps that change), so this is safe.
        await loadSchedules();
        return res?.data ?? null;
      } catch (err) {
        toast.error(
          err instanceof ApiError ? err.message : "Failed to save schedule",
        );
        return null;
      } finally {
        setSaving(false);
      }
    },
    [loadSchedules], // FIX: was missing loadSchedules — caused stale closure
  );

  // ── Remove a single item ─────────────────────────────────────────────────

  const removeItem = useCallback(
    async (scheduleId: string, itemId: string, weekKey: string) => {
      try {
        const res = await apiFetch<
          ApiEnvelope<{ removed: string; newTotal: number }>
        >(`/schedules/${scheduleId}/items/${itemId}`, { method: "DELETE" });

        const result = res?.data;

        setSavedSchedules((prev) => {
          const week = prev[weekKey];
          if (!week) return prev;
          const newDays: WeekSchedule = {};
          for (const [dayIdx, dayData] of Object.entries(week.days)) {
            const stringKey = String(dayIdx); // always a string key
            newDays[stringKey] = {};
            if (!dayData) continue;
            for (const [mt, meal] of Object.entries(dayData) as [
              MealTime,
              ScheduledMeal | undefined,
            ][]) {
              if (meal && meal.id !== itemId) {
                newDays[stringKey][mt] = meal;
              }
            }
          }

          return {
            ...prev,
            [weekKey]: {
              ...week,
              days: newDays,
              totalAmount: result?.newTotal ?? week.totalAmount,
            },
          };
        });

        toast.success("Meal removed");
      } catch (err) {
        toast.error(
          err instanceof ApiError ? err.message : "Failed to remove meal",
        );
      }
    },
    [],
  );

  // ── Cancel week ─────────────────────────────────────────────────────────

  const cancelWeek = useCallback(
    async (scheduleId: string, weekKey: string) => {
      try {
        await apiFetch(`/schedules/${scheduleId}/cancel`, { method: "PATCH" });
        setSavedSchedules((prev) => {
          const updated = { ...prev };
          delete updated[weekKey];
          return updated;
        });
        toast.success("Week cancelled");
      } catch (err) {
        toast.error(
          err instanceof ApiError ? err.message : "Failed to cancel week",
        );
      }
    },
    [],
  );

  // ── Delete week ─────────────────────────────────────────────────────────

  const deleteSchedule = useCallback(
    async (scheduleId: string, weekKey: string) => {
      try {
        await apiFetch(`/schedules/${scheduleId}`, { method: "DELETE" });
        setSavedSchedules((prev) => {
          const updated = { ...prev };
          delete updated[weekKey];
          return updated;
        });
        toast.success("Week deleted");
      } catch (err) {
        toast.error(
          err instanceof ApiError ? err.message : "Failed to delete schedule",
        );
      }
    },
    [],
  );
  const checkout = useCallback(
    async (
      dto: CheckoutPayload,
    ): Promise<{ apiRef: string; grandTotal: number }> => {
      const res = await apiFetch<ApiEnvelope<CheckoutApiResponse>>(
        "/schedules/checkout",
        {
          method: "POST",
          body: JSON.stringify(dto),
        },
      );
      const apiRef = res?.data?.apiRef;
      const grandTotal = res?.data?.grandTotal; // ← already there in the response
      if (!apiRef)
        throw new Error("Payment initiation failed — no reference returned");
      return { apiRef, grandTotal: grandTotal ?? 0 }; // ← just expose it
    },
    [],
  );

  const cancelPayment = useCallback(async (apiRef: string): Promise<void> => {
    try {
      await apiFetch(`/schedules/payments/${apiRef}/cancel`, {
        method: "PATCH",
        body: JSON.stringify({}),
      });
    } catch {}
  }, []);

  return {
    savedSchedules,
    setSavedSchedules,
    loading,
    saving,
    loadSchedules,
    upsertSchedule,
    removeItem,
    cancelWeek,
    deleteSchedule,
    checkout,
    cancelPayment,
    customerPhone,
  };
}

// ─── Chef notification polling ────────────────────────────────────────────────

export interface ChefNotification {
  type: "NEW_SCHEDULE_ORDER";
  scheduleId: string;
  customerName: string;
  customerPhone: string | null;
  serviceType: string;
  deliveryAddress: string | null;
  totalAmount: number;
  weekStartDate: string;
  days: {
    date: string;
    meals: {
      mealTime: string;
      itemName: string;
      scheduledAt: string;
      readyBy: string;
      quantity: number;
      unitPrice: number;
    }[];
  }[];
  paidAt: string | null;
}

export function useChefNotifications(
  businessId: string | null,
  onNew: (n: ChefNotification) => void,
) {
  const lastSeenRef = useRef<string>(new Date().toISOString());
  const seenIdsRef = useRef<Set<string>>(new Set());
  const onNewRef = useRef(onNew);
  useEffect(() => {
    onNewRef.current = onNew;
  }, [onNew]);

  useEffect(() => {
    if (!businessId) return;

    async function poll() {
      try {
        const qs = new URLSearchParams({
          businessId: businessId!,
          since: lastSeenRef.current,
        }).toString();
        const res = await apiFetch<ApiEnvelope<ChefNotification[]>>(
          `/schedules/notifications/pending?${qs}`,
        );
        const data = res?.data;
        if (data?.length) {
          lastSeenRef.current = new Date().toISOString();
          for (const n of data) {
            if (!seenIdsRef.current.has(n.scheduleId)) {
              seenIdsRef.current.add(n.scheduleId);
              onNewRef.current(n);
            }
          }
        }
      } catch {
        // Silent — retry on next interval
      }
    }

    poll();
    const interval = setInterval(poll, 15_000);
    return () => clearInterval(interval);
  }, [businessId]);
}
