"use client";

import { useState, useEffect } from "react";
import {
  X, User, FileText, BarChart2, Zap,
  MapPin, Globe, Phone, Mail, Link2, Award,
  CalendarCheck, CheckCircle2, XCircle,
  ShieldOff, RotateCcw, Loader2,
} from "lucide-react";
import { Business, DayOfWeek } from "@/types/admin";
import DocumentViewer from "./DocumentViewer";
import BusinessAnalyticsPanel from "./BusinessAnalyticsPanel";

type ModalTab = "overview" | "documents" | "analytics" | "actions";

interface Props {
  business: Business;
  onClose: () => void;
  onAction: (msg: string, type: "success" | "error") => void;
}

const SERVICE_ICONS: Record<string, string> = {
  DELIVERY: "🛵", PICKUP: "🏪", DINE_IN: "🍽️",
};

const DAY_SHORT: Record<DayOfWeek, string> = {
  MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed", THURSDAY: "Thu",
  FRIDAY: "Fri", SATURDAY: "Sat", SUNDAY: "Sun",
};

const ALL_DAYS: DayOfWeek[] = [
  "MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY",
];

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Something went wrong";
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  PENDING:   { bg: "rgba(251,191,36,0.12)", text: "#b45309" },
  APPROVED:  { bg: "rgba(34,197,94,0.1)",   text: "#15803d" },
  DECLINED:  { bg: "rgba(107,114,128,0.1)", text: "#6b7280" },
  SUSPENDED: { bg: "rgba(220,38,38,0.1)",   text: "#dc2626" },
};

