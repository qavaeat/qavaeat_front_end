"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { apiFetch, ApiError } from "@/lib/api";

// ─── Domain types ─────────────────────────────────────────────────────────────

export interface PlannedMeal {
  id: string;
  menuItemId: string;
  name: string;
  imageUrl: string | null;
  price: number;
  description: string | null;
  kitchenName: string;
  kitchenId: string;
  emoji: string;
  prepTimeMin: number;
}

interface PlanData {
  items: PlannedMeal[];
  kitchenId: string | null;
  kitchenName: string | null;
}

interface PlanEnvelope {
  success: boolean;
  data: PlanData;
}

interface AddItemEnvelope {
  success: boolean;
  data: PlannedMeal;
}

interface ProfileData {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatarUrl: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
  user: {
    email: string;
    role: string;
    createdAt: string;
  };
}

interface ProfileEnvelope {
  success: boolean;
  data: {
    profile: ProfileData;
  };
}

// ─── Context shape ────────────────────────────────────────────────────────────

interface PlanContextValue {
  plannedMeals: PlannedMeal[];
  activePlanKitchenId: string | null;
  activePlanKitchenName: string | null;
  addToplan: (meal: Omit<PlannedMeal, "id">) => Promise<void>;
  removeFromPlan: (id: string) => Promise<void>;
  clearPlan: () => Promise<void>;
  isPlanned: (menuItemId: string) => boolean;
  count: number;
  userId: string;
  loading: boolean;
}

