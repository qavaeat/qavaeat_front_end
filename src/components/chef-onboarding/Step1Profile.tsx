
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileUploadZone } from "./FileUploadZone";
import { uploadFile } from "@/lib/supabase-upload";
import type { ProfileData } from "../../types/types";
import { toast } from "sonner";

interface Props {
  data: ProfileData;
  onComplete: (data: ProfileData) => void;
}

const MAX_BIO = 250;

export function Step1Profile({ data, onComplete }: Props) {
  const [form, setForm] = useState<ProfileData>(data);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    if (name === "shortBio" && value.length > MAX_BIO) return;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Form is valid when businessName, phoneNumber and bio are filled
  // profilePhoto is nullable
  const isValid =
    form.businessName.trim().length > 0 &&
    form.phoneNumber.trim().length >= 9 &&
    form.shortBio.trim().length > 0;

  const handleContinue = async () => {
    if (!isValid) return;
    setUploading(true);
    try {
      let photoUrl = form.profilePhotoUrl;
      if (photoFile) {
        photoUrl = await uploadFile("chef-profiles", photoFile, "profile/");
      }
      onComplete({ ...form, profilePhotoUrl: photoUrl });
    } catch {
      toast.error("Failed to upload photo. Please try again.");
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
          {/* Left — profile photo */}
          <FileUploadZone
            label="Upload Profile Photo"
            hint="Drag photo here or browse"
            accept="image/*"
            type="image"
            value={form.profilePhotoUrl}
            uploading={uploading && !!photoFile}
            onChange={(url, file) => {
              setForm((p) => ({ ...p, profilePhotoUrl: url }));
              setPhotoFile(file);
            }}
          />

          {/* Right — form fields */}
          <div className="flex flex-col gap-4">
            {/* Business Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">
                Business Name
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  name="businessName"
                  value={form.businessName}
                  onChange={handleChange}
                  placeholder="Name"
                  className="pl-10 rounded-xl border-border bg-background"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  <span className="text-base leading-none">🇰🇪</span>
                  <span className="text-sm text-muted-foreground font-medium">
                    +254
                  </span>
                </div>
                <Input
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  placeholder="7XX XXX XXX"
                  className="pl-20 rounded-xl border-border bg-background"
                  type="tel"
                />
              </div>
            </div>

            {/* Short Bio */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">
                Short Bio
              </label>
              <Textarea
                name="shortBio"
                value={form.shortBio}
                onChange={handleChange}
                placeholder="Tell your customers about your cooking style, your inspiration and what makes your food special"
                rows={5}
                className="rounded-xl border-border bg-background resize-none text-sm"
              />
              <p className="text-xs text-muted-foreground text-right">
                {form.shortBio.length} / {MAX_BIO}
              </p>
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
