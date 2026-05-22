"use client";


import { useState, useEffect, useCallback, useRef } from "react";
import {
  SlidersHorizontal, ChefHat, Banknote,
  CheckCircle2, AlertCircle, ChevronDown,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import AdminStatsBar from "@/components/admin/AdminStatsBar";
import ChefCard from "@/components/admin/ChefCard";
import ChefReviewModal from "@/components/admin/ChefReviewModal";
import ChefPayoutsTable from "@/components/admin/ChefPayoutsTable";
import { Business, BusinessStatus } from "@/types/admin";

type AdminTab     = "chefs" | "payouts";
type StatusFilter = "ALL" | BusinessStatus;

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface Toast { id: number; message: string; type: "success" | "error"; }

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "ALL",       label: "All Businesses" },
  { value: "PENDING",   label: "Pending"        },
  { value: "APPROVED",  label: "Approved"       },
  { value: "DECLINED",  label: "Declined"       },
  { value: "SUSPENDED", label: "Suspended"      },
];

const STATUS_DOT: Record<StatusFilter, string> = {
  ALL:       "bg-[var(--muted-foreground)]",
  PENDING:   "bg-amber-400",
  APPROVED:  "bg-green-500",
  DECLINED:  "bg-gray-400",
  SUSPENDED: "bg-red-500",
};

const LIMIT = 12;

