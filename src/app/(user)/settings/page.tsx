"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, MapPin, Bell, Palette, Shield, Trash2,
  Camera, Check, ChevronRight, Sun, Moon, Monitor,
  Phone, Mail, Lock, Eye, EyeOff, AlertTriangle,
  Save, X, Loader2, CheckCircle2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { uploadFile } from "@/lib/supabase-upload";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────
interface UserProfile {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  avatarUrl: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
}

type ThemeOption = "light" | "dark" | "system";
type SettingsSection =
  | "profile" | "address" | "notifications"
  | "appearance" | "security" | "danger";

const SECTIONS: {
  id: SettingsSection; label: string;
  icon: React.ElementType; description: string;
}[] = [
  { id: "profile",       label: "Profile",      icon: User,    description: "Name, photo & contact" },
  { id: "address",       label: "Address",       icon: MapPin,  description: "Delivery location" },
  { id: "notifications", label: "Notifications", icon: Bell,    description: "Alerts & reminders" },
  { id: "appearance",    label: "Appearance",    icon: Palette, description: "Theme & display" },
  { id: "security",      label: "Security",      icon: Shield,  description: "Password & sessions" },
  { id: "danger",        label: "Danger Zone",   icon: Trash2,  description: "Delete account" },
];

const EMPTY: UserProfile = {
  firstName: "", lastName: "", phone: "", email: "",
  avatarUrl: null, address: null, city: null, state: null,
  country: null, postalCode: null, latitude: null, longitude: null,
};

// ── Helpers ────────────────────────────────────────────────────────────────
function Field({ label, hint, children }: {
  label: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-foreground">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Card({ title, description, children }: {
  title: string; description?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-sm font-black text-foreground">{title}</h3>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Toggle({ value, onChange, label, sub }: {
  value: boolean; onChange: (v: boolean) => void; label: string; sub?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-border/50 last:border-0">
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
          value ? "bg-[#007606]" : "bg-muted-foreground/30"
        }`}
      >
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${
          value ? "left-5" : "left-0.5"
        }`} />
      </button>
    </div>
  );
}

function DeleteModal({ onClose }: { onClose: () => void }) {
  const [val, setVal]         = useState("");
  const [deleting, setDeleting] = useState(false);
  const PHRASE = "DELETE MY ACCOUNT";

  const go = async () => {
    if (val !== PHRASE) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/profile", { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Account deleted.");
      window.location.href = "/auth/login";
    } catch {
      toast.error("Failed. Please try again.");
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-50 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.25 }}
        className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-md p-6 space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-black text-foreground">Delete Account</h2>
            <p className="text-xs text-muted-foreground">Permanent and irreversible.</p>
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground mb-1.5">This will permanently remove:</p>
          {[
            "Profile & personal data",
            "All order history",
            "Active subscriptions",
            "Wallet balance",
          ].map((item) => (
            <p key={item} className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
              {item}
            </p>
          ))}
        </div>

        <Field label={`Type "${PHRASE}" to confirm`}>
          <Input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder={PHRASE}
            className="rounded-xl border-border font-mono text-xs"
          />
        </Field>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">
            Cancel
          </Button>
          <Button
            onClick={go}
            disabled={val !== PHRASE || deleting}
            className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold disabled:opacity-40"
          >
            {deleting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />Deleting...
              </span>
            ) : "Delete Account"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [section, setSection]       = useState<SettingsSection>("profile");
  const [profile, setProfile]       = useState<UserProfile>(EMPTY);
  const [draft,   setDraft]         = useState<UserProfile>(EMPTY);
  const [loading, setLoading]       = useState(true);
  const [saving,  setSaving]        = useState(false);
  const [dirty,   setDirty]         = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const [theme, setTheme] = useState<ThemeOption>(() => {
    if (typeof window === "undefined") return "system";
    return (localStorage.getItem("theme") as ThemeOption) ?? "system";
  });

  const [showPw,      setShowPw]      = useState(false);
  const [currentPwd,  setCurrentPwd]  = useState("");
  const [newPwd,      setNewPwd]      = useState("");
  const [confirmPwd,  setConfirmPwd]  = useState("");
  const [changingPwd, setChangingPwd] = useState(false);
  const [pwSaved,     setPwSaved]     = useState(false);

  const [notifs, setNotifs] = useState({
    orderUpdates:   true,
    deliveryAlerts: true,
    mealReminders:  true,
    promotions:     false,
    newChefs:       false,
    weeklyDigest:   true,
  });

  const avatarRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────
