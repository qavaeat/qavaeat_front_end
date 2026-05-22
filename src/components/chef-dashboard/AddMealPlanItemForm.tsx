"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { X, Plus, Minus, Search, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { MealTime, MealPlan, MealPlanItem } from "./types";

const MEAL_TIMES: MealTime[] = ["BREAKFAST", "LUNCH", "DINNER"];

interface MenuItem { id: string; name: string; price: number | string; }

interface Props {
  plan: MealPlan;
  onClose: () => void;
  onSave: (item: Omit<MealPlanItem, "id"> & { id: string }) => void;
}

interface FormState {
  menuItemId: string;
  menuItemName: string;
  mealTime: MealTime | "";
  dayNumber: string;
  notes: string;
}

interface FieldErrors {
  menuItemId?: string;
  mealTime?: string;
  dayNumber?: string;
}

function validate(form: FormState, maxDay: number): FieldErrors {
  const e: FieldErrors = {};
  if (!form.menuItemId) e.menuItemId = "Select a menu item.";
  if (!form.mealTime) e.mealTime = "Select a meal time.";
  if (!form.dayNumber || isNaN(Number(form.dayNumber)) || Number(form.dayNumber) < 1)
    e.dayNumber = "Day number must be at least 1.";
  else if (Number(form.dayNumber) > maxDay)
    e.dayNumber = `Cannot exceed plan duration (${maxDay} days).`;
  return e;
}

