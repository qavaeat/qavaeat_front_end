
"use client";

import { useState } from "react";
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
import { AddMenuItemForm } from "./AddMenuItemForm";
import { UpdateMenuItemForm } from "./UpdateMenuItemForm";
import { AddMealPlanForm } from "./AddMealPlanForm";
import { UpdateMealPlanForm } from "./UpdateMealPlanForm";
import { AddMealPlanItemForm } from "./AddMealPlanItemForm";
import { MealPlanItemsViewer } from "./MealPlanItemsViewer";
import type { MenuItem, MealPlan, MealTime, MealPlanItem } from "./types";

type MenuTab = "menu" | "plan";
type MealFilter = "All" | MealTime;
type PlanFilter = "All" | "Weekly" | "Monthly" | "Subscriptions";

const PAGE_SIZE = 7;

const SEED_ITEMS: MenuItem[] = Array.from({ length: 14 }, (_, i) => ({
  id: `MI-${i + 1}`,
  name: [
    "Grilled Chicken Nuggets",
    "Herb Roasted Salmon",
    "Spaghetti Carbonara",
    "Vitality Veggie Bowl",
    "Grilled Mutton",
  ][i % 5],
  description:
    "Deep fried chicken nuggets with season flavour from natural spices",
  price: [645, 890, 750, 520, 1100][i % 5],
  quantity: 10,
  imageUrl: null,
  isAvailable: i % 4 !== 3,
  calories: null,
  prepTimeMin: 20,
  tags: [],
  mealTimes: ["LUNCH", "DINNER"] as MealTime[],
}));

const SEED_PLANS: MealPlan[] = Array.from({ length: 9 }, (_, i) => ({
  id: `MP-${i + 1}`,
  name: ["Performance Fuel", "Vitality Veggie", "Low Carb Focus"][i % 3],
  description: "A curated plan for healthy eating",
  imageUrl: null,
  cuisineType: ["Kenyan"],
  mealTypes: ["LUNCH", "DINNER"] as MealTime[],
  price: [2700, 1600, 2200][i % 3],
  currency: "KES",
  durationDays: i % 3 === 2 ? 30 : 7,
  mealsPerDay: [10, 5, 7][i % 3],
  maxSubscribers: i % 2 === 0 ? 20 : null,
  isDeliveryAvailable: true,
  isPickupAvailable: false,
  availableDays: ["MONDAY", "WEDNESDAY", "FRIDAY"] as const,
  tags: [],
  durationType: i % 3 === 2 ? "monthly" : "weekly",
  subscriberCount: [12, 8, 5, 3, 15, 7, 2, 9, 4][i],
  items:
    i === 0
      ? [
          {
            id: "MPI-1",
            menuItemId: "MI-1",
            menuItemName: "Grilled Chicken Nuggets",
            mealTime: "LUNCH",
            dayNumber: 1,
            notes: null,
          },
          {
            id: "MPI-2",
            menuItemId: "MI-2",
            menuItemName: "Herb Roasted Salmon",
            mealTime: "DINNER",
            dayNumber: 1,
            notes: "Extra sauce",
          },
          {
            id: "MPI-3",
            menuItemId: "MI-3",
            menuItemName: "Spaghetti Carbonara",
            mealTime: "BREAKFAST",
            dayNumber: 2,
            notes: null,
          },
        ]
      : [],
}));