const load = useCallback(async () => {
  setLoading(true);
  try {
    const res = await fetch("/api/profile", { cache: "no-store" });
    if (!res.ok) return;
    const json = await res.json();
    const p = json?.data?.profile; // ← was `json?.data`
    if (!p) return;

    const mapped: UserProfile = {
      firstName:  p.firstName  ?? "",
      lastName:   p.lastName   ?? "",
      phone:      p.phone      ?? "",
      email:      p.user?.email ?? "",  // ← email lives on p.user
      avatarUrl:  p.avatarUrl  ?? null,
      address:    p.address    ?? null,
      city:       p.city       ?? null,
      state:      p.state      ?? null,
      country:    p.country    ?? null,
      postalCode: p.postalCode ?? null,
      latitude:   p.latitude   ?? null,
      longitude:  p.longitude  ?? null,
    };

    setProfile(mapped);
    setDraft(mapped);
  } catch {
    toast.error("Failed to load settings.");
  } finally {
    setLoading(false);
  }
}, []);

  useEffect(() => { load(); }, [load]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const set = <K extends keyof UserProfile>(k: K, v: UserProfile[K]) => {
    setDraft((p) => ({ ...p, [k]: v }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};

      if (draft.firstName)  payload.firstName  = draft.firstName;
      if (draft.lastName)   payload.lastName   = draft.lastName;
      if (draft.phone)      payload.phone      = draft.phone;
      if (draft.avatarUrl  !== undefined) payload.avatarUrl  = draft.avatarUrl;
      if (draft.address    !== undefined) payload.address    = draft.address;
      if (draft.city       !== undefined) payload.city       = draft.city;
      if (draft.state      !== undefined) payload.state      = draft.state;
      if (draft.country    !== undefined) payload.country    = draft.country;
      if (draft.postalCode !== undefined) payload.postalCode = draft.postalCode;
      if (draft.latitude   !== undefined) payload.latitude   = draft.latitude;
      if (draft.longitude  !== undefined) payload.longitude  = draft.longitude;

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error((await res.json())?.message ?? "Failed to save.");

      setProfile(draft);
      setDirty(false);
      toast.success("Saved!");

      // Tell UserNav to refresh name/avatar without page reload
      window.dispatchEvent(new CustomEvent("profile-updated"));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    setUploadingAvatar(true);
    try {
      const url = await uploadFile("user-avatars", file, "avatars/");
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: url }),
      });
      setProfile((p) => ({ ...p, avatarUrl: url }));
      setDraft((p)   => ({ ...p, avatarUrl: url }));
      toast.success("Photo updated!");
      window.dispatchEvent(new CustomEvent("profile-updated"));
    } catch {
      toast.error("Upload failed.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const applyTheme = (t: ThemeOption) => {
    setTheme(t);
    localStorage.setItem("theme", t);
    const root = document.documentElement;
    if (t === "dark")       root.classList.add("dark");
    else if (t === "light") root.classList.remove("dark");
    else {
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? root.classList.add("dark")
        : root.classList.remove("dark");
    }
    toast.success(`Theme: ${t}`);
  };

  const changePassword = async () => {
    if (!currentPwd || newPwd.length < 8 || newPwd !== confirmPwd) {
      toast.error("Check your password fields.");
      return;
    }
    setChangingPwd(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      setPwSaved(true);
      toast.success("Password updated!");
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
      setTimeout(() => setPwSaved(false), 3000);
    } catch {
      toast.error("Failed.");
    } finally {
      setChangingPwd(false);
    }
  };

  const fullName = draft.firstName
    ? `${draft.firstName} ${draft.lastName}`.trim()
    : draft.email?.split("@")[0] ?? "Your Account";

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 animate-pulse">
        <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
          <div className="h-8 w-40 bg-muted rounded-xl" />
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-56 space-y-2">
              <div className="h-16 bg-muted rounded-2xl" />
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-14 bg-muted rounded-xl" />
              ))}
            </div>
            <div className="flex-1 space-y-4">
              <div className="h-36 bg-muted rounded-2xl" />
              <div className="h-64 bg-muted rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your profile, preferences and security
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Sidebar ── */}
          <motion.aside
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 }}
            className="lg:w-56 flex-shrink-0"
          >
            {/* Avatar summary */}
            <div className="bg-background rounded-2xl border border-border p-4 flex items-center gap-3 mb-3 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 overflow-hidden flex items-center justify-center flex-shrink-0">
                {profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-base font-black text-primary">
                    {fullName[0]?.toUpperCase() ?? "?"}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-foreground truncate">{fullName}</p>
                <p className="text-[10px] text-muted-foreground truncate">{profile.email}</p>
              </div>
            </div>

            {/* Nav */}
            <div className="bg-background rounded-2xl border border-border overflow-hidden shadow-sm">
              {SECTIONS.map((s) => {
                const Icon    = s.icon;
                const active  = section === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSection(s.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors border-b border-border last:border-0 ${
                      active ? "bg-primary/5" : "hover:bg-muted/50"
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
                    <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 ${
                      active ? "text-primary" : "text-muted-foreground opacity-0"
                    }`} />
                  </button>
                );
              })}
            </div>
          </motion.aside>

          {/* ── Content ── */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.12 }}
            className="flex-1 min-w-0 space-y-4"
          >
            {/* Unsaved changes banner */}
            <AnimatePresence>
              {dirty && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-secondary/10 border border-secondary/30 rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                >
                  <p className="text-sm font-semibold text-secondary-foreground">
                    Unsaved changes
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setDraft(profile); setDirty(false); }}
                      className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />Discard
                    </button>
                    <Button
                      onClick={save}
                      disabled={saving}
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold px-4 h-8"
                    >
                      {saving ? (
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="w-3 h-3 animate-spin" />Saving
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <Save className="w-3.5 h-3.5" />Save
                        </span>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">

              {/* ── Profile ── */}
              {section === "profile" && (
                <motion.div key="profile"
                  initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {/* Avatar hero card */}
                  <div className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden">
                    <div className="h-20 bg-gradient-to-br from-primary/20 via-secondary/10 to-[#007606]/10 relative">
                      <div
                        className="absolute inset-0 opacity-20"
                        style={{
                          backgroundImage:
                            "radial-gradient(circle at 25% 60%, #DD3131 0%, transparent 50%), radial-gradient(circle at 75% 30%, #F4CD2E 0%, transparent 50%)",
                        }}
                      />
                    </div>
                    <div className="px-6 pb-5">
                      <div className="flex items-end justify-between -mt-8 mb-3">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-xl border-4 border-background bg-muted overflow-hidden flex items-center justify-center shadow-lg">
                            {draft.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={draft.avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl font-black text-primary">
                                {fullName[0]?.toUpperCase() ?? "?"}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => avatarRef.current?.click()}
                            disabled={uploadingAvatar}
                            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow hover:bg-primary/90 transition-colors"
                          >
                            {uploadingAvatar ? (
                              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <Camera className="w-3 h-3" />
                            )}
                          </button>
                          <input
                            ref={avatarRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }}
                          />
                        </div>
                        <button
                          onClick={() => avatarRef.current?.click()}
                          className="text-xs font-bold text-primary border border-primary/30 rounded-xl px-3 py-1.5 hover:bg-primary/5 transition-colors"
                        >
                          Change Photo
                        </button>
                      </div>
                      <p className="text-sm font-black text-foreground">{fullName}</p>
                      <p className="text-xs text-muted-foreground">{profile.email}</p>
                    </div>
                  </div>

                  {/* Personal fields */}
                  <Card title="Personal Information" description="Your name and contact details">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="First Name *">
                        <Input
                          value={draft.firstName}
                          onChange={(e) => set("firstName", e.target.value)}
                          placeholder="First name"
                          className="rounded-xl border-border"
                        />
                      </Field>
                      <Field label="Last Name *">
                        <Input
                          value={draft.lastName}
                          onChange={(e) => set("lastName", e.target.value)}
                          placeholder="Last name"
                          className="rounded-xl border-border"
                        />
                      </Field>
                      <Field label="Phone">
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <Input
                            value={draft.phone}
                            onChange={(e) => set("phone", e.target.value)}
                            placeholder="+254 7XX XXX XXX"
                            className="pl-9 rounded-xl border-border"
                          />
                        </div>
                      </Field>
                      <Field label="Email" hint="Contact support to change your email">
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <Input
                            value={draft.email}
                            disabled
                            className="pl-9 rounded-xl border-border bg-muted text-muted-foreground cursor-not-allowed"
                          />
                        </div>
                      </Field>
                    </div>
                    <div className="flex justify-end mt-5">
                      <Button
                        onClick={save}
                        disabled={!dirty || saving}
                        className="bg-primary hover:bg-primary/90 text-white rounded-xl font-bold px-7 disabled:opacity-40"
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* ── Address ── */}
              {section === "address" && (
                <motion.div key="address"
                  initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}
                >
                  <Card title="Delivery Address" description="Used when placing orders and subscribing to meal plans">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <Field label="Street Address">
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <Input
                              value={draft.address ?? ""}
                              onChange={(e) => set("address", e.target.value || null)}
                              placeholder="e.g. 14 Mwangi Road"
                              className="pl-9 rounded-xl border-border"
                            />
                          </div>
                        </Field>
                      </div>
                      <Field label="City">
                        <Input
                          value={draft.city ?? ""}
                          onChange={(e) => set("city", e.target.value || null)}
                          placeholder="Nairobi"
                          className="rounded-xl border-border"
                        />
                      </Field>
                      <Field label="State / County">
                        <Input
                          value={draft.state ?? ""}
                          onChange={(e) => set("state", e.target.value || null)}
                          placeholder="Nairobi County"
                          className="rounded-xl border-border"
                        />
                      </Field>
                      <Field label="Country">
                        <Input
                          value={draft.country ?? ""}
                          onChange={(e) => set("country", e.target.value || null)}
                          placeholder="Kenya"
                          className="rounded-xl border-border"
                        />
                      </Field>
                      <Field label="Postal Code">
                        <Input
                          value={draft.postalCode ?? ""}
                          onChange={(e) => set("postalCode", e.target.value || null)}
                          placeholder="00100"
                          className="rounded-xl border-border"
                        />
                      </Field>
                    </div>

                    {(draft.latitude || draft.longitude) && (
                      <div className="mt-4 p-3 rounded-xl bg-muted/50 border border-border flex gap-6">
                        <div className="text-xs">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Latitude</p>
                          <p className="font-mono font-bold text-foreground">{draft.latitude?.toFixed(6)}</p>
                        </div>
                        <div className="text-xs">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Longitude</p>
                          <p className="font-mono font-bold text-foreground">{draft.longitude?.toFixed(6)}</p>
                        </div>
                        <p className="text-[10px] text-muted-foreground self-end ml-auto">Set via location</p>
                      </div>
                    )}

                    <div className="flex justify-end mt-5">
                      <Button
                        onClick={save}
                        disabled={!dirty || saving}
                        className="bg-primary hover:bg-primary/90 text-white rounded-xl font-bold px-7 disabled:opacity-40"
                      >
                        {saving ? "Saving..." : "Save Address"}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* ── Notifications ── */}
              {section === "notifications" && (
                <motion.div key="notifications"
                  initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}
                >
                  <Card title="Notifications" description="Choose what you hear from us">
                    <Toggle
                      value={notifs.orderUpdates}
                      onChange={(v) => setNotifs((p) => ({ ...p, orderUpdates: v }))}
                      label="Order Updates"
                      sub="Confirmations, status changes and cancellations"
                    />
                    <Toggle
                      value={notifs.deliveryAlerts}
                      onChange={(v) => setNotifs((p) => ({ ...p, deliveryAlerts: v }))}
                      label="Delivery Alerts"
                      sub="Real-time delivery and pickup notifications"
                    />
                    <Toggle
                      value={notifs.mealReminders}
                      onChange={(v) => setNotifs((p) => ({ ...p, mealReminders: v }))}
                      label="Meal Reminders"
                      sub="30 minutes before each scheduled meal"
                    />
                    <Toggle
                      value={notifs.promotions}
                      onChange={(v) => setNotifs((p) => ({ ...p, promotions: v }))}
                      label="Promotions & Offers"
                      sub="Discounts, deals and limited-time offers"
                    />
                    <Toggle
                      value={notifs.newChefs}
                      onChange={(v) => setNotifs((p) => ({ ...p, newChefs: v }))}
                      label="New Kitchens Near You"
                      sub="When a new chef joins in your area"
                    />
                    <Toggle
                      value={notifs.weeklyDigest}
                      onChange={(v) => setNotifs((p) => ({ ...p, weeklyDigest: v }))}
                      label="Weekly Digest"
                      sub="Your meal summary every Monday morning"
                    />
                  </Card>
                </motion.div>
              )}

              {/* ── Appearance ── */}
              {section === "appearance" && (
                <motion.div key="appearance"
                  initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <Card title="Theme" description="Choose how QavaEat looks for you">
                    <div className="grid grid-cols-3 gap-3">
                      {([
                        { value: "light"  as ThemeOption, label: "Light",  icon: Sun,     bg: "bg-white",    inner: "bg-muted" },
                        { value: "dark"   as ThemeOption, label: "Dark",   icon: Moon,    bg: "bg-[#1A1A1A]", inner: "bg-[#2E2E2E]" },
                        { value: "system" as ThemeOption, label: "System", icon: Monitor, bg: "bg-gradient-to-br from-white to-[#1A1A1A]", inner: "bg-muted" },
                      ]).map(({ value, label, icon: Icon, bg, inner }) => {
                        const active = theme === value;
                        return (
                          <motion.button
                            key={value}
                            onClick={() => applyTheme(value)}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className={`relative flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all ${
                              active
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/30 bg-background"
                            }`}
                          >
                            <div className={`w-full h-14 rounded-xl ${bg} border border-border/50 flex items-center justify-center`}>
                              <div className={`w-8 h-8 rounded-lg ${inner}`} />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Icon className={`w-3.5 h-3.5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                              <span className={`text-xs font-bold ${active ? "text-primary" : "text-foreground"}`}>
                                {label}
                              </span>
                            </div>
                            {active && (
                              <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </span>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </Card>

                  <Card title="Display Preferences" description="Fine-tune your experience">
                    <Toggle value={false} onChange={() => {}} label="Compact Mode"   sub="Show more items with less spacing" />
                    <Toggle value={true}  onChange={() => {}} label="Animations"     sub="Smooth transitions throughout the app" />
                    <Toggle value={true}  onChange={() => {}} label="Show Prices"    sub="Display prices on menu item cards" />
                    <Toggle value={false} onChange={() => {}} label="Show Calories"  sub="Display calorie counts where available" />
                  </Card>
                </motion.div>
              )}

              {/* ── Security ── */}
              {section === "security" && (
                <motion.div key="security"
                  initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <Card title="Change Password" description="Use a strong password of at least 8 characters">
                    <div className="space-y-4 max-w-sm">
                      {[
                        { label: "Current Password", value: currentPwd, setter: setCurrentPwd },
                        { label: "New Password",     value: newPwd,     setter: setNewPwd },
                        { label: "Confirm Password", value: confirmPwd, setter: setConfirmPwd },
                      ].map(({ label, value, setter }) => (
                        <Field key={label} label={label}>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <Input
                              type={showPw ? "text" : "password"}
                              value={value}
                              onChange={(e) => setter(e.target.value)}
                              placeholder={label}
                              className={`pl-9 pr-10 rounded-xl ${
                                label === "Confirm Password" && confirmPwd && confirmPwd !== newPwd
                                  ? "border-primary"
                                  : "border-border"
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPw((p) => !p)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {label === "Confirm Password" && confirmPwd && confirmPwd !== newPwd && (
                            <p className="text-[10px] text-primary">Passwords do not match</p>
                          )}
                        </Field>
                      ))}

                      <Button
                        onClick={changePassword}
                        disabled={!currentPwd || newPwd.length < 8 || newPwd !== confirmPwd || changingPwd}
                        className="bg-primary hover:bg-primary/90 text-white rounded-xl font-bold px-7 disabled:opacity-40"
                      >
                        {changingPwd ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />Updating...
                          </span>
                        ) : pwSaved ? (
                          <span className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5" />Updated!
                          </span>
                        ) : "Update Password"}
                      </Button>
                    </div>
                  </Card>

                  <Card title="Active Sessions" description="Devices currently signed into your account">
                    <div className="space-y-2">
                      {[
                        { device: "Chrome on Desktop", location: "Nairobi, Kenya", time: "Active now", current: true },
                        { device: "Safari on iPhone",  location: "Nairobi, Kenya", time: "2h ago",     current: false },
                      ].map((s, i) => (
                        <div key={i}
                          className="flex items-center justify-between p-3.5 rounded-xl border border-border hover:bg-muted/30 transition-colors"
                        >
                          <div>
                            <p className="text-sm font-semibold text-foreground">{s.device}</p>
                            <p className="text-[11px] text-muted-foreground">{s.location} · {s.time}</p>
                          </div>
                          {s.current ? (
                            <span className="text-[10px] font-black text-[#007606] bg-[#007606]/10 px-2.5 py-1 rounded-full">
                              This device
                            </span>
                          ) : (
                            <button className="text-xs text-primary font-semibold hover:underline">
                              Sign out
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* ── Danger Zone ── */}
              {section === "danger" && (
                <motion.div key="danger"
                  initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}
                >
                  <div className="bg-background rounded-2xl border-2 border-primary/30 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-primary/20 bg-primary/5">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-primary" />
                        <h2 className="text-sm font-black text-primary">Danger Zone</h2>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        These actions cannot be undone
                      </p>
                    </div>
                    <div className="px-6 py-5 space-y-3">
                      {[
                        {
                          title: "Export My Data",
                          sub: "Download a copy of all your personal data",
                          label: "Export",
                          action: () => toast.success("Export requested. Check your email shortly."),
                        },
                        {
                          title: "Deactivate Account",
                          sub: "Temporarily hide your account. Reactivate anytime.",
                          label: "Deactivate",
                          action: () => toast.success("Account deactivated."),
                        },
                      ].map((item) => (
                        <div key={item.title}
                          className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted/20 transition-colors"
                        >
                          <div>
                            <p className="text-sm font-bold text-foreground">{item.title}</p>
                            <p className="text-[11px] text-muted-foreground">{item.sub}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={item.action}
                            className="rounded-xl border-border text-xs font-bold px-4 flex-shrink-0"
                          >
                            {item.label}
                          </Button>
                        </div>
                      ))}

                      <div className="flex items-center justify-between p-4 rounded-xl border-2 border-primary/25 bg-primary/5">
                        <div>
                          <p className="text-sm font-black text-primary">Delete Account</p>
                          <p className="text-[11px] text-muted-foreground">
                            Permanently remove your account and all data.
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => setShowDelete(true)}
                          className="rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold px-4 flex-shrink-0"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showDelete && <DeleteModal onClose={() => setShowDelete(false)} />}
      </AnimatePresence>
    </div>
  );
}