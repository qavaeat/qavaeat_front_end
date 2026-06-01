"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck,
  ChefHat,
  Calendar,
  Clock,

  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileUploadZone } from "./FileUploadZone";
import { uploadFile } from "@/lib/supabase-upload";
import type { KitchenData } from "../../types/types";
import { toast } from "sonner";
import { LocationPicker } from "@/lib/locationPicker";
import type { PickedLocation } from "@/lib/maps";

// ── Constants ─────────────────────────────────────────────────────────────────

const DAY_OPTIONS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

const SERVICE_OPTIONS = [
  { value: "DELIVERY", label: "Delivery" },
  { value: "PICKUP", label: "Pickup" },
  { value: "DINE_IN", label: "Dine-in" },
] as const;

// ── Field error ───────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          initial={{ opacity: 0, y: -4, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -4, height: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-1.5 text-[11px] font-medium text-destructive pl-1 mt-0.5"
        >
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

// ── Validation ────────────────────────────────────────────────────────────────

interface FormErrors {
  location?: string;
  areasOfService?: string;
  foodSpecialty?: string;
  availability?: string;
  yearsOfExperience?: string;
}

function validate(form: KitchenData, selectedServices: string[], selectedDays: string[]): FormErrors {
  const errors: FormErrors = {};

  if (!form.location.trim()) {
    errors.location = "Kitchen location is required.";
  }
  if (selectedServices.length === 0) {
    errors.areasOfService = "Select at least one service.";
  }
  if (!form.foodSpecialty.trim()) {
    errors.foodSpecialty = "Food specialties are required.";
  }
  if (selectedDays.length === 0) {
    errors.availability = "Select at least one available day.";
  }
  if (form.yearsOfExperience < 0) {
    errors.yearsOfExperience = "Enter a valid number of years.";
  }

  return errors;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  data: KitchenData;
  onComplete: (data: KitchenData) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Step2Kitchen({ data, onComplete }: Props) {
  const [form, setForm] = useState<KitchenData>({
    ...data,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    foodSpecialty: data.foodSpecialty ?? "",
    availability: data.availability ?? "",
    yearsOfExperience: data.yearsOfExperience ?? 0,
  });

  const [kitchenFile, setKitchenFile] = useState<File | null>(null);
  const [menuFile, setMenuFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [pickedLocation, setPickedLocation] = useState<PickedLocation | null>(
    data.latitude && data.longitude
      ? { formatted_address: data.location, lat: data.latitude, lng: data.longitude }
      : null,
  );

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  // ── Derived selections ────────────────────────────────────────────────────

  const selectedDays = form.availability
    ? form.availability.split(",").filter(Boolean)
    : [];

  const selectedServices = form.areasOfService
    ? form.areasOfService.split(",").filter(Boolean)
    : [];

  // ── Re-validate live after first submit ───────────────────────────────────

  const revalidate = (nextForm: KitchenData, nextServices: string[], nextDays: string[]) => {
    if (submitted) setErrors(validate(nextForm, nextServices, nextDays));
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleLocationChange = useCallback(
    (loc: PickedLocation | null) => {
      setPickedLocation(loc);
      const nextForm = {
        ...form,
        location: loc?.formatted_address ?? "",
        latitude: loc?.lat ?? null,
        longitude: loc?.lng ?? null,
      };
      setForm(nextForm);
      revalidate(nextForm, selectedServices, selectedDays);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form, selectedServices, selectedDays, submitted],
  );

  const toggleDay = (day: string) => {
    const updated = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day];
    const nextForm = { ...form, availability: updated.join(",") };
    setForm(nextForm);
    revalidate(nextForm, selectedServices, updated);
  };

  const toggleService = (value: string) => {
    const updated = selectedServices.includes(value)
      ? selectedServices.filter((s) => s !== value)
      : [...selectedServices, value];
    const nextForm = { ...form, areasOfService: updated.join(",") };
    setForm(nextForm);
    revalidate(nextForm, updated, selectedDays);
  };

  const handleFieldChange = (name: keyof KitchenData, value: string | number) => {
    const nextForm = { ...form, [name]: value };
    setForm(nextForm);
    revalidate(nextForm, selectedServices, selectedDays);
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleContinue = async () => {
    setSubmitted(true);
    const errs = validate(form, selectedServices, selectedDays);
    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      const first = document.querySelector("[data-field-error]");
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setUploading(true);
    try {
      let kitchenUrl = form.kitchenPhotoUrl;
      let menuUrl = form.menuPhotoUrl;
      if (kitchenFile) kitchenUrl = await uploadFile("chef-kitchens", kitchenFile, "kitchen/");
      if (menuFile) menuUrl = await uploadFile("chef-menus", menuFile, "menu/");
      onComplete({ ...form, kitchenPhotoUrl: kitchenUrl, menuPhotoUrl: menuUrl });
    } catch {
      toast.error("Failed to upload. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-foreground mb-1">
          Your Kitchen & Services
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Help customers find you and understand what you offer
        </p>
      </div>

      <div className="bg-background/80 backdrop-blur-sm rounded-2xl border border-border p-5 sm:p-6 shadow-sm space-y-6">

        {/* Photo uploads */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FileUploadZone
            label="Kitchen / Working Area Photo"
            hint="Drag photo here or browse"
            accept="image/*"
            type="image"
            value={form.kitchenPhotoUrl}
            uploading={uploading && !!kitchenFile}
            onChange={(url, file) => {
              setForm((p) => ({ ...p, kitchenPhotoUrl: url }));
              setKitchenFile(file);
            }}
          />
          <FileUploadZone
            label="Sample Menu Photo"
            hint="Drag photo here or browse"
            accept="image/*"
            type="image"
            value={form.menuPhotoUrl}
            uploading={uploading && !!menuFile}
            onChange={(url, file) => {
              setForm((p) => ({ ...p, menuPhotoUrl: url }));
              setMenuFile(file);
            }}
          />
        </div>

        {/* Location */}
        <div data-field-error={errors.location ? "" : undefined}>
          <LocationPicker
            value={pickedLocation}
            onChange={handleLocationChange}
            label="Kitchen Location"
            confirmLabel="Kitchen location set"
            hint="Search, use GPS, or tap the map to pin your kitchen"
            required
          />
          <FieldError message={errors.location} />
        </div>

        {/* Services offered */}
        <div className="flex flex-col gap-1.5" data-field-error={errors.areasOfService ? "" : undefined}>
          <label className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Truck className="w-4 h-4 text-muted-foreground" />
            Services Offered <span className="text-destructive">*</span>
          </label>
          <div className={`flex flex-wrap gap-2 p-2 rounded-xl transition-colors ${errors.areasOfService ? "bg-destructive/5 border border-destructive/30" : ""}`}>
            {SERVICE_OPTIONS.map(({ value, label }) => {
              const active = selectedServices.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleService(value)}
                  className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <FieldError message={errors.areasOfService} />
        </div>

        {/* Food specialties */}
        <div className="flex flex-col gap-1.5" data-field-error={errors.foodSpecialty ? "" : undefined}>
          <label className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ChefHat className="w-4 h-4 text-muted-foreground" />
            Food Specialties <span className="text-destructive">*</span>
          </label>
          <Input
            name="foodSpecialty"
            value={form.foodSpecialty}
            onChange={(e) => handleFieldChange("foodSpecialty", e.target.value)}
            placeholder="e.g. Kenyan, BBQ, Vegan, Swahili cuisine"
            className={`rounded-xl border-border bg-background ${
              errors.foodSpecialty ? "border-destructive focus-visible:ring-destructive/30" : ""
            }`}
          />
          <FieldError message={errors.foodSpecialty} />
          {!errors.foodSpecialty && (
            <p className="text-[10px] text-muted-foreground pl-1">
              Separate multiple specialties with commas
            </p>
          )}
        </div>

        {/* Available days */}
        <div className="flex flex-col gap-1.5" data-field-error={errors.availability ? "" : undefined}>
          <label className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            Available Days <span className="text-destructive">*</span>
          </label>
          <div className={`flex flex-wrap gap-2 p-2 rounded-xl transition-colors ${errors.availability ? "bg-destructive/5 border border-destructive/30" : ""}`}>
            {DAY_OPTIONS.map((day) => {
              const active = selectedDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {DAY_LABELS[day]}
                </button>
              );
            })}
          </div>
          <FieldError message={errors.availability} />
        </div>

        {/* Years of experience */}
        <div className="flex flex-col gap-1.5" data-field-error={errors.yearsOfExperience ? "" : undefined}>
          <label className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Years of Cooking Experience <span className="text-destructive">*</span>
          </label>
          <Input
            type="number"
            name="yearsOfExperience"
            min={0}
            max={60}
            value={form.yearsOfExperience}
            onChange={(e) =>
              handleFieldChange("yearsOfExperience", Math.max(0, Number(e.target.value)))
            }
            placeholder="e.g. 5"
            className={`rounded-xl border-border bg-background w-32 ${
              errors.yearsOfExperience ? "border-destructive focus-visible:ring-destructive/30" : ""
            }`}
          />
          <FieldError message={errors.yearsOfExperience} />
        </div>

        {/* Continue */}
        <div className="flex justify-end pt-2">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleContinue}
              disabled={uploading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-black tracking-widest uppercase rounded-full px-10 py-5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Uploading...
                </span>
              ) : (
                "Continue"
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}