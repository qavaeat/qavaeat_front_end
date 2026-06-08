"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Banknote,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Loader2,
  Phone,
  Building2,
  Send,
  ReceiptText,
  Filter,
  X,
  Zap,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentMethod {
  method: "mpesa" | "bank";
  mpesaPhone?: string;
  mpesaName?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
}

interface OrderItem {
  id: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface PayoutOrder {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  source: "order" | "schedule" | "mealplan";
  mealTime?: "BREAKFAST" | "LUNCH" | "DINNER";
  items: OrderItem[];
}

interface PayoutRow {
  businessId: string;
  businessName: string;
  chefEmail: string;
  logoUrl?: string;
  // Total for ALL delivered items in the selected date window (historical display)
  grossEarnings: number;
  platformFee: number;
  todayEarnings: number;
  // Unremitted slice only — the exact amount the Remit button will dispatch
  pendingEarnings: number;
  deliveredCount: number;
  pendingCount: number;
  cancelledCount: number;
  orders: PayoutOrder[];
  paymentMethod: PaymentMethod | null;
  payoutStatus: "PAID" | "NOT_PAID";
  payoutId?: string;
  remittedAt?: string | null;
  transferRef?: string | null;
  payoutDest?: string | null;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface MissedInstance {
  id: string;
  scheduledDate: string;
  mealTime: string;
  status: string;
  remittedAt: string | null;
  menuItem: { id: string; name: string } | null;
  subscription: {
    id: string;
    user: {
      id: string;
      email: string;
      profile: { firstName: string | null; lastName: string | null } | null;
    } | null;
    mealPlan: {
      id: string;
      name: string;
      business: { id: string; name: string };
    } | null;
  } | null;
}

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function eatWindowToday(): { start: string; end: string } {
  const eatNow = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const ymd = eatNow.toISOString().slice(0, 10);
  return {
    start: new Date(`${ymd}T00:00:00+03:00`).toISOString(),
    end: new Date(`${ymd}T23:59:59+03:00`).toISOString(),
  };
}

function eatWindowRange(daysBack: number): { start: string; end: string } {
  const eatNow = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const endYMD = eatNow.toISOString().slice(0, 10);
  const startYMD = new Date(eatNow.getTime() - daysBack * 86_400_000)
    .toISOString()
    .slice(0, 10);
  return {
    start: new Date(`${startYMD}T00:00:00+03:00`).toISOString(),
    end: new Date(`${endYMD}T23:59:59+03:00`).toISOString(),
  };
}

function formatEAT(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Nairobi",
  });
}

function formatDateEAT(iso: string): string {
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Nairobi",
  });
}

