
"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, MapPin, Bell, Palette, Shield, Trash2,
  Camera, Check, ChevronRight, Sun, Moon, Monitor,
  Phone, Mail, Lock, Eye, EyeOff, AlertTriangle,
  Save, X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { uploadFile } from "@/lib/supabase-upload";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────
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
type ProfileSection =
  | "personal"
  | "address"
  | "notifications"
  | "appearance"
  | "security"
  | "danger";

// ── Dummy initial data ─────────────────────────────────
const INITIAL_PROFILE: UserProfile = {
  firstName: "Jimmy",
  lastName: "James",
  phone: "+254 712 345 678",
  email: "jimmy.james@example.com",
  avatarUrl: null,
  address: "14 Mwangi Road",
  city: "Nairobi",
  state: "Nairobi",
  country: "Kenya",
  postalCode: "00100",
  latitude: -1.2921,
  longitude: 36.8219,
};

// ── Sidebar nav items ──────────────────────────────────
const SECTIONS: { id: ProfileSection; label: string; icon: React.ElementType; description: string }[] = [
  { id: "personal", label: "Personal Info", icon: User, description: "Your name, photo and contact" },
  { id: "address", label: "Address", icon: MapPin, description: "Delivery and location details" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "What you hear from us" },
  { id: "appearance", label: "Appearance", icon: Palette, description: "Theme and display settings" },
  { id: "security", label: "Security", icon: Shield, description: "Password and account access" },
  { id: "danger", label: "Danger Zone", icon: Trash2, description: "Delete your account" },
];

// ── Avatar uploader ────────────────────────────────────
function AvatarUploader({ avatarUrl, name, onUpload }: {
  avatarUrl: string | null;
  name: string;
  onUpload: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadFile("chef-profiles", file, "user-avatars/");
      onUpload(url);
      toast.success("Photo updated!");
    } catch {
      toast.error("Failed to upload photo.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-5">
      <div className="relative flex-shrink-0">
        <div className="w-20 h-20 rounded-2xl bg-muted border-2 border-border overflow-hidden flex items-center justify-center">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-black text-primary">{name[0]?.toUpperCase()}</span>
          )}
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
        >
          {uploading
            ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Camera className="w-3.5 h-3.5" />}
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>
      <div>
        <p className="text-sm font-bold text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG or WebP · Max 2MB</p>
        <button onClick={() => inputRef.current?.click()}
          className="text-xs text-primary font-semibold mt-1 hover:underline">
          Change photo
        </button>
      </div>
    </div>
  );
}

// ── Section wrapper ────────────────────────────────────
function SectionCard({ title, description, children }: {
  title: string; description?: string; children: React.ReactNode;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
      className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-border">
        <h2 className="text-base font-black text-foreground">{title}</h2>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </motion.div>
  );
}

// ── Field ──────────────────────────────────────────────
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-foreground">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ── Toggle switch ──────────────────────────────────────
function Toggle({ value, onChange, label, sub }: {
  value: boolean; onChange: (v: boolean) => void; label: string; sub?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      <button onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${value ? "bg-primary" : "bg-muted-foreground/30"}`}>
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${value ? "left-5" : "left-0.5"}`} />
      </button>
    </div>
  );
}

