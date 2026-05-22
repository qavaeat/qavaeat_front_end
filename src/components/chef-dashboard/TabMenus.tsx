"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  Plus,
  Users,
  Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SkeletonLoader } from "@/components/ui/SkeletonLoader";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import { toast } from "sonner";
import { AddMenuItemForm } from "./AddMenuItemForm";
import { UpdateMenuItemForm } from "./UpdateMenuItemForm";
import { AddMealPlanForm } from "./AddMealPlanForm";
import { UpdateMealPlanForm } from "./UpdateMealPlanForm";
import { AddMealPlanItemForm } from "./AddMealPlanItemForm";
import { MealPlanItemsViewer } from "./MealPlanItemsViewer";
import type { MenuItem, MealPlan, MealTime, MealPlanItem } from "./types";

// ─── types ────────────────────────────────────────────────────────────────────
type MenuTab = "menu" | "plan";
type MealFilter = "All" | MealTime;
type PlanFilter = "All" | "Weekly" | "Monthly" | "Subscriptions";

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const PAGE_SIZE = 7;

async function fetchMenuItems(params: Record<string, string | number>) {
  const qs = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)]),
  ).toString();
  const res = await fetch(`/api/chefs/menu?${qs}`);
  if (!res.ok) throw new Error("Failed to fetch menu items");
  return res.json();
}

async function fetchMealPlans(params: Record<string, string | number>) {
  const qs = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)]),
  ).toString();
  const res = await fetch(`/api/chefs/meal-plans?${qs}`);
  if (!res.ok) throw new Error("Failed to fetch meal plans");
  return res.json();
}