function kes(n: number): string {
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 0 })}`;
}

function feePercent(fee: number, gross: number): number {
  return gross > 0 ? Math.round((fee / gross) * 100) : 0;
}

const RANGE_OPTIONS = [
  { label: "Today", days: 0 },
  { label: "Yesterday", days: 1 },
  { label: "Last 7 d", days: 7 },
] as const;

// ─── Toast hook ───────────────────────────────────────────────────────────────

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const push = useCallback((message: string, type: "success" | "error") => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      4000,
    );
  }, []);

  return { toasts, push };
}

// ─── PayMethodBadge ───────────────────────────────────────────────────────────

function PayMethodBadge({ pm }: { pm: PaymentMethod | null }) {
  if (!pm)
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold"
        style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
      >
        Not set up
      </span>
    );
  if (pm.method === "mpesa")
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold"
        style={{
          background: "color-mix(in srgb, var(--chart-3) 12%, transparent)",
          color: "var(--chart-3)",
        }}
      >
        <Phone className="w-2.5 h-2.5" />
        M-Pesa · {pm.mpesaPhone ?? "—"}
      </span>
    );
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold"
      style={{
        background: "color-mix(in srgb, var(--primary) 10%, transparent)",
        color: "var(--primary)",
      }}
    >
      <Building2 className="w-2.5 h-2.5" />
      Bank · {pm.bankName ?? "—"}
    </span>
  );
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function StatusBadge({
  status,
  remittedAt,
}: {
  status: "PAID" | "NOT_PAID";
  remittedAt?: string | null;
}) {
  if (status === "PAID")
    return (
      <div className="flex flex-col items-end gap-0.5">
        <span
          className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-black"
          style={{
            background: "color-mix(in srgb, var(--chart-3) 12%, transparent)",
            color: "var(--chart-3)",
          }}
        >
          <CheckCircle2 className="w-3 h-3" /> PAID
        </span>
        {remittedAt && (
          <span
            className="text-[9px]"
            style={{ color: "var(--muted-foreground)" }}
          >
            {formatEAT(remittedAt)}
          </span>
        )}
      </div>
    );
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-black"
      style={{
        background: "color-mix(in srgb, var(--primary) 10%, transparent)",
        color: "var(--primary)",
      }}
    >
      <Clock className="w-3 h-3" /> PENDING
    </span>
  );
}

// ─── RemitModal ───────────────────────────────────────────────────────────────
//
// Uses pendingEarnings (unremitted slice) as the amount to send — NOT
// todayEarnings.  This supports multiple remits per day: a second Remit after
// new orders arrive sends only the new amount without touching already-paid rows.

function RemitModal({
  row,
  onClose,
  onSuccess,
  pushToast,
}: {
  row: PayoutRow;
  onClose: () => void;
  onSuccess: (businessId: string) => void;
  pushToast: (msg: string, type: "success" | "error") => void;
}) {
  const [busy, setBusy] = useState(false);

  const amountToSend = row.pendingEarnings;

  // Derive the pending gross/fee for display in the breakdown
  // by scaling the full-window figures proportionally
  const pendingGross =
    row.todayEarnings > 0
      ? (amountToSend / row.todayEarnings) * row.grossEarnings
      : 0;
  const pendingPlatformFee = pendingGross - amountToSend;

  const destination =
    row.paymentMethod?.method === "mpesa"
      ? `M-Pesa → ${row.paymentMethod.mpesaPhone ?? "—"} (${row.paymentMethod.mpesaName ?? ""})`
      : row.paymentMethod?.method === "bank"
        ? `Bank → ${row.paymentMethod.bankName ?? "—"} / ${row.paymentMethod.accountNumber ?? "—"}`
        : "No payment method configured";

  // The only real gate is whether there is something to send.
  // remittedAt no longer blocks — new orders may have arrived since last remit.
  const canRemit = amountToSend > 0 && !!row.paymentMethod;

  const doRemit = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/payouts/${row.businessId}/remit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountToSend, payoutId: row.payoutId }),
      });
      const json: { success: boolean; message?: string } = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.message ?? "Remit failed");
      pushToast(
        `${row.businessName} — ${kes(amountToSend)} sent via IntaSend`,
        "success",
      );
      onSuccess(row.businessId);
      onClose();
    } catch (err) {
      pushToast((err as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden"
        style={{
          background: "var(--background)",
          borderColor: "var(--border)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background:
                  "color-mix(in srgb, var(--primary) 10%, transparent)",
              }}
            >
              <Send className="w-4 h-4" style={{ color: "var(--primary)" }} />
            </div>
            <div>
              <p
                className="text-sm font-black"
                style={{ color: "var(--foreground)" }}
              >
                Confirm Remittance
              </p>
              <p
                className="text-[10px]"
                style={{ color: "var(--muted-foreground)" }}
              >
                {row.businessName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ color: "var(--muted-foreground)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3">
          {/* Fee breakdown — pending slice only */}
          <div
            className="rounded-xl overflow-hidden border"
            style={{
              borderColor:
                "color-mix(in srgb, var(--chart-3) 25%, transparent)",
            }}
          >
            <div
              className="px-4 py-2.5 flex items-center justify-between text-[11px]"
              style={{ background: "var(--muted)" }}
            >
              <span style={{ color: "var(--muted-foreground)" }}>
                Pending gross
              </span>
              <span
                className="font-bold"
                style={{ color: "var(--foreground)" }}
              >
                {kes(pendingGross)}
              </span>
            </div>
            <div
              className="px-4 py-2.5 flex items-center justify-between text-[11px] border-t"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--border) 60%, transparent)",
                background: "var(--muted)",
              }}
            >
              <span style={{ color: "var(--muted-foreground)" }}>
                Platform fee ({feePercent(row.platformFee, row.grossEarnings)}%)
              </span>
              <span className="font-bold" style={{ color: "var(--primary)" }}>
                − {kes(pendingPlatformFee)}
              </span>
            </div>
            <div
              className="px-4 py-3 flex items-center justify-between border-t"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--chart-3) 25%, transparent)",
                background:
                  "color-mix(in srgb, var(--chart-3) 6%, transparent)",
              }}
            >
              <span
                className="text-xs font-black"
                style={{ color: "var(--foreground)" }}
              >
                Chef receives
              </span>
              <span
                className="text-2xl font-black"
                style={{ color: "var(--chart-3)" }}
              >
                {kes(amountToSend)}
              </span>
            </div>
          </div>

          {/* Destination */}
          <div
            className="rounded-xl p-3 space-y-1"
            style={{
              background: "var(--muted)",
              border: "1px solid var(--border)",
            }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "var(--muted-foreground)" }}
            >
              Via IntaSend →
            </p>
            <p
              className="text-xs font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              {destination}
            </p>
            <p
              className="text-[10px]"
              style={{ color: "var(--muted-foreground)" }}
            >
              {row.chefEmail}
            </p>
          </div>

          {/* Informational — previously remitted today (no longer a blocker) */}
          {row.remittedAt && amountToSend > 0 && (
            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{
                background:
                  "color-mix(in srgb, var(--chart-3) 8%, transparent)",
                border:
                  "1px solid color-mix(in srgb, var(--chart-3) 25%, transparent)",
              }}
            >
              <CheckCircle2
                className="w-4 h-4 flex-shrink-0 mt-0.5"
                style={{ color: "var(--chart-3)" }}
              />
              <p className="text-[10px]" style={{ color: "var(--foreground)" }}>
                Previously remitted at {formatEAT(row.remittedAt)}.
                {row.transferRef && (
                  <span className="font-mono ml-1">Ref: {row.transferRef}</span>
                )}{" "}
                New unremitted orders found — this will send an additional
                transfer.
              </p>
            </div>
          )}

          {/* Warning — nothing to send */}
          {amountToSend === 0 && (
            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{
                background:
                  "color-mix(in srgb, var(--primary) 8%, transparent)",
                border:
                  "1px solid color-mix(in srgb, var(--primary) 25%, transparent)",
              }}
            >
              <AlertTriangle
                className="w-4 h-4 flex-shrink-0 mt-0.5"
                style={{ color: "var(--primary)" }}
              />
              <p className="text-[10px]" style={{ color: "var(--foreground)" }}>
                No unremitted deliveries — nothing to send.
              </p>
            </div>
          )}

          {/* Warning — no payment method */}
          {!row.paymentMethod && (
            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{
                background:
                  "color-mix(in srgb, var(--primary) 8%, transparent)",
                border:
                  "1px solid color-mix(in srgb, var(--primary) 25%, transparent)",
              }}
            >
              <AlertTriangle
                className="w-4 h-4 flex-shrink-0 mt-0.5"
                style={{ color: "var(--primary)" }}
              />
              <p className="text-[10px]" style={{ color: "var(--foreground)" }}>
                Chef has not configured a payment method.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-2.5">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold border transition-colors disabled:opacity-50"
            style={{
              borderColor: "var(--border)",
              color: "var(--foreground)",
              background: "transparent",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => void doRemit()}
            disabled={busy || !canRemit}
            className="flex-1 py-2.5 rounded-xl text-sm font-black transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: "var(--primary)", color: "white" }}
          >
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Sending…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> Remit via IntaSend
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── OrdersDrawer ─────────────────────────────────────────────────────────────

function OrdersDrawer({
  row,
  onClose,
}: {
  row: PayoutRow;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
    >
      <div
        className="ml-auto h-full w-full max-w-sm flex flex-col shadow-2xl"
        style={{
          background: "var(--background)",
          borderLeft: "1px solid var(--border)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: "var(--border)" }}
        >
          <div>
            <p
              className="text-sm font-black"
              style={{ color: "var(--foreground)" }}
            >
              {row.businessName}
            </p>
            <p
              className="text-[10px]"
              style={{ color: "var(--muted-foreground)" }}
            >
              {row.orders.length} order{row.orders.length !== 1 ? "s" : ""} in
              range
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ color: "var(--muted-foreground)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {row.orders.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-2">📭</p>
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--foreground)" }}
              >
                No orders in range
              </p>
            </div>
          ) : (
            row.orders.map((order) => {
              const statusColor =
                order.status === "DELIVERED"
                  ? "var(--chart-3)"
                  : order.status === "CANCELLED" || order.status === "FAILED"
                    ? "var(--primary)"
                    : "var(--muted-foreground)";

              const sourceBadge =
                order.source === "schedule"
                  ? "SCHEDULE"
                  : order.source === "mealplan"
                    ? "PLAN"
                    : null;

              return (
                <div
                  key={order.id}
                  className="rounded-xl border overflow-hidden"
                  style={{ borderColor: "var(--border)" }}
                >
                  {/* Row header */}
                  <div
                    className="flex items-center justify-between px-3 py-2.5"
                    style={{ background: "var(--muted)" }}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="text-[10px] font-mono font-bold truncate"
                        style={{ color: "var(--foreground)" }}
                      >
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      {sourceBadge && (
                        <span
                          className="text-[8px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0"
                          style={{
                            background:
                              "color-mix(in srgb, var(--primary) 10%, transparent)",
                            color: "var(--primary)",
                          }}
                        >
                          {sourceBadge}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className="text-[9px] font-black px-2 py-0.5 rounded-full"
                        style={{
                          color: statusColor,
                          background: `color-mix(in srgb, ${statusColor} 12%, transparent)`,
                        }}
                      >
                        {order.status}
                      </span>
                      <span
                        className="text-[11px] font-black"
                        style={{ color: "var(--primary)" }}
                      >
                        {kes(order.total)}
                      </span>
                    </div>
                  </div>

                  {/* Items */}
                  <div
                    className="divide-y"
                    style={{ borderColor: "var(--border)" }}
                  >
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between px-3 py-2 gap-2"
                      >
                        <div>
                          <p
                            className="text-xs font-semibold"
                            style={{ color: "var(--foreground)" }}
                          >
                            {item.itemName}
                          </p>
                          <p
                            className="text-[10px]"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            ×{item.quantity}
                          </p>
                        </div>
                        <span
                          className="text-xs font-bold"
                          style={{ color: "var(--foreground)" }}
                        >
                          {kes(item.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Timestamp */}
                  <div
                    className="px-3 py-2 flex justify-end"
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    <span
                      className="text-[10px]"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {order.source === "schedule" ||
                      order.source === "mealplan"
                        ? formatDateEAT(order.createdAt)
                        : formatEAT(order.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PayoutCard ───────────────────────────────────────────────────────────────
//
// Remit button logic:
//   - Disabled only when pendingEarnings === 0 (nothing to send) or no payment method.
//   - alreadyRemitted alone does NOT disable the button — new orders may have
//     arrived since the last remittance, and the service handles that correctly.
//
// Label states:
//   "Sent"         — remitted earlier today, no new pending orders
//   "Remit again"  — remitted earlier today, new unremitted orders exist
//   "Remit"        — not yet remitted today, orders pending
//   "Nothing pending" — delivered orders all remitted, nothing new
//   "No payout method" — chef hasn't set up payment

function PayoutCard({
  row,
  onRemit,
  onToggleStatus,
  onViewOrders,
  toggling,
}: {
  row: PayoutRow;
  onRemit: (row: PayoutRow) => void;
  onToggleStatus: (row: PayoutRow) => void;
  onViewOrders: (row: PayoutRow) => void;
  toggling: boolean;
}) {
  const alreadyRemitted = !!row.remittedAt;
  const noMethod = !row.paymentMethod;
  const noPending = row.pendingEarnings === 0;

  // noPending is the only functional gate; alreadyRemitted is cosmetic only
  const isDisabled = noMethod || noPending;

  const remitLabel =
    noPending && alreadyRemitted
      ? "Sent"
      : noPending
        ? "Nothing pending"
        : noMethod
          ? "No payout method"
          : alreadyRemitted
            ? "Remit again"
            : "Remit";

  const remitHint =
    noPending && alreadyRemitted
      ? "All delivered meals have been remitted"
      : noPending
        ? "All delivered meals already remitted"
        : noMethod
          ? "Chef hasn't added a payout method"
          : alreadyRemitted
            ? "New delivered orders arrived since last remittance"
            : "Send via IntaSend";

  const remitBg =
    alreadyRemitted && noPending
      ? "var(--muted)"
      : isDisabled
        ? "color-mix(in srgb, var(--primary) 30%, var(--muted))"
        : "var(--primary)";

  const remitFg = isDisabled ? "var(--muted-foreground)" : "white";

  return (
    <div
      className="rounded-2xl border flex flex-col overflow-hidden transition-shadow hover:shadow-md"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          {row.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.logoUrl}
              alt={row.businessName}
              className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: "var(--muted)" }}
            >
              🍽️
            </div>
          )}
          <div className="min-w-0">
            <p
              className="text-sm font-black truncate"
              style={{ color: "var(--foreground)" }}
            >
              {row.businessName}
            </p>
            <p
              className="text-[10px] truncate"
              style={{ color: "var(--muted-foreground)" }}
            >
              {row.chefEmail}
            </p>
          </div>
        </div>
        <StatusBadge status={row.payoutStatus} remittedAt={row.remittedAt} />
      </div>

      {/* Earnings strip */}
      <div className="border-y" style={{ borderColor: "var(--border)" }}>
        {/* Full-window totals — accurate even for historical date ranges */}
        <div className="px-3 py-2.5 space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span style={{ color: "var(--muted-foreground)" }}>
              Gross collected
            </span>
            <span className="font-bold" style={{ color: "var(--foreground)" }}>
              {kes(row.grossEarnings)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span style={{ color: "var(--muted-foreground)" }}>
              Platform fee ({feePercent(row.platformFee, row.grossEarnings)}%)
            </span>
            <span className="font-bold" style={{ color: "var(--primary)" }}>
              − {kes(row.platformFee)}
            </span>
          </div>
          <div
            className="flex items-center justify-between text-[10px] pt-0.5 border-t"
            style={{ borderColor: "var(--border)" }}
          >
            <span className="font-black" style={{ color: "var(--foreground)" }}>
              Chef earned
            </span>
            <span className="font-black" style={{ color: "var(--chart-3)" }}>
              {kes(row.todayEarnings)}
            </span>
          </div>

          {/* Pending line — only shown when there is something outstanding */}
          {row.pendingEarnings > 0 && (
            <div
              className="flex items-center justify-between text-[10px] pt-0.5 border-t"
              style={{ borderColor: "var(--border)" }}
            >
              <span
                className="font-semibold"
                style={{ color: "var(--primary)" }}
              >
                Pending remit
              </span>
              <span className="font-black" style={{ color: "var(--primary)" }}>
                {kes(row.pendingEarnings)}
              </span>
            </div>
          )}
        </div>

        {/* Counts */}
        <div
          className="grid grid-cols-2 border-t"
          style={{ borderColor: "var(--border)" }}
        >
          {[
            {
              label: "Delivered",
              value: row.deliveredCount,
              color: "var(--foreground)",
            },
            {
              label: "Pending",
              value: row.pendingCount,
              color: "var(--primary)",
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="px-3 py-2 text-center border-r last:border-0"
              style={{ borderColor: "var(--border)" }}
            >
              <p className="text-base font-black" style={{ color }}>
                {value}
              </p>
              <p
                className="text-[9px] uppercase tracking-wide mt-0.5"
                style={{ color: "var(--muted-foreground)" }}
              >
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* IntaSend transfer ref */}
      {row.transferRef && (
        <div
          className="px-4 py-2 flex items-center gap-1.5 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <Zap
            className="w-3 h-3 flex-shrink-0"
            style={{ color: "var(--chart-3)" }}
          />
          <span
            className="text-[10px] font-mono truncate"
            style={{ color: "var(--muted-foreground)" }}
          >
            IntaSend: {row.transferRef}
          </span>
        </div>
      )}

      {/* Payment method + orders button */}
      <div
        className="px-4 py-2.5 flex items-center justify-between gap-2 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <PayMethodBadge pm={row.paymentMethod} />
        <button
          onClick={() => onViewOrders(row)}
          className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-colors"
          style={{
            borderColor: "var(--border)",
            color: "var(--foreground)",
            background: "transparent",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--muted)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <ReceiptText className="w-3 h-3" /> Orders
        </button>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 flex items-center gap-2">
        {/* Toggle paid / unpaid status */}
        <button
          onClick={() => onToggleStatus(row)}
          disabled={toggling}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-colors disabled:opacity-50"
          style={{
            borderColor:
              row.payoutStatus === "PAID"
                ? "color-mix(in srgb, var(--primary) 40%, transparent)"
                : "color-mix(in srgb, var(--chart-3) 40%, transparent)",
            color:
              row.payoutStatus === "PAID" ? "var(--primary)" : "var(--chart-3)",
            background:
              row.payoutStatus === "PAID"
                ? "color-mix(in srgb, var(--primary) 6%, transparent)"
                : "color-mix(in srgb, var(--chart-3) 6%, transparent)",
          }}
        >
          {toggling ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : row.payoutStatus === "PAID" ? (
            <>
              <XCircle className="w-3.5 h-3.5" /> Unpaid
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" /> Mark Paid
            </>
          )}
        </button>

        {/* Remit button */}
        <button
          onClick={() => !isDisabled && onRemit(row)}
          disabled={isDisabled}
          title={remitHint}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: remitBg, color: remitFg }}
        >
          {alreadyRemitted && noPending ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" /> {remitLabel}
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" /> {remitLabel}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── MissedCard ───────────────────────────────────────────────────────────────

function MissedCard({ instance }: { instance: MissedInstance }) {
  const name = instance.subscription?.user?.profile
    ? `${instance.subscription.user.profile.firstName ?? ""} ${instance.subscription.user.profile.lastName ?? ""}`.trim()
    : (instance.subscription?.user?.email ?? "Unknown");

  const mealTimeLabel: Record<string, string> = {
    BREAKFAST: "Breakfast · by 11:00 AM",
    LUNCH: "Lunch · by 5:00 PM",
    DINNER: "Dinner · by 11:00 PM",
  };

  const rows: [string, string][] = [
    ["Customer", name],
    ["Meal time", mealTimeLabel[instance.mealTime] ?? instance.mealTime],
    [
      "Scheduled",
      new Date(instance.scheduledDate).toLocaleDateString("en-KE", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Africa/Nairobi",
      }),
    ],
    ["Escrow", instance.remittedAt ? "Released" : "Held — not remitted"],
  ];

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        background: "var(--card)",
        borderColor: "color-mix(in srgb, var(--primary) 30%, var(--border))",
      }}
    >
      <div
        className="flex items-start justify-between gap-3 px-4 py-3"
        style={{
          background: "color-mix(in srgb, var(--primary) 5%, transparent)",
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle
            className="w-4 h-4 flex-shrink-0"
            style={{ color: "var(--primary)" }}
          />
          <div className="min-w-0">
            <p
              className="text-xs font-black truncate"
              style={{ color: "var(--foreground)" }}
            >
              {instance.menuItem?.name ?? "Unknown meal"}
            </p>
            <p
              className="text-[10px] truncate"
              style={{ color: "var(--muted-foreground)" }}
            >
              {instance.subscription?.mealPlan?.name ?? "—"} ·{" "}
              {instance.subscription?.mealPlan?.business?.name ?? "—"}
            </p>
          </div>
        </div>
        <span
          className="text-[9px] font-black px-2 py-0.5 rounded-full flex-shrink-0"
          style={{
            background: "color-mix(in srgb, var(--primary) 12%, transparent)",
            color: "var(--primary)",
          }}
        >
          MISSED
        </span>
      </div>

      <div className="px-4 py-3 space-y-1.5">
        {rows.map(([k, v]) => (
          <div
            key={k}
            className="flex items-center justify-between text-[10px]"
          >
            <span style={{ color: "var(--muted-foreground)" }}>{k}</span>
            <span
              className="font-semibold capitalize"
              style={{
                color:
                  k === "Escrow"
                    ? instance.remittedAt
                      ? "var(--chart-3)"
                      : "var(--primary)"
                    : "var(--foreground)",
              }}
            >
              {v}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PaginationBar ────────────────────────────────────────────────────────────

function PaginationBar({
  m,
  onPrev,
  onNext,
}: {
  m: Meta;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between pt-2 flex-wrap gap-3">
      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
        Page {m.page} of {m.totalPages} · {m.total} total
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={onPrev}
          disabled={!m.hasPrevPage}
          className="w-8 h-8 rounded-xl border flex items-center justify-center disabled:opacity-40"
          style={{
            borderColor: "var(--border)",
            background: "var(--card)",
            color: "var(--foreground)",
          }}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span
          className="text-xs font-bold px-2"
          style={{ color: "var(--foreground)" }}
        >
          {m.page}
        </span>
        <button
          onClick={onNext}
          disabled={!m.hasNextPage}
          className="w-8 h-8 rounded-xl border flex items-center justify-center disabled:opacity-40"
          style={{
            borderColor: "var(--border)",
            background: "var(--card)",
            color: "var(--foreground)",
          }}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── ChefPayoutsTable (main component) ───────────────────────────────────────

export default function ChefPayoutsTable() {
  const [rows, setRows] = useState<PayoutRow[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [missed, setMissed] = useState<MissedInstance[]>([]);
  const [missedMeta, setMissedMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMissed, setLoadingMissed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [missedPage, setMissedPage] = useState(1);
  const [rangeIdx, setRangeIdx] = useState(0);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"payouts" | "missed">("payouts");
  const [remitTarget, setRemitTarget] = useState<PayoutRow | null>(null);
  const [orderTarget, setOrderTarget] = useState<PayoutRow | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const { toasts, push: pushToast } = useToasts();

  // ── Summary — page-scoped totals for the selected date window ─────────────
  const summary = useMemo(
    () => ({
      totalGross: rows.reduce((s, r) => s + r.grossEarnings, 0),
      totalFees: rows.reduce((s, r) => s + r.platformFee, 0),
      totalEarnings: rows.reduce((s, r) => s + r.todayEarnings, 0),
      totalPending: rows.reduce((s, r) => s + r.pendingEarnings, 0),
    }),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.businessName.toLowerCase().includes(q) ||
        r.chefEmail.toLowerCase().includes(q),
    );
  }, [rows, search]);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const range = RANGE_OPTIONS[rangeIdx];
      const { start, end } =
        range.days === 0 ? eatWindowToday() : eatWindowRange(range.days);
      const qs = new URLSearchParams({
        start,
        end,
        page: String(page),
        limit: "12",
      });
      const res = await fetch(`/api/admin/payouts?${qs.toString()}`);
      const json: {
        success: boolean;
        data?: PayoutRow[];
        meta?: Meta;
        message?: string;
      } = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.message ?? "Failed to load");
      setRows(json.data ?? []);
      setMeta(json.meta ?? null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, rangeIdx]);

  const fetchMissed = useCallback(async () => {
    setLoadingMissed(true);
    try {
      const qs = new URLSearchParams({ page: String(missedPage), limit: "12" });
      const res = await fetch(`/api/admin/disputes/missed?${qs.toString()}`);
      const json: { success: boolean; data?: MissedInstance[]; meta?: Meta } =
        await res.json();
      if (res.ok && json.success) {
        setMissed(json.data ?? []);
        setMissedMeta(json.meta ?? null);
      }
    } catch {
      // Non-fatal — disputes tab failing shouldn't break the payouts tab
    } finally {
      setLoadingMissed(false);
    }
  }, [missedPage]);

  useEffect(() => {
    void fetchPayouts();
  }, [fetchPayouts]);
  useEffect(() => {
    if (activeTab === "missed") void fetchMissed();
  }, [activeTab, fetchMissed]);
  useEffect(() => {
    setPage(1);
  }, [rangeIdx]);
  useEffect(() => {
    setMissedPage(1);
  }, [activeTab]);

  // ── Toggle paid / unpaid ───────────────────────────────────────────────────

  const toggleStatus = async (row: PayoutRow) => {
    setToggling(row.businessId);
    try {
      const next: "PAID" | "NOT_PAID" =
        row.payoutStatus === "PAID" ? "NOT_PAID" : "PAID";
      const res = await fetch(`/api/admin/payouts/${row.businessId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next, payoutId: row.payoutId }),
      });
      const json: { success: boolean; message?: string } = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.message ?? "Update failed");
      setRows((prev) =>
        prev.map((r) =>
          r.businessId === row.businessId ? { ...r, payoutStatus: next } : r,
        ),
      );
      pushToast(
        `${row.businessName} marked as ${next === "PAID" ? "paid" : "unpaid"}`,
        "success",
      );
    } catch (err) {
      pushToast((err as Error).message, "error");
    } finally {
      setToggling(null);
    }
  };

  // After a successful remit: mark paid, update remittedAt, zero pendingEarnings.
  // If new orders arrive later the admin refreshes to see the new pendingEarnings.
  const onRemitSuccess = (businessId: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.businessId === businessId
          ? {
              ...r,
              payoutStatus: "PAID",
              remittedAt: new Date().toISOString(),
              pendingEarnings: 0,
            }
          : r,
      ),
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Summary strip — reflects current page in the selected date range */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Gross (this page)",
            value: kes(summary.totalGross),
            color: "var(--foreground)",
          },
          {
            label: "Platform Fees",
            value: kes(summary.totalFees),
            color: "var(--primary)",
          },
          {
            label: "To Chefs",
            value: kes(summary.totalEarnings),
            color: "var(--chart-3)",
          },
          {
            label: "Pending Remit",
            value: kes(summary.totalPending),
            color: "var(--primary)",
          },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-2xl border p-3 sm:p-4"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <p className="text-lg sm:text-2xl font-black" style={{ color }}>
              {value}
            </p>
            <p
              className="text-[10px] sm:text-xs mt-0.5"
              style={{ color: "var(--muted-foreground)" }}
            >
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div
        className="flex items-center gap-1 p-1 rounded-2xl w-fit"
        style={{ background: "var(--muted)" }}
      >
        {(["payouts", "missed"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all"
            style={{
              background: activeTab === tab ? "var(--card)" : "transparent",
              color:
                activeTab === tab
                  ? "var(--foreground)"
                  : "var(--muted-foreground)",
              boxShadow:
                activeTab === tab ? "0 1px 3px rgba(0,0,0,.08)" : "none",
            }}
          >
            {tab === "payouts" ? (
              <Banknote className="w-3.5 h-3.5" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5" />
            )}
            <span className="capitalize">
              {tab === "missed"
                ? `Disputes${missed.length > 0 ? ` (${missed.length})` : ""}`
                : "Chef Payouts"}
            </span>
          </button>
        ))}
      </div>

      {/* ── Payouts tab ─────────────────────────────────────────────────────── */}
      {activeTab === "payouts" && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                style={{ color: "var(--muted-foreground)" }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search business or email…"
                className="w-full pl-9 pr-3 py-2 rounded-xl text-sm border outline-none"
                style={{
                  background: "var(--card)",
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "var(--primary)")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "var(--border)")
                }
              />
            </div>

            {/* Date range pills */}
            <div className="flex items-center gap-1 flex-wrap">
              <Filter
                className="w-3.5 h-3.5 flex-shrink-0"
                style={{ color: "var(--muted-foreground)" }}
              />
              {RANGE_OPTIONS.map((opt, i) => (
                <button
                  key={opt.label}
                  onClick={() => setRangeIdx(i)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors whitespace-nowrap"
                  style={{
                    background:
                      i === rangeIdx ? "var(--primary)" : "var(--card)",
                    borderColor:
                      i === rangeIdx ? "var(--primary)" : "var(--border)",
                    color: i === rangeIdx ? "white" : "var(--foreground)",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Refresh */}
            <button
              onClick={() => void fetchPayouts()}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border font-semibold disabled:opacity-50 flex-shrink-0"
              style={{
                borderColor: "var(--border)",
                color: "var(--muted-foreground)",
                background: "var(--card)",
              }}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {/* Skeleton */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-56 rounded-2xl animate-pulse"
                  style={{ background: "var(--muted)" }}
                />
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div
              className="rounded-2xl border p-4 flex items-center gap-3"
              style={{
                background:
                  "color-mix(in srgb, var(--primary) 6%, transparent)",
                borderColor:
                  "color-mix(in srgb, var(--primary) 30%, transparent)",
              }}
            >
              <AlertTriangle
                className="w-5 h-5 flex-shrink-0"
                style={{ color: "var(--primary)" }}
              />
              <p
                className="text-sm flex-1"
                style={{ color: "var(--foreground)" }}
              >
                {error}
              </p>
              <button
                onClick={() => void fetchPayouts()}
                className="text-xs font-bold underline"
                style={{ color: "var(--primary)" }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <p className="text-5xl">💸</p>
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--foreground)" }}
              >
                No payout records found
              </p>
              <p
                className="text-xs"
                style={{ color: "var(--muted-foreground)" }}
              >
                {search
                  ? "No businesses match your search."
                  : "No paid orders in this date range."}
              </p>
            </div>
          )}

          {/* Cards */}
          {!loading && !error && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((row) => (
                <PayoutCard
                  key={row.businessId}
                  row={row}
                  onRemit={setRemitTarget}
                  onToggleStatus={(r) => void toggleStatus(r)}
                  onViewOrders={setOrderTarget}
                  toggling={toggling === row.businessId}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && meta && meta.totalPages > 1 && (
            <PaginationBar
              m={meta}
              onPrev={() => setPage((p) => p - 1)}
              onNext={() => setPage((p) => p + 1)}
            />
          )}
        </div>
      )}

      {/* ── Disputes tab ────────────────────────────────────────────────────── */}
      {activeTab === "missed" && (
        <div className="space-y-4">
          <div
            className="rounded-2xl border p-4 flex items-start gap-3"
            style={{
              background: "color-mix(in srgb, var(--primary) 5%, transparent)",
              borderColor:
                "color-mix(in srgb, var(--primary) 25%, transparent)",
            }}
          >
            <AlertTriangle
              className="w-5 h-5 flex-shrink-0 mt-0.5"
              style={{ color: "var(--primary)" }}
            />
            <div>
              <p
                className="text-sm font-black"
                style={{ color: "var(--foreground)" }}
              >
                Escrow Disputes — Missed Meals
              </p>
              <p
                className="text-xs mt-0.5 leading-relaxed"
                style={{ color: "var(--muted-foreground)" }}
              >
                Meals reported as not received. Funds are held in escrow and
                have not been released. Review each case and decide: refund the
                customer or override to delivered.
              </p>
            </div>
          </div>

          {loadingMissed && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-40 rounded-2xl animate-pulse"
                  style={{ background: "var(--muted)" }}
                />
              ))}
            </div>
          )}

          {!loadingMissed && missed.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <p className="text-5xl">✅</p>
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--foreground)" }}
              >
                No disputes
              </p>
            </div>
          )}

          {!loadingMissed && missed.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {missed.map((inst) => (
                  <MissedCard key={inst.id} instance={inst} />
                ))}
              </div>
              {missedMeta && missedMeta.totalPages > 1 && (
                <PaginationBar
                  m={missedMeta}
                  onPrev={() => setMissedPage((p) => p - 1)}
                  onNext={() => setMissedPage((p) => p + 1)}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* Modals */}
      {remitTarget && (
        <RemitModal
          row={remitTarget}
          onClose={() => setRemitTarget(null)}
          onSuccess={onRemitSuccess}
          pushToast={pushToast}
        />
      )}
      {orderTarget && (
        <OrdersDrawer row={orderTarget} onClose={() => setOrderTarget(null)} />
      )}

      {/* Toast stack */}
      <div className="fixed bottom-6 right-4 sm:right-6 z-[100] flex flex-col gap-2 pointer-events-none w-[calc(100vw-2rem)] max-w-xs sm:w-auto sm:max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold pointer-events-auto"
            style={{
              background:
                t.type === "success" ? "var(--chart-3)" : "var(--primary)",
              color: "white",
            }}
          >
            {t.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="flex-1 min-w-0 truncate">{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