export function AddMealPlanItemForm({ plan, onClose, onSave }: Props) {
  const [form, setForm] = useState<FormState>({
    menuItemId: "", menuItemName: "", mealTime: "", dayNumber: "1", notes: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  // ── menu item search dropdown ──
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemPage, setItemPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── derived meal time state ──
  const selectedDay = Number(form.dayNumber);
  const allowedMealTimes = MEAL_TIMES.filter((mt) => plan.mealTypes.includes(mt));
  const takenMealTimes = new Set(
    (plan.items ?? [])
      .filter((i) => i.dayNumber === selectedDay)
      .map((i) => i.mealTime),
  );

  const fetchItems = useCallback(async (query: string, page: number, reset = false) => {
    setLoadingItems(true);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: "20",
        ...(query ? { search: query } : {}),
      }).toString();
      const res = await fetch(`/api/chefs/menu?${qs}`);
      const json = await res.json();
      const items: MenuItem[] = json?.items ?? [];
      setMenuItems((prev) => reset ? items : [...prev, ...items]);
      setHasMore(json?.meta?.hasNextPage ?? false);
    } catch {
      // silent — dropdown just won't populate
    } finally {
      setLoadingItems(false);
    }
  }, []);

  // Initial load when dropdown opens
  useEffect(() => {
    if (dropdownOpen && menuItems.length === 0) {
      fetchItems("", 1, true);
    }
  }, [dropdownOpen, fetchItems, menuItems.length]);

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setItemPage(1);
      fetchItems(search, 1, true);
    }, 300);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [search, fetchItems]);

  // Infinite scroll in dropdown
  const handleDropdownScroll = () => {
    const el = listRef.current;
    if (!el || loadingItems || !hasMore) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
      const next = itemPage + 1;
      setItemPage(next);
      fetchItems(search, next);
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const set = (key: keyof FormState, value: string) => {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  // Changing day resets meal time so stale taken slots don't carry over
  const setDay = (val: string) => {
    setForm((p) => ({ ...p, dayNumber: val, mealTime: "" }));
    setErrors((p) => ({ ...p, dayNumber: undefined, mealTime: undefined }));
  };

  const selectItem = (item: MenuItem) => {
    setForm((p) => ({ ...p, menuItemId: item.id, menuItemName: item.name }));
    setErrors((p) => ({ ...p, menuItemId: undefined }));
    setDropdownOpen(false);
    setSearch("");
  };

  const handleSave = async () => {
    const errs = validate(form, plan.durationDays);

    // Enforce mealsPerDay cap
    if (!errs.dayNumber && form.dayNumber) {
      const dayNum = Number(form.dayNumber);
      const existingForDay = (plan.items ?? []).filter((i) => i.dayNumber === dayNum);
      if (existingForDay.length >= plan.mealsPerDay) {
        errs.dayNumber = `Day ${dayNum} already has ${plan.mealsPerDay} meal${plan.mealsPerDay !== 1 ? "s" : ""} (the plan limit). Choose a different day.`;
      }
    }

    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);

    try {
      const res = await fetch(`/api/chefs/meal-plans/${plan.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menuItemId: form.menuItemId,
          mealTime: form.mealTime,
          dayNumber: Number(form.dayNumber),
          notes: form.notes.trim() || null,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json?.message ?? json?.error ?? "Failed to add item.");
      }

      const json = await res.json();
      const saved = json.data; // { id, mealPlanId, menuItemId, mealTime, dayNumber, notes }

      if (!saved?.id) {
        console.error("Backend did not return an id:", json);
        toast.error("Item saved but could not get its ID — refresh the page.");
        onClose();
        return;
      }

      onSave({
        id: saved.id,
        menuItemId: form.menuItemId,
        menuItemName: form.menuItemName,
        mealTime: form.mealTime as MealTime,
        dayNumber: Number(form.dayNumber),
        notes: form.notes.trim() || null,
      });

      toast.success("Meal item added to plan!");
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add item.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.3 }}
        className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-black text-foreground">Add Meal Item</h2>
            <p className="text-xs text-muted-foreground">
              Adding to: <span className="font-semibold text-primary">{plan.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* ── Searchable menu item dropdown ── */}
          <div className="space-y-1.5" ref={dropdownRef}>
            <label className="text-xs font-bold text-foreground">Menu Item *</label>
            <button
              type="button"
              onClick={() => setDropdownOpen((v) => !v)}
              className={`w-full h-10 px-3 rounded-xl border bg-background text-sm flex items-center justify-between transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                errors.menuItemId ? "border-destructive" : "border-border"
              }`}
            >
              <span className={form.menuItemId ? "text-foreground font-medium" : "text-muted-foreground"}>
                {form.menuItemName || "Select a menu item..."}
              </span>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute z-50 mt-1 w-full max-w-[calc(28rem-3rem)] bg-background border border-border rounded-xl shadow-xl overflow-hidden"
              >
                <div className="p-2 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      autoFocus
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search menu items..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-muted border-0 focus:outline-none focus:ring-1 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                <div
                  ref={listRef}
                  onScroll={handleDropdownScroll}
                  className="max-h-52 overflow-y-auto overscroll-contain"
                >
                  {menuItems.length === 0 && !loadingItems ? (
                    <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                      {search ? `No items matching "${search}"` : "No menu items found"}
                    </div>
                  ) : (
                    menuItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => selectItem(item)}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-xs hover:bg-muted/60 transition-colors text-left ${
                          form.menuItemId === item.id ? "bg-primary/5 text-primary font-bold" : "text-foreground"
                        }`}
                      >
                        <span className="truncate">{item.name}</span>
                        <span className="text-muted-foreground ml-3 flex-shrink-0 font-medium">
                          Ksh {Number(item.price).toLocaleString()}
                        </span>
                      </button>
                    ))
                  )}
                  {loadingItems && (
                    <div className="flex items-center justify-center py-3">
                      <span className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                    </div>
                  )}
                  {!hasMore && menuItems.length > 0 && (
                    <p className="text-center text-[10px] text-muted-foreground py-2">All items loaded</p>
                  )}
                </div>
              </motion.div>
            )}
            {errors.menuItemId && (
              <p className="text-[10px] text-destructive">{errors.menuItemId}</p>
            )}
          </div>

          {/* ── Meal Time — only allowed types, taken slots disabled ── */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Meal Time *</label>
            <div className="flex gap-2">
              {allowedMealTimes.map((mt) => {
                const isTaken = takenMealTimes.has(mt);
                const isSelected = form.mealTime === mt;
                return (
                  <button
                    key={mt}
                    type="button"
                    disabled={isTaken}
                    onClick={() => !isTaken && set("mealTime", mt)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all relative
                      ${isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : isTaken
                          ? "border-border text-muted-foreground/40 bg-muted/40 cursor-not-allowed line-through"
                          : "border-border text-muted-foreground hover:border-primary/40 bg-background"
                      }`}
                  >
                    {mt.charAt(0) + mt.slice(1).toLowerCase()}
                    {isTaken && (
                      <span className="absolute -top-1.5 -right-1.5 text-[8px] bg-muted text-muted-foreground px-1 rounded-full">
                        taken
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {errors.mealTime && (
              <p className="text-[10px] text-destructive">{errors.mealTime}</p>
            )}
          </div>

          {/* ── Day Number ── */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Day Number *
              <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
                (1 – {plan.durationDays})
              </span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDay(String(Math.max(1, Number(form.dayNumber) - 1)))}
                className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <Input
                type="number"
                value={form.dayNumber}
                onChange={(e) => setDay(e.target.value)}
                min={1}
                max={plan.durationDays}
                className={`rounded-xl text-center font-bold flex-1 ${errors.dayNumber ? "border-destructive" : "border-border"}`}
              />
              <button
                type="button"
                onClick={() => setDay(String(Math.min(plan.durationDays, Number(form.dayNumber) + 1)))}
                className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {errors.dayNumber && (
              <p className="text-[10px] text-destructive">{errors.dayNumber}</p>
            )}
          </div>

          {/* ── Notes ── */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Notes <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Input
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="e.g. Extra spicy, no onions..."
              className="rounded-xl border-border"
            />
          </div>

          {/* ── Existing items preview ── */}
          {plan.items && plan.items.length > 0 && (
            <div className="rounded-xl bg-muted/40 border border-border p-3">
              <p className="text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-wide">
                Already in this plan ({plan.items.length})
              </p>
              <div className="space-y-1 max-h-28 overflow-y-auto">
                {plan.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-[10px]">
                    <span className="text-foreground font-medium truncate flex-1">{item.menuItemName}</span>
                    <span className="text-muted-foreground ml-2 flex-shrink-0">
                      Day {item.dayNumber} · {item.mealTime}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={onClose} className="rounded-full border-border px-6">
            Cancel
          </Button>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#007606] hover:bg-[#007606]/90 text-white rounded-full px-8 font-bold"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Adding...
                </span>
              ) : "Add to Plan"}
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}