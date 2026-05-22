"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Phone, MapPin, Mail, Camera, Save,
  Trash2, AlertTriangle, ChefHat, Eye, EyeOff,
  CheckCircle2, Lock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useProfile } from "./ProfileContext";
import { uploadFile } from "@/lib/supabase-upload";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
});

interface SectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

function Section({ title, subtitle, children }: SectionProps) {
  return (
    <motion.div
      {...fadeUp(0.05)}
      className="bg-background rounded-2xl border border-border overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-sm font-black text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  );
}

function Field({
  label, required, error, children,
}: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-foreground">
        {label}{required && <span className="text-primary ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-[10px] text-destructive">{error}</p>}
    </div>
  );
}

export function TabProfile() {
  const { user, loading, refresh, updateOptimistic } = useProfile();
  const profile = user?.profile;

  // ── Personal info form ─────────────────────────────────────────────────
  const [personal, setPersonal] = useState({
    firstName: profile?.firstName ?? "",
    lastName:  profile?.lastName ?? "",
    phone:     profile?.phone ?? "",
  });
  const [personalErrors, setPersonalErrors] = useState<Record<string, string>>({});
  const [savingPersonal, setSavingPersonal] = useState(false);

  // ── Address form ───────────────────────────────────────────────────────
  const [address, setAddress] = useState({
    address:    profile?.address ?? "",
    city:       profile?.city ?? "",
    state:      profile?.state ?? "",
    country:    profile?.country ?? "",
    postalCode: profile?.postalCode ?? "",
  });
  const [savingAddress, setSavingAddress] = useState(false);

  // ── Avatar ─────────────────────────────────────────────────────────────
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatarUrl ?? null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // ── Delete account ─────────────────────────────────────────────────────
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  // ── Sync form when profile loads ────────────────────────────────────────
  const [synced, setSynced] = useState(false);
  if (profile && !synced) {
    setPersonal({
      firstName: profile.firstName ?? "",
      lastName:  profile.lastName ?? "",
      phone:     profile.phone ?? "",
    });
    setAddress({
      address:    profile.address ?? "",
      city:       profile.city ?? "",
      state:      profile.state ?? "",
      country:    profile.country ?? "",
      postalCode: profile.postalCode ?? "",
    });
    setAvatarPreview(profile.avatarUrl ?? null);
    setSynced(true);
  }

  const displayName = profile?.firstName
    ? `${profile.firstName} ${profile.lastName ?? ""}`.trim()
    : user?.email?.split("@")[0] ?? "Chef";

  // ── Avatar pick ────────────────────────────────────────────────────────
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setUploadingAvatar(true);
    try {
      const url = await uploadFile("chef-profiles", avatarFile, "avatars/");
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: url }),
      });
      if (!res.ok) throw new Error("Failed to update avatar");
      updateOptimistic({ avatarUrl: url });
      setAvatarFile(null);
      toast.success("Avatar updated!");
    } catch {
      toast.error("Failed to upload avatar.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ── Save personal ──────────────────────────────────────────────────────
  const savePersonal = async () => {
    const errs: Record<string, string> = {};
    if (personal.firstName.trim().length < 2) errs.firstName = "At least 2 characters.";
    if (personal.lastName.trim().length < 2)  errs.lastName  = "At least 2 characters.";
    if (personal.phone.trim().length < 7)      errs.phone     = "Enter a valid phone number.";
    if (Object.keys(errs).length > 0) { setPersonalErrors(errs); return; }

    setSavingPersonal(true);
    try {
      const method = profile ? "PATCH" : "POST";
      const res = await fetch("/api/profile", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(personal),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json?.message ?? "Failed to save.");
      }
      updateOptimistic(personal);
      toast.success("Personal info saved!");
      setPersonalErrors({});
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSavingPersonal(false);
    }
  };

  // ── Save address ───────────────────────────────────────────────────────
  const saveAddress = async () => {
    setSavingAddress(true);
    try {
      const method = profile ? "PATCH" : "POST";
      const res = await fetch("/api/profile", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(address),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json?.message ?? "Failed to save.");
      }
      updateOptimistic(address);
      toast.success("Address saved!");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSavingAddress(false);
    }
  };

  // ── Delete account ─────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (deleteInput !== "DELETE") return;
    setDeleting(true);
    try {
      const res = await fetch("/api/profile", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete profile.");
      toast.success("Profile deleted.");
      setShowDeleteConfirm(false);
      await refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-40 bg-muted rounded-2xl" />
        <div className="h-64 bg-muted rounded-2xl" />
        <div className="h-48 bg-muted rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl mx-auto">

      {/* ── Hero card ──────────────────────────────────────────────────── */}
      <motion.div
        {...fadeUp(0)}
        className="bg-background rounded-2xl border border-border overflow-hidden"
      >
        {/* Banner */}
        <div className="h-28 bg-gradient-to-br from-primary/20 via-secondary/10 to-[#007606]/10 relative">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #DD3131 0%, transparent 50%), radial-gradient(circle at 80% 20%, #F4CD2E 0%, transparent 50%)" }}
          />
        </div>

        <div className="px-6 pb-6">
          {/* Avatar row */}
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl border-4 border-background bg-muted overflow-hidden flex items-center justify-center shadow-lg">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarPreview} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <ChefHat className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            {avatarFile && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <Button
                  onClick={handleAvatarUpload}
                  disabled={uploadingAvatar}
                  className="bg-[#007606] hover:bg-[#007606]/90 text-white rounded-xl px-4 h-9 text-xs font-bold"
                >
                  {uploadingAvatar ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Uploading...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Save className="w-3.5 h-3.5" /> Save Photo
                    </span>
                  )}
                </Button>
              </motion.div>
            )}
          </div>

          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-black text-foreground">Chef {displayName}</h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3 h-3" />
                {user?.email}
              </p>
              {profile?.city && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  {[profile.city, profile.country].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[10px] font-bold bg-[#007606]/10 text-[#007606] px-3 py-1.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                Chef Account
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Personal info ──────────────────────────────────────────────── */}
      <Section title="Personal Information" subtitle="Update your name and contact details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="First Name" required error={personalErrors.firstName}>
            <Input
              value={personal.firstName}
              onChange={(e) => {
                setPersonal((p) => ({ ...p, firstName: e.target.value }));
                setPersonalErrors((p) => ({ ...p, firstName: undefined as unknown as string }));
              }}
              placeholder="e.g. Miriam"
              className={`rounded-xl ${personalErrors.firstName ? "border-destructive" : "border-border"}`}
            />
          </Field>
          <Field label="Last Name" required error={personalErrors.lastName}>
            <Input
              value={personal.lastName}
              onChange={(e) => {
                setPersonal((p) => ({ ...p, lastName: e.target.value }));
                setPersonalErrors((p) => ({ ...p, lastName: undefined as unknown as string }));
              }}
              placeholder="e.g. Wanjiru"
              className={`rounded-xl ${personalErrors.lastName ? "border-destructive" : "border-border"}`}
            />
          </Field>
          <Field label="Phone Number" required error={personalErrors.phone}>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={personal.phone}
                onChange={(e) => {
                  setPersonal((p) => ({ ...p, phone: e.target.value }));
                  setPersonalErrors((p) => ({ ...p, phone: undefined as unknown as string }));
                }}
                placeholder="e.g. 0712345678"
                className={`pl-9 rounded-xl ${personalErrors.phone ? "border-destructive" : "border-border"}`}
              />
            </div>
          </Field>
          <Field label="Email Address">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={user?.email ?? ""}
                disabled
                className="pl-9 rounded-xl border-border bg-muted/40 text-muted-foreground cursor-not-allowed"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">Email cannot be changed here.</p>
          </Field>
        </div>
        <div className="flex justify-end mt-5">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={savePersonal}
              disabled={savingPersonal}
              className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 font-bold"
            >
              {savingPersonal ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="w-3.5 h-3.5" /> Save Changes
                </span>
              )}
            </Button>
          </motion.div>
        </div>
      </Section>

      {/* ── Address ────────────────────────────────────────────────────── */}
      <Section title="Location & Address" subtitle="Used for delivery coordination and map display">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Street Address">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={address.address}
                  onChange={(e) => setAddress((p) => ({ ...p, address: e.target.value }))}
                  placeholder="e.g. 14 Westlands Road"
                  className="pl-9 rounded-xl border-border"
                />
              </div>
            </Field>
          </div>
          <Field label="City">
            <Input value={address.city} onChange={(e) => setAddress((p) => ({ ...p, city: e.target.value }))}
              placeholder="e.g. Nairobi" className="rounded-xl border-border" />
          </Field>
          <Field label="State / County">
            <Input value={address.state} onChange={(e) => setAddress((p) => ({ ...p, state: e.target.value }))}
              placeholder="e.g. Nairobi County" className="rounded-xl border-border" />
          </Field>
          <Field label="Country">
            <Input value={address.country} onChange={(e) => setAddress((p) => ({ ...p, country: e.target.value }))}
              placeholder="e.g. Kenya" className="rounded-xl border-border" />
          </Field>
          <Field label="Postal Code">
            <Input value={address.postalCode} onChange={(e) => setAddress((p) => ({ ...p, postalCode: e.target.value }))}
              placeholder="e.g. 00100" className="rounded-xl border-border" />
          </Field>
        </div>
        <div className="flex justify-end mt-5">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={saveAddress}
              disabled={savingAddress}
              className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 font-bold"
            >
              {savingAddress ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="w-3.5 h-3.5" /> Save Address
                </span>
              )}
            </Button>
          </motion.div>
        </div>
      </Section>

      {/* ── Security ───────────────────────────────────────────────────── */}
      <Section title="Security" subtitle="Manage your account security">
        <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 border border-border">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-foreground">Password</p>
            <p className="text-[10px] text-muted-foreground">
              Change your password to keep your account secure
            </p>
          </div>
          <Button variant="outline" className="rounded-xl border-border text-xs font-bold px-4 flex-shrink-0">
            Change Password
          </Button>
        </div>
      </Section>

      {/* ── Danger zone ────────────────────────────────────────────────── */}
      <motion.div
        {...fadeUp(0.1)}
        className="bg-background rounded-2xl border border-destructive/30 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-destructive/20 bg-destructive/5">
          <h3 className="text-sm font-black text-destructive flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Danger Zone
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            These actions are irreversible. Please proceed with caution.
          </p>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-bold text-foreground">Delete Profile</p>
              <p className="text-[10px] text-muted-foreground max-w-sm">
                Permanently delete your chef profile. Your account will remain but all profile data will be removed.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)}
              className="border-destructive text-destructive hover:bg-destructive/5 rounded-xl text-xs font-bold px-5 flex-shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Delete Profile
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ── Delete confirm modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div
            className="fixed inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            onClick={(e) => e.target === e.currentTarget && setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.2 }}
              className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-md p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground">Delete Profile</h3>
                  <p className="text-xs text-muted-foreground">This cannot be undone.</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Type <span className="font-bold text-destructive">DELETE</span> to confirm.
              </p>
              <Input
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="Type DELETE"
                className="rounded-xl border-border"
              />
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }}
                  className="rounded-full border-border px-6">
                  Cancel
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={deleteInput !== "DELETE" || deleting}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full px-6 font-bold"
                >
                  {deleting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Deleting...
                    </span>
                  ) : "Delete Profile"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}