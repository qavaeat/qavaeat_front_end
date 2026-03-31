
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Truck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileUploadZone } from "./FileUploadZone";
import { uploadFile } from "@/lib/supabase-upload";
import type { KitchenData } from "../../types/types";
import { toast } from "sonner";

interface Props {
  data: KitchenData;
  onComplete: (data: KitchenData) => void;
}

export function Step2Kitchen({ data, onComplete }: Props) {
  const [form, setForm] = useState<KitchenData>(data);
  const [kitchenFile, setKitchenFile] = useState<File | null>(null);
  const [menuFile, setMenuFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // location and areasOfService required; photos nullable
  const isValid =
    form.location.trim().length > 0 && form.areasOfService.trim().length > 0;

  const handleContinue = async () => {
    if (!isValid) return;
    setUploading(true);
    try {
      let kitchenUrl = form.kitchenPhotoUrl;
      let menuUrl = form.menuPhotoUrl;

      if (kitchenFile) {
        kitchenUrl = await uploadFile("chef-kitchens", kitchenFile, "kitchen/");
      }
      if (menuFile) {
        menuUrl = await uploadFile("chef-menus", menuFile, "menu/");
      }

      onComplete({
        ...form,
        kitchenPhotoUrl: kitchenUrl,
        menuPhotoUrl: menuUrl,
      });
    } catch {
      toast.error("Failed to upload. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-foreground mb-1">
          Create Your Business Profile
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Food lovers will see this when discovering your kitchen
        </p>
      </div>

      <div className="bg-background/80 backdrop-blur-sm rounded-2xl border border-border p-5 sm:p-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.4fr] gap-5 sm:gap-6">
          {/* Left — photo uploads */}
          <div className="flex flex-col gap-4">
            <FileUploadZone
              label="Upload Kitchen or Working Area Photo"
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
              label="Upload Sample Menu Photo"
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

          {/* Right — location fields */}
          <div className="flex flex-col gap-4">
            {/* Location */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Name"
                  className="pl-10 rounded-xl border-border bg-background"
                />
              </div>
              {/*
                ── Google Maps Integration slot ──
                When ready, replace the Input above with a Google Places
                Autocomplete input. Install @react-google-maps/api and use:

                <Autocomplete
                  onLoad={(a) => setAutocomplete(a)}
                  onPlaceChanged={() => {
                    const place = autocomplete.getPlace();
                    setForm(p => ({ ...p, location: place.formatted_address }));
                  }}
                >
                  <input placeholder="Search location..." className="..." />
                </Autocomplete>

                Add NEXT_PUBLIC_GOOGLE_MAPS_KEY to .env.local
              */}
              <p className="text-[10px] text-muted-foreground pl-1">
                Google Maps integration ready — add your API key to enable
                autocomplete
              </p>
            </div>

            {/* Areas of Service */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                Areas of Service
                <span className="text-xs text-muted-foreground font-normal">
                  (Can put multiple)
                </span>
              </label>
              <div className="relative">
                <Truck className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
                <Textarea
                  name="areasOfService"
                  value={form.areasOfService}
                  onChange={handleChange}
                  placeholder="e.g. Westlands, Parklands, Kilimani"
                  rows={5}
                  className="pl-10 rounded-xl border-border bg-background resize-none text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleContinue}
              disabled={!isValid || uploading}
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