export default function ChefReviewModal({ business, onClose, onAction }: Props) {
  const [tab, setTab]                               = useState<ModalTab>("overview");
  const [reviewNote, setReviewNote]                 = useState(business.reviewNote ?? "");
  const [suspendReason, setSuspendReason]           = useState("");
  const [submitting, setSubmitting]                 = useState(false);
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const isPending   = business.status === "PENDING";
  const isApproved  = business.status === "APPROVED";
  const isSuspended = business.status === "SUSPENDED";

  async function handleReview(decision: "APPROVED" | "DECLINED") {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/businesses/${business.id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reviewNote: reviewNote || undefined }),
      });
      const data = await res.json() as { message?: string };
      if (!res.ok) throw new Error(data.message ?? "Request failed");
      onAction(
        decision === "APPROVED" ? `${business.name} approved.` : `Application declined.`,
        "success",
      );
    } catch (err) {
      onAction(getErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSuspend(suspend: boolean) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/businesses/${business.id}/suspend`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suspend, reason: suspendReason || undefined }),
      });
      const data = await res.json() as { message?: string };
      if (!res.ok) throw new Error(data.message ?? "Request failed");
      onAction(
        suspend ? `${business.name} suspended.` : `${business.name} reinstated.`,
        "success",
      );
    } catch (err) {
      onAction(getErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
      setShowSuspendConfirm(false);
    }
  }

  const tabs: { key: ModalTab; label: string; Icon: React.ElementType }[] = [
    { key: "overview",  label: "Overview",  Icon: User      },
    { key: "documents", label: "Documents", Icon: FileText  },
    { key: "analytics", label: "Analytics", Icon: BarChart2 },
    { key: "actions",   label: "Actions",   Icon: Zap       },
  ];

  const initials = business.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const ss       = STATUS_STYLES[business.status] ?? STATUS_STYLES["DECLINED"];

  // Build documents array — only include non-null URLs
  const documents = [
    business.businessPermitUrl  && { label: "Business Permit",    url: business.businessPermitUrl,  type: "permit" as const },
    business.nationalIdFrontUrl && { label: "National ID (Front)", url: business.nationalIdFrontUrl, type: "id"     as const },
    business.nationalIdBackUrl  && { label: "National ID (Back)",  url: business.nationalIdBackUrl,  type: "id"     as const },
    business.premiseImageUrl    && { label: "Premise Photo",       url: business.premiseImageUrl,    type: "photo"  as const },
  ].filter(Boolean) as { label: string; url: string; type: "permit" | "id" | "photo" }[];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full sm:max-w-3xl max-h-[95dvh] sm:max-h-[90vh] flex flex-col bg-[var(--card)] sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-4 px-5 py-4 border-b border-[var(--border)] flex-shrink-0">
          {business.logoUrl ? (
            <img src={business.logoUrl} alt={business.name}
              className="w-12 h-12 rounded-xl object-cover border border-[var(--border)]"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-[var(--primary)] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-[var(--foreground)] text-base truncate">{business.name}</h2>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <p className="text-xs text-[var(--muted-foreground)] truncate">{business.chef.email}</p>
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: ss.bg, color: ss.text }}
              >
                {business.status}
              </span>
            </div>
          </div>
          <button onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors flex-shrink-0"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border)] flex-shrink-0 overflow-x-auto">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                tab === t.key
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              <t.Icon size={15} strokeWidth={1.75} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {/* Overview */}
          {tab === "overview" && (
            <div className="p-5 space-y-6">
              <Section title="Business Details">
                {business.description && (
                  <p className="text-sm text-[var(--muted-foreground)] mb-4 leading-relaxed">{business.description}</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoRow Icon={MapPin} label="Address" value={`${business.address}, ${business.city}, ${business.state}`} />
                  <InfoRow Icon={Globe}  label="Country" value={business.country} />
                  <InfoRow Icon={Phone}  label="Phone"   value={business.phone} />
                  {business.email   && <InfoRow Icon={Mail}  label="Email"   value={business.email} />}
                  {business.website && <InfoRow Icon={Link2} label="Website" value={business.website} />}
                  <InfoRow Icon={Award} label="Experience"
                    value={`${business.yearsOfExperience} year${business.yearsOfExperience !== 1 ? "s" : ""}`}
                  />
                </div>
              </Section>

              <Section title="Services">
                <div className="flex flex-wrap gap-2">
                  {business.services.map((s) => (
                    <span key={s} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--muted)] text-[var(--foreground)] text-sm font-medium">
                      {SERVICE_ICONS[s] ?? "•"} {s.replace("_", " ")}
                    </span>
                  ))}
                </div>
              </Section>

              <Section title="Availability">
                <div className="flex flex-wrap gap-2">
                  {ALL_DAYS.map((day) => {
                    const active = business.availability.includes(day);
                    return (
                      <span key={day}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          active
                            ? "bg-[var(--primary)] text-white"
                            : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                        }`}
                      >
                        {DAY_SHORT[day]}
                      </span>
                    );
                  })}
                </div>
              </Section>

              <Section title="Food Specialties">
                <div className="flex flex-wrap gap-2">
                  {business.foodSpecialty.map((s) => (
                    <span key={s} className="px-3 py-1.5 rounded-full bg-[var(--secondary)] text-[var(--secondary-foreground)] text-xs font-semibold">
                      {s}
                    </span>
                  ))}
                </div>
              </Section>

              {business.reviewedAt && (
                <Section title="Review History">
                  <div className="bg-[var(--muted)] rounded-xl p-4 space-y-2">
                    <InfoRow Icon={CalendarCheck} label="Reviewed At"
                      value={new Date(business.reviewedAt).toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })}
                    />
                    {business.reviewNote && (
                      <div className="mt-2">
                        <p className="text-xs text-[var(--muted-foreground)] mb-1">Review Note</p>
                        <p className="text-sm text-[var(--foreground)] italic">&ldquo;{business.reviewNote}&rdquo;</p>
                      </div>
                    )}
                  </div>
                </Section>
              )}
            </div>
          )}

          {/* Documents */}
          {tab === "documents" && (
            <div className="p-5">
              {documents.length > 0 ? (
                <DocumentViewer documents={documents} />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <FileText size={32} strokeWidth={1} className="text-[var(--muted-foreground)]" />
                  <p className="text-sm text-[var(--muted-foreground)]">No documents uploaded.</p>
                </div>
              )}
            </div>
          )}

          {/* Analytics */}
          {tab === "analytics" && (
            <div className="p-5">
              <BusinessAnalyticsPanel businessId={business.id} status={business.status} />
            </div>
          )}

          {/* Actions */}
          {tab === "actions" && (
            <div className="p-5 space-y-6">
              <Section title="Review Note">
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  rows={4}
                  placeholder="Add an internal note (recommended when declining)…"
                  className="w-full px-4 py-3 text-sm bg-[var(--muted)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none"
                />
              </Section>

              {isPending && (
                <Section title="Application Decision">
                  <p className="text-sm text-[var(--muted-foreground)] mb-4">
                    Approving grants this user the <strong className="text-[var(--foreground)]">CHEF</strong> role
                    and makes their business live. Declining keeps them as a regular user.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleReview("APPROVED")} disabled={submitting}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition-colors disabled:opacity-60"
                    >
                      {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      Approve Application
                    </button>
                    <button
                      onClick={() => handleReview("DECLINED")} disabled={submitting}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white font-semibold text-sm transition-colors disabled:opacity-60"
                    >
                      {submitting ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                      Decline Application
                    </button>
                  </div>
                </Section>
              )}

              {(isApproved || isSuspended) && (
                <Section title={isSuspended ? "Reinstate Business" : "Suspend Business"}>
                  {isSuspended ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700">
                        This business is currently suspended. Reinstating will make it live again.
                      </div>
                      <button
                        onClick={() => handleSuspend(false)} disabled={submitting}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition-colors disabled:opacity-60"
                      >
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                        Reinstate Business
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2">
                        <ShieldOff size={16} className="mt-0.5 flex-shrink-0" />
                        Suspending immediately hides this business and prevents new orders. The chef will be notified.
                      </div>
                      {!showSuspendConfirm ? (
                        <button
                          onClick={() => setShowSuspendConfirm(true)}
                          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] hover:bg-red-700 text-white font-semibold text-sm transition-colors"
                        >
                          <ShieldOff size={16} /> Suspend Business
                        </button>
                      ) : (
                        <div className="space-y-3 border border-[var(--primary)] rounded-xl p-4">
                          <p className="text-sm font-semibold text-[var(--foreground)]">Confirm suspension</p>
                          <textarea
                            value={suspendReason}
                            onChange={(e) => setSuspendReason(e.target.value)}
                            rows={3}
                            placeholder="Reason for suspension (shared with the business owner)…"
                            className="w-full px-4 py-3 text-sm bg-[var(--muted)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none"
                          />
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleSuspend(true)} disabled={submitting}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--primary)] text-white font-semibold text-sm disabled:opacity-60"
                            >
                              {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
                              Confirm Suspend
                            </button>
                            <button
                              onClick={() => setShowSuspendConfirm(false)}
                              className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--foreground)] text-sm font-medium hover:bg-[var(--muted)]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Section>
              )}

              <Section title="Quick Info">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-[var(--muted)] rounded-xl p-3">
                    <p className="text-[var(--muted-foreground)] text-xs mb-1">Chef ID</p>
                    <p className="font-mono text-xs text-[var(--foreground)] break-all">{business.chefId}</p>
                  </div>
                  <div className="bg-[var(--muted)] rounded-xl p-3">
                    <p className="text-[var(--muted-foreground)] text-xs mb-1">Business ID</p>
                    <p className="font-mono text-xs text-[var(--foreground)] break-all">{business.id}</p>
                  </div>
                </div>
              </Section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-3">{title}</h3>
      {children}
    </div>
  );
}

function InfoRow({ Icon, label, value }: { Icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={14} strokeWidth={1.75} className="text-[var(--muted-foreground)] flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
        <p className="text-sm text-[var(--foreground)] font-medium">{value}</p>
      </div>
    </div>
  );
}