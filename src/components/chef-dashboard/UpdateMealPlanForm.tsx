"use client";

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, ChevronDown, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileUploadZone } from "@/components/chef-onboarding/FileUploadZone";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";
import { uploadFile } from "@/lib/supabase-upload";
import { toast } from "sonner";
import type { MealTime, DayOfWeek, MealPlan } from "./types";

const MEAL_TIMES: MealTime[] = ["BREAKFAST", "LUNCH", "DINNER"];
const DAYS: DayOfWeek[] = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"];
const DAY_SHORT: Record<DayOfWeek, string> = {
  MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed", THURSDAY: "Thu",
  FRIDAY: "Fri", SATURDAY: "Sat", SUNDAY: "Sun",
};

type PlanStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";

const STATUS_OPTIONS: { value: PlanStatus; label: string; bg: string; text: string; dot: string }[] = [
  { value: "DRAFT",    label: "Draft",    bg: "bg-muted",          text: "text-muted-foreground", dot: "bg-muted-foreground" },
  { value: "ACTIVE",   label: "Active",   bg: "bg-[#007606]/10",   text: "text-[#007606]",        dot: "bg-[#007606]"        },
  { value: "PAUSED",   label: "Paused",   bg: "bg-amber-100 dark:bg-amber-900/20", text: "text-amber-600", dot: "bg-amber-500" },
  { value: "ARCHIVED", label: "Archived", bg: "bg-destructive/10", text: "text-destructive",       dot: "bg-destructive"      },
];

// Extract exact message from backend error response
async function extractError(res: Response, fallback: string): Promise<string> {
  try {
    const json = await res.json();
    return json?.message ?? json?.error ?? fallback;
  } catch {
    return fallback;
  }
}

interface Props {
  plan: MealPlan;
  onClose: () => void;
  onSave: (updated: Partial<MealPlan>) => void;
  onDelete?: (id: string) => void;
}

interface FormState {
  name: string; description: string; imageUrl: string | null;
  cuisineType: string[]; mealTypes: MealTime[]; price: string;
  maxSubscribers: string; isDeliveryAvailable: boolean;
  isPickupAvailable: boolean; availableDays: DayOfWeek[]; tags: string[];
}

interface FieldErrors { name?: string; price?: string; }

function validate(form: FormState): FieldErrors {
  const e: FieldErrors = {};
  if (form.name.trim().length > 0 && form.name.trim().length < 2)
    e.name = "Name must be at least 2 characters.";
  if (form.price && (isNaN(Number(form.price)) || Number(form.price) <= 0))
    e.price = "Price must be a positive number.";
  return e;
}

