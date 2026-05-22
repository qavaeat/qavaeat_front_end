"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Phone, MapPin, Mail, Camera, Save,
  Trash2, AlertTriangle, ChefHat, Lock,
  CheckCircle2, Sun, Moon, Monitor, Palette,
  ChevronRight, Settings,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useProfile } from "./ProfileContext";
import { uploadFile } from "@/lib/supabase-upload";

// ── helpers ────────────────────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay },
});

type SettingsSection = "profile" | "appearance" | "security";

const SECTIONS: { id: SettingsSection; label: string; icon: React.ElementType; description: string }[] = [
  { id: "profile",    label: "Profile",    icon: User,    description: "Personal info, avatar, address" },
  { id: "appearance", label: "Appearance", icon: Palette, description: "Theme, display preferences" },
  { id: "security",   label: "Security",   icon: Lock,    description: "Password, account safety" },
];

type Theme = "light" | "dark" | "system";

// ── sub-components ─────────────────────────────────────────────────────────
function Field({
  label, required, error, hint, children,
}: {
  label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-foreground">
        {label}{required && <span className="text-primary ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-[10px] text-destructive">{error}</p>}
      {hint && !error && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ── Profile section ────────────────────────────────────────────────────────
function ProfileSection() {
  const { user, updateOptimistic } = useProfile();
  const profile = user?.profile;

  const [personal, setPersonal] = useState({
    firstName: profile?.firstName ?? "",
    lastName:  profile?.lastName  ?? "",
    phone:     profile?.phone     ?? "",
  });
  const [personalErrors, setPersonalErrors] = useState<Record<string, string>>({});
  const [savingPersonal, setSavingPersonal] = useState(false);

  const [address, setAddress] = useState({
    address:    profile?.address    ?? "",
    city:       profile?.city       ?? "",
    state:      profile?.state      ?? "",
    country:    profile?.country    ?? "",
    postalCode: profile?.postalCode ?? "",
  });
  const [savingAddress, setSavingAddress] = useState(false);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatarUrl ?? null);
  const [avatarFile, setAvatarFile]       = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput]             = useState("");
  const [deleting, setDeleting]                   = useState(false);

  // Sync when profile loads
  const [synced, setSynced] = useState(false);
  if (profile && !synced) {
    setPersonal({ firstName: profile.firstName ?? "", lastName: profile.lastName ?? "", phone: profile.phone ?? "" });
    setAddress({ address: profile.address ?? "", city: profile.city ?? "", state: profile.state ?? "", country: profile.country ?? "", postalCode: profile.postalCode ?? "" });
    setAvatarPreview(profile.avatarUrl ?? null);
    setSynced(true);
  }

  const displayName = profile?.firstName
    ? `${profile.firstName} ${profile.lastName ?? ""}`.trim()
    : user?.email?.split("@")[0] ?? "Chef";

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
      if (!res.ok) { const j = await res.json(); throw new Error(j?.message ?? "Failed to save."); }
      updateOptimistic(personal);
      setPersonalErrors({});
      toast.success("Personal info saved!");
    } catch (e) { toast.error((e as Error).message); }
    finally { setSavingPersonal(false); }
  };

  const saveAddress = async () => {
    setSavingAddress(true);
    try {
      const method = profile ? "PATCH" : "POST";
      const res = await fetch("/api/profile", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(address),
      });
      if (!res.ok) { const j = await res.json(); throw new Error(j?.message ?? "Failed to save."); }
      updateOptimistic(address);
      toast.success("Address saved!");
    } catch (e) { toast.error((e as Error).message); }
    finally { setSavingAddress(false); }
  };

  const handleDelete = async () => {
    if (deleteInput !== "DELETE") return;
    setDeleting(true);
    try {
      const res = await fetch("/api/profile", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete profile.");
      toast.success("Profile deleted.");
      setShowDeleteConfirm(false);
    } catch (e) { toast.error((e as Error).message); }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-6">
      {/* Avatar card */}
      <div className="bg-background rounded-2xl border border-border overflow-hidden">
        <div className="h-24 bg-gradient-to-br from-primary/20 via-secondary/10 to-[#007606]/10 relative">
          <div className="absolute inset-0 opacity-30"
            style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #DD3131 0%, transparent 50%), radial-gradient(circle at 80% 20%, #F4CD2E 0%, transparent 50%)" }} />
        </div>
        <div className="px-6 pb-5">
          <div className="flex items-end justify-between -mt-8 mb-3">
            <div className="relative">
              <div className="w-16 h-16 rounded-xl border-4 border-background bg-muted overflow-hidden flex items-center justify-center shadow-lg">
                {avatarPreview
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={avatarPreview} alt={displayName} className="w-full h-full object-cover" />
                  : <ChefHat className="w-7 h-7 text-muted-foreground" />}
              </div>
              <button onClick={() => avatarInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow hover:bg-primary/90 transition-colors">
                <Camera className="w-3 h-3" />
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            {avatarFile && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <Button onClick={handleAvatarUpload} disabled={uploadingAvatar}
                  className="bg-[#007606] hover:bg-[#007606]/90 text-white rounded-xl px-4 h-8 text-xs font-bold">
                  {uploadingAvatar
                    ? <span className="flex items-center gap-1.5"><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Uploading...</span>
                    : <span className="flex items-center gap-1.5"><Save className="w-3 h-3" />Save Photo</span>}
                </Button>
              </motion.div>
            )}
          </div>
          <div>
            <p className="text-sm font-black text-foreground">Chef {displayName}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Mail className="w-3 h-3" />{user?.email}
            </p>
            {profile?.city && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />
                {[profile.city, profile.country].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Personal info */}
      <div className="bg-background rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <p className="text-sm font-black text-foreground">Personal Information</p>
          <p className="text-xs text-muted-foreground mt-0.5">Your name and contact details</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First Name" required error={personalErrors.firstName}>
              <Input value={personal.firstName}
                onChange={(e) => { setPersonal((p) => ({ ...p, firstName: e.target.value })); setPersonalErrors((p) => ({ ...p, firstName: "" })); }}
                placeholder="e.g. Miriam"
                className={`rounded-xl ${personalErrors.firstName ? "border-destructive" : "border-border"}`} />
            </Field>
            <Field label="Last Name" required error={personalErrors.lastName}>
              <Input value={personal.lastName}
                onChange={(e) => { setPersonal((p) => ({ ...p, lastName: e.target.value })); setPersonalErrors((p) => ({ ...p, lastName: "" })); }}
                placeholder="e.g. Wanjiru"
                className={`rounded-xl ${personalErrors.lastName ? "border-destructive" : "border-border"}`} />
            </Field>
            <Field label="Phone Number" required error={personalErrors.phone}>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input value={personal.phone}
                  onChange={(e) => { setPersonal((p) => ({ ...p, phone: e.target.value })); setPersonalErrors((p) => ({ ...p, phone: "" })); }}
                  placeholder="0712 345 678"
                  className={`pl-9 rounded-xl ${personalErrors.phone ? "border-destructive" : "border-border"}`} />
              </div>
            </Field>
            <Field label="Email Address" hint="Email cannot be changed here.">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input value={user?.email ?? ""} disabled
                  className="pl-9 rounded-xl border-border bg-muted/40 text-muted-foreground cursor-not-allowed" />
              </div>
            </Field>
          </div>
          <div className="flex justify-end">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button onClick={savePersonal} disabled={savingPersonal}
                className="bg-primary hover:bg-primary/90 text-white rounded-full px-7 font-bold text-sm">
                {savingPersonal
                  ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</span>
                  : <span className="flex items-center gap-2"><Save className="w-3.5 h-3.5" />Save Changes</span>}
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="bg-background rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <p className="text-sm font-black text-foreground">Location & Address</p>
          <p className="text-xs text-muted-foreground mt-0.5">Used for delivery coordination</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label="Street Address">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input value={address.address} onChange={(e) => setAddress((p) => ({ ...p, address: e.target.value }))}
                    placeholder="e.g. 14 Westlands Road" className="pl-9 rounded-xl border-border" />
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
          <div className="flex justify-end">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button onClick={saveAddress} disabled={savingAddress}
                className="bg-primary hover:bg-primary/90 text-white rounded-full px-7 font-bold text-sm">
                {savingAddress
                  ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</span>
                  : <span className="flex items-center gap-2"><Save className="w-3.5 h-3.5" />Save Address</span>}
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-background rounded-2xl border border-destructive/30 overflow-hidden">
        <div className="px-6 py-4 border-b border-destructive/20 bg-destructive/5">
          <p className="text-sm font-black text-destructive flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />Danger Zone
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">These actions are irreversible.</p>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-bold text-foreground">Delete Profile</p>
              <p className="text-[10px] text-muted-foreground max-w-sm">
                Permanently remove your chef profile data. Your account remains but all profile info is erased.
              </p>
            </div>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(true)}
              className="border-destructive text-destructive hover:bg-destructive/5 rounded-xl text-xs font-bold px-5 flex-shrink-0">
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />Delete Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Delete confirm */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            onClick={(e) => e.target === e.currentTarget && setShowDeleteConfirm(false)}>
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
              <Input value={deleteInput} onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="Type DELETE" className="rounded-xl border-border" />
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }}
                  className="rounded-full border-border px-6">Cancel</Button>
                <Button onClick={handleDelete} disabled={deleteInput !== "DELETE" || deleting}
                  className="bg-destructive hover:bg-destructive/90 text-white rounded-full px-6 font-bold">
                  {deleting
                    ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Deleting...</span>
                    : "Delete Profile"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Appearance section ─────────────────────────────────────────────────────
function AppearanceSection() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system";
    return (localStorage.getItem("theme") as Theme) ?? "system";
  });

  const applyTheme = (t: Theme) => {
    setTheme(t);
    localStorage.setItem("theme", t);
    const root = document.documentElement;
    if (t === "dark") root.classList.add("dark");
    else if (t === "light") root.classList.remove("dark");
    else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      prefersDark ? root.classList.add("dark") : root.classList.remove("dark");
    }
    toast.success(`Theme set to ${t}.`);
  };

  const THEMES: { id: Theme; label: string; icon: React.ElementType; description: string }[] = [
    { id: "light",  label: "Light",  icon: Sun,     description: "Clean white interface" },
    { id: "dark",   label: "Dark",   icon: Moon,    description: "Easy on the eyes at night" },
    { id: "system", label: "System", icon: Monitor, description: "Follows your device setting" },
  ];

  return (
    <div className="space-y-4">
      {/* Theme picker */}
      <div className="bg-background rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <p className="text-sm font-black text-foreground">Theme</p>
          <p className="text-xs text-muted-foreground mt-0.5">Choose your preferred colour scheme</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {THEMES.map((t) => {
              const Icon = t.icon;
              const active = theme === t.id;
              return (
                <motion.button
                  key={t.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => applyTheme(t.id)}
                  className={`flex flex-col items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                    active
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30 bg-background"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    active ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${active ? "text-primary" : "text-foreground"}`}>
                      {t.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{t.description}</p>
                  </div>
                  {active && (
                    <CheckCircle2 className="w-4 h-4 text-primary absolute top-3 right-3" />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Display preferences */}
      <div className="bg-background rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <p className="text-sm font-black text-foreground">Display Preferences</p>
          <p className="text-xs text-muted-foreground mt-0.5">Customise your dashboard experience</p>
        </div>
        <div className="divide-y divide-border">
          {[
            { label: "Compact table rows",        sub: "Show more data with smaller row height",   key: "compact" },
            { label: "Show order notifications",  sub: "Pop-up alerts for new incoming orders",    key: "notifs" },
            { label: "Auto-refresh dashboard",    sub: "Refresh stats every 60 seconds",           key: "autoRefresh" },
          ].map((pref) => (
            <ToggleRow key={pref.key} label={pref.label} sub={pref.sub} storageKey={pref.key} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, sub, storageKey }: { label: string; sub: string; storageKey: string }) {
  const [on, setOn] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(`pref_${storageKey}`) === "true";
  });

  const toggle = () => {
    const next = !on;
    setOn(next);
    localStorage.setItem(`pref_${storageKey}`, String(next));
    toast.success(`${label} ${next ? "enabled" : "disabled"}.`);
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 gap-4">
      <div>
        <p className="text-xs font-bold text-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground">{sub}</p>
      </div>
      <button onClick={toggle}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${on ? "bg-[#007606]" : "bg-muted-foreground/30"}`}>
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${on ? "left-5" : "left-0.5"}`} />
      </button>
    </div>
  );
}

// ── Security section ───────────────────────────────────────────────────────
function SecuritySection() {
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw]         = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const errs: Record<string, string> = {};
    if (!form.current)              errs.current = "Enter your current password.";
    if (form.next.length < 8)       errs.next    = "At least 8 characters.";
    if (form.next !== form.confirm) errs.confirm  = "Passwords do not match.";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);
    try {
      // Wire up to your change-password endpoint when ready
      await new Promise((r) => setTimeout(r, 800));
      toast.success("Password changed successfully!");
      setForm({ current: "", next: "", confirm: "" });
      setErrors({});
    } catch {
      toast.error("Failed to change password.");
    } finally {
      setSaving(false);
    }
  };

  const PwInput = ({
    value, onChange, show, onToggle, placeholder, error,
  }: {
    value: string; onChange: (v: string) => void;
    show: boolean; onToggle: () => void;
    placeholder: string; error?: string;
  }) => (
    <div className="space-y-1.5">
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input type={show ? "text" : "password"} value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`pl-9 pr-10 rounded-xl ${error ? "border-destructive" : "border-border"}`} />
        <button type="button" onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-[10px] text-destructive">{error}</p>}
    </div>
  );

  // Import Eye / EyeOff at top of file
  const { Eye, EyeOff } = require("lucide-react"); // eslint-disable-line

  return (
    <div className="space-y-4">
      <div className="bg-background rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <p className="text-sm font-black text-foreground">Change Password</p>
          <p className="text-xs text-muted-foreground mt-0.5">Use a strong password you don&apos;t use elsewhere</p>
        </div>
        <div className="p-6 space-y-4">
          <Field label="Current Password" error={errors.current}>
            <PwInput value={form.current} onChange={(v) => { setForm((p) => ({ ...p, current: v })); setErrors((p) => ({ ...p, current: "" })); }}
              show={showCurrentPw} onToggle={() => setShowCurrentPw((p) => !p)}
              placeholder="Your current password" error={errors.current} />
          </Field>
          <Field label="New Password" error={errors.next} hint="Minimum 8 characters">
            <PwInput value={form.next} onChange={(v) => { setForm((p) => ({ ...p, next: v })); setErrors((p) => ({ ...p, next: "" })); }}
              show={showNewPw} onToggle={() => setShowNewPw((p) => !p)}
              placeholder="New password" error={errors.next} />
          </Field>
          <Field label="Confirm New Password" error={errors.confirm}>
            <PwInput value={form.confirm} onChange={(v) => { setForm((p) => ({ ...p, confirm: v })); setErrors((p) => ({ ...p, confirm: "" })); }}
              show={showConfirmPw} onToggle={() => setShowConfirmPw((p) => !p)}
              placeholder="Repeat new password" error={errors.confirm} />
          </Field>
          <div className="flex justify-end pt-1">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button onClick={handleSave} disabled={saving}
                className="bg-primary hover:bg-primary/90 text-white rounded-full px-7 font-bold text-sm">
                {saving
                  ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</span>
                  : <span className="flex items-center gap-2"><Save className="w-3.5 h-3.5" />Update Password</span>}
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Session info placeholder */}
      <div className="bg-background rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <p className="text-sm font-black text-foreground">Active Sessions</p>
          <p className="text-xs text-muted-foreground mt-0.5">Devices currently logged into your account</p>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#007606]/10 flex items-center justify-center">
                <Monitor className="w-4 h-4 text-[#007606]" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Current Session</p>
                <p className="text-[10px] text-muted-foreground">Web browser · Active now</p>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-[#007606]/10 text-[#007606] px-2 py-1 rounded-full">
              Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main TabSettings ───────────────────────────────────────────────────────
export function TabSettings() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div {...fadeUp(0)} className="mb-6">
        <h2 className="text-xl font-black text-foreground flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          Settings
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage your profile, appearance and security
        </p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Sidebar nav */}
        <motion.div {...fadeUp(0.05)} className="lg:w-56 flex-shrink-0">
          <div className="bg-background rounded-2xl border border-border overflow-hidden sticky top-24">
            {SECTIONS.map((s, i) => {
              const Icon = s.icon;
              const active = activeSection === s.id;
              return (
                <button key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors border-b border-border last:border-0 ${
                    active ? "bg-primary/5 text-primary" : "text-foreground hover:bg-muted/50"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    active ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold ${active ? "text-primary" : "text-foreground"}`}>
                      {s.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">{s.description}</p>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${active ? "text-primary rotate-90" : "text-muted-foreground"}`} />
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {activeSection === "profile" && (
              <motion.div key="profile"
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
                <ProfileSection />
              </motion.div>
            )}
            {activeSection === "appearance" && (
              <motion.div key="appearance"
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
                <AppearanceSection />
              </motion.div>
            )}
            {activeSection === "security" && (
              <motion.div key="security"
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
                <SecuritySection />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}