export default function AdminPage() {
  const [tab, setTab]                   = useState<AdminTab>("chefs");
  const [businesses, setBusinesses]     = useState<Business[]>([]);
  const [meta, setMeta]                 = useState<Meta | null>(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [filterOpen, setFilterOpen]     = useState(false);
  const [page, setPage]                 = useState(1);
  const [selected, setSelected]         = useState<Business | null>(null);
  const [toasts, setToasts]             = useState<Toast[]>([]);

  const filterRef = useRef<HTMLDivElement>(null);
  const toastId   = useRef(0);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node))
        setFilterOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Reset to page 1 when filter changes
  useEffect(() => { setPage(1); }, [statusFilter]);

  const fetchBusinesses = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      params.set("page",  String(page));
      params.set("limit", String(LIMIT));

      const res = await fetch(`/api/admin/businesses?${params.toString()}`, {
        signal,
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load businesses");

      const json = await res.json() as {
        success: boolean;
        businesses?: Business[];
        data?: Business[];
        meta?: Meta;
      };
      setBusinesses(json.businesses ?? json.data ?? []);
      setMeta(json.meta ?? null);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    if (tab !== "chefs") return;
    const ctrl = new AbortController();
    void fetchBusinesses(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchBusinesses, tab]);

  function pushToast(message: string, type: "success" | "error") {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }

  function handleAction(message: string, type: "success" | "error") {
    pushToast(message, type);
    setSelected(null);
    void fetchBusinesses();
  }

  const activeFilter = STATUS_OPTIONS.find((o) => o.value === statusFilter)!;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Manage businesses, review applications, and remit payments
          </p>
        </div>

        <AdminStatsBar />

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-[var(--muted)] p-1 rounded-2xl w-fit">
          <TabBtn active={tab === "chefs"}   onClick={() => setTab("chefs")}   Icon={ChefHat}  label="Business Management" />
          <TabBtn active={tab === "payouts"} onClick={() => setTab("payouts")} Icon={Banknote} label="Today's Payouts"      />
        </div>

        {/* ── Business Management ──────────────────────────────────────────── */}
        {tab === "chefs" && (
          <div className="space-y-5">

            {/* Toolbar */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative" ref={filterRef}>
                <button
                  onClick={() => setFilterOpen((v) => !v)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm font-medium text-[var(--foreground)] hover:border-[var(--primary)] transition-colors"
                >
                  <SlidersHorizontal size={14} strokeWidth={2} className="text-[var(--muted-foreground)]" />
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[statusFilter]}`} />
                  {activeFilter.label}
                  <ChevronDown size={14} strokeWidth={2}
                    className={`text-[var(--muted-foreground)] transition-transform ${filterOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {filterOpen && (
                  <div className="absolute left-0 mt-2 w-48 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl z-20 overflow-hidden">
                    {STATUS_OPTIONS.map((opt) => (
                      <button key={opt.value}
                        onClick={() => { setStatusFilter(opt.value); setFilterOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors ${
                          statusFilter === opt.value
                            ? "bg-[var(--muted)] text-[var(--foreground)] font-semibold"
                            : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[opt.value]}`} />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {!loading && !error && meta && (
                <p className="text-xs text-[var(--muted-foreground)]">
                  {meta.total === 0
                    ? "No businesses found"
                    : `${meta.total} business${meta.total !== 1 ? "es" : ""}`}
                  {statusFilter !== "ALL" && ` · ${activeFilter.label.toLowerCase()}`}
                </p>
              )}
            </div>

            {/* Skeleton */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-52 rounded-2xl bg-[var(--muted)] animate-pulse" />
                ))}
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-700">
                <AlertCircle size={16} className="flex-shrink-0" />
                {error}
                <button onClick={() => void fetchBusinesses()} className="ml-auto text-xs font-semibold underline">
                  Retry
                </button>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && businesses.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[var(--muted)] flex items-center justify-center">
                  <ChefHat size={28} strokeWidth={1.25} className="text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-[var(--foreground)]">No businesses found</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  No applications match the selected filter.
                </p>
                {statusFilter !== "ALL" && (
                  <button
                    onClick={() => setStatusFilter("ALL")}
                    className="text-xs font-semibold text-[var(--primary)] underline"
                  >
                    Show all
                  </button>
                )}
              </div>
            )}

            {/* Grid */}
            {!loading && !error && businesses.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {businesses.map((b) => (
                  <ChefCard key={b.id} business={b} onClick={() => setSelected(b)} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && !error && meta && meta.totalPages > 1 && (
              <Pagination
                meta={meta}
                onPrev={() => setPage((p) => p - 1)}
                onNext={() => setPage((p) => p + 1)}
                onPage={setPage}
              />
            )}
          </div>
        )}

        {tab === "payouts" && <ChefPayoutsTable />}
      </div>

      {selected && (
        <ChefReviewModal
          business={selected}
          onClose={() => setSelected(null)}
          onAction={handleAction}
        />
      )}

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg text-sm font-medium pointer-events-auto ${
              t.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
            }`}
          >
            {t.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TabBtn({ active, onClick, Icon, label }: {
  active: boolean; onClick: () => void; Icon: React.ElementType; label: string;
}) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
        active
          ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
          : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      }`}
    >
      <Icon size={15} strokeWidth={active ? 2 : 1.75} />
      {label}
    </button>
  );
}

function Pagination({ meta, onPrev, onNext, onPage }: {
  meta: Meta;
  onPrev: () => void;
  onNext: () => void;
  onPage: (p: number) => void;
}) {
  // Build page numbers: always show first, last, current ±1, with ellipsis gaps
  const pages: (number | "…")[] = [];
  const { page, totalPages } = meta;

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= page - 1 && i <= page + 1)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  return (
    <div className="flex items-center justify-between pt-2">
      <p className="text-xs text-[var(--muted-foreground)]">
        Page {page} of {totalPages} · {meta.total} total
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          disabled={!meta.hasPrevPage}
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[var(--primary)] transition-colors"
        >
          <ChevronLeft size={14} strokeWidth={2} />
          Prev
        </button>

        <div className="flex items-center gap-1">
          {pages.map((p, i) =>
            p === "…" ? (
              <span key={`ellipsis-${i}`} className="px-2 text-xs text-[var(--muted-foreground)]">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPage(p as number)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                  p === page
                    ? "bg-primary text-white"
                    : "bg-card border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)]"
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>

        <button
          onClick={onNext}
          disabled={!meta.hasNextPage}
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[var(--primary)] transition-colors"
        >
          Next
          <ChevronRight size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}