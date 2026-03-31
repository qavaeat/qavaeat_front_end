"use client";

import {
  createContext, useContext, useState,
  useCallback, useEffect, type ReactNode,
} from "react";

export interface PlannedMeal {
  id: string;
  menuItemId: string;
  name: string;
  imageUrl: string | null;
  price: number;
  description: string | null;
  kitchenName: string;
  emoji: string;
}

interface PlanContextValue {
  plannedMeals: PlannedMeal[];
  addToplan: (meal: Omit<PlannedMeal, "id">) => void;
  removeFromPlan: (id: string) => void;
  clearPlan: () => void;
  isPlanned: (menuItemId: string) => boolean;
  count: number;
}

const STORAGE_KEY = "qavaeat_plan_v1";

function load(): PlannedMeal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(meals: PlannedMeal[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meals));
  } catch { /* quota exceeded — fail silently */ }
}

const PlanContext = createContext<PlanContextValue | null>(null);

export function PlanProvider({ children }: { children: ReactNode }) {
  // Lazy initialiser — runs once on client mount, never on server
  const [plannedMeals, setPlannedMeals] = useState<PlannedMeal[]>(load);

  // Persist every change
  useEffect(() => {
    save(plannedMeals);
  }, [plannedMeals]);

  const addToplan = useCallback((meal: Omit<PlannedMeal, "id">) => {
    setPlannedMeals(prev => {
      if (prev.some(m => m.menuItemId === meal.menuItemId)) return prev;
      const next = [...prev, { ...meal, id: `pm-${Date.now()}` }];
      save(next); // also write immediately so navigation doesn't race
      return next;
    });
  }, []);

  const removeFromPlan = useCallback((id: string) => {
    setPlannedMeals(prev => {
      const next = prev.filter(m => m.id !== id);
      save(next);
      return next;
    });
  }, []);

  const clearPlan = useCallback(() => {
    setPlannedMeals([]);
    save([]);
  }, []);

  const isPlanned = useCallback(
    (menuItemId: string) => plannedMeals.some(m => m.menuItemId === menuItemId),
    [plannedMeals]
  );

  return (
    <PlanContext.Provider value={{
      plannedMeals,
      addToplan,
      removeFromPlan,
      clearPlan,
      isPlanned,
      count: plannedMeals.length,
    }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used within PlanProvider");
  return ctx;
}