// ── Status dropdown ────────────────────────────────────────────────────────────
function StatusDropdown({
  value, onChange, loading,
}: {
  value: PlanStatus;
  onChange: (s: PlanStatus) => void;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = STATUS_OPTIONS.find((o) => o.value === value)!;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={loading}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 pl-2.5 pr-2 py-1.5 rounded-full text-[11px] font-bold border border-transparent transition-all hover:border-current ${current.bg} ${current.text}`}
      >
        {loading
          ? <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
          : <span className={`w-2 h-2 rounded-full ${current.dot}`} />
        }
        <span>{current.label}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1.5 w-36 bg-background border border-border rounded-xl shadow-xl overflow-hidden z-50"
          >
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold transition-colors hover:bg-muted/60 ${opt.text}`}
              >
                <span className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${opt.dot}`} />
                  {opt.label}
                </span>
                {value === opt.value && <Check className="w-3 h-3" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function UpdateMealPlanForm({ plan, onClose, onSave, onDelete }: Props) {
  const [form, setForm] = useState<FormState>({
    name: plan.name,
    description: plan.description ?? "",
    imageUrl: plan.imageUrl,
    cuisineType: [...plan.cuisineType],
    mealTypes: [...plan.mealTypes],
    price: String(plan.price),
    maxSubscribers: plan.maxSubscribers ? String(plan.maxSubscribers) : "",
    isDeliveryAvailable: plan.isDeliveryAvailable,
    isPickupAvailable: plan.isPickupAvailable,
    availableDays: [...plan.availableDays],
    tags: [...plan.tags],
  });
  const [currentStatus, setCurrentStatus] = useState<PlanStatus>(
    (plan as MealPlan & { status?: PlanStatus }).status ?? "DRAFT"
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [cuisineInput, setCuisineInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const set = (key: keyof FormState, value: unknown) => {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const toggleMealType = (mt: MealTime) =>
    set("mealTypes", form.mealTypes.includes(mt)
      ? form.mealTypes.filter((m) => m !== mt)
      : [...form.mealTypes, mt]);

  const toggleDay = (d: DayOfWeek) =>
    set("availableDays", form.availableDays.includes(d)
      ? form.availableDays.filter((x) => x !== d)
      : [...form.availableDays, d]);

  const addCuisine = () => {
    const t = cuisineInput.trim();
    if (t && !form.cuisineType.includes(t)) set("cuisineType", [...form.cuisineType, t]);
    setCuisineInput("");
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) set("tags", [...form.tags, t]);
    setTagInput("");
  };

  // ── Status change via dropdown ─────────────────────────────────────────────
  const handleStatusChange = async (nextStatus: PlanStatus) => {
    if (nextStatus === currentStatus) return;
    setTogglingStatus(true);
    try {
      const res = await fetch(`/api/chefs/meal-plans/${plan.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const msg = await extractError(res, "Failed to update status.");
        throw new Error(msg);
      }
      setCurrentStatus(nextStatus);
      onSave({ status: nextStatus } as Partial<MealPlan>);
      toast.success(`Status updated to ${nextStatus.toLowerCase()}.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setTogglingStatus(false);
    }
  };

  // ── PATCH ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    try {
      let imageUrl = form.imageUrl;
      if (imageFile) imageUrl = await uploadFile("chef-menus", imageFile, "meal-plans/");

      const patch: Partial<MealPlan> = {};
      if (form.name.trim() !== plan.name) patch.name = form.name.trim();
      if (form.description !== (plan.description ?? "")) patch.description = form.description || null;
      if (imageUrl !== plan.imageUrl) patch.imageUrl = imageUrl;
      if (JSON.stringify(form.cuisineType) !== JSON.stringify(plan.cuisineType)) patch.cuisineType = form.cuisineType;
      if (JSON.stringify(form.mealTypes) !== JSON.stringify(plan.mealTypes)) patch.mealTypes = form.mealTypes;
      if (form.price && Number(form.price) !== Number(plan.price)) patch.price = Number(form.price);
      const newMax = form.maxSubscribers ? Number(form.maxSubscribers) : null;
      if (newMax !== plan.maxSubscribers) patch.maxSubscribers = newMax;
      if (form.isDeliveryAvailable !== plan.isDeliveryAvailable) patch.isDeliveryAvailable = form.isDeliveryAvailable;
      if (form.isPickupAvailable !== plan.isPickupAvailable) patch.isPickupAvailable = form.isPickupAvailable;
      if (JSON.stringify(form.availableDays) !== JSON.stringify(plan.availableDays)) patch.availableDays = form.availableDays;
      if (JSON.stringify(form.tags) !== JSON.stringify(plan.tags)) patch.tags = form.tags;

      if (Object.keys(patch).length === 0) {
        toast.info("No changes to save.");
        onClose();
        return;
      }

      const res = await fetch(`/api/chefs/meal-plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const msg = await extractError(res, "Failed to update meal plan.");
        throw new Error(msg);
      }

      toast.success("Meal plan updated!");
      onSave(patch);
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update.");
    } finally {
      setSaving(false);
    }
  };

  // ── DELETE ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/chefs/meal-plans/${plan.id}`, { method: "DELETE" });
      if (!res.ok) {
        const msg = await extractError(res, "Failed to delete meal plan.");
        throw new Error(msg);
      }
      toast.success("Meal plan deleted.");
      onDelete?.(plan.id);
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete.");
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
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
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border sticky top-0 bg-background z-10 gap-2">
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black text-foreground truncate">Update Meal Plan</h2>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Only changed fields will be sent</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Status dropdown */}
              <StatusDropdown
                value={currentStatus}
                onChange={handleStatusChange}
                loading={togglingStatus}
              />
              {/* Delete */}
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="w-8 h-8 rounded-full hover:bg-destructive/10 flex items-center justify-center transition-colors group"
                title="Delete plan"
              >
                <Trash2 className="w-4 h-4 text-muted-foreground group-hover:text-destructive transition-colors" />
              </button>
              <button onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-5">
            <FileUploadZone label="Cover Photo" hint="Drag photo here or browse"
              accept="image/*" type="image" value={form.imageUrl}
              onChange={(url, file) => { set("imageUrl", url); setImageFile(file); }} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Plan Name</label>
                <Input value={form.name} onChange={(e) => set("name", e.target.value)}
                  className={`rounded-xl ${errors.name ? "border-destructive" : "border-border"}`} />
                {errors.name && <p className="text-[10px] text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Price (KES)</label>
                <Input type="number" value={form.price} onChange={(e) => set("price", e.target.value)}
                  className={`rounded-xl ${errors.price ? "border-destructive" : "border-border"}`} />
                {errors.price && <p className="text-[10px] text-destructive">{errors.price}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Description</label>
              <Textarea value={form.description} onChange={(e) => set("description", e.target.value)}
                rows={3} className="rounded-xl border-border resize-none text-sm" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Max Subscribers</label>
              <Input type="number" value={form.maxSubscribers} onChange={(e) => set("maxSubscribers", e.target.value)}
                placeholder="Leave blank for unlimited" className="rounded-xl border-border" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Meal Types</label>
              <div className="flex gap-2">
                {MEAL_TIMES.map((mt) => (
                  <button key={mt} type="button" onClick={() => toggleMealType(mt)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      form.mealTypes.includes(mt)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary/40 bg-background"
                    }`}>
                    {mt.charAt(0) + mt.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Available Days</label>
              <div className="flex gap-1.5 flex-wrap">
                {DAYS.map((d) => (
                  <button key={d} type="button" onClick={() => toggleDay(d)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      form.availableDays.includes(d)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary/40 bg-background"
                    }`}>
                    {DAY_SHORT[d]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Cuisine Types</label>
              <div className="flex gap-2">
                <Input value={cuisineInput} onChange={(e) => setCuisineInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCuisine(); } }}
                  placeholder="Add cuisine type" className="rounded-xl border-border flex-1 text-sm" />
                <Button type="button" onClick={addCuisine} variant="outline" className="rounded-xl px-3">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {form.cuisineType.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {form.cuisineType.map((c) => (
                    <span key={c} className="flex items-center gap-1 bg-secondary/20 text-secondary-foreground text-[10px] font-bold px-2 py-1 rounded-full">
                      {c}
                      <button onClick={() => set("cuisineType", form.cuisineType.filter((x) => x !== c))}>
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {([
                { key: "isDeliveryAvailable" as const, label: "Delivery Available", sub: "Deliver to customers" },
                { key: "isPickupAvailable" as const, label: "Pickup Available", sub: "Customers can pick up" },
              ] as const).map(({ key, label, sub }) => (
                <div key={key} className="flex items-center justify-between py-3 px-4 rounded-xl bg-muted/40 border border-border">
                  <div>
                    <p className="text-xs font-bold text-foreground">{label}</p>
                    <p className="text-[10px] text-muted-foreground">{sub}</p>
                  </div>
                  <button type="button" onClick={() => set(key, !form[key])}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${form[key] ? "bg-[#007606]" : "bg-muted-foreground/30"}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${form[key] ? "left-5" : "left-0.5"}`} />
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Tags</label>
              <div className="flex gap-2">
                <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  placeholder="Add tag and press Enter" className="rounded-xl border-border flex-1 text-sm" />
                <Button type="button" onClick={addTag} variant="outline" className="rounded-xl px-3">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
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

          <div className="flex items-center justify-end gap-3 px-4 sm:px-6 py-4 border-t border-border sticky bottom-0 bg-background">
            <Button variant="outline" onClick={onClose} className="rounded-full border-border px-5 sm:px-6">Cancel</Button>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button onClick={handleSave} disabled={saving}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 sm:px-8 font-bold">
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

      <ConfirmDeleteDialog
        open={showDeleteDialog}
        title="Delete Meal Plan"
        description="This will permanently remove this meal plan and all its items. This cannot be undone."
        itemName={plan.name}
        loading={deleting}
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}