
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Plus, Minus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileUploadZone } from "@/components/chef-onboarding/FileUploadZone";
import { uploadFile } from "@/lib/supabase-upload";
import { toast } from "sonner";
import type { MealTime, MenuItem } from "./types";

const MEAL_TIMES: MealTime[] = ["BREAKFAST", "LUNCH", "DINNER"];

interface Props {
  item: MenuItem;
  onClose: () => void;
  onSave: (updated: MenuItem) => void;
}

interface FieldErrors {
  name?: string;
  price?: string;
  mealTimes?: string;
  prepTimeMin?: string;
}

function validate(form: MenuItem): FieldErrors {
  const e: FieldErrors = {};
  if (form.name.trim().length < 2) e.name = "Name must be at least 2 characters.";
  if (!form.price || form.price <= 0) e.price = "Price must be a positive number.";
  if (form.mealTimes.length === 0) e.mealTimes = "Select at least one meal time.";
  if (form.prepTimeMin !== null && form.prepTimeMin < 1)
    e.prepTimeMin = "Prep time must be at least 1 minute.";
  return e;
}

export function UpdateMenuItemForm({ item, onClose, onSave }: Props) {
  const [form, setForm] = useState<MenuItem>({ ...item });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof MenuItem>(key: K, value: MenuItem[K]) => {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const toggleMealTime = (mt: MealTime) =>
    set("mealTimes", form.mealTimes.includes(mt)
      ? form.mealTimes.filter((m) => m !== mt)
      : [...form.mealTimes, mt]);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) set("tags", [...form.tags, t]);
    setTagInput("");
  };

  const handleSave = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    try {
      let imageUrl = form.imageUrl;
      if (imageFile) {
        imageUrl = await uploadFile("chef-menus", imageFile, "menu-items/");
      }
      onSave({ ...form, imageUrl });
      toast.success("Menu item updated!");
      onClose();
    } catch {
      toast.error("Failed to update. Please try again.");
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
        className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-background z-10">
          <h2 className="text-base font-black text-foreground">Edit Menu Item</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <FileUploadZone
            label="Menu Item Photo"
            hint="Drag photo here or browse"
            accept="image/*"
            type="image"
            value={form.imageUrl}
            onChange={(url, file) => { set("imageUrl", url); setImageFile(file); }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Name *</label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)}
                className={`rounded-xl ${errors.name ? "border-destructive" : "border-border"}`} />
              {errors.name && <p className="text-[10px] text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Price (KES) *</label>
              <Input type="number" value={form.price}
                onChange={(e) => set("price", Number(e.target.value))}
                className={`rounded-xl ${errors.price ? "border-destructive" : "border-border"}`} />
              {errors.price && <p className="text-[10px] text-destructive">{errors.price}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Description</label>
            <Textarea value={form.description ?? ""} onChange={(e) => set("description", e.target.value || null)}
              rows={3} className="rounded-xl border-border resize-none text-sm" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Quantity</label>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => set("quantity", Math.max(0, form.quantity - 1))}
                  className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted">
                  <Minus className="w-3 h-3" />
                </button>
                <Input type="number" value={form.quantity}
                  onChange={(e) => set("quantity", Number(e.target.value))}
                  className="rounded-xl border-border text-center text-sm flex-1" />
                <button type="button" onClick={() => set("quantity", form.quantity + 1)}
                  className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Calories</label>
              <Input type="number" value={form.calories ?? ""}
                onChange={(e) => set("calories", e.target.value ? Number(e.target.value) : null)}
                placeholder="kcal" className="rounded-xl border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Prep Time (min)</label>
              <Input type="number" value={form.prepTimeMin ?? ""}
                onChange={(e) => set("prepTimeMin", e.target.value ? Number(e.target.value) : null)}
                placeholder="mins"
                className={`rounded-xl ${errors.prepTimeMin ? "border-destructive" : "border-border"}`} />
              {errors.prepTimeMin && <p className="text-[10px] text-destructive">{errors.prepTimeMin}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Meal Times *</label>
            <div className="flex gap-2">
              {MEAL_TIMES.map((mt) => (
                <button key={mt} type="button" onClick={() => toggleMealTime(mt)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                    form.mealTimes.includes(mt)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}>
                  {mt}
                </button>
              ))}
            </div>
            {errors.mealTimes && <p className="text-[10px] text-destructive">{errors.mealTimes}</p>}
          </div>

          <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-muted/40 border border-border">
            <div>
              <p className="text-xs font-bold text-foreground">Available</p>
              <p className="text-[10px] text-muted-foreground">Show this item to customers</p>
            </div>
            <button type="button" onClick={() => set("isAvailable", !form.isAvailable)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${form.isAvailable ? "bg-[#007606]" : "bg-muted-foreground/30"}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${form.isAvailable ? "left-5" : "left-0.5"}`} />
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Tags</label>
            <div className="flex gap-2">
              <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="Add tag and press Enter"
                className="rounded-xl border-border flex-1 text-sm" />
              <Button type="button" onClick={addTag} variant="outline" className="rounded-xl px-3">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.tags.map((t) => (
                  <span key={t} className="flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-full">
                    {t}
                    <button onClick={() => set("tags", form.tags.filter((x) => x !== t))}>
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border sticky bottom-0 bg-background">
          <Button variant="outline" onClick={onClose} className="rounded-full px-6">Cancel</Button>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={handleSave} disabled={saving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 font-bold">
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : "Save Changes"}
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}