export function TabMenus() {
  const [activeTab, setActiveTab] = useState<MenuTab>("menu");
  const [menuItems, setMenuItems] = useState<MenuItem[]>(SEED_ITEMS);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>(SEED_PLANS);
  const [search, setSearch] = useState("");
  const [mealFilter, setMealFilter] = useState<MealFilter>("All");
  const [planFilter, setPlanFilter] = useState<PlanFilter>("All");
  const [page, setPage] = useState(1);

  // Modal state
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

  const filteredItems = menuItems.filter((item) => {
    const matchSearch =
      search === "" || item.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      mealFilter === "All" || item.mealTimes.includes(mealFilter as MealTime);
    return matchSearch && matchFilter;
  });

  const filteredPlans = mealPlans.filter((plan) => {
    const matchSearch =
      search === "" || plan.name.toLowerCase().includes(search.toLowerCase());
    const matchPlanFilter =
      planFilter === "All" ||
      (planFilter === "Weekly" && plan.durationDays <= 7) ||
      (planFilter === "Monthly" && plan.durationDays > 7) ||
      (planFilter === "Subscriptions" && (plan.subscriberCount ?? 0) > 0);
    return matchSearch && matchPlanFilter;
  });

  const isMenu = activeTab === "menu";
  const items = isMenu ? filteredItems : filteredPlans;
  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const paginated = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleTabChange = (tab: MenuTab) => {
    setActiveTab(tab);
    setPage(1);
    setSearch("");
    setMealFilter("All");
    setPlanFilter("All");
  };

  // Remove meal plan item
  const handleRemovePlanItem = (planId: string, itemId: string) => {
    setMealPlans((prev) =>
      prev.map((p) =>
        p.id === planId
          ? { ...p, items: (p.items ?? []).filter((i) => i.id !== itemId) }
          : p,
      ),
    );
    // Keep viewer in sync
    setViewingPlanItems((prev) =>
      prev && prev.id === planId
        ? { ...prev, items: (prev.items ?? []).filter((i) => i.id !== itemId) }
        : prev,
    );
  };

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
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
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

      {/* Items list */}
      <div className="bg-background rounded-2xl border border-border overflow-hidden shadow-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {paginated.length > 0 ? (
              <div className="divide-y divide-border">
                {paginated.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.04 }}
                    className="flex items-center gap-4 px-4 sm:px-5 py-4 hover:bg-muted/20 transition-colors"
                  >
                    {/* Image */}
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
                              🍽️ {((item as MealPlan).items ?? []).length} items
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Price + status + actions */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className="text-sm font-black text-foreground">
                        Ksh {item.price.toLocaleString()}
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
                        {/* View items button for plans */}
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
                        {/* Add item to plan */}
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
                        {/* Edit */}
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
                        {/* Delete */}
                        <button
                          onClick={() => {
                            if (isMenu)
                              setMenuItems((p) =>
                                p.filter((x) => x.id !== item.id),
                              );
                            else
                              setMealPlans((p) =>
                                p.filter((x) => x.id !== item.id),
                              );
                          }}
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
                  Click &quot;{isMenu ? "Add Menu Item" : "Add Meal Plan"}&quot;
                  to get started
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Pagination */}
        {items.length > PAGE_SIZE && (
          <div className="flex items-center justify-center gap-3 px-4 py-4 border-t border-border">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-muted-foreground font-medium">
              {page} out of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAddMenu && (
          <AddMenuItemForm
            onClose={() => setShowAddMenu(false)}
            onSave={(item) => {
              setMenuItems((p) => [{ ...item, id: `MI-${Date.now()}` }, ...p]);
              setPage(1);
            }}
          />
        )}
        {editingMenuItem && (
          <UpdateMenuItemForm
            item={editingMenuItem}
            onClose={() => setEditingMenuItem(null)}
            onSave={(updated) => {
              setMenuItems((p) =>
                p.map((x) => (x.id === updated.id ? updated : x)),
              );
              setEditingMenuItem(null);
            }}
          />
        )}
        {showAddPlan && (
          <AddMealPlanForm
            onClose={() => setShowAddPlan(false)}
            onSave={(plan) => {
              setMealPlans((p) => [
                {
                  ...plan,
                  id: `MP-${Date.now()}`,
                  subscriberCount: 0,
                  items: [],
                },
                ...p,
              ]);
              setPage(1);
            }}
          />
        )}
        {editingPlan && (
          <UpdateMealPlanForm
            plan={editingPlan}
            onClose={() => setEditingPlan(null)}
            onSave={(patch) => {
              setMealPlans((p) =>
                p.map((x) =>
                  x.id === editingPlan.id ? { ...x, ...patch } : x,
                ),
              );
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
            onSave={(newItem: Omit<MealPlanItem, "id">) => {
              const withId = { ...newItem, id: `MPI-${Date.now()}` };
              setMealPlans((p) =>
                p.map((x) =>
                  x.id === addingItemToPlan.id
                    ? { ...x, items: [...(x.items ?? []), withId] }
                    : x,
                ),
              );
              setAddingItemToPlan(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
