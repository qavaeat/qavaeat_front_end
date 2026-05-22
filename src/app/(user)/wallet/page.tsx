"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet, ArrowUpRight, ArrowDownLeft, Plus, ArrowRight,
  TrendingUp, Clock, CheckCircle2, XCircle, ChevronDown,
  CreditCard, Smartphone, Building2, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────
type TxType = "credit" | "debit" | "pending";
type TxStatus = "completed" | "pending" | "failed";

interface Transaction {
  id: string;
  type: TxType;
  status: TxStatus;
  desc: string;
  sub: string;
  amount: number;
  date: string;
  time: string;
}

type FilterTab = "all" | "credits" | "debits" | "pending";
type DepositMethod = "mpesa" | "card" | "bank";

// ── Dummy data ─────────────────────────────────────────────────────────────
const TRANSACTIONS: Transaction[] = [
  { id:"tx1",  type:"credit",  status:"completed", desc:"M-Pesa Deposit",            sub:"Via Safaricom",          amount:5000,  date:"Today",      time:"9:14 AM" },
  { id:"tx2",  type:"debit",   status:"completed", desc:"Breakfast · Grilled Salmon", sub:"Mama Peninah's Kitchen", amount:890,   date:"Today",      time:"8:03 AM" },
  { id:"tx3",  type:"debit",   status:"pending",   desc:"Lunch · Beef Tenderloin",   sub:"David's Grill & Co.",    amount:1200,  date:"Today",      time:"12:30 PM" },
  { id:"tx4",  type:"debit",   status:"completed", desc:"Dinner · Lobster Thermidor", sub:"Fatima's Swahili Bites", amount:1800,  date:"Yesterday",  time:"7:45 PM" },
  { id:"tx5",  type:"credit",  status:"completed", desc:"M-Pesa Deposit",            sub:"Via Safaricom",          amount:10000, date:"Yesterday",  time:"2:00 PM" },
  { id:"tx6",  type:"debit",   status:"completed", desc:"Meal Plan Subscription",    sub:"Weekly Gourmet Plan",    amount:4800,  date:"Mon, 30 Apr", time:"10:00 AM" },
  { id:"tx7",  type:"debit",   status:"failed",    desc:"Dinner · BBQ Ribs",         sub:"Otieno's Smokehouse",    amount:980,   date:"Mon, 30 Apr", time:"8:15 PM" },
  { id:"tx8",  type:"credit",  status:"completed", desc:"Refund",                    sub:"Cancelled order #3821",  amount:450,   date:"Sun, 29 Apr", time:"3:22 PM" },
  { id:"tx9",  type:"debit",   status:"completed", desc:"Breakfast · Caesar Salad",  sub:"Amara Green Table",      amount:380,   date:"Sun, 29 Apr", time:"7:50 AM" },
  { id:"tx10", type:"debit",   status:"completed", desc:"Lunch · Spaghetti Carbonara", sub:"Zara Continental",    amount:750,   date:"Sat, 28 Apr", time:"1:10 PM" },
];

const BALANCE    = 12350;
const ESCROW     = 8750;
const THIS_MONTH_SPEND = TRANSACTIONS
  .filter((t) => t.type === "debit" && t.status === "completed")
  .reduce((s, t) => s + t.amount, 0);
const THIS_MONTH_IN = TRANSACTIONS
  .filter((t) => t.type === "credit" && t.status === "completed")
  .reduce((s, t) => s + t.amount, 0);

// ── Small helpers ──────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<TxStatus, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  completed: { icon: CheckCircle2, color: "text-[#007606]", bg: "bg-[#007606]/10", label: "Completed" },
  pending:   { icon: Clock,        color: "text-secondary-foreground", bg: "bg-secondary/20", label: "Pending" },
  failed:    { icon: XCircle,      color: "text-primary",  bg: "bg-primary/10",    label: "Failed" },
};

function TxIcon({ type }: { type: TxType }) {
  if (type === "credit") return (
    <div className="w-9 h-9 rounded-full bg-[#007606]/10 flex items-center justify-center flex-shrink-0">
      <ArrowDownLeft className="w-4 h-4 text-[#007606]" />
    </div>
  );
  if (type === "pending") return (
    <div className="w-9 h-9 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
      <Clock className="w-4 h-4 text-secondary-foreground" />
    </div>
  );
  return (
    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
      <ArrowUpRight className="w-4 h-4 text-primary" />
    </div>
  );
}