// ── Delete confirmation modal ──────────────────────────
function DeleteModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const CONFIRM_TEXT = "DELETE MY ACCOUNT";

  const handleDelete = async () => {
    if (confirmation !== CONFIRM_TEXT) return;
    setDeleting(true);
    await new Promise(r => setTimeout(r, 1500));
    toast.success("Account scheduled for deletion.");
    setDeleting(false);
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-50 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.3 }}
        className="bg-background rounded-2xl border border-destructive/30 shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h2 className="text-base font-black text-foreground">Delete Account</h2>
            <p className="text-xs text-muted-foreground">This action is permanent and irreversible.</p>
          </div>
        </div>

        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 text-xs text-muted-foreground space-y-1.5">
          <p>Deleting your account will permanently remove:</p>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            <li>Your profile and personal data</li>
            <li>All order history</li>
            <li>Active meal plan subscriptions</li>
            <li>Wallet balance and transaction history</li>
          </ul>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground">
            Type <span className="text-destructive font-black">{CONFIRM_TEXT}</span> to confirm
          </label>
          <Input value={confirmation} onChange={e => setConfirmation(e.target.value)}
            placeholder={CONFIRM_TEXT} className="rounded-xl border-border font-mono text-sm" />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl border-border">Cancel</Button>
          <Button onClick={handleDelete}
            disabled={confirmation !== CONFIRM_TEXT || deleting}
            className="flex-1 rounded-xl bg-destructive hover:bg-destructive/90 text-white font-bold disabled:opacity-40">
            {deleting
              ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Deleting...</span>
              : "Delete Account"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────
export default function ProfilePage() {
  const [activeSection, setActiveSection] = useState<ProfileSection>("personal");
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [draft, setDraft] = useState<UserProfile>(INITIAL_PROFILE);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [theme, setTheme] = useState<ThemeOption>("system");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  // Notifications
  const [notifs, setNotifs] = useState({
    orderUpdates: true,
    promotions: false,
    mealReminders: true,
    newChefs: false,
    deliveryAlerts: true,
    weeklyDigest: true,
  });

  const setField = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    setDraft(p => ({ ...p, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // POST to NEXT_PUBLIC_API_URL/users/profile
      await new Promise(r => setTimeout(r, 900));
      setProfile(draft);
      setIsDirty(false);
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setDraft(profile);
    setIsDirty(false);
  };

  const handlePasswordChange = async () => {
    if (!currentPwd || !newPwd || newPwd !== confirmPwd) {
      toast.error("Please fill all fields and ensure passwords match.");
      return;
    }
    await new Promise(r => setTimeout(r, 800));
    toast.success("Password changed successfully!");
    setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
  };

  const fullName = `${profile.firstName} ${profile.lastName}`;

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

        {/* Page header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-foreground">My Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your account settings and preferences</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">

          {/* ── Sidebar ── */}
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="space-y-2 h-fit">

            {/* Profile summary card */}
            <div className="bg-background rounded-2xl border border-border p-4 flex items-center gap-3 mb-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-black text-primary">{profile.firstName[0]}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-foreground truncate">{fullName}</p>
                <p className="text-[11px] text-muted-foreground truncate">{profile.email}</p>
              </div>
            </div>

            {/* Nav items */}
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const active = activeSection === section.id;
              const isDanger = section.id === "danger";
              return (
                <motion.button key={section.id} onClick={() => setActiveSection(section.id)}
                  whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                    active
                      ? isDanger ? "bg-destructive/10 border border-destructive/20" : "bg-primary/8 border border-primary/15"
                      : "hover:bg-muted border border-transparent"
                  }`}>
                  <Icon className={`w-4 h-4 flex-shrink-0 ${
                    active ? isDanger ? "text-destructive" : "text-primary" : "text-muted-foreground"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${
                      active ? isDanger ? "text-destructive" : "text-primary" : "text-foreground"
                    }`}>{section.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{section.description}</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform ${
                    active ? "opacity-100 text-muted-foreground" : "opacity-0"
                  }`} />
                </motion.button>
              );
            })}
          </motion.div>

          {/* ── Content ── */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
            className="space-y-4 min-w-0">

            {/* Unsaved changes banner */}
            <AnimatePresence>
              {isDirty && (
                <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  className="bg-secondary/10 border border-secondary/30 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-secondary-foreground">You have unsaved changes</p>
                  <div className="flex items-center gap-2">
                    <button onClick={handleDiscard}
                      className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                      <X className="w-3.5 h-3.5" /> Discard
                    </button>
                    <Button onClick={handleSave} disabled={saving} size="sm"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold px-4 h-8">
                      {saving
                        ? <span className="flex items-center gap-1.5"><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving</span>
                        : <><Save className="w-3.5 h-3.5 mr-1" />Save Changes</>}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {/* ── Personal Info ── */}
              {activeSection === "personal" && (
                <motion.div key="personal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }} className="space-y-4">
                  <SectionCard title="Profile Photo" description="This appears on your orders and profile">
                    <AvatarUploader
                      avatarUrl={draft.avatarUrl}
                      name={`${draft.firstName} ${draft.lastName}`}
                      onUpload={(url) => setField("avatarUrl", url)}
                    />
                  </SectionCard>

                  <SectionCard title="Personal Information" description="Update your name and contact details">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="First Name *">
                        <Input value={draft.firstName} onChange={e => setField("firstName", e.target.value)}
                          placeholder="First name" className="rounded-xl border-border" />
                      </Field>
                      <Field label="Last Name *">
                        <Input value={draft.lastName} onChange={e => setField("lastName", e.target.value)}
                          placeholder="Last name" className="rounded-xl border-border" />
                      </Field>
                      <Field label="Phone Number *">
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input value={draft.phone} onChange={e => setField("phone", e.target.value)}
                            placeholder="+254 7XX XXX XXX" className="pl-10 rounded-xl border-border" />
                        </div>
                      </Field>
                      <Field label="Email Address" hint="Contact support to change your email">
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input value={draft.email} disabled
                            className="pl-10 rounded-xl border-border bg-muted text-muted-foreground cursor-not-allowed" />
                        </div>
                      </Field>
                    </div>

                    <div className="flex justify-end mt-5">
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                        <Button onClick={handleSave} disabled={!isDirty || saving}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold px-8 disabled:opacity-40">
                          {saving ? "Saving..." : "Save Changes"}
                        </Button>
                      </motion.div>
                    </div>
                  </SectionCard>
                </motion.div>
              )}

              {/* ── Address ── */}
              {activeSection === "address" && (
                <motion.div key="address" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}>
                  <SectionCard title="Delivery Address" description="Used as default when placing orders and subscribing to meal plans">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Street Address" hint="House/apartment number and street name">
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input value={draft.address ?? ""} onChange={e => setField("address", e.target.value || null)}
                            placeholder="e.g. 14 Mwangi Road" className="pl-10 rounded-xl border-border" />
                        </div>
                      </Field>
                      <Field label="City">
                        <Input value={draft.city ?? ""} onChange={e => setField("city", e.target.value || null)}
                          placeholder="e.g. Nairobi" className="rounded-xl border-border" />
                      </Field>
                      <Field label="State / County">
                        <Input value={draft.state ?? ""} onChange={e => setField("state", e.target.value || null)}
                          placeholder="e.g. Nairobi" className="rounded-xl border-border" />
                      </Field>
                      <Field label="Country">
                        <Input value={draft.country ?? ""} onChange={e => setField("country", e.target.value || null)}
                          placeholder="e.g. Kenya" className="rounded-xl border-border" />
                      </Field>
                      <Field label="Postal Code">
                        <Input value={draft.postalCode ?? ""} onChange={e => setField("postalCode", e.target.value || null)}
                          placeholder="e.g. 00100" className="rounded-xl border-border" />
                      </Field>
                    </div>

                    {/* Coords display (set via maps — read only) */}
                    {(draft.latitude || draft.longitude) && (
                      <div className="mt-4 p-3 rounded-xl bg-muted/40 border border-border flex gap-4">
                        <div className="text-xs">
                          <p className="text-muted-foreground">Latitude</p>
                          <p className="font-mono font-bold text-foreground">{draft.latitude?.toFixed(6)}</p>
                        </div>
                        <div className="text-xs">
                          <p className="text-muted-foreground">Longitude</p>
                          <p className="font-mono font-bold text-foreground">{draft.longitude?.toFixed(6)}</p>
                        </div>
                        <p className="text-[10px] text-muted-foreground self-end ml-auto">
                          Coordinates set via map pin
                        </p>
                      </div>
                    )}

                    <div className="flex justify-end mt-5">
                      <Button onClick={handleSave} disabled={!isDirty || saving}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold px-8 disabled:opacity-40">
                        {saving ? "Saving..." : "Save Address"}
                      </Button>
                    </div>
                  </SectionCard>
                </motion.div>
              )}

              {/* ── Notifications ── */}
              {activeSection === "notifications" && (
                <motion.div key="notifications" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }} className="space-y-4">
                  <SectionCard title="Push Notifications" description="Choose what to be notified about">
                    <div>
                      <Toggle value={notifs.orderUpdates} onChange={v => setNotifs(p => ({ ...p, orderUpdates: v }))}
                        label="Order Updates" sub="Status changes, confirmations and cancellations" />
                      <Toggle value={notifs.deliveryAlerts} onChange={v => setNotifs(p => ({ ...p, deliveryAlerts: v }))}
                        label="Delivery Alerts" sub="Real-time delivery and pickup notifications" />
                      <Toggle value={notifs.mealReminders} onChange={v => setNotifs(p => ({ ...p, mealReminders: v }))}
                        label="Meal Reminders" sub="Reminders 30 minutes before scheduled meals" />
                      <Toggle value={notifs.promotions} onChange={v => setNotifs(p => ({ ...p, promotions: v }))}
                        label="Promotions & Offers" sub="Discounts, coupons and special deals" />
                      <Toggle value={notifs.newChefs} onChange={v => setNotifs(p => ({ ...p, newChefs: v }))}
                        label="New Chefs Near You" sub="When a new kitchen opens in your area" />
                      <Toggle value={notifs.weeklyDigest} onChange={v => setNotifs(p => ({ ...p, weeklyDigest: v }))}
                        label="Weekly Digest" sub="Your meal summary every Monday morning" />
                    </div>
                  </SectionCard>
                </motion.div>
              )}

              {/* ── Appearance ── */}
              {activeSection === "appearance" && (
                <motion.div key="appearance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }} className="space-y-4">
                  <SectionCard title="Theme" description="Choose how QavaEat looks for you">
                    <div className="grid grid-cols-3 gap-3">
                      {([
                        { value: "light" as ThemeOption, label: "Light", icon: Sun, preview: "bg-white border-2" },
                        { value: "dark" as ThemeOption, label: "Dark", icon: Moon, preview: "bg-gray-900 border-2" },
                        { value: "system" as ThemeOption, label: "System", icon: Monitor, preview: "bg-gradient-to-br from-white to-gray-900 border-2" },
                      ]).map(({ value, label, icon: Icon, preview }) => (
                        <motion.button key={value} onClick={() => setTheme(value)}
                          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                          className={`relative flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all ${
                            theme === value ? "border-primary bg-primary/5" : "border-border hover:border-primary/30 bg-background"
                          }`}>
                          {/* Preview swatch */}
                          <div className={`w-full h-16 rounded-xl ${preview} border-border overflow-hidden flex items-center justify-center`}>
                            <div className={`w-8 h-8 rounded-lg ${value === "dark" ? "bg-gray-700" : "bg-gray-100"}`} />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Icon className={`w-3.5 h-3.5 ${theme === value ? "text-primary" : "text-muted-foreground"}`} />
                            <span className={`text-xs font-bold ${theme === value ? "text-primary" : "text-foreground"}`}>{label}</span>
                          </div>
                          {theme === value && (
                            <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-3 h-3 text-primary-foreground" />
                            </span>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </SectionCard>

                  <SectionCard title="Display Preferences" description="Fine-tune your experience">
                    <div>
                      <Toggle value={true} onChange={() => {}} label="Compact Mode" sub="Show more items with less spacing" />
                      <Toggle value={false} onChange={() => {}} label="Animations" sub="Reduce motion for a simpler interface" />
                      <Toggle value={true} onChange={() => {}} label="Show Prices" sub="Display prices on menu item cards" />
                      <Toggle value={false} onChange={() => {}} label="Show Calories" sub="Display calorie counts where available" />
                    </div>
                  </SectionCard>
                </motion.div>
              )}

              {/* ── Security ── */}
              {activeSection === "security" && (
                <motion.div key="security" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }} className="space-y-4">
                  <SectionCard title="Change Password" description="Use a strong password of at least 8 characters">
                    <div className="space-y-4 max-w-md">
                      <Field label="Current Password">
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input type={showPassword ? "text" : "password"} value={currentPwd}
                            onChange={e => setCurrentPwd(e.target.value)}
                            placeholder="Your current password"
                            className="pl-10 pr-10 rounded-xl border-border" />
                          <button onClick={() => setShowPassword(p => !p)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </Field>
                      <Field label="New Password">
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input type={showPassword ? "text" : "password"} value={newPwd}
                            onChange={e => setNewPwd(e.target.value)}
                            placeholder="Choose a new password"
                            className="pl-10 rounded-xl border-border" />
                        </div>
                      </Field>
                      <Field label="Confirm New Password">
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input type={showPassword ? "text" : "password"} value={confirmPwd}
                            onChange={e => setConfirmPwd(e.target.value)}
                            placeholder="Repeat new password"
                            className={`pl-10 rounded-xl ${confirmPwd && confirmPwd !== newPwd ? "border-destructive" : "border-border"}`} />
                        </div>
                        {confirmPwd && confirmPwd !== newPwd && (
                          <p className="text-[10px] text-destructive">Passwords do not match</p>
                        )}
                      </Field>
                      <Button onClick={handlePasswordChange}
                        disabled={!currentPwd || !newPwd || newPwd !== confirmPwd}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold px-8 disabled:opacity-40">
                        Update Password
                      </Button>
                    </div>
                  </SectionCard>

                  <SectionCard title="Active Sessions" description="Manage where you're logged in">
                    <div className="space-y-2">
                      {[
                        { device: "Chrome on macOS", location: "Nairobi, Kenya", time: "Active now", current: true },
                        { device: "Safari on iPhone", location: "Nairobi, Kenya", time: "2 hours ago", current: false },
                      ].map((session, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{session.device}</p>
                            <p className="text-[11px] text-muted-foreground">{session.location} · {session.time}</p>
                          </div>
                          {session.current
                            ? <span className="text-[10px] font-black text-[#007606] bg-[#007606]/10 px-2 py-1 rounded-full">This device</span>
                            : <button className="text-xs text-destructive font-semibold hover:underline">Sign out</button>}
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                </motion.div>
              )}

              {/* ── Danger Zone ── */}
              {activeSection === "danger" && (
                <motion.div key="danger" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}>
                  <div className="bg-background rounded-2xl border-2 border-destructive/30 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-destructive/20 bg-destructive/5">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                        <h2 className="text-base font-black text-destructive">Danger Zone</h2>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">Actions here are permanent and cannot be undone</p>
                    </div>
                    <div className="px-6 py-5 space-y-4">
                      {/* Export data */}
                      <div className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                        <div>
                          <p className="text-sm font-bold text-foreground">Export My Data</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">Download a copy of all your personal data</p>
                        </div>
                        <Button variant="outline" size="sm" className="rounded-xl border-border text-xs font-bold px-4"
                          onClick={() => toast.success("Data export requested. You'll receive an email shortly.")}>
                          Export
                        </Button>
                      </div>

                      {/* Deactivate */}
                      <div className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                        <div>
                          <p className="text-sm font-bold text-foreground">Deactivate Account</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">Temporarily hide your account. You can reactivate anytime.</p>
                        </div>
                        <Button variant="outline" size="sm"
                          className="rounded-xl border-destructive/40 text-destructive hover:bg-destructive/5 text-xs font-bold px-4"
                          onClick={() => toast.success("Account deactivated.")}>
                          Deactivate
                        </Button>
                      </div>

                      {/* Delete */}
                      <div className="flex items-center justify-between p-4 rounded-xl border-2 border-destructive/30 bg-destructive/5">
                        <div>
                          <p className="text-sm font-black text-destructive">Delete Account</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">Permanently delete your account and all associated data.</p>
                        </div>
                        <Button size="sm"
                          className="rounded-xl bg-destructive hover:bg-destructive/90 text-white text-xs font-bold px-4"
                          onClick={() => setShowDeleteModal(true)}>
                          Delete Account
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

      {/* Delete modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <DeleteModal onClose={() => setShowDeleteModal(false)} onConfirm={() => {}} />
        )}
      </AnimatePresence>
    </div>
  );
}