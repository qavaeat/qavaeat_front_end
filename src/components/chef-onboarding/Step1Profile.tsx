"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, Phone, Mail, User, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
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

// ── Field error message ────────────────────────────────
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

// ── Validation ─────────────────────────────────────────
interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  businessName?: string;
  phoneNumber?: string;
  password?: string;
  confirmPassword?: string;
  shortBio?: string;
}

function validate(
  form: ProfileData,
  password: string,
  confirmPassword: string,
): FormErrors {
  const errors: FormErrors = {};

  if (!form.firstName?.trim()) errors.firstName = "First name is required.";
  if (!form.lastName?.trim()) errors.lastName = "Last name is required.";

  if (!form.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!form.businessName.trim())
    errors.businessName = "Business name is required.";

  if (!form.phoneNumber.trim()) {
    errors.phoneNumber = "Phone number is required.";
  } else if (form.phoneNumber.trim().length < 9) {
    errors.phoneNumber = "Enter a valid phone number.";
  }

  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  if (!form.shortBio.trim()) {
    errors.shortBio = "A short bio is required.";
  }

  return errors;
}

export function Step1Profile({ data, onComplete }: Props) {
  const [form, setForm] = useState<ProfileData>({
    ...data,
    email: data.email ?? "",
    firstName: data.firstName ?? "",
    lastName: data.lastName ?? "",
    password: data.password ?? "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Errors only appear after first submit attempt
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const passwordValid = password.length >= 8;
  const passwordsMatch = password === confirmPassword;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    if (name === "shortBio" && value.length > MAX_BIO) return;
    const updated = { ...form, [name]: value };
    setForm(updated);
    // Re-validate live after first submit attempt
    if (submitted) {
      setErrors(validate(updated, password, confirmPassword));
    }
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (submitted) {
      setErrors(validate(form, val, confirmPassword));
    }
  };

  const handleConfirmChange = (val: string) => {
    setConfirmPassword(val);
    if (submitted) {
      setErrors(validate(form, password, val));
    }
  };

  const handleContinue = async () => {
    setSubmitted(true);
    const errs = validate(form, password, confirmPassword);
    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      // Scroll to first error
      const first = document.querySelector("[data-field-error]");
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setUploading(true);
    try {
      let photoUrl = form.profilePhotoUrl;
      if (photoFile) {
        photoUrl = await uploadFile("chef-profiles", photoFile, "profile/");
      }
      onComplete({ ...form, profilePhotoUrl: photoUrl, password });
    } catch {
      toast.error("Failed to upload photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Helper: input class with error highlight
  const inputCls = (field: keyof FormErrors, extra = "") =>
    `rounded-xl border-border bg-background ${extra} ${
      errors[field]
        ? "border-destructive focus-visible:ring-destructive/30"
        : ""
    }`;

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
              <div className="flex flex-col gap-1.5" data-field-error={errors.firstName ? "" : undefined}>
                <label className="text-sm font-semibold text-foreground">
                  First Name <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <User className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${errors.firstName ? "text-destructive" : "text-muted-foreground"}`} />
                  <Input
                    name="firstName"
                    value={form.firstName ?? ""}
                    onChange={handleChange}
                    placeholder="Jane"
                    className={inputCls("firstName", "pl-10")}
                  />
                </div>
                <FieldError message={errors.firstName} />
              </div>

              <div className="flex flex-col gap-1.5" data-field-error={errors.lastName ? "" : undefined}>
                <label className="text-sm font-semibold text-foreground">
                  Last Name <span className="text-destructive">*</span>
                </label>
                <Input
                  name="lastName"
                  value={form.lastName ?? ""}
                  onChange={handleChange}
                  placeholder="Doe"
                  className={inputCls("lastName")}
                />
                <FieldError message={errors.lastName} />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5" data-field-error={errors.email ? "" : undefined}>
              <label className="text-sm font-semibold text-foreground">
                Email Address <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${errors.email ? "text-destructive" : "text-muted-foreground"}`} />
                <Input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="chef@example.com"
                  className={inputCls("email", "pl-10")}
                />
              </div>
              <FieldError message={errors.email} />
            </div>

            {/* Business Name */}
            <div className="flex flex-col gap-1.5" data-field-error={errors.businessName ? "" : undefined}>
              <label className="text-sm font-semibold text-foreground">
                Business Name <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Briefcase className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${errors.businessName ? "text-destructive" : "text-muted-foreground"}`} />
                <Input
                  name="businessName"
                  value={form.businessName}
                  onChange={handleChange}
                  placeholder="e.g. Mama Pima's Kitchen"
                  className={inputCls("businessName", "pl-10")}
                />
              </div>
              <FieldError message={errors.businessName} />
            </div>

            {/* Phone Number */}
            <div className="flex flex-col gap-1.5" data-field-error={errors.phoneNumber ? "" : undefined}>
              <label className="text-sm font-semibold text-foreground">
                Phone Number <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  <span className="text-base leading-none">🇰🇪</span>
                  <span className="text-sm text-muted-foreground font-medium">+254</span>
                </div>
                <Input
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  placeholder="7XX XXX XXX"
                  className={inputCls("phoneNumber", "pl-20")}
                  type="tel"
                />
              </div>
              <FieldError message={errors.phoneNumber} />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5" data-field-error={errors.password ? "" : undefined}>
              <label className="text-sm font-semibold text-foreground">
                Password <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${errors.password ? "text-destructive" : "text-muted-foreground"}`} />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="Min. 8 characters"
                  className={inputCls("password", "pl-10 pr-10")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <FieldError message={errors.password} />
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5" data-field-error={errors.confirmPassword ? "" : undefined}>
              <label className="text-sm font-semibold text-foreground">
                Confirm Password <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${errors.confirmPassword ? "text-destructive" : "text-muted-foreground"}`} />
                <Input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => handleConfirmChange(e.target.value)}
                  placeholder="Re-enter your password"
                  className={inputCls("confirmPassword", "pl-10 pr-10")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <FieldError message={errors.confirmPassword} />
              {/* Success state */}
              {confirmPassword.length > 0 && passwordsMatch && passwordValid && !errors.confirmPassword && (
                <p className="text-[11px] text-green-600 pl-1">✓ Passwords match</p>
              )}
            </div>

            {/* Short Bio */}
            <div className="flex flex-col gap-1.5" data-field-error={errors.shortBio ? "" : undefined}>
              <label className="text-sm font-semibold text-foreground">
                Short Bio <span className="text-destructive">*</span>
              </label>
              <Textarea
                name="shortBio"
                value={form.shortBio}
                onChange={handleChange}
                placeholder="Tell your customers about your cooking style, your inspiration and what makes your food special"
                rows={4}
                className={`rounded-xl border-border bg-background resize-none text-sm ${
                  errors.shortBio ? "border-destructive focus-visible:ring-destructive/30" : ""
                }`}
              />
              <div className="flex items-center justify-between">
                <FieldError message={errors.shortBio} />
                <p className="text-xs text-muted-foreground ml-auto">
                  {form.shortBio.length} / {MAX_BIO}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
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