// ── Deposit modal ──────────────────────────────────────────────────────────
function DepositModal({ onClose }: { onClose: () => void }) {
  const [method, setMethod] = useState<DepositMethod>("mpesa");
  const [amount, setAmount] = useState("");
  const [phone,  setPhone]  = useState("");
  const [loading, setLoading] = useState(false);

  const METHODS: { id: DepositMethod; label: string; icon: React.ElementType; sub: string }[] = [
    { id: "mpesa", label: "M-Pesa",      icon: Smartphone, sub: "Instant · Safaricom" },
    { id: "card",  label: "Debit Card",  icon: CreditCard, sub: "Visa / Mastercard" },
    { id: "bank",  label: "Bank Transfer", icon: Building2, sub: "1–2 business days" },
  ];

  const QUICK = [500, 1000, 2000, 5000];

  const handleDeposit = async () => {
    const amt = Number(amount);
    if (!amt || amt < 100) { toast.error("Minimum deposit is KES 100."); return; }
    if (method === "mpesa" && !phone) { toast.error("Enter your M-Pesa number."); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    toast.success(`KES ${amt.toLocaleString()} deposit initiated!`);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.25 }}
        className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-md"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-black text-foreground">Add Funds</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
            <XCircle className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Payment method */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-foreground">Payment Method</p>
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map(({ id, label, icon: Icon, sub }) => {
                const active = method === id;
                return (
                  <button key={id} onClick={() => setMethod(id)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                      active ? "border-primary bg-primary/5" : "border-border hover:border-primary/30 bg-background"
                    }`}>
                    <Icon className={`w-5 h-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-[10px] font-black ${active ? "text-primary" : "text-foreground"}`}>{label}</span>
                    <span className="text-[9px] text-muted-foreground">{sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-foreground">Amount (KES)</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-muted-foreground">KES</span>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="pl-14 rounded-xl border-border text-lg font-black text-foreground"
              />
            </div>
            {/* Quick amounts */}
            <div className="flex gap-2">
              {QUICK.map((q) => (
                <button key={q} onClick={() => setAmount(String(q))}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    amount === String(q)
                      ? "bg-primary text-white border-primary"
                      : "border-border text-muted-foreground hover:border-primary/40 bg-background"
                  }`}>
                  {q >= 1000 ? `${q/1000}K` : q}
                </button>
              ))}
            </div>
          </div>

          {/* M-Pesa number */}
          {method === "mpesa" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              className="space-y-2">
              <p className="text-xs font-bold text-foreground">M-Pesa Number</p>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="+254 7XX XXX XXX" className="pl-10 rounded-xl border-border" />
              </div>
              <p className="text-[10px] text-muted-foreground">You&apos;ll receive an STK push on your phone</p>
            </motion.div>
          )}

          {/* Summary */}
          {Number(amount) > 0 && (
            <div className="bg-muted/40 rounded-xl p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deposit amount</span>
                <span className="font-bold text-foreground">KES {Number(amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Processing fee</span>
                <span className="font-bold text-[#007606]">Free</span>
              </div>
              <div className="flex justify-between border-t border-border pt-1.5">
                <span className="font-black text-foreground">New balance</span>
                <span className="font-black text-[#007606]">
                  KES {(BALANCE + Number(amount)).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl border-border">Cancel</Button>
          <Button onClick={handleDeposit} disabled={loading || !amount}
            className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-xl font-black disabled:opacity-40">
            {loading
              ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</span>
              : <span className="flex items-center gap-2"><Plus className="w-4 h-4" />Add Funds</span>}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function WalletPage() {
  const [filter, setFilter]       = useState<FilterTab>("all");
  const [showDeposit, setShowDeposit] = useState(false);
  const [showAll,  setShowAll]    = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const filtered = TRANSACTIONS.filter((t) => {
    if (filter === "credits") return t.type === "credit";
    if (filter === "debits")  return t.type === "debit" && t.status !== "pending";
    if (filter === "pending") return t.status === "pending";
    return true;
  });

  const displayed = showAll ? filtered : filtered.slice(0, 6);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 800));
    setRefreshing(false);
    toast.success("Wallet refreshed");
  };

  const FILTER_TABS: { id: FilterTab; label: string }[] = [
    { id: "all",     label: "All" },
    { id: "credits", label: "Deposits" },
    { id: "debits",  label: "Spending" },
    { id: "pending", label: "Pending" },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">

        {/* Page header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground">Wallet</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your balance and transactions</p>
          </div>
          <button onClick={handleRefresh}
            className={`w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors ${refreshing ? "animate-spin" : ""}`}>
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
        </motion.div>

        {/* ── Balance hero card ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="relative rounded-3xl overflow-hidden shadow-xl"
          style={{ background: "linear-gradient(135deg, #DD3131 0%, #771A1A 60%, #1A1A1A 100%)" }}>

          {/* Decorative circles */}
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10"
            style={{ background: "#F4CD2E" }} />
          <div className="absolute -bottom-20 -left-10 w-48 h-48 rounded-full opacity-10"
            style={{ background: "#007606" }} />
          <div className="absolute top-6 right-6 w-20 h-20 rounded-full opacity-5"
            style={{ background: "#FFFFFF" }} />

          <div className="relative p-6 sm:p-8">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="w-4 h-4 text-white/70" />
                  <p className="text-xs font-semibold text-white/70 uppercase tracking-widest">Available Balance</p>
                </div>
                <p className="text-4xl sm:text-5xl font-black text-white">
                  KES {BALANCE.toLocaleString()}
                </p>
                <p className="text-sm text-white/60 mt-1">
                  <span className="text-white/80 font-semibold">KES {ESCROW.toLocaleString()}</span> in scheduled meals
                </p>
              </div>

              <Button
                onClick={() => setShowDeposit(true)}
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-black rounded-2xl px-5 py-2.5 flex items-center gap-2 shadow-lg flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add Funds
              </Button>
            </div>

            {/* Stats row */}
            <div className="flex gap-4 mt-6 pt-5 border-t border-white/15 flex-wrap">
              <div>
                <p className="text-[10px] text-white/50 uppercase tracking-widest">Spent This Month</p>
                <p className="text-lg font-black text-white mt-0.5">
                  KES {THIS_MONTH_SPEND.toLocaleString()}
                </p>
              </div>
              <div className="w-px bg-white/15 self-stretch" />
              <div>
                <p className="text-[10px] text-white/50 uppercase tracking-widest">Deposited This Month</p>
                <p className="text-lg font-black text-white mt-0.5">
                  KES {THIS_MONTH_IN.toLocaleString()}
                </p>
              </div>
              <div className="w-px bg-white/15 self-stretch" />
              <div>
                <p className="text-[10px] text-white/50 uppercase tracking-widest">Transactions</p>
                <p className="text-lg font-black text-white mt-0.5">{TRANSACTIONS.length}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Summary cards row ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: TrendingUp, label: "Scheduled Meals",
              value: `KES ${ESCROW.toLocaleString()}`,
              sub: "Held in escrow",
              iconBg: "bg-secondary/20", iconColor: "text-secondary-foreground",
              valuColor: "text-secondary-foreground",
            },
            {
              icon: ArrowUpRight, label: "Total Spent",
              value: `KES ${THIS_MONTH_SPEND.toLocaleString()}`,
              sub: "This month",
              iconBg: "bg-primary/10", iconColor: "text-primary",
              valuColor: "text-primary",
            },
            {
              icon: ArrowDownLeft, label: "Total Deposited",
              value: `KES ${THIS_MONTH_IN.toLocaleString()}`,
              sub: "This month",
              iconBg: "bg-[#007606]/10", iconColor: "text-[#007606]",
              valuColor: "text-[#007606]",
            },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label}
                className="bg-background rounded-2xl border border-border p-5 flex items-center gap-4 shadow-sm">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.iconBg}`}>
                  <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">{stat.label}</p>
                  <p className={`text-xl font-black ${stat.valuColor}`}>{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.sub}</p>
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* ── Spending breakdown bar ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-background rounded-2xl border border-border shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-foreground">Balance Breakdown</h3>
              <p className="text-xs text-muted-foreground">How your funds are allocated</p>
            </div>
            <span className="text-xs font-bold text-muted-foreground">
              KES {(BALANCE + ESCROW).toLocaleString()} total
            </span>
          </div>

          {/* Bar */}
          <div className="h-3 rounded-full bg-muted overflow-hidden flex gap-0.5 mb-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(BALANCE / (BALANCE + ESCROW)) * 100}%` }}
              transition={{ duration: 1, delay: 0.3 }}
              className="h-full bg-primary rounded-full"
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(ESCROW / (BALANCE + ESCROW)) * 100}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full bg-secondary rounded-full"
            />
          </div>

          <div className="flex gap-6 flex-wrap">
            {[
              { color: "bg-primary",   label: "Available",        amount: BALANCE, pct: Math.round((BALANCE / (BALANCE + ESCROW)) * 100) },
              { color: "bg-secondary", label: "Scheduled Meals",  amount: ESCROW,  pct: Math.round((ESCROW  / (BALANCE + ESCROW)) * 100) },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full flex-shrink-0 ${item.color}`} />
                <div>
                  <p className="text-[10px] text-muted-foreground">{item.label} ({item.pct}%)</p>
                  <p className="text-xs font-bold text-foreground">KES {item.amount.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Transactions ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden">

          {/* Header + filters */}
          <div className="px-5 py-4 border-b border-border">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 className="text-sm font-black text-foreground">Transaction History</h3>
              <Button onClick={() => setShowDeposit(true)} size="sm"
                className="bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold h-8 px-4 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />Add Funds
              </Button>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {FILTER_TABS.map((tab) => (
                <button key={tab.id} onClick={() => { setFilter(tab.id); setShowAll(false); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    filter === tab.id
                      ? "bg-primary text-white border-primary"
                      : "border-border text-muted-foreground hover:border-primary/30 bg-background"
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="divide-y divide-border/50">
            <AnimatePresence mode="popLayout">
              {displayed.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm font-semibold text-foreground">No transactions</p>
                  <p className="text-xs text-muted-foreground mt-1">Nothing here yet</p>
                </div>
              ) : (
                displayed.map((tx, i) => {
                  const st = STATUS_CONFIG[tx.status];
                  const StatusIcon = st.icon;
                  return (
                    <motion.div key={tx.id}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-3.5 px-5 py-4 hover:bg-muted/20 transition-colors"
                    >
                      <TxIcon type={tx.type} />

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{tx.desc}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{tx.sub}</p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-black ${
                          tx.type === "credit" ? "text-[#007606]" : tx.status === "failed" ? "text-muted-foreground line-through" : "text-foreground"
                        }`}>
                          {tx.type === "credit" ? "+" : "−"}KES {tx.amount.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-1 justify-end mt-0.5">
                          <StatusIcon className={`w-3 h-3 ${st.color}`} />
                          <p className="text-[10px] text-muted-foreground">{tx.date} · {tx.time}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>

          {/* Show more / less */}
          {filtered.length > 6 && (
            <div className="px-5 py-4 border-t border-border">
              <button
                onClick={() => setShowAll((p) => !p)}
                className="w-full flex items-center justify-center gap-2 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
              >
                {showAll ? (
                  <><ChevronDown className="w-3.5 h-3.5 rotate-180" />Show less</>
                ) : (
                  <><ArrowRight className="w-3.5 h-3.5" />Show all {filtered.length} transactions</>
                )}
              </button>
            </div>
          )}
        </motion.div>

        {/* ── Quick actions ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button onClick={() => setShowDeposit(true)}
            className="bg-background rounded-2xl border border-border p-5 flex items-center gap-4 hover:border-primary/30 hover:shadow-md transition-all text-left group">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-black text-foreground">Add Funds</p>
              <p className="text-xs text-muted-foreground">Top up via M-Pesa, card or bank</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto group-hover:text-primary transition-colors" />
          </button>

          <button
            className="bg-background rounded-2xl border border-border p-5 flex items-center gap-4 hover:border-secondary/50 hover:shadow-md transition-all text-left group"
            onClick={() => toast.info("Withdrawal coming soon!")}>
            <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-secondary/30 transition-colors">
              <ArrowUpRight className="w-6 h-6 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-sm font-black text-foreground">Withdraw</p>
              <p className="text-xs text-muted-foreground">Transfer to M-Pesa or bank</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto group-hover:text-secondary-foreground transition-colors" />
          </button>
        </motion.div>
      </div>

      <AnimatePresence>
        {showDeposit && <DepositModal onClose={() => setShowDeposit(false)} />}
      </AnimatePresence>
    </div>
  );
}