async function deleteMenuItem(id: string) {
  const res = await fetch(`/api/chefs/menu/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete menu item");
}

async function deleteMealPlan(id: string) {
  const res = await fetch(`/api/chefs/meal-plans/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete meal plan");
}

// ─── component ────────────────────────────────────────────────────────────────
export function TabMenus() {
  const [activeTab, setActiveTab] = useState<MenuTab>("menu");

  // data
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);

  // pagination meta from backend
  const [menuMeta, setMenuMeta] = useState<PaginationMeta | null>(null);
  const [planMeta, setPlanMeta] = useState<PaginationMeta | null>(null);

  // ui state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [mealFilter, setMealFilter] = useState<MealFilter>("All");
  const [planFilter, setPlanFilter] = useState<PlanFilter>("All");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // modal state
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [editingPlan, setEditingPlan] = useState<MealPlan | null>(null);
  const [viewingPlanItems, setViewingPlanItems] = useState<MealPlan | null>(
    null,
  );
  const [addingItemToPlan, setAddingItemToPlan] = useState<MealPlan | null>(
    null,
  );
  const [deletingMenuItem, setDeletingMenuItem] = useState<MenuItem | null>(
    null,
  );
  const [deletingPlan, setDeletingPlan] = useState<MealPlan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isMenu = activeTab === "menu";

  // debounce search input (300 ms)
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // ─── fetch menu items ──────────────────────────────────────────────────────
  const loadMenuItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = {
        page,
        limit: PAGE_SIZE,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (mealFilter !== "All") params.mealTime = mealFilter;

      const json = await fetchMenuItems(params);
      setMenuItems(json?.items ?? []);
      setMenuMeta(json?.meta ?? null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, mealFilter]);

  // ─── fetch meal plans ──────────────────────────────────────────────────────
  const loadMealPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = {
        page,
        limit: PAGE_SIZE,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (planFilter === "Weekly") params.durationMax = 7;
      if (planFilter === "Monthly") params.durationMin = 8;
      if (planFilter === "Subscriptions") params.hasSubscribers = 1;

      const json = await fetchMealPlans(params);
      interface MealData {
        id: string;
        menuItemId: string;
        menuItem?: { name: string };
        menuItemName?: string;
        mealTime: string;
        dayNumber: number;
        notes?: string | null;
      }
      interface PlanData {
        id: string;
        name: string;
        price: string | number;
        meals?: MealData[];
        currentSubscribers?: number;
        _count?: { subscriptions: number };
        mealTypes?: string[];
        cuisineType?: string[];
        availableDays?: string[];
        tags?: string[];
        [key: string]: unknown;
      }
      const normalized = (json?.data ?? []).map((p: PlanData) => ({
        ...p,
        price: Number(p.price),
        // backend calls it `meals`, frontend expects `items`
        items: (p.meals ?? []).map((m: MealData) => ({
          id: m.id,
          menuItemId: m.menuItemId,
          menuItemName: m.menuItem?.name ?? m.menuItemName ?? "",
          mealTime: m.mealTime,
          dayNumber: m.dayNumber,
          notes: m.notes ?? null,
        })),
        // backend uses currentSubscribers, frontend expects subscriberCount
        subscriberCount: p.currentSubscribers ?? p._count?.subscriptions ?? 0,
        // ensure arrays are never undefined
        mealTypes: p.mealTypes ?? [],
        cuisineType: p.cuisineType ?? [],
        availableDays: p.availableDays ?? [],
        tags: p.tags ?? [],
      }));
      setMealPlans(normalized);
      setPlanMeta(json?.meta ?? null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, planFilter]);

  // trigger the right fetch when tab / filters / page change
  useEffect(() => {
    if (isMenu) loadMenuItems();
    else loadMealPlans();
  }, [isMenu, loadMenuItems, loadMealPlans]);

  // ─── helpers ───────────────────────────────────────────────────────────────
  const handleTabChange = (tab: MenuTab) => {
    setActiveTab(tab);
    setPage(1);
    setSearch("");
    setMealFilter("All");
    setPlanFilter("All");
  };

  const handleDeleteMenuItem = async (id: string) => {
    try {
      await deleteMenuItem(id);
      loadMenuItems();
    } catch {
      alert("Failed to delete. Please try again.");
    }
  };

  const handleDeleteMealPlan = async (id: string) => {
    try {
      await deleteMealPlan(id);
      loadMealPlans();
    } catch {
      alert("Failed to delete. Please try again.");
    }
  };

  const handleRemovePlanItem = (planId: string, itemId: string) => {
    setMealPlans((prev) =>
      prev.map((p) =>
        p.id === planId
          ? { ...p, items: (p.items ?? []).filter((i) => i.id !== itemId) }
          : p,
      ),
    );
    setViewingPlanItems((prev) =>
      prev && prev.id === planId
        ? { ...prev, items: (prev.items ?? []).filter((i) => i.id !== itemId) }
        : prev,
    );
  };

  const activeMeta = isMenu ? menuMeta : planMeta;
  const displayedItems = isMenu ? menuItems : mealPlans;

  // ─── render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Kitchen Live Banner */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4 px-5 py-4 rounded-2xl border border-[#007606]/30 bg-[#007606]/5"
      >
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-8 h-8 text-[#007606] flex-shrink-0" />
          <div>
            <p className="text-sm font-black text-foreground">
              Your Kitchen is Live
            </p>
            <p className="text-xs text-muted-foreground">
              You are now accepting orders from local food lovers
            </p>
          </div>
        </div>
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex-shrink-0"
        >
          <Button
            onClick={() =>
              isMenu ? setShowAddMenu(true) : setShowAddPlan(true)
            }
            className="bg-[#007606] hover:bg-[#007606]/90 text-white font-bold rounded-xl px-5 py-2.5 text-sm whitespace-nowrap"
          >
            {isMenu ? "Add Menu Item" : "Add Meal Plan"}
          </Button>
        </motion.div>
      </motion.div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-muted rounded-xl p-1 w-fit">
          {(["menu", "plan"] as MenuTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                activeTab === tab
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "menu" ? "Menu" : "Meal Plan"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${isMenu ? "menu..." : "plans..."}`}
              className="pl-9 rounded-full border-border bg-background text-sm"
            />
          </div>
          <button className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors">
            <Filter className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Sub-filter pills */}
      <AnimatePresence mode="wait">
        {isMenu ? (
          <motion.div
            key="menuF"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex gap-2 flex-wrap"
          >
            {(["All", "BREAKFAST", "LUNCH", "DINNER"] as MealFilter[]).map(
              (f) => (
                <button
                  key={f}
                  onClick={() => {
                    setMealFilter(f);
                    setPage(1);
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    mealFilter === f
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary bg-background"
                  }`}
                >
                  {f === "All" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ),
            )}
          </motion.div>
        ) : (
          <motion.div
            key="planF"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex gap-2 flex-wrap"
          >
            {(
              ["All", "Weekly", "Monthly", "Subscriptions"] as PlanFilter[]
            ).map((f) => (
              <button
                key={f}
                onClick={() => {
                  setPlanFilter(f);
                  setPage(1);
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 ${
                  planFilter === f
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary bg-background"
                }`}
              >
                {f === "Subscriptions" && <Users className="w-3 h-3" />}
                {f}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── loading skeleton ── */}
      {loading && <SkeletonLoader variant="row" count={PAGE_SIZE} />}

      {/* ── error state ── */}
      {!loading && error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-2xl px-5 py-6 text-center space-y-2">
          <p className="text-sm font-semibold text-destructive">{error}</p>
          <button
            onClick={() => (isMenu ? loadMenuItems() : loadMealPlans())}
            className="text-xs underline text-muted-foreground hover:text-foreground"
          >
            Try again
          </button>
        </div>
      )}

      {/* ── items list ── */}
      {!loading && !error && (
        <div className="bg-background rounded-2xl border border-border overflow-hidden shadow-sm">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {displayedItems.length > 0 ? (
                <div className="divide-y divide-border">
                  {displayedItems.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.04 }}
                      className="flex items-center gap-4 px-4 sm:px-5 py-4 hover:bg-muted/20 transition-colors"
                    >
                      {/* Thumbnail */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            {isMenu ? "🍽️" : "📋"}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {"description" in item
                            ? ((item as MenuItem).description ?? "")
                            : ""}
                        </p>
                        <div className="flex gap-1.5 mt-1.5 flex-wrap items-center">
                          {isMenu
                            ? (item as MenuItem).mealTimes.map((mt) => (
                                <span
                                  key={mt}
                                  className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium"
                                >
                                  {mt.charAt(0) + mt.slice(1).toLowerCase()}
                                </span>
                              ))
                            : (item as MealPlan).mealTypes.map((mt) => (
                                <span
                                  key={mt}
                                  className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium"
                                >
                                  {mt.charAt(0) + mt.slice(1).toLowerCase()}
                                </span>
                              ))}
                          {!isMenu && (
                            <>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                  (item as MealPlan).durationDays <= 7
                                    ? "bg-secondary/20 text-secondary-foreground"
                                    : "bg-primary/10 text-primary"
                                }`}
                              >
                                {(item as MealPlan).durationDays <= 7
                                  ? "Weekly"
                                  : "Monthly"}
                              </span>
                              <span className="text-[10px] flex items-center gap-0.5 text-muted-foreground">
                                <Users className="w-2.5 h-2.5" />
                                {(item as MealPlan).subscriberCount ?? 0} subs
                              </span>
                              <span className="text-[10px] flex items-center gap-0.5 text-muted-foreground">
                                🍽️ {((item as MealPlan).items ?? []).length}{" "}
                                items
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Price + status + actions */}
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className="text-sm font-black text-foreground">
                          Ksh {Number(item.price).toLocaleString()}
                        </span>
                        {isMenu && (
                          <span
                            className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                              (item as MenuItem).isAvailable
                                ? "bg-[#007606]/10 text-[#007606]"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {(item as MenuItem).isAvailable
                              ? "Available"
                              : "Unavailable"}
                          </span>
                        )}
                        <div className="flex items-center gap-1">
                          {!isMenu && (
                            <button
                              onClick={() =>
                                setViewingPlanItems(item as MealPlan)
                              }
                              title="View meal items"
                              className="text-muted-foreground hover:text-[#007606] transition-colors p-1"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          {!isMenu && (
                            <button
                              onClick={() =>
                                setAddingItemToPlan(item as MealPlan)
                              }
                              title="Add meal item to plan"
                              className="text-muted-foreground hover:text-primary transition-colors p-1"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() =>
                              isMenu
                                ? setEditingMenuItem(item as MenuItem)
                                : setEditingPlan(item as MealPlan)
                            }
                            className="text-muted-foreground hover:text-primary transition-colors p-1"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              isMenu
                                ? setDeletingMenuItem(item as MenuItem)
                                : setDeletingPlan(item as MealPlan)
                            }
                            className="text-muted-foreground hover:text-destructive transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <span className="text-4xl">{isMenu ? "🍽️" : "📋"}</span>
                  <p className="text-sm font-semibold text-foreground">
                    No {isMenu ? "menu items" : "meal plans"} yet
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Click &quot;{isMenu ? "Add Menu Item" : "Add Meal Plan"}
                    &quot; to get started
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* ── backend-driven pagination ── */}
          {activeMeta && activeMeta.totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-border">
              {/* left: count info */}
              <p className="text-xs text-muted-foreground">
                Showing{" "}
                <span className="font-semibold text-foreground">
                  {(activeMeta.page - 1) * activeMeta.limit + 1}–
                  {Math.min(
                    activeMeta.page * activeMeta.limit,
                    activeMeta.total,
                  )}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-foreground">
                  {activeMeta.total}
                </span>
              </p>

              {/* centre: prev / page indicator / next */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!activeMeta.hasPrevPage}
                  className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* page number pills */}
                <div className="flex items-center gap-1">
                  {Array.from(
                    { length: activeMeta.totalPages },
                    (_, i) => i + 1,
                  )
                    .filter(
                      (p) =>
                        p === 1 ||
                        p === activeMeta.totalPages ||
                        Math.abs(p - activeMeta.page) <= 1,
                    )
                    .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1)
                        acc.push("…");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, idx) =>
                      p === "…" ? (
                        <span
                          key={`ellipsis-${idx}`}
                          className="text-xs text-muted-foreground px-1"
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPage(p as number)}
                          className={`w-7 h-7 rounded-md text-xs font-bold transition-colors ${
                            activeMeta.page === p
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted text-muted-foreground"
                          }`}
                        >
                          {p}
                        </button>
                      ),
                    )}
                </div>

                <button
                  onClick={() =>
                    setPage((p) => Math.min(activeMeta.totalPages, p + 1))
                  }
                  disabled={!activeMeta.hasNextPage}
                  className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showAddMenu && (
          <AddMenuItemForm
            onClose={() => setShowAddMenu(false)}
            onSave={async (item) => {
              // POST handled inside AddMenuItemForm; just refresh the list
              setShowAddMenu(false);
              setPage(1);
              await loadMenuItems();
            }}
          />
        )}
        {editingMenuItem && (
          <UpdateMenuItemForm
            item={editingMenuItem}
            onClose={() => setEditingMenuItem(null)}
            onSave={(updated) => {
              // optimistic: swap the item in the list instantly
              setMenuItems((prev) =>
                prev.map((x) => (x.id === updated.id ? updated : x)),
              );
              setEditingMenuItem(null);
            }}
            onDelete={(id) => {
              // optimistic: remove from list instantly
              setMenuItems((prev) => prev.filter((x) => x.id !== id));
              setEditingMenuItem(null);
            }}
          />
        )}
        {showAddPlan && (
          <AddMealPlanForm
            onClose={() => setShowAddPlan(false)}
            onSave={async () => {
              setShowAddPlan(false);
              setPage(1);
              await loadMealPlans();
            }}
          />
        )}
        {editingPlan && (
          <UpdateMealPlanForm
            plan={editingPlan}
            onClose={() => setEditingPlan(null)}
            onSave={(patch) => {
              setMealPlans((prev) =>
                prev.map((x) =>
                  x.id === editingPlan.id ? { ...x, ...patch } : x,
                ),
              );
              setEditingPlan(null);
            }}
            onDelete={(id) => {
              setMealPlans((prev) => prev.filter((x) => x.id !== id));
              setEditingPlan(null);
            }}
          />
        )}
        {viewingPlanItems && (
          <MealPlanItemsViewer
            plan={viewingPlanItems}
            onClose={() => setViewingPlanItems(null)}
            onAddItem={() => {
              setAddingItemToPlan(viewingPlanItems);
              setViewingPlanItems(null);
            }}
            onRemoveItem={(itemId) =>
              handleRemovePlanItem(viewingPlanItems.id, itemId)
            }
          />
        )}
        {addingItemToPlan && (
          <AddMealPlanItemForm
            plan={addingItemToPlan}
            onClose={() => setAddingItemToPlan(null)}
            onSave={(newItem) => {
              // newItem already has the real DB id — don't generate a fake one
              setMealPlans((p) =>
                p.map((x) =>
                  x.id === addingItemToPlan.id
                    ? { ...x, items: [...(x.items ?? []), newItem] }
                    : x,
                ),
              );
              // also sync viewingPlanItems so the viewer reflects the new item immediately
              setViewingPlanItems((prev) =>
                prev && prev.id === addingItemToPlan.id
                  ? { ...prev, items: [...(prev.items ?? []), newItem] }
                  : prev,
              );
              setAddingItemToPlan(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── delete confirmation dialogs ── */}
      <ConfirmDeleteDialog
        open={!!deletingMenuItem}
        title="Delete Menu Item"
        description="This will permanently remove this item and cannot be undone."
        itemName={deletingMenuItem?.name}
        loading={isDeleting}
        onCancel={() => setDeletingMenuItem(null)}
        onConfirm={async () => {
          if (!deletingMenuItem) return;
          setIsDeleting(true);
          try {
            await deleteMenuItem(deletingMenuItem.id);
            setMenuItems((prev) =>
              prev.filter((x) => x.id !== deletingMenuItem.id),
            );
            toast.success("Menu item deleted.");
            setDeletingMenuItem(null);
          } catch {
            toast.error("Failed to delete. Please try again.");
          } finally {
            setIsDeleting(false);
          }
        }}
      />

      <ConfirmDeleteDialog
        open={!!deletingPlan}
        title="Delete Meal Plan"
        description="This will permanently remove this meal plan and cannot be undone."
        itemName={deletingPlan?.name}
        loading={isDeleting}
        onCancel={() => setDeletingPlan(null)}
        onConfirm={async () => {
          if (!deletingPlan) return;
          setIsDeleting(true);
          try {
            await deleteMealPlan(deletingPlan.id);
            setMealPlans((prev) =>
              prev.filter((x) => x.id !== deletingPlan.id),
            );
            toast.success("Meal plan deleted.");
            setDeletingPlan(null);
          } catch {
            toast.error("Failed to delete. Please try again.");
          } finally {
            setIsDeleting(false);
          }
        }}
      />
    </div>
  );
}
