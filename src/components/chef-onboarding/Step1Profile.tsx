"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, Phone, Mail, User, Lock, Eye, EyeOff } from "lucide-react";
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
  const [form, setForm] = useState<ProfileData>({
    ...data,
    email: data.email ?? "",
    firstName: data.firstName ?? "",
    lastName: data.lastName ?? "",
    password: data.password ?? ""
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Password state kept local — confirmPassword never leaves this component
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordsMatch = password === confirmPassword;
  const passwordValid = password.length >= 8;
  // Only show mismatch error once the user has typed something in confirm
  const showMismatchError = confirmPassword.length > 0 && !passwordsMatch;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    if (name === "shortBio" && value.length > MAX_BIO) return;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const isValid =
    form.email.trim().length > 0 &&
    form.email.includes("@") &&
    form.businessName.trim().length > 0 &&
    form.phoneNumber.trim().length >= 9 &&
    form.shortBio.trim().length > 0 &&
    passwordValid &&
    passwordsMatch;

  const handleContinue = async () => {
    if (!isValid) return;
    setUploading(true);
    try {
      let photoUrl = form.profilePhotoUrl;
      if (photoFile) {
        photoUrl = await uploadFile("chef-profiles", photoFile, "profile/");
      }
      // Only pass password (not confirmPassword) to the next step
      onComplete({ ...form, profilePhotoUrl: photoUrl, password });
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
            {/* First + Last name row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    name="firstName"
                    value={form.firstName ?? ""}
                    onChange={handleChange}
                    placeholder="Jane"
                    className="pl-10 rounded-xl border-border bg-background"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">
                  Last Name
                </label>
                <Input
                  name="lastName"
                  value={form.lastName ?? ""}
                  onChange={handleChange}
                  placeholder="Doe"
                  className="rounded-xl border-border bg-background"
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">
                Email Address <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="chef@example.com"
                  className="pl-10 rounded-xl border-border bg-background"
                />
              </div>
            </div>

            {/* Business Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">
                Business Name <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  name="businessName"
                  value={form.businessName}
                  onChange={handleChange}
                  placeholder="e.g. Mama Pima's Kitchen"
                  className="pl-10 rounded-xl border-border bg-background"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">
                Phone Number <span className="text-destructive">*</span>
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

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">
                Password <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="pl-10 pr-10 rounded-xl border-border bg-background"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {/* Strength hint — only shown once they start typing */}
              {password.length > 0 && !passwordValid && (
                <p className="text-[11px] text-destructive pl-1">
                  Password must be at least 8 characters
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">
                Confirm Password <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className={`pl-10 pr-10 rounded-xl border-border bg-background ${
                    showMismatchError
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {showMismatchError && (
                <p className="text-[11px] text-destructive pl-1">
                  Passwords do not match
                </p>
              )}
              {/* Success state */}
              {confirmPassword.length > 0 &&
                passwordsMatch &&
                passwordValid && (
                  <p className="text-[11px] text-green-600 pl-1">
                    Passwords match
                  </p>
                )}
            </div>

            {/* Short Bio */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">
                Short Bio <span className="text-destructive">*</span>
              </label>
              <Textarea
                name="shortBio"
                value={form.shortBio}
                onChange={handleChange}
                placeholder="Tell your customers about your cooking style, your inspiration and what makes your food special"
                rows={4}
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
