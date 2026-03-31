
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, ChevronDown, ChevronUp, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MealPlan, MealPlanItem, MealTime } from "./types";

const MEAL_TIME_COLOR: Record<MealTime, { bg: string; text: string }> = {
  BREAKFAST: { bg: "bg-secondary/20", text: "text-secondary-foreground" },
  LUNCH: { bg: "bg-primary/10", text: "text-primary" },
  DINNER: { bg: "bg-[#007606]/10", text: "text-[#007606]" },
};

interface Props {
  plan: MealPlan;
  onClose: () => void;
  onAddItem: () => void;
  onRemoveItem: (itemId: string) => void;
}

export function MealPlanItemsViewer({ plan, onClose, onAddItem, onRemoveItem }: Props) {
  const items = plan.items ?? [];

  // Group items by day number
  const byDay = items.reduce<Record<number, MealPlanItem[]>>((acc, item) => {
    if (!acc[item.dayNumber]) acc[item.dayNumber] = [];
    acc[item.dayNumber].push(item);
    return acc;
  }, {});

  const days = Object.keys(byDay).map(Number).sort((a, b) => a - b);

  // Track which days are expanded
  const [expanded, setExpanded] = useState<Set<number>>(new Set(days.slice(0, 3)));

  const toggleDay = (day: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(day) ? next.delete(day) : next.add(day);
      return next;
    });
  };

  const mealOrder: MealTime[] = ["BREAKFAST", "LUNCH", "DINNER"];

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
        className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-xl max-h-[88vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-base font-black text-foreground">{plan.name}</h2>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-[10px] text-muted-foreground">
                {plan.durationDays} days · {plan.mealsPerDay} meals/day
              </span>
              <span className="text-[10px] font-bold text-primary">
                Ksh {plan.price.toLocaleString()}
              </span>
              <span className="text-[10px] bg-[#007606]/10 text-[#007606] font-bold px-2 py-0.5 rounded-full">
                {items.length} items added
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                onClick={onAddItem}
                className="bg-[#007606] hover:bg-[#007606]/90 text-white text-xs font-bold rounded-xl px-4 h-8 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </Button>
            </motion.div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 gap-3"
            >
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                <UtensilsCrossed className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground">No meal items yet</p>
              <p className="text-xs text-muted-foreground text-center max-w-xs">
                Click &quot;Add Item&quot; to start building this meal plan day by day
              </p>
              <Button onClick={onAddItem}
                className="bg-[#007606] hover:bg-[#007606]/90 text-white rounded-xl px-6 text-sm font-bold mt-2">
                Add First Item
              </Button>
            </motion.div>
          ) : (
            <>
              {/* Days without items — show empty slots */}
              {Array.from({ length: plan.durationDays }, (_, i) => i + 1).map((day) => {
                const dayItems = byDay[day] ?? [];
                const isExpanded = expanded.has(day);
                const sortedItems = [...dayItems].sort(
                  (a, b) => mealOrder.indexOf(a.mealTime) - mealOrder.indexOf(b.mealTime)
                );

                return (
                  <div key={day} className="rounded-xl border border-border overflow-hidden">
                    {/* Day header */}
                    <button
                      onClick={() => toggleDay(day)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-[11px] font-black text-primary-foreground flex-shrink-0">
                          {day}
                        </span>
                        <span className="text-sm font-bold text-foreground">Day {day}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {dayItems.length} item{dayItems.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {isExpanded
                        ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </button>

                    {/* Day items */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          {sortedItems.length > 0 ? (
                            <div className="divide-y divide-border/50">
                              {sortedItems.map((item, idx) => {
                                const mtStyle = MEAL_TIME_COLOR[item.mealTime];
                                return (
                                  <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/10 transition-colors group"
                                  >
                                    {/* Meal time badge */}
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0 ${mtStyle.bg} ${mtStyle.text}`}>
                                      {item.mealTime.charAt(0) + item.mealTime.slice(1).toLowerCase()}
                                    </span>

                                    {/* Food icon placeholder */}
                                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm flex-shrink-0">
                                      🍽️
                                    </div>

                                    {/* Item info */}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-semibold text-foreground truncate">
                                        {item.menuItemName}
                                      </p>
                                      {item.notes && (
                                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate italic">
                                          {item.notes}
                                        </p>
                                      )}
                                    </div>

                                    {/* Remove */}
                                    <button
                                      onClick={() => onRemoveItem(item.id)}
                                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1 flex-shrink-0"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </motion.div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="px-4 py-4 flex items-center gap-2">
                              <div className="flex-1 h-px bg-border/50 border-dashed" />
                              <p className="text-[10px] text-muted-foreground whitespace-nowrap">No items for Day {day}</p>
                              <div className="flex-1 h-px bg-border/50" />
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer summary */}
        {items.length > 0 && (
          <div className="px-6 py-4 border-t border-border bg-muted/20 flex-shrink-0">
            <div className="flex items-center justify-between text-xs">
              <div className="flex gap-4">
                {(["BREAKFAST", "LUNCH", "DINNER"] as MealTime[]).map((mt) => {
                  const count = items.filter((i) => i.mealTime === mt).length;
                  const style = MEAL_TIME_COLOR[mt];
                  return (
                    <span key={mt} className={`flex items-center gap-1.5 font-medium ${style.text}`}>
                      <span className={`w-2 h-2 rounded-full ${style.bg.replace("/10", "").replace("/20", "")}`}
                        style={{ background: mt === "BREAKFAST" ? "#8E771B" : mt === "LUNCH" ? "#DD3131" : "#007606" }} />
                      {count} {mt.charAt(0) + mt.slice(1).toLowerCase()}
                    </span>
                  );
                })}
              </div>
              <span className="text-muted-foreground">{items.length} total items</span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}