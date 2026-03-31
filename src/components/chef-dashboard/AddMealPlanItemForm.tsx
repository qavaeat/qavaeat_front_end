
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Plus, Minus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { MealTime, MealPlan, MealPlanItem } from "./types";

const MEAL_TIMES: MealTime[] = ["BREAKFAST", "LUNCH", "DINNER"];

// Dummy available menu items — replace with real fetch from  backend
const AVAILABLE_ITEMS = [
  { id: "MI-1", name: "Grilled Chicken Nuggets" },
  { id: "MI-2", name: "Herb Roasted Salmon" },
  { id: "MI-3", name: "Spaghetti Carbonara" },
  { id: "MI-4", name: "Vitality Veggie Bowl" },
  { id: "MI-5", name: "Grilled Mutton" },
];

interface Props {
  plan: MealPlan;
  onClose: () => void;
  onSave: (item: Omit<MealPlanItem, "id">) => void;
}

interface FormState {
  menuItemId: string;
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
    e.dayNumber = `Day number cannot exceed plan duration (${maxDay} days).`;
  return e;
}

export function AddMealPlanItemForm({ plan, onClose, onSave }: Props) {
  const [form, setForm] = useState<FormState>({
    menuItemId: "",
    mealTime: "",
    dayNumber: "1",
    notes: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  const set = (key: keyof FormState, value: string) => {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const handleSave = async () => {
    const errs = validate(form, plan.durationDays);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    try {
      const selectedItem = AVAILABLE_ITEMS.find((i) => i.id === form.menuItemId);
      const item: Omit<MealPlanItem, "id"> = {
        menuItemId: form.menuItemId,
        menuItemName: selectedItem?.name ?? "",
        mealTime: form.mealTime as MealTime,
        dayNumber: Number(form.dayNumber),
        notes: form.notes.trim() || null,
      };

      // Simulate API call to your backend
      // POST /meal-plans/:planId/items  { mealTime, dayNumber, notes, menuItemId }
      await new Promise((r) => setTimeout(r, 600));

      onSave(item);
      toast.success("Meal item added to plan!");
      onClose();
    } catch {
      toast.error("Failed to add item. Please try again.");
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
            <p className="text-xs text-muted-foreground">Adding to: <span className="font-semibold text-primary">{plan.name}</span></p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Menu Item selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Menu Item *</label>
            <select
              value={form.menuItemId}
              onChange={(e) => set("menuItemId", e.target.value)}
              className={`w-full h-10 px-3 rounded-xl border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors ${
                errors.menuItemId ? "border-destructive" : "border-border"
              }`}
            >
              <option value="" disabled>Select a menu item...</option>
              {AVAILABLE_ITEMS.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            {errors.menuItemId && <p className="text-[10px] text-destructive">{errors.menuItemId}</p>}
          </div>

          {/* Meal Time */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Meal Time *</label>
            <div className="flex gap-2">
              {MEAL_TIMES.map((mt) => (
                <button
                  key={mt}
                  type="button"
                  onClick={() => set("mealTime", mt)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                    form.mealTime === mt
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/40 bg-background"
                  }`}
                >
                  {mt}
                </button>
              ))}
            </div>
            {errors.mealTime && <p className="text-[10px] text-destructive">{errors.mealTime}</p>}
          </div>

          {/* Day Number */}
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
                onClick={() => set("dayNumber", String(Math.max(1, Number(form.dayNumber) - 1)))}
                className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <Input
                type="number"
                value={form.dayNumber}
                onChange={(e) => set("dayNumber", e.target.value)}
                min={1}
                max={plan.durationDays}
                className={`rounded-xl text-center font-bold flex-1 ${
                  errors.dayNumber ? "border-destructive" : "border-border"
                }`}
              />
              <button
                type="button"
                onClick={() => set("dayNumber", String(Math.min(plan.durationDays, Number(form.dayNumber) + 1)))}
                className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {errors.dayNumber && <p className="text-[10px] text-destructive">{errors.dayNumber}</p>}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Notes <span className="text-muted-foreground font-normal">(optional)</span></label>
            <Input
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="e.g. Extra spicy, no onions..."
              className="rounded-xl border-border"
            />
          </div>

          {/* Existing items preview */}
          {plan.items && plan.items.length > 0 && (
            <div className="rounded-xl bg-muted/40 border border-border p-3">
              <p className="text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-wide">
                Items already in this plan ({plan.items.length})
              </p>
              <div className="space-y-1 max-h-28 overflow-y-auto">
                {plan.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-[10px]">
                    <span className="text-foreground font-medium truncate flex-1">{item.menuItemName}</span>
                    <span className="text-muted-foreground ml-2 flex-shrink-0">Day {item.dayNumber} · {item.mealTime}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={onClose} className="rounded-full border-border px-6">Cancel</Button>
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