const PlanContext = createContext<PlanContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PlanProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string>("");
  const [plannedMeals, setPlannedMeals] = useState<PlannedMeal[]>([]);
  const [kitchenId, setKitchenId] = useState<string | null>(null);
  const [kitchenName, setKitchenName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // A plain ref holding the current "generation" string.
  // Using a string (not Symbol) avoids the Strict Mode double-invoke race:
  // each init() captures its own generation at call time and checks it after
  // every await — if a newer init() has started, the old one exits cleanly.
  const generationRef = useRef<number>(0);

  useEffect(() => {
    // Increment generation so any in-flight init from a previous render
    // (e.g. React 18 Strict Mode double-invoke) exits after its next await.
    const myGeneration = ++generationRef.current;

    async function init(): Promise<void> {
      setLoading(true);

      try {
        // ── STEP 1: resolve userId via /profile/me ───────────────────────────
        // apiFetch hits /api/profile/me → Next.js proxy → Fastify /profile/me
        // The full Fastify envelope: { success, data: { profile: { userId, ... } } }
        const profileEnvelope = await apiFetch<ProfileEnvelope>("/profile/me");

        // Bail if a newer init() has started while we were awaiting
        if (generationRef.current !== myGeneration) return;

        const resolvedUserId = profileEnvelope?.data?.profile?.userId ?? "";
        if (resolvedUserId) setUserId(resolvedUserId);

        // ── STEP 2: load the meal plan ───────────────────────────────────────
        // apiFetch hits /api/plans/my → Next.js proxy → Fastify /plans/my
        // The full Fastify envelope: { success, data: { kitchenId, kitchenName, items } }
        const planEnvelope = await apiFetch<PlanEnvelope>("/plans/my");

        if (generationRef.current !== myGeneration) return;

        const plan = planEnvelope?.data;

        setPlannedMeals(plan?.items ?? []);
        setKitchenId(plan?.kitchenId ?? null);
        setKitchenName(plan?.kitchenName ?? null);
      } catch (err) {
        if (generationRef.current !== myGeneration) return;
        if (err instanceof ApiError && err.status !== 401) {
          toast.error(err.message);
        }
        // 401 → apiFetch already handles redirect to /auth
      } finally {
        if (generationRef.current === myGeneration) setLoading(false);
      }
    }

    void init();

    const handler = (): void => {
      generationRef.current += 1;
      void init();
    };

    window.addEventListener("profile-updated", handler);
    return () => {
      // Invalidate this generation so in-flight fetches from this render exit
      generationRef.current += 1;
      window.removeEventListener("profile-updated", handler);
    };
  }, []);

  // ─── addToplan ─────────────────────────────────────────────────────────────

const addToplan = useCallback(
  async (meal: Omit<PlannedMeal, "id">): Promise<void> => {

    // Guard 1: don't add if already in plan
    if (plannedMeals.some((m) => m.menuItemId === meal.menuItemId)) {
      return;
    }

    // Guard 2: kitchen mismatch — only block if BOTH sides have a real kitchenId
    // This prevents false positives when kitchenId is "" or undefined transiently
    if (
      kitchenId !== null &&
      kitchenId !== "" &&
      meal.kitchenId &&
      meal.kitchenId !== "" &&
      kitchenId !== meal.kitchenId
    ) {
      toast.warning(
        `Your plan is from ${kitchenName ?? "another kitchen"}. Clear it first to plan from ${meal.kitchenName}.`,
        {
          action: {
            label: "Clear & Add",
            onClick: async () => {
              try {
                await apiFetch("/plans/my", { method: "DELETE" });
              } catch {
                /* ignore */
              }
              setPlannedMeals([]);
              setKitchenId(null);
              setKitchenName(null);
              await addToplan(meal);
            },
          },
        },
      );
      return;
    }

    const tempId = `temp-${Date.now()}`;
    setPlannedMeals((prev) => {
      if (prev.some((m) => m.menuItemId === meal.menuItemId)) return prev;
      return [...prev, { ...meal, id: tempId }];
    });

    // Only set kitchen if we don't already have one
    if (!kitchenId || kitchenId === "") {
      setKitchenId(meal.kitchenId);
      setKitchenName(meal.kitchenName);
    }

    try {
      const envelope = await apiFetch<AddItemEnvelope>("/plans/items", {
        method: "POST",
        body: JSON.stringify({ menuItemId: meal.menuItemId }),
      });
      const saved = envelope.data;
      setPlannedMeals((prev) =>
        prev.map((m) => (m.id === tempId ? saved : m)),
      );
      // Update kitchenId from the server response which is always authoritative
      if (saved.kitchenId) {
        setKitchenId(saved.kitchenId);
        setKitchenName(saved.kitchenName);
      }
    } catch (err) {
      setPlannedMeals((prev) => {
        const next = prev.filter((m) => m.id !== tempId);
        if (next.length === 0) {
          setKitchenId(null);
          setKitchenName(null);
        }
        return next;
      });
      toast.error(
        err instanceof ApiError ? err.message : "Failed to add to plan",
      );
    }
  },
  [kitchenId, kitchenName, plannedMeals], // add plannedMeals to deps
);

  // ─── removeFromPlan ────────────────────────────────────────────────────────

  const removeFromPlan = useCallback(
    async (id: string): Promise<void> => {
      const snapshot = plannedMeals;

      setPlannedMeals((prev) => {
        const next = prev.filter((m) => m.id !== id);
        if (next.length === 0) {
          setKitchenId(null);
          setKitchenName(null);
        }
        return next;
      });

      try {
        await apiFetch(`/plans/items/${id}`, { method: "DELETE" });
      } catch (err) {
        setPlannedMeals(snapshot);
        toast.error(
          err instanceof ApiError ? err.message : "Failed to remove item",
        );
      }
    },
    [plannedMeals],
  );

  // ─── clearPlan ─────────────────────────────────────────────────────────────

  const clearPlan = useCallback(async (): Promise<void> => {
    const snapshot = { meals: plannedMeals, kitchenId, kitchenName };

    setPlannedMeals([]);
    setKitchenId(null);
    setKitchenName(null);

    try {
      await apiFetch("/plans/my", { method: "DELETE" });
    } catch (err) {
      setPlannedMeals(snapshot.meals);
      setKitchenId(snapshot.kitchenId);
      setKitchenName(snapshot.kitchenName);
      toast.error(
        err instanceof ApiError ? err.message : "Failed to clear plan",
      );
    }
  }, [plannedMeals, kitchenId, kitchenName]);

  // ─── isPlanned ─────────────────────────────────────────────────────────────

  const isPlanned = useCallback(
    (menuItemId: string): boolean =>
      plannedMeals.some((m) => m.menuItemId === menuItemId),
    [plannedMeals],
  );

  return (
    <PlanContext.Provider
      value={{
        plannedMeals,
        activePlanKitchenId: kitchenId,
        activePlanKitchenName: kitchenName,
        addToplan,
        removeFromPlan,
        clearPlan,
        isPlanned,
        count: plannedMeals.length,
        userId,
        loading,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePlan(): PlanContextValue {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used within PlanProvider");
  return